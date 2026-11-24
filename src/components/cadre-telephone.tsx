import type { ReactNode } from 'react';

// Sur un téléphone, l'appli occupe tout l'écran : rien à dessiner.
// La version pour navigateur (l'appli dans un téléphone dessiné) est dans cadre-telephone.web.tsx.

/** Vrai quand la page est ouverte sur un ordinateur : l'appli s'affiche alors dans un téléphone dessiné */
export const surOrdinateur = false;

export function CadreTelephone() {
  return null;
}

/** Dans le téléphone dessiné, l'appli reçoit les marges d'un vrai écran (barre d'état, barre de navigation) */
export function MargesTelephone({ children }: { children: ReactNode }) {
  return children;
}
