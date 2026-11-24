import { ORDRE, type Residence } from '@/data/maison';
import { plat } from '@/lib/fr';
import type { MessageIA } from '@/lib/openrouter';
import { heure, heureRonde, MIN, quartSuivant, salutation } from '@/lib/temps';
import type { Etat, Message } from '@/state/types';

export const nomPiece = (r: Residence, id: string) => r.pieces.find((p) => p.id === id)?.nom ?? id;

/** « au salon », « dans la cuisine », « sur la terrasse »… */
export function lieu(r: Residence, id: string): string {
  const n = nomPiece(r, id).toLowerCase();
  if (n === 'salon') return 'au salon';
  if (n === 'terrasse') return 'sur la terrasse';
  if (n.startsWith('entrée')) return `dans l’${n}`;
  if (/^(bureau|séjour|sauna|local)/.test(n)) return `dans le ${n}`;
  return `dans la ${n}`;
}

/** « La cuisine », « Le salon », « L’entrée »… */
export function laPiece(r: Residence, id: string): string {
  const t = lieu(r, id).replace(/^au /, 'le ').replace(/^(dans|sur) /, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Consigne donnée au modèle : la personnalité de Dobby et l'état de la maison */
export function consigne(e: Etat): string {
  const r = e.residences[e.residence];
  const zones = r.privees.map((id) => nomPiece(r, id)).join(', ') || 'aucune';
  const tache = r.tache ? `${r.tache.label.toLowerCase()} (${nomPiece(r, r.tache.piece)})` : 'aucune';
  const recents =
    e.journal
      .filter((j) => j.residence === e.residence)
      .slice(0, 5)
      .map((j) => `${heure(j.ts)} ${j.texte}`)
      .join(' ; ') || 'rien de particulier';
  const autres = ORDRE.filter((id) => id !== e.residence)
    .map((id) => `${e.residences[id].nom} (${e.residences[id].type.toLowerCase()}, ${e.residences[id].temperature} °C)`)
    .join(', ');
  const memoire = e.memoire.map((m) => m.texte).join(' ; ') || 'rien pour le moment, la mémoire vient d’être effacée';
  const attente =
    e.validations
      .filter((v) => v.statut === 'attente')
      .map((v) => `${v.titre} (${v.montant} €)`)
      .join(', ') || 'aucun';

  return [
    `Tu es Dobby, l'assistant domestique d'une famille. Tu vis dans leur résidence de ${r.nom} (${r.type.toLowerCase()}). Tu réponds par message, dans l'application Dobby, à l'un des parents.`,
    '',
    'Ta façon d’écrire :',
    '- Vouvoiement, phrases courtes, ton posé, chaleureux et discret.',
    '- Une à trois phrases, en texte simple : pas de liste, pas de titre, pas de gras, pas d’emoji, pas de tiret long.',
    '- Réponds en français, sauf si on t’écrit dans une autre langue.',
    '- Tu ne dis jamais que tu es une intelligence artificielle, un modèle de langage ou un programme : tu es Dobby, l’assistant domestique de la maison.',
    '- N’emploie pas les mots robot, humanoïde, autonome ni intelligent pour parler de toi.',
    '',
    'Ce que tu fais : cuisine, entretien (ménage, linge, rangement), soin des animaux, maison connectée (lumière, chauffage, volets, alarme), démarches (courses, réservations, rendez-vous, prestataires).',
    'Quand on te confie une tâche, confirme-la simplement et dis quand ce sera fait. Tu prends l’initiative, dans le cadre fixé par la famille.',
    '',
    'Tes règles :',
    `- Au-delà de ${e.budget} € par achat, tu demandes l’accord avant d’acheter ou de réserver.`,
    `- Tu n’entres jamais dans les Zones privées : ${zones}.`,
    '- Tu ne manipules aucun objet tranchant en présence d’un enfant, et tu ne remplaces pas la surveillance d’un adulte.',
    '- Ce que tu vois et entends reste dans la maison. Aucun employé ne voit à travers tes caméras.',
    '- Pour une panne, une question de garantie ou de contrat, propose d’appeler Camille Dufour, la Conseillère Dobby de la famille, joignable 24 h/24.',
    '- Si une demande est impossible ou dangereuse, dis-le avec tact et propose une autre solution.',
    '',
    'La maison en ce moment :',
    `- Il est ${heure(Date.now())}. Température intérieure : ${r.temperature} °C. Ta batterie : ${r.batterie} %.`,
    `- Tu es dans la pièce : ${nomPiece(r, r.piece)}. Tâche en cours : ${tache}.`,
    `- Tes caméras : ${e.volet ? 'couvertes par leur volet, tu ne vois rien' : 'actives'}.`,
    '- La famille : Alexandre et Claire, leurs enfants Léo (13 ans) et Jeanne (9 ans), Plume le chat (il vit à Paris), et Sofia, la gouvernante à mi-temps.',
    `- Ce que tu as appris : ${memoire}.`,
    `- Tes dernières actions : ${recents}.`,
    `- Achats en attente d’accord : ${attente}.`,
    `- Les autres résidences ont chacune leur Dobby : ${autres}.`,
  ].join('\n');
}

/**
 * Historique envoyé au modèle. Certains modèles exigent que l'utilisateur parle en premier
 * et que les rôles alternent : on regroupe les messages successifs d'un même auteur.
 */
export function historique(messages: Message[], nouveau: string): MessageIA[] {
  const lignes: MessageIA[] = [];
  for (const m of messages.slice(-14)) {
    const contenu = m.texte ?? (m.photo ? `(photo envoyée : ${m.legende ?? 'confirmation'})` : '');
    if (!contenu) continue;
    const role = m.auteur === 'moi' ? 'user' : 'assistant';
    const dernier = lignes[lignes.length - 1];
    if (dernier && dernier.role === role) dernier.content += `\n${contenu}`;
    else lignes.push({ role, content: contenu });
  }
  while (lignes.length && lignes[0].role !== 'user') lignes.shift();
  const dernier = lignes[lignes.length - 1];
  if (dernier && dernier.role === 'user') dernier.content += `\n${nouveau}`;
  else lignes.push({ role: 'user', content: nouveau });
  return lignes;
}

const auHasard = <T,>(liste: T[]) => liste[Math.floor(Math.random() * liste.length)];

/** Réponses préparées : sans clé OpenRouter, ou si le modèle ne répond pas */
export function reponsePreparee(texte: string, e: Etat): string {
  const t = plat(texte);
  const r = e.residences[e.residence];
  const a = (...mots: string[]) => mots.some((m) => t.includes(m));
  const court = t.length < 28;

  if (court && a('bonjour', 'bonsoir', 'salut', 'coucou', 'hello'))
    return `${salutation()}. Tout est en ordre à ${r.nom}. Que puis-je faire pour vous ?`;
  if (court && a('merci')) return auHasard(['Avec plaisir.', 'Je vous en prie.', 'C’est un plaisir.']);
  if (a('qui es-tu', 'qui es tu', 'tu es qui', 'presente-toi', 'presente toi'))
    return 'Je suis Dobby, votre assistant domestique. Je m’occupe de la maison, dans le cadre que vous fixez.';
  if (a('camera', 'espion', 'filme', 'vie privee', 'donnees'))
    return 'Ce que je vois et entends reste dans la maison. Vous pouvez couvrir mes caméras à tout moment, depuis les Réglages.';
  if (a('plume', 'chat'))
    return e.residence === 'paris'
      ? 'Plume va bien. Il a mangé tout à l’heure et dort sur le fauteuil du salon.'
      : 'Plume est resté à Paris. Le Dobby de Paris s’occupe de lui.';
  if (a('enfant', 'leo', 'jeanne', 'gouter', 'ecole', 'devoirs'))
    return 'Le goûter sera prêt à leur retour, sans noisettes pour Léo. Je vous préviens quand ils arrivent.';
  if (a('diner', 'dejeuner', 'repas', 'cuisine', 'manger', 'recette', 'petit-dej'))
    return `Je m’en occupe. Ce sera prêt à ${heureRonde(quartSuivant(Date.now() + 45 * MIN))}. Une envie particulière ?`;
  if (a('linge', 'lessive', 'repass', 'draps'))
    return 'C’est noté. Je lance une lessive et je plierai le linge dès qu’il sera sec.';
  if (a('menage', 'ranger', 'range', 'aspir', 'poussiere', 'nettoie', 'propre'))
    return 'Entendu. Je commence par le salon, puis la cuisine. Les Zones privées restent fermées.';
  if (a('volet', 'lumiere', 'chauff', 'temperature', 'froid', 'chaud', 'alarme'))
    return `C’est fait. Il fait ${r.temperature} °C et la lumière du salon est douce.`;
  if (a('course', 'commande', 'achete', 'reserv', 'restaurant', 'fleur'))
    return `Je m’en charge. Au-delà de ${e.budget} €, je vous demanderai votre accord avant de valider.`;
  if (a('chalet', 'megeve'))
    return 'Je préviens le Dobby de Megève : chalet chauffé à 21 °C et réfrigérateur rempli avant votre arrivée.';
  if (a('cap-ferret', 'cap ferret', 'villa', 'jardin', 'arros'))
    return 'Je préviens le Dobby du Cap-Ferret. Le jardin sera arrosé demain à 6 h.';
  if (a('batterie', 'charge', 'fatigue'))
    return `Ma batterie est à ${r.batterie} %. Je me recharge sur ma station quand la maison est calme.`;
  if (a('conseill', 'panne', 'probleme', 'contrat', 'garantie', 'reparation'))
    return 'Votre Conseillère, Camille Dufour, est joignable 24 h/24. Son numéro est dans les Réglages.';
  return auHasard([
    'C’est noté. Je m’en occupe et je vous préviens quand c’est fait.',
    'Entendu. Je vous envoie un message dès que c’est fait.',
    'Bien reçu. Je m’en charge, dans le cadre que vous avez fixé.',
  ]);
}

/** « stop », « Dobby, stop. », « arrête-toi » : la commande d'arrêt, comme à la voix */
export function estUnArret(texte: string): boolean {
  return /^(dobby\W*)?(stop|arrete-toi|arrete toi|arrete)\W*$/.test(plat(texte).trim());
}
