// Couleurs du site Dobby (palette Couleur.png), déclinées en thème clair :
// texte foncé (nuit, orage) sur fond clair, givre pour les accents, rouge réservé à l'arrêt d'urgence.
export const C = {
  fond: '#F2F7F9',
  carte: '#FFFFFF',
  neige: '#E7F3F9',
  givre: '#B8E2F2',
  brume: '#9DC1CF',
  lac: '#7E9AA6',
  ardoise: '#5F747D',
  gris: '#55686F',
  orage: '#404E54',
  nuit: '#151D20',
  arret: '#D83C42',
  privee: '#DDE7EB',
  filet: 'rgba(64, 78, 84, 0.13)',
  voile: 'rgba(13, 19, 22, 0.4)',
} as const;

// Italiana pour les grands titres, Manrope pour le reste (comme sur le site)
export const F = {
  titre: 'Italiana_400Regular',
  leger: 'Manrope_300Light',
  texte: 'Manrope_400Regular',
  moyen: 'Manrope_500Medium',
  demi: 'Manrope_600SemiBold',
  gras: 'Manrope_700Bold',
} as const;

export const MARGE = 20;
export const RAYON = 20;
