// Typographie française, comme sur le site : espaces insécables avant « : ; ! ? »,
// dans les guillemets, entre un nombre et son unité, apostrophe typographique.
const NBSP = ' ';
const FINE = ' ';

const UNITES =
  '€|%|h|min|s|m|km|kg|N|dB|°C|ans?|jours?|semaines?|mois|minutes?|secondes?|heures?|pièces?|résidences?|fois|personnes|enfants|éléments?|profils?|routines?|stères|couverts|foyers|avis|pays';
const UNITE = new RegExp(`(\\d) (?=(?:${UNITES})(?![A-Za-zÀ-ÖØ-öø-ÿ0-9]))`, 'g');

export function fr(s: string): string {
  return s
    .replace(/'/g, '’')
    .replace(/\.\.\./g, '…')
    .replace(/« /g, `«${NBSP}`)
    .replace(/ »/g, `${NBSP}»`)
    .replace(/ :/g, `${NBSP}:`)
    .replace(/ ([;!?])/g, `${FINE}$1`)
    .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${FINE}`)
    .replace(/(\d{1,2}) h (\d{2})/g, `$1${NBSP}h${NBSP}$2`)
    .replace(UNITE, `$1${NBSP}`);
}

/** Minuscules sans accents, pour reconnaître des mots dans un message */
export function plat(s: string): string {
  return s
    .toLowerCase()
    .replace(/[àâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/[’']/g, "'");
}
