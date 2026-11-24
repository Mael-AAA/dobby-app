export const MIN = 60_000;

const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

/** 14 h 05 */
export function heure(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 20 h, ou 20 h 15 */
export function heureRonde(ts: number): string {
  const d = new Date(ts);
  return d.getMinutes() === 0 ? `${d.getHours()} h` : heure(ts);
}

/** Arrondit au quart d'heure suivant */
export function quartSuivant(ts: number): number {
  const q = 15 * MIN;
  return Math.ceil(ts / q) * q;
}

export function salutation(ts = Date.now()): string {
  const h = new Date(ts).getHours();
  return h >= 5 && h < 18 ? 'Bonjour' : 'Bonsoir';
}

/** Aujourd'hui, Hier ou 12 novembre */
export function jour(ts: number): string {
  const d = new Date(ts);
  const debut = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ecart = Math.round((debut(new Date()) - debut(d)) / (24 * 60 * MIN));
  if (ecart === 0) return 'Aujourd’hui';
  if (ecart === 1) return 'Hier';
  return `${d.getDate()} ${MOIS[d.getMonth()]}`;
}

export const attendre = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms));
