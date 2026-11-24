import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Réponses libres de Dobby, par l'API OpenRouter (modèles gratuits).
// Avec Expo Go, la clé vient de .env.local (OPENROUTER_API_KEY=...), transmise par app.config.js.
// En ligne (version web publiée sur Cloudflare), la page ne contient aucune clé : elle écrit au Worker
// (cloudflare/worker.js, adresse /api/dobby), qui ajoute la clé gardée en secret sur Cloudflare.

export interface MessageIA {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Version web publiée (npx expo export) : les messages passent par le Worker Cloudflare */
export const EN_LIGNE = Platform.OS === 'web' && !__DEV__;

/** Modèles gratuits essayés dans l'ordre : si l'un est saturé ou retiré, on passe au suivant */
const MODELES = ['google/gemma-4-31b-it:free', 'openrouter/free', 'google/gemma-4-26b-a4b-it:free'];
const ADRESSE = EN_LIGNE ? '/api/dobby' : 'https://openrouter.ai/api/v1/chat/completions';
const DELAI = 20_000;

function reglages() {
  const extra = (Constants.expoConfig?.extra ?? {}) as { openrouterKey?: string; openrouterModel?: string };
  return { cle: extra.openrouterKey?.trim() ?? '', modele: extra.openrouterModel?.trim() ?? '' };
}

/** Une clé OpenRouter a-t-elle été trouvée dans .env.local ? */
export function cleOpenRouter(): boolean {
  return reglages().cle.length > 0;
}

/** Dobby répond-il avec le modèle ? Sinon, il reprend ses phrases préparées */
export function reponsesLibres(): boolean {
  return EN_LIGNE || cleOpenRouter();
}

type Essai =
  | { ok: true; texte: string; modele: string }
  | { ok: false; definitif: boolean; raison: string; statut?: number };

/** Certains modèles (Gemma par exemple) refusent le rôle « system » : la consigne passe alors dans le premier message */
function sansSysteme(messages: MessageIA[]): MessageIA[] {
  const consigne = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const reste = messages.filter((m) => m.role !== 'system').map((m) => ({ ...m }));
  const premier = reste.find((m) => m.role === 'user');
  if (premier && consigne) premier.content = `${consigne}\n\n---\n\n${premier.content}`;
  return reste;
}

async function essayer(modele: string, cle: string, messages: MessageIA[]): Promise<Essai> {
  const controle = new AbortController();
  const minuteur = setTimeout(() => controle.abort(), DELAI);
  try {
    const reponse = await fetch(ADRESSE, {
      method: 'POST',
      signal: controle.signal,
      headers: EN_LIGNE
        ? { 'Content-Type': 'application/json' }
        : { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json', 'X-Title': 'Dobby' },
      body: JSON.stringify({ model: modele, messages, max_tokens: 600, temperature: 0.6 }),
    });
    const donnees = (await reponse.json().catch(() => null)) as {
      model?: string;
      error?: { message?: string };
      choices?: { message?: { content?: string | null } }[];
    } | null;
    if (!reponse.ok) {
      const detail = donnees?.error?.message ?? reponse.statusText;
      // 401 : clé refusée, 402 : crédit négatif. Inutile d'essayer un autre modèle.
      return {
        ok: false,
        definitif: reponse.status === 401 || reponse.status === 402,
        raison: `${reponse.status} ${detail}`,
        statut: reponse.status,
      };
    }
    const texte = nettoyer(donnees?.choices?.[0]?.message?.content ?? '');
    if (!texte) return { ok: false, definitif: false, raison: 'réponse vide' };
    return { ok: true, texte, modele: donnees?.model ?? modele };
  } catch (e) {
    const raison = controle.signal.aborted ? `pas de réponse après ${DELAI / 1000} s` : e instanceof Error ? e.message : String(e);
    return { ok: false, definitif: false, raison };
  } finally {
    clearTimeout(minuteur);
  }
}

/** Renvoie la réponse de Dobby, ou lève une erreur (l'appli répond alors avec une phrase préparée) */
export async function demanderADobby(messages: MessageIA[]): Promise<string> {
  const { cle, modele } = reglages();
  if (!reponsesLibres()) throw new Error('aucune clé OpenRouter dans .env.local');
  const modeles = [...new Set([modele, ...MODELES].filter(Boolean))];
  const raisons: string[] = [];
  for (const m of modeles) {
    let essai = await essayer(m, cle, messages);
    if (!essai.ok && essai.statut === 400 && messages[0]?.role === 'system') {
      essai = await essayer(m, cle, sansSysteme(messages));
    }
    if (essai.ok) {
      console.log(`[Dobby] Réponse de ${essai.modele}`);
      return essai.texte;
    }
    raisons.push(`${m} : ${essai.raison}`);
    console.log(`[Dobby] ${m} n'a pas répondu (${essai.raison})`);
    if (essai.definitif) break;
  }
  throw new Error(raisons.join(' | '));
}

let EMOJI: RegExp | null = null;
try {
  EMOJI = new RegExp('[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{FE0F}\\u{200D}]', 'gu');
} catch {
  EMOJI = null;
}

/** Retire ce qui ne s'affiche pas bien dans une bulle : réflexion, gras, listes, émojis, tirets longs */
export function nettoyer(s: string): string {
  let t = s
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^\s*dobby\s*:\s*/i, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\s+[—–]\s+/g, ', ')
    .replace(/—/g, ', ');
  if (EMOJI) t = t.replace(EMOJI, '');
  return t.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
