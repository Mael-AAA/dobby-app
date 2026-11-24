import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { heure, heureRonde, MIN, quartSuivant } from '@/lib/temps';

export type IconeMC = ComponentProps<typeof MaterialCommunityIcons>['name'];
export type ResidenceId = 'paris' | 'megeve' | 'capferret';
export type PhotoId = 'plume' | 'linge' | 'diner' | 'cuisine';

export const PHOTOS: Record<PhotoId, number> = {
  plume: require('../../assets/images/photos/plume.webp'),
  linge: require('../../assets/images/photos/linge.webp'),
  diner: require('../../assets/images/photos/diner.webp'),
  cuisine: require('../../assets/images/photos/cuisine.webp'),
};

/** Pièce du plan, dans un repère de 600 × 400 (comme le plan du site) */
export interface Piece {
  id: string;
  nom: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const COULOIR = { x: 20, y: 170, w: 560, h: 60 };
export const STATION = { x: 556, y: 200 };

function plan(noms: [string, string][]): Piece[] {
  const cadres = [
    { x: 20, y: 20, w: 240, h: 150 },
    { x: 260, y: 20, w: 160, h: 150 },
    { x: 420, y: 20, w: 160, h: 150 },
    { x: 20, y: 230, w: 120, h: 150 },
    { x: 140, y: 230, w: 120, h: 150 },
    { x: 260, y: 230, w: 160, h: 150 },
    { x: 420, y: 230, w: 160, h: 150 },
  ];
  return noms.map(([id, nom], i) => ({ id, nom, ...cadres[i] }));
}

export interface Tache {
  label: string;
  piece: string;
  debut: number;
  duree: number;
}

export interface Residence {
  id: ResidenceId;
  nom: string;
  type: string;
  temperature: number;
  batterie: number;
  /** pièce où se trouve Dobby */
  piece: string;
  tache: Tache | null;
  /** ce qu'on affiche quand Dobby n'a rien en cours */
  repos: string;
  pieces: Piece[];
  privees: string[];
  raccourcis: Raccourci[];
}

export interface Contexte {
  maintenant: number;
  budget: number;
}

export interface Raccourci {
  id: string;
  label: string;
  icone: IconeMC;
  piece: string;
  /** tâche affichée pendant l'exécution, à la 3e personne : « Nourrit Plume » */
  enCours: string;
  confirme: (c: Contexte) => string;
  fait: (c: Contexte) => string;
  journal: string;
  duree: number;
  photo?: PhotoId;
  legende?: (c: Contexte) => string;
  /** achat soumis au budget : au-delà, Dobby demande votre accord */
  achat?: { titre: string; detail: string; montant: number };
  temperature?: number;
}

const volets = (piece: string): Raccourci => ({
  id: 'volets',
  label: 'Fermer les volets',
  icone: 'window-shutter',
  piece,
  enCours: 'Ferme les volets',
  confirme: () => 'Je ferme les volets et je tamise la lumière.',
  fait: () => 'Volets fermés. Lumière du salon à 40 %.',
  journal: 'Volets fermés, lumière à 40 %',
  duree: 4500,
});

const courses = (montant: number, titre: string): Raccourci => ({
  id: 'courses',
  label: 'Commander les courses',
  icone: 'cart-outline',
  piece: 'cuisine',
  enCours: 'Prépare le panier',
  confirme: () => 'Je prépare le panier, d’après ce qui manque dans les placards.',
  fait: () => 'Courses commandées. Livraison demain entre 9 h et 10 h.',
  journal: `${titre} commandées, ${montant} €`,
  duree: 3500,
  achat: { titre, detail: 'Épicerie fine, livraison demain matin', montant },
});

const lessive = (piece: string): Raccourci => ({
  id: 'lessive',
  label: 'Lancer une lessive',
  icone: 'washing-machine',
  piece,
  enCours: 'Lance une lessive',
  confirme: () => 'Draps de la chambre des enfants, programme 40 °C.',
  fait: (c) => `Lessive lancée. Fin prévue à ${heure(c.maintenant + 75 * MIN)}, je l’étendrai.`,
  journal: 'Lessive lancée, draps des enfants',
  duree: 6000,
  photo: 'linge',
  legende: (c) => `Chambre des enfants, ${heure(c.maintenant)}`,
});

export function residencesInitiales(): Record<ResidenceId, Residence> {
  const now = Date.now();
  return {
    paris: {
      id: 'paris',
      nom: 'Paris 16e',
      type: 'Appartement',
      temperature: 21,
      batterie: 82,
      piece: 'salon',
      tache: { label: 'Range la bibliothèque', piece: 'salon', debut: now - 6 * MIN, duree: 10 * MIN },
      repos: 'Tout est calme à la maison.',
      pieces: plan([
        ['salon', 'Salon'],
        ['cuisine', 'Cuisine'],
        ['bureau', 'Bureau'],
        ['entree', 'Entrée'],
        ['bain', 'Salle de bains'],
        ['enfants', 'Chambre des enfants'],
        ['parents', 'Chambre parentale'],
      ]),
      privees: ['parents'],
      raccourcis: [
        {
          id: 'plume',
          label: 'Nourrir Plume',
          icone: 'cat',
          piece: 'cuisine',
          enCours: 'Nourrit Plume',
          confirme: () => 'C’est noté, j’y vais.',
          fait: (c) => `C’est fait. Plume a mangé à ${heure(c.maintenant)}.`,
          journal: 'Plume a mangé',
          duree: 6000,
          photo: 'plume',
          legende: (c) => `Plume, ${heure(c.maintenant)}`,
        },
        {
          id: 'diner',
          label: 'Préparer le dîner',
          icone: 'silverware-fork-knife',
          piece: 'cuisine',
          enCours: 'Prépare le dîner',
          confirme: (c) =>
            `Velouté et risotto pour quatre, sans noisettes pour Léo. Prêts à ${heureRonde(quartSuivant(c.maintenant + 40 * MIN))}.`,
          fait: () => 'Le dîner est prêt. Table dressée pour quatre.',
          journal: 'Dîner prêt, table dressée pour quatre',
          duree: 8000,
          photo: 'diner',
          legende: (c) => `Salle à manger, ${heure(c.maintenant)}`,
        },
        lessive('bain'),
        volets('salon'),
        courses(186, 'Courses de la semaine'),
        {
          id: 'cuisine',
          label: 'Ranger la cuisine',
          icone: 'silverware-clean',
          piece: 'cuisine',
          enCours: 'Range la cuisine',
          confirme: () => 'Je lance le lave-vaisselle et je range le plan de travail.',
          fait: () => 'Cuisine rangée. Le lave-vaisselle finit dans une heure.',
          journal: 'Cuisine rangée, lave-vaisselle lancé',
          duree: 6000,
          photo: 'cuisine',
          legende: (c) => `Cuisine, ${heure(c.maintenant)}`,
        },
      ],
    },
    megeve: {
      id: 'megeve',
      nom: 'Megève',
      type: 'Chalet',
      temperature: 17,
      batterie: 100,
      piece: 'sejour',
      tache: null,
      repos: 'Chalet en veille jusqu’à votre arrivée.',
      pieces: plan([
        ['sejour', 'Séjour'],
        ['cuisine', 'Cuisine'],
        ['skis', 'Local à skis'],
        ['entree', 'Entrée'],
        ['sauna', 'Sauna'],
        ['enfants', 'Chambre des enfants'],
        ['parents', 'Chambre parentale'],
      ]),
      privees: ['parents'],
      raccourcis: [
        {
          id: 'chalet',
          label: 'Préparer le chalet',
          icone: 'home-thermometer-outline',
          piece: 'sejour',
          enCours: 'Prépare le chalet',
          confirme: () => 'Chauffage à 21 °C, lits faits et réfrigérateur rempli avant votre arrivée.',
          fait: () => 'Le chalet est prêt. Il fait 21 °C dans le séjour.',
          journal: 'Chalet prêt : chauffage, lits, réfrigérateur',
          duree: 7000,
          temperature: 21,
        },
        {
          id: 'cheminee',
          label: 'Allumer la cheminée',
          icone: 'fireplace',
          piece: 'sejour',
          enCours: 'Allume la cheminée',
          confirme: () => 'Je prépare un feu doux dans le séjour.',
          fait: () => 'Le feu est allumé, le pare-feu est en place.',
          journal: 'Cheminée allumée, pare-feu en place',
          duree: 5000,
        },
        {
          id: 'skis',
          label: 'Préparer les skis',
          icone: 'ski',
          piece: 'skis',
          enCours: 'Prépare les skis',
          confirme: () => 'Je sèche les chaussures et je farte les skis des enfants.',
          fait: () => 'Skis prêts pour demain matin, chaussures sèches.',
          journal: 'Skis fartés, chaussures sèches',
          duree: 6000,
        },
        volets('sejour'),
        courses(212, 'Courses du week-end'),
      ],
    },
    capferret: {
      id: 'capferret',
      nom: 'Cap-Ferret',
      type: 'Villa',
      temperature: 18,
      batterie: 64,
      piece: 'entree',
      tache: null,
      repos: 'En veille, volets fermés.',
      pieces: plan([
        ['salon', 'Salon'],
        ['cuisine', 'Cuisine'],
        ['terrasse', 'Terrasse'],
        ['entree', 'Entrée'],
        ['buanderie', 'Buanderie'],
        ['enfants', 'Chambre des enfants'],
        ['parents', 'Chambre parentale'],
      ]),
      privees: ['parents'],
      raccourcis: [
        {
          id: 'arrosage',
          label: 'Arroser le jardin',
          icone: 'watering-can-outline',
          piece: 'terrasse',
          enCours: 'Arrose le jardin',
          confirme: () => 'J’arrose le jardin et les pots de la terrasse.',
          fait: () => 'Jardin arrosé. Prochain arrosage demain à 6 h.',
          journal: 'Jardin arrosé',
          duree: 6000,
        },
        {
          id: 'aerer',
          label: 'Aérer la villa',
          icone: 'weather-windy',
          piece: 'salon',
          enCours: 'Aère la villa',
          confirme: () => 'J’ouvre les fenêtres vingt minutes, puis je referme tout.',
          fait: () => 'Villa aérée, fenêtres refermées.',
          journal: 'Villa aérée, fenêtres refermées',
          duree: 5000,
        },
        lessive('buanderie'),
        volets('salon'),
        courses(164, 'Courses pour la villa'),
      ],
    },
  };
}

export const ORDRE: ResidenceId[] = ['paris', 'megeve', 'capferret'];

export type TypeEntree = 'tache' | 'securite' | 'achat' | 'maison';

export interface Entree {
  id: string;
  ts: number;
  residence: ResidenceId;
  texte: string;
  piece?: string;
  type: TypeEntree;
}

export function journalInitial(): Entree[] {
  const now = Date.now();
  const veille = new Date(now - 24 * 60 * MIN);
  // il y a quelques minutes : des tâches qui ont du sens à toute heure
  const e = (min: number, residence: ResidenceId, texte: string, piece?: string, type: TypeEntree = 'tache'): Entree => ({
    id: `j-${residence}-${min}`,
    ts: now - min * MIN,
    residence,
    texte,
    piece,
    type,
  });
  // la veille : des heures précises
  const h = (hh: number, mm: number, residence: ResidenceId, texte: string, piece?: string, type: TypeEntree = 'tache'): Entree => ({
    id: `v-${residence}-${hh}-${mm}`,
    ts: new Date(veille.getFullYear(), veille.getMonth(), veille.getDate(), hh, mm).getTime(),
    residence,
    texte,
    piece,
    type,
  });
  return [
    e(6, 'paris', 'Rangement de la bibliothèque commencé', 'salon'),
    e(24, 'paris', 'Plantes du bureau arrosées', 'bureau'),
    e(47, 'paris', 'Linge plié et rangé', 'enfants'),
    e(71, 'paris', 'Courses rangées', 'cuisine'),
    e(96, 'paris', 'Salon aéré, fenêtre refermée', 'salon', 'maison'),
    e(140, 'paris', 'Demande d’accord envoyée : bouquets pour samedi', undefined, 'achat'),
    e(15, 'megeve', 'Chauffage maintenu à 17 °C', 'sejour', 'maison'),
    e(65, 'megeve', 'Cheminée préparée pour vendredi', 'sejour'),
    e(150, 'megeve', 'Demande d’accord envoyée : bois de chauffage', undefined, 'achat'),
    e(42, 'capferret', 'Arrosage du jardin terminé', 'terrasse'),
    e(190, 'capferret', 'Villa aérée, volets refermés', 'salon', 'maison'),
    h(22, 40, 'paris', 'Alarme activée pour la nuit', 'entree', 'securite'),
    h(19, 30, 'paris', 'Table dressée pour quatre', 'salon'),
    h(18, 45, 'paris', 'Plume a mangé, photo envoyée', 'cuisine'),
    h(17, 10, 'paris', 'Goûter servi, sans noisettes pour Léo', 'cuisine'),
    h(16, 0, 'megeve', 'Lits faits, chambres aérées', 'enfants'),
    h(6, 0, 'capferret', 'Arrosage du jardin', 'terrasse'),
  ];
}

export interface Validation {
  id: string;
  residence: ResidenceId;
  titre: string;
  detail: string;
  montant: number;
  icone: IconeMC;
  statut: 'attente' | 'acceptee' | 'refusee';
}

export const VALIDATIONS: Validation[] = [
  {
    id: 'fleurs',
    residence: 'paris',
    titre: 'Bouquets pour samedi',
    detail: 'Fleuriste de l’avenue Mozart',
    montant: 240,
    icone: 'flower-outline',
    statut: 'attente',
  },
  {
    id: 'bois',
    residence: 'megeve',
    titre: 'Bois de chauffage, 2 stères',
    detail: 'Livraison jeudi au chalet',
    montant: 380,
    icone: 'fire',
    statut: 'attente',
  },
];

export interface Routine {
  id: string;
  titre: string;
  quand: string;
  residence: ResidenceId;
  icone: IconeMC;
  active: boolean;
}

export const ROUTINES: Routine[] = [
  { id: 'cafe', titre: 'Café serré pour Claire', quand: 'Chaque jour à 7 h', residence: 'paris', icone: 'coffee-outline', active: true },
  { id: 'plume', titre: 'Repas de Plume', quand: 'Chaque jour à 7 h 30 et 18 h 45', residence: 'paris', icone: 'cat', active: true },
  { id: 'linge', titre: 'Linge de la semaine', quand: 'Lundi et jeudi', residence: 'paris', icone: 'tshirt-crew-outline', active: true },
  { id: 'gouter', titre: 'Goûter des enfants', quand: 'Mercredi à 16 h 30', residence: 'paris', icone: 'food-apple-outline', active: true },
  { id: 'volets', titre: 'Volets du salon', quand: 'Chaque soir, au coucher du soleil', residence: 'paris', icone: 'window-shutter', active: true },
  { id: 'chalet', titre: 'Préparer le chalet', quand: 'Le vendredi, avant votre arrivée', residence: 'megeve', icone: 'home-thermometer-outline', active: false },
  { id: 'arrosage', titre: 'Arrosage du jardin', quand: 'Chaque jour à 6 h', residence: 'capferret', icone: 'watering-can-outline', active: true },
];

export interface Souvenir {
  id: string;
  texte: string;
  categorie: 'Goûts' | 'Habitudes' | 'Maison';
}

export const MEMOIRE: Souvenir[] = [
  { id: 'cafe', texte: 'Café serré pour Claire, à 7 h', categorie: 'Goûts' },
  { id: 'viande', texte: 'Claire ne mange pas de viande', categorie: 'Goûts' },
  { id: 'noisettes', texte: 'Léo est allergique aux noisettes', categorie: 'Goûts' },
  { id: 'fauteuil', texte: 'Plume dort sur le fauteuil l’après-midi', categorie: 'Habitudes' },
  { id: 'veilleuse', texte: 'Jeanne s’endort avec la veilleuse allumée', categorie: 'Habitudes' },
  { id: 'mercredi', texte: 'Le mercredi, les enfants rentrent à 16 h 30', categorie: 'Habitudes' },
  { id: 'livres', texte: 'Les livres du bureau ne bougent pas', categorie: 'Maison' },
  { id: 'cles', texte: 'Les clés de la voiture vont dans la coupe de l’entrée', categorie: 'Maison' },
];

export interface Profil {
  id: string;
  nom: string;
  role: string;
  droits: string;
}

export const FAMILLE: Profil[] = [
  { id: 'alexandre', nom: 'Alexandre', role: 'Parent', droits: 'Tous les droits' },
  { id: 'claire', nom: 'Claire', role: 'Parent', droits: 'Tous les droits' },
  { id: 'leo', nom: 'Léo, 13 ans', role: 'Profil enfant', droits: 'Demandes limitées, aucun achat' },
  { id: 'jeanne', nom: 'Jeanne, 9 ans', role: 'Profil enfant', droits: 'Demandes limitées, aucun achat' },
  { id: 'sofia', nom: 'Sofia', role: 'Gouvernante', droits: 'Tâches du quotidien, sans achat ni réglage' },
];

export const DROITS: { droit: string; parents: boolean; enfants: boolean }[] = [
  { droit: 'Demander un goûter, une histoire, de l’aide pour ranger', parents: true, enfants: true },
  { droit: 'Acheter, commander, réserver', parents: true, enfants: false },
  { droit: 'Faire sortir Dobby de la maison', parents: true, enfants: false },
  { droit: 'Modifier les Zones privées', parents: true, enfants: false },
  { droit: 'Arrêter Dobby', parents: true, enfants: true },
];

export const CONSEILLER = {
  nom: 'Camille Dufour',
  role: 'Votre Conseillère Dobby',
  telephone: '01 99 00 24 24',
  lien: 'tel:+33199002424',
};
