// Worker Cloudflare de l'application Dobby en ligne.
//
// Il fait deux choses :
// 1. il sert les fichiers de l'appli (dossier dist, produit par « npm run build:web ») ;
// 2. il transmet à OpenRouter les messages écrits à Dobby (adresse /api/dobby).
//
// La clé OpenRouter reste sur Cloudflare : c'est le secret OPENROUTER_API_KEY du Worker
// (tableau de bord Cloudflare, Worker « dobby-app » > Settings > Variables and Secrets).
// La page web ne la contient jamais. Le relais n'accepte que les modèles gratuits : aucun frais possible.

const OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions';
const ROLES = new Set(['system', 'user', 'assistant']);
const MAX_MESSAGES = 40;
const MAX_CARACTERES = 16000;
const MAX_JETONS = 600;

function json(corps, statut = 200) {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// Même format d'erreur qu'OpenRouter : l'appli le lit de la même façon.
function erreur(statut, message) {
  return json({ error: { message, code: statut } }, statut);
}

function modeleGratuit(modele) {
  return typeof modele === 'string' && (modele.endsWith(':free') || modele === 'openrouter/free');
}

function messagesValides(messages) {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= MAX_MESSAGES &&
    messages.every((m) => m && ROLES.has(m.role) && typeof m.content === 'string' && m.content.length <= MAX_CARACTERES)
  );
}

async function relayer(request, env, url) {
  const cle = (env.OPENROUTER_API_KEY || '').trim();

  // Vérification depuis le navigateur : ouvrir https://<adresse de l'appli>/api/dobby
  if (request.method === 'GET') return json({ cle: cle ? 'présente' : 'absente' });
  if (request.method !== 'POST') return erreur(405, 'Méthode non acceptée');

  // Seule la page de l'appli peut écrire à Dobby, pas un autre site.
  const origine = request.headers.get('Origin');
  if (origine && origine !== url.origin) return erreur(403, 'Origine refusée');

  if (!cle) return erreur(401, 'Clé absente : ajoutez le secret OPENROUTER_API_KEY au Worker sur Cloudflare.');

  let demande;
  try {
    demande = await request.json();
  } catch {
    return erreur(400, 'Requête illisible');
  }
  if (!modeleGratuit(demande?.model)) return erreur(400, 'Seuls les modèles gratuits sont acceptés');
  if (!messagesValides(demande?.messages)) return erreur(400, 'Messages non valides');

  let reponse;
  try {
    reponse = await fetch(OPENROUTER, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cle}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': url.origin,
        'X-Title': 'Dobby',
      },
      body: JSON.stringify({
        model: demande.model,
        messages: demande.messages.map(({ role, content }) => ({ role, content })),
        max_tokens: Math.min(Number(demande.max_tokens) || MAX_JETONS, MAX_JETONS),
        temperature: typeof demande.temperature === 'number' ? Math.min(Math.max(demande.temperature, 0), 1.5) : 0.6,
      }),
    });
  } catch {
    return erreur(502, 'OpenRouter ne répond pas');
  }

  return new Response(reponse.body, {
    status: reponse.status,
    headers: {
      'Content-Type': reponse.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/dobby') return relayer(request, env, url);
    // Le reste : les fichiers de l'appli (en pratique, wrangler.jsonc les sert sans passer par ici).
    return env.ASSETS.fetch(request);
  },
};
