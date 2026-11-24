import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DobbyFace } from '@/components/dobby-face';
import { Carte, Progression, T, type IconeFeather } from '@/components/ui';
import type { Residence } from '@/data/maison';
import { nomPiece } from '@/lib/dobby-parle';
import { C } from '@/theme';

/** Heure courante, rafraîchie toutes les secondes (pour les barres de progression) */
export function useMaintenant(intervalle = 1000): number {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setT(Date.now()), intervalle);
    return () => clearInterval(i);
  }, [intervalle]);
  return t;
}

function Info({ icone, texte }: { icone: IconeFeather; texte: string }) {
  return (
    <View style={st.info}>
      <Feather name={icone} size={16} color={C.orage} />
      <T variante="note">
        {texte}
      </T>
    </View>
  );
}

/** État d'une résidence : ce que fait Dobby, où il est, sa batterie, la température */
export function CarteResidence({ r, largeur, arret, volet }: { r: Residence; largeur: number; arret: boolean; volet: boolean }) {
  const maintenant = useMaintenant();
  const progression = r.tache ? Math.min(1, Math.max(0, (maintenant - r.tache.debut) / r.tache.duree)) : 0;
  const zones = r.privees.length;

  return (
    <Carte style={[st.carte, { width: largeur }]}>
      <View style={st.ligne}>
        <View style={{ flex: 1 }}>
          <T variante="section">{r.nom}</T>
          <T variante="note">{r.type}</T>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T variante="chiffre">{`${r.temperature} °C`}</T>
          <T variante="note">à l’intérieur</T>
        </View>
      </View>

      <View style={[st.ligne, { gap: 14 }]}>
        <DobbyFace taille={52} eteint={arret} voile={volet} />
        <View style={{ flex: 1, gap: 2 }}>
          <T variante="etiquette">{arret ? 'Arrêt d’urgence' : r.tache ? 'En ce moment' : 'Disponible'}</T>
          <T variante="fort">{arret ? 'Dobby est à l’arrêt' : r.tache ? r.tache.label : r.repos}</T>
          <T variante="note">{nomPiece(r, r.tache?.piece ?? r.piece)}</T>
        </View>
      </View>

      {r.tache && !arret ? <Progression valeur={progression} /> : null}

      <View style={st.pied}>
        <Info icone="battery" texte={`Batterie ${r.batterie} %`} />
        <Info icone={volet ? 'eye-off' : 'eye'} texte={volet ? 'Caméras couvertes' : 'Caméras actives'} />
        <Info icone="lock" texte={zones > 1 ? `${zones} Zones privées` : `${zones} Zone privée`} />
      </View>
    </Carte>
  );
}

const st = StyleSheet.create({
  carte: { padding: 18, gap: 16 },
  ligne: { flexDirection: 'row', alignItems: 'center' },
  pied: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.filet,
  },
  info: { flexShrink: 1, alignItems: 'flex-start', gap: 4 },
});
