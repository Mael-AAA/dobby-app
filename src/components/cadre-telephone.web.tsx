import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { DobbyFace } from '@/components/dobby-face';
import { fr } from '@/lib/fr';
import { C, F } from '@/theme';

// Sur un ordinateur, la page montre l'appli dans un téléphone dessiné.
// L'écran du téléphone est un cadre (iframe) qui charge la même adresse : à l'intérieur, l'appli
// dispose de 390 points de large, comme sur un smartphone, et s'affiche exactement de la même façon.
// Sur un téléphone ou dans une fenêtre étroite, l'appli occupe simplement toute la page.

const ECRAN_LARGEUR = 390;
const ECRAN_HAUTEUR = 844;
const BORD = 12; // épaisseur du contour
const AIR = 28; // espace minimal autour du téléphone
/** Marges d'un smartphone récent : barre d'état en haut, barre de navigation en bas */
const MARGES = { top: 44, right: 0, bottom: 24, left: 0 };

function estDansUnCadre(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

const DANS_LE_CADRE = estDansUnCadre();

export const surOrdinateur =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  !DANS_LE_CADRE &&
  window.matchMedia('(min-width: 720px) and (min-height: 600px) and (hover: hover) and (pointer: fine)').matches;

export function MargesTelephone({ children }: { children: ReactNode }) {
  if (!DANS_LE_CADRE) return children;
  return <SafeAreaInsetsContext.Provider value={MARGES}>{children}</SafeAreaInsetsContext.Provider>;
}

function useHeure(): string {
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setMaintenant(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  return maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function Icones() {
  return (
    <div style={st.icones}>
      <svg width="17" height="11" viewBox="0 0 17 11" aria-hidden="true">
        <rect x="0" y="7" width="3" height="4" rx="1" fill={C.nuit} />
        <rect x="4.6" y="4.8" width="3" height="6.2" rx="1" fill={C.nuit} />
        <rect x="9.2" y="2.4" width="3" height="8.6" rx="1" fill={C.nuit} />
        <rect x="13.8" y="0" width="3" height="11" rx="1" fill={C.nuit} />
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
        <path d="M1.3 4.6a9.5 9.5 0 0 1 13.4 0" fill="none" stroke={C.nuit} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4 7.3a5.6 5.6 0 0 1 8 0" fill="none" stroke={C.nuit} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="8" cy="10.2" r="1.5" fill={C.nuit} />
      </svg>
      <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true">
        <rect x="0.6" y="0.6" width="21.8" height="10.8" rx="3.3" fill="none" stroke={C.nuit} strokeOpacity="0.45" strokeWidth="1.2" />
        <rect x="2.3" y="2.3" width="15.2" height="7.4" rx="1.8" fill={C.nuit} />
        <path d="M23.8 4.1v3.8c.8-.3 1.4-1 1.4-1.9s-.6-1.6-1.4-1.9Z" fill={C.nuit} fillOpacity="0.45" />
      </svg>
    </div>
  );
}

/** La page vue sur un ordinateur : l'appli dans un téléphone, et une courte légende si la place le permet */
export function CadreTelephone() {
  const { width, height } = useWindowDimensions();
  const heure = useHeure();
  const [adresse] = useState(() => window.location.href);

  // Le téléphone garde la largeur d'un vrai écran. S'il manque de hauteur, il raccourcit, puis rapetisse.
  const ecranHauteur = Math.min(ECRAN_HAUTEUR, Math.max(680, height - 2 * (AIR + BORD)));
  const telLargeur = ECRAN_LARGEUR + 2 * BORD;
  const telHauteur = ecranHauteur + 2 * BORD;
  const echelle = Math.min(1, (height - 2 * AIR) / telHauteur);
  const legende = width >= 1000;

  return (
    <div style={st.page}>
      {legende ? (
        <div style={st.legende}>
          <DobbyFace taille={40} />
          <div style={st.titre}>Dobby</div>
          <p style={st.texte}>
            {fr("L'application qui accompagne Dobby : suivre ce qu'il fait, lui confier une tâche, l'arrêter d'un geste.")}
          </p>
          <p style={st.note}>{fr("Sur un téléphone, cette adresse ouvre l'application en plein écran.")}</p>
        </div>
      ) : null}

      <div style={{ position: 'relative', flexShrink: 0, width: telLargeur * echelle, height: telHauteur * echelle }}>
        <div style={{ ...st.telephone, width: telLargeur, height: telHauteur, transform: `scale(${echelle})` }}>
          <div style={{ ...st.bouton, left: -4, top: 168, height: 54 }} />
          <div style={{ ...st.bouton, left: -4, top: 236, height: 54 }} />
          <div style={{ ...st.bouton, right: -4, top: 204, height: 86 }} />
          <div style={{ ...st.ecran, height: ecranHauteur }}>
            <iframe src={adresse} title="Application Dobby" style={st.cadre} />
            <div style={st.barreEtat} aria-hidden="true">
              <span style={st.heure}>{heure}</span>
              <Icones />
            </div>
            <div style={st.camera} aria-hidden="true" />
            <div style={st.navigation} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

const SYSTEME = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const st: Record<string, CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 72,
    overflow: 'hidden',
    background: `linear-gradient(160deg, ${C.fond} 0%, ${C.neige} 58%, #D6E8F0 100%)`,
  },
  legende: { width: 300, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 },
  titre: { fontFamily: F.titre, fontSize: 64, lineHeight: 1, color: C.nuit, marginTop: 6 },
  texte: { margin: 0, fontFamily: F.texte, fontSize: 16, lineHeight: 1.6, color: C.orage },
  note: { margin: 0, fontFamily: F.moyen, fontSize: 13, lineHeight: 1.5, color: C.gris },
  telephone: {
    position: 'absolute',
    top: 0,
    left: 0,
    boxSizing: 'border-box',
    padding: BORD,
    borderRadius: 54,
    background: C.nuit,
    transformOrigin: 'top left',
    boxShadow: '0 50px 90px -30px rgba(21, 29, 32, 0.5), 0 18px 36px -18px rgba(21, 29, 32, 0.35)',
  },
  bouton: { position: 'absolute', width: 4, borderRadius: 2, background: '#0D1316' },
  ecran: {
    position: 'relative',
    width: ECRAN_LARGEUR,
    borderRadius: 42,
    overflow: 'hidden',
    background: C.fond,
  },
  cadre: { display: 'block', width: '100%', height: '100%', border: 0, background: C.fond },
  barreEtat: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: MARGES.top,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2px 26px 0 32px',
    boxSizing: 'border-box',
    pointerEvents: 'none',
  },
  heure: { fontFamily: SYSTEME, fontSize: 15, fontWeight: 600, color: C.nuit, letterSpacing: 0.2 },
  icones: { display: 'flex', alignItems: 'center', gap: 6 },
  camera: {
    position: 'absolute',
    top: 14,
    left: '50%',
    width: 13,
    height: 13,
    marginLeft: -6.5,
    borderRadius: '50%',
    background: '#0D1316',
    pointerEvents: 'none',
  },
  navigation: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    width: 118,
    height: 4.5,
    marginLeft: -59,
    borderRadius: 3,
    background: C.nuit,
    opacity: 0.85,
    pointerEvents: 'none',
  },
};
