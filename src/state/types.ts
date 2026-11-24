import type {
  Entree,
  PhotoId,
  Residence,
  ResidenceId,
  Routine,
  Souvenir,
  Validation,
} from '@/data/maison';

export interface Message {
  id: string;
  ts: number;
  auteur: 'moi' | 'dobby';
  texte?: string;
  photo?: PhotoId;
  legende?: string;
  /** demande d'accord affichée dans la conversation */
  validation?: string;
}

export interface Etat {
  residence: ResidenceId;
  residences: Record<ResidenceId, Residence>;
  journal: Entree[];
  validations: Validation[];
  messages: Message[];
  /** nombre de réponses en cours de rédaction */
  ecrit: number;
  nonLus: number;
  /** heure de l'arrêt d'urgence, null si Dobby fonctionne */
  arret: number | null;
  /** volet des caméras fermé */
  volet: boolean;
  /** au-delà de ce montant, Dobby demande votre accord */
  budget: number;
  routines: Routine[];
  memoire: Souvenir[];
}
