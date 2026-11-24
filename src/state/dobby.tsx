import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import {
  FAMILLE,
  journalInitial,
  MEMOIRE,
  residencesInitiales,
  ROUTINES,
  VALIDATIONS,
  type Entree,
  type Raccourci,
  type Residence,
  type ResidenceId,
  type Validation,
} from '@/data/maison';
import { consigne, estUnArret, historique, laPiece, nomPiece, reponsePreparee } from '@/lib/dobby-parle';
import { fr, plat } from '@/lib/fr';
import { demanderADobby, nettoyer, reponsesLibres } from '@/lib/openrouter';
import { attendre, MIN, salutation } from '@/lib/temps';
import { vibrer } from '@/lib/vibrer';
import type { Etat, Message } from '@/state/types';

let compteur = 0;
const nouvelId = () => `${Date.now().toString(36)}-${(compteur++).toString(36)}`;

function etatInitial(): Etat {
  return {
    residence: 'paris',
    residences: residencesInitiales(),
    journal: journalInitial().sort((a, b) => b.ts - a.ts),
    validations: VALIDATIONS,
    messages: [
      {
        id: 'bienvenue',
        ts: Date.now() - 2 * MIN,
        auteur: 'dobby',
        texte: fr(`${salutation()}. Je vous attendais. Écrivez-moi ce dont vous avez besoin, ou touchez un raccourci : je m'en occupe.`),
      },
    ],
    ecrit: 0,
    nonLus: 1,
    arret: null,
    volet: false,
    budget: 150,
    routines: ROUTINES,
    memoire: MEMOIRE,
  };
}

interface Valeur {
  etat: Etat;
  residence: Residence;
  famille: typeof FAMILLE;
  cleIA: boolean;
  choisirResidence: (id: ResidenceId) => void;
  envoyer: (texte: string) => void;
  lancerRaccourci: (id: string) => void;
  decider: (id: string, accepter: boolean) => void;
  arreter: () => void;
  relancer: () => void;
  basculerZone: (piece: string) => void;
  basculerVolet: () => void;
  basculerRoutine: (id: string) => void;
  oublier: (id: string) => void;
  toutOublier: () => void;
  changerBudget: (ecart: number) => void;
  messagesVus: (ouverts: boolean) => void;
}

const Contexte = createContext<Valeur | null>(null);

export function useDobby(): Valeur {
  const v = useContext(Contexte);
  if (!v) throw new Error('useDobby doit être utilisé dans DobbyProvider');
  return v;
}

export function DobbyProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<Etat>(etatInitial);
  // copie de l'état à jour, lue par les minuteurs et les réponses qui arrivent plus tard
  const ref = useRef(etat);
  useLayoutEffect(() => {
    ref.current = etat;
  });
  const minuteurs = useRef(new Set<ReturnType<typeof setTimeout>>());
  const messagesOuverts = useRef(false);

  // --- petites fonctions pures sur l'état ---

  const ajouterJournal = (e: Etat, x: Omit<Entree, 'id' | 'ts'>): Etat => ({
    ...e,
    journal: [{ id: nouvelId(), ts: Date.now(), ...x }, ...e.journal],
  });

  const ajouterMessage = (e: Etat, m: Omit<Message, 'id' | 'ts'>): Etat => ({
    ...e,
    messages: [...e.messages, { ...m, id: nouvelId(), ts: Date.now(), texte: m.texte ? fr(m.texte) : undefined }],
    nonLus: m.auteur === 'dobby' && !messagesOuverts.current ? e.nonLus + 1 : e.nonLus,
  });

  const majResidence = (e: Etat, id: ResidenceId, maj: (r: Residence) => Residence): Etat => ({
    ...e,
    residences: { ...e.residences, [id]: maj(e.residences[id]) },
  });

  // --- minuteurs : tous annulés par l'arrêt d'urgence ---

  const plusTard = (ms: number, action: () => void) => {
    const t = setTimeout(() => {
      minuteurs.current.delete(t);
      action();
    }, Math.max(0, ms));
    minuteurs.current.add(t);
  };

  /** Dobby écrit (trois points), puis son message arrive */
  const dobbyDit = (m: Omit<Message, 'id' | 'ts' | 'auteur'>, delai: number) => {
    setEtat((e) => ({ ...e, ecrit: e.ecrit + 1 }));
    plusTard(delai, () =>
      setEtat((e) => ajouterMessage({ ...e, ecrit: Math.max(0, e.ecrit - 1) }, { auteur: 'dobby', ...m })),
    );
  };

  // La bibliothèque de Paris se range pendant que l'on parcourt l'appli
  useEffect(() => {
    const liste = minuteurs.current;
    const t = ref.current.residences.paris.tache;
    if (t) {
      plusTard(t.debut + t.duree - Date.now(), () =>
        setEtat((e) => {
          if (e.residences.paris.tache?.label !== t.label) return e;
          const n = majResidence(e, 'paris', (r) => ({ ...r, tache: null }));
          return ajouterJournal(n, { residence: 'paris', texte: 'Bibliothèque rangée', piece: 'salon', type: 'tache' });
        }),
      );
    }
    return () => {
      liste.forEach(clearTimeout);
      liste.clear();
    };
    // une seule fois, au lancement
  }, []);

  // --- actions ---

  const choisirResidence = (id: ResidenceId) => {
    if (ref.current.residence === id) return;
    vibrer('choix');
    setEtat((e) => ({ ...e, residence: id }));
  };

  const terminer = (rid: ResidenceId, rc: Raccourci, tacheId: number) => {
    const e = ref.current;
    if (e.residences[rid].tache?.debut !== tacheId) return; // tâche annulée entre-temps
    const c = { maintenant: Date.now(), budget: e.budget };

    if (rc.achat && rc.achat.montant > e.budget) {
      const achat = rc.achat;
      const v: Validation = {
        id: nouvelId(),
        residence: rid,
        titre: achat.titre,
        detail: achat.detail,
        montant: achat.montant,
        icone: rc.icone,
        statut: 'attente',
      };
      vibrer('leger');
      setEtat((s) => {
        let n = majResidence(s, rid, (r) => ({ ...r, tache: null }));
        n = { ...n, validations: [v, ...n.validations] };
        n = ajouterJournal(n, { residence: rid, texte: `Demande d'accord envoyée : ${achat.titre.toLowerCase()}`, type: 'achat' });
        return ajouterMessage(n, {
          auteur: 'dobby',
          texte: `Le panier fait ${achat.montant} €, au-delà de votre budget de ${s.budget} € par achat. J'attends votre accord.`,
          validation: v.id,
        });
      });
      return;
    }

    vibrer('succes');
    setEtat((s) => {
      let n = majResidence(s, rid, (r) => ({ ...r, tache: null, temperature: rc.temperature ?? r.temperature }));
      n = ajouterJournal(n, { residence: rid, texte: rc.journal, piece: rc.piece, type: rc.achat ? 'achat' : 'tache' });
      n = ajouterMessage(n, { auteur: 'dobby', texte: rc.fait(c) });
      if (rc.photo) n = ajouterMessage(n, { auteur: 'dobby', photo: rc.photo, legende: rc.legende?.(c) });
      return n;
    });
  };

  const executer = (rc: Raccourci) => {
    const e = ref.current;
    const rid = e.residence;
    const r = e.residences[rid];

    if (r.privees.includes(rc.piece)) {
      dobbyDit(
        {
          texte: `${laPiece(r, rc.piece)} est une Zone privée : je n'y entre pas. Vous pouvez la rouvrir depuis le Plan, si vous le souhaitez.`,
        },
        900,
      );
      return;
    }

    dobbyDit({ texte: rc.confirme({ maintenant: Date.now(), budget: e.budget }) }, 900);
    plusTard(900, () => {
      const debut = Date.now();
      setEtat((s) =>
        majResidence(s, rid, (x) => ({
          ...x,
          piece: rc.piece,
          tache: { label: rc.enCours, piece: rc.piece, debut, duree: rc.duree },
        })),
      );
      plusTard(rc.duree, () => terminer(rid, rc, debut));
    });
  };

  const lancerRaccourci = (id: string) => {
    const rc = ref.current.residences[ref.current.residence].raccourcis.find((x) => x.id === id);
    if (!rc) return;
    vibrer('choix');
    setEtat((e) => ajouterMessage(e, { auteur: 'moi', texte: rc.label }));
    executer(rc);
  };

  const repondre = async (texte: string) => {
    const e = ref.current;
    setEtat((s) => ({ ...s, ecrit: s.ecrit + 1 }));
    const depart = Date.now();
    let reponse: string;
    if (reponsesLibres()) {
      try {
        reponse = await demanderADobby([{ role: 'system', content: consigne(e) }, ...historique(e.messages, texte)]);
      } catch (err) {
        console.log(`[Dobby] Réponse préparée à la place. ${err instanceof Error ? err.message : String(err)}`);
        reponse = reponsePreparee(texte, ref.current);
      }
    } else {
      reponse = reponsePreparee(texte, e);
    }
    const ecoule = Date.now() - depart;
    if (ecoule < 1100) await attendre(1100 - ecoule + Math.random() * 600);
    if (ref.current.arret) {
      setEtat((s) => ({ ...s, ecrit: Math.max(0, s.ecrit - 1) }));
      return;
    }
    setEtat((s) => ajouterMessage({ ...s, ecrit: Math.max(0, s.ecrit - 1) }, { auteur: 'dobby', texte: nettoyer(reponse) }));
  };

  const arreter = () => {
    if (ref.current.arret) return;
    minuteurs.current.forEach(clearTimeout);
    minuteurs.current.clear();
    vibrer('fort');
    const rid = ref.current.residence;
    setEtat((s) => {
      const r = s.residences[rid];
      let n: Etat = { ...s, arret: Date.now(), ecrit: 0 };
      if (r.tache) {
        n = ajouterJournal(n, { residence: rid, texte: `Tâche interrompue : ${r.tache.label.toLowerCase()}`, piece: r.tache.piece, type: 'tache' });
      }
      n = majResidence(n, rid, (x) => ({ ...x, tache: null }));
      return ajouterJournal(n, { residence: rid, texte: "Arrêt d'urgence depuis l'application", piece: r.piece, type: 'securite' });
    });
  };

  const envoyer = (brut: string) => {
    const texte = brut.trim();
    if (!texte) return;
    setEtat((e) => ajouterMessage(e, { auteur: 'moi', texte }));
    if (estUnArret(texte)) {
      arreter();
      return;
    }
    const e = ref.current;
    const rc = e.residences[e.residence].raccourcis.find((x) => plat(x.label) === plat(texte));
    if (rc) executer(rc);
    else void repondre(texte);
  };

  const relancer = () => {
    vibrer('succes');
    setEtat((s) => {
      const n = ajouterJournal({ ...s, arret: null }, { residence: s.residence, texte: "Dobby relancé depuis l'application", type: 'securite' });
      return ajouterMessage(n, { auteur: 'dobby', texte: 'Je suis de nouveau disponible. Rien n’a bougé pendant l’arrêt.' });
    });
  };

  const decider = (id: string, accepter: boolean) => {
    const v = ref.current.validations.find((x) => x.id === id);
    if (!v || v.statut !== 'attente') return;
    vibrer(accepter ? 'succes' : 'leger');
    setEtat((s) => {
      const n: Etat = {
        ...s,
        validations: s.validations.map((x) => (x.id === id ? { ...x, statut: accepter ? 'acceptee' : 'refusee' } : x)),
      };
      return ajouterJournal(n, {
        residence: v.residence,
        texte: accepter ? `Achat validé : ${v.titre.toLowerCase()}, ${v.montant} €` : `Achat refusé : ${v.titre.toLowerCase()}`,
        type: 'achat',
      });
    });
    dobbyDit(
      {
        texte: accepter
          ? `Merci, c'est validé : ${v.titre.toLowerCase()}, ${v.montant} €. Je m'occupe de la suite.`
          : "Entendu, je n'achète rien. Je garde la liste si vous changez d'avis.",
      },
      800,
    );
  };

  const basculerZone = (pieceId: string) => {
    const rid = ref.current.residence;
    const r = ref.current.residences[rid];
    const privee = r.privees.includes(pieceId);
    const nom = nomPiece(r, pieceId).toLowerCase();
    vibrer('choix');
    setEtat((s) => {
      const n = majResidence(s, rid, (x) => ({
        ...x,
        privees: privee ? x.privees.filter((p) => p !== pieceId) : [...x.privees, pieceId],
        // Dobby sort aussitôt de la pièce qui devient privée
        piece: !privee && x.piece === pieceId ? 'entree' : x.piece,
        tache: !privee && x.tache?.piece === pieceId ? null : x.tache,
      }));
      return ajouterJournal(n, {
        residence: rid,
        texte: privee ? `Zone privée retirée : ${nom}` : `Zone privée ajoutée : ${nom}`,
        piece: pieceId,
        type: 'securite',
      });
    });
  };

  const basculerVolet = () => {
    const volet = !ref.current.volet;
    vibrer('choix');
    setEtat((s) =>
      ajouterJournal({ ...s, volet }, {
        residence: s.residence,
        texte: volet ? 'Volet des caméras fermé' : 'Volet des caméras rouvert',
        type: 'securite',
      }),
    );
  };

  const basculerRoutine = (id: string) => {
    vibrer('choix');
    setEtat((s) => ({ ...s, routines: s.routines.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) }));
  };

  const oublier = (id: string) => {
    vibrer('leger');
    setEtat((s) => ({ ...s, memoire: s.memoire.filter((m) => m.id !== id) }));
  };

  const toutOublier = () => {
    vibrer('fort');
    setEtat((s) =>
      ajouterJournal({ ...s, memoire: [] }, { residence: s.residence, texte: 'Mémoire de Dobby effacée', type: 'securite' }),
    );
  };

  const changerBudget = (ecart: number) => {
    vibrer('choix');
    setEtat((s) => ({ ...s, budget: Math.min(1000, Math.max(50, s.budget + ecart)) }));
  };

  const messagesVus = (ouverts: boolean) => {
    messagesOuverts.current = ouverts;
    if (ouverts) setEtat((s) => (s.nonLus ? { ...s, nonLus: 0 } : s));
  };

  const valeur: Valeur = {
    etat,
    residence: etat.residences[etat.residence],
    famille: FAMILLE,
    cleIA: reponsesLibres(),
    choisirResidence,
    envoyer,
    lancerRaccourci,
    decider,
    arreter,
    relancer,
    basculerZone,
    basculerVolet,
    basculerRoutine,
    oublier,
    toutOublier,
    changerBudget,
    messagesVus,
  };

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}
