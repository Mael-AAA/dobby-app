import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DobbyFace } from '@/components/dobby-face';
import { T } from '@/components/ui';
import { ORDRE } from '@/data/maison';
import { lieu } from '@/lib/dobby-parle';
import { useDobby } from '@/state/dobby';
import { C, F, MARGE } from '@/theme';

/** Le bouton rouge, présent en haut de chaque écran : un seul geste suffit */
export function BoutonArret() {
  const { arreter } = useDobby();
  return (
    <Pressable
      onPress={arreter}
      accessibilityRole="button"
      accessibilityLabel="Arrêter Dobby immédiatement"
      hitSlop={6}
      style={({ pressed }) => [st.arret, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
    >
      <Feather name="power" size={15} color="#FFFFFF" />
      <T variante="fort" couleur="#FFFFFF" style={{ fontSize: 14, fontFamily: F.gras }}>
        Arrêt
      </T>
    </Pressable>
  );
}

/** En-tête des onglets : logo discret, résidence (touchez pour en changer), état de Dobby, bouton d'arrêt */
export function Barre() {
  const insets = useSafeAreaInsets();
  const { etat, residence: r } = useDobby();
  const [choix, setChoix] = useState(false);

  const statut = etat.arret ? 'À l’arrêt' : r.tache ? r.tache.label : `Disponible, ${lieu(r, r.piece)}`;

  return (
    <View style={[st.barre, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => setChoix(true)}
        accessibilityRole="button"
        accessibilityLabel={`Résidence ${r.nom}. ${statut}. Changer de résidence`}
        style={({ pressed }) => [st.gauche, pressed && { opacity: 0.7 }]}
      >
        <DobbyFace taille={32} eteint={!!etat.arret} voile={etat.volet} />
        <View style={{ flexShrink: 1 }}>
          <View style={st.nom}>
            <T variante="fort" numberOfLines={1}>
              {r.nom}
            </T>
            <Feather name="chevron-down" size={16} color={C.orage} />
          </View>
          <T variante="note" numberOfLines={1}>
            {statut}
          </T>
        </View>
      </Pressable>
      <BoutonArret />
      <ChoixResidence visible={choix} fermer={() => setChoix(false)} />
    </View>
  );
}

/** En-tête des écrans secondaires : retour, titre, bouton d'arrêt */
export function BarreRetour({ titre }: { titre: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.barre, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={10}
        style={({ pressed }) => [st.retour, pressed && { opacity: 0.6 }]}
      >
        <Feather name="chevron-left" size={22} color={C.nuit} />
        <T variante="fort">Réglages</T>
      </Pressable>
      <BoutonArret />
      <T variante="titre" style={st.titreRetour} accessibilityRole="header">
        {titre}
      </T>
    </View>
  );
}

function ChoixResidence({ visible, fermer }: { visible: boolean; fermer: () => void }) {
  const insets = useSafeAreaInsets();
  const { etat, choisirResidence } = useDobby();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer} statusBarTranslucent>
      <Pressable style={st.fond} onPress={fermer} accessibilityLabel="Fermer" />
      <View style={[st.feuille, { paddingBottom: insets.bottom + 20 }]}>
        <View style={st.poignee} />
        <T variante="section" accessibilityRole="header" style={{ marginBottom: 4 }}>
          Vos résidences
        </T>
        <T variante="note" style={{ marginBottom: 12 }}>
          Chaque Dobby connaît la sienne. Vous les pilotez toutes d’ici.
        </T>
        {ORDRE.map((id) => {
          const r = etat.residences[id];
          const actif = id === etat.residence;
          return (
            <Pressable
              key={id}
              onPress={() => {
                choisirResidence(id);
                fermer();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
              style={({ pressed }) => [st.choix, actif && st.choixActif, pressed && { opacity: 0.75 }]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <T variante="fort">{r.nom}</T>
                <T variante="note">
                  {r.type} · {r.temperature} °C · batterie {r.batterie} %
                </T>
              </View>
              {actif ? <Feather name="check" size={20} color={C.nuit} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: MARGE,
    paddingBottom: 10,
    backgroundColor: C.fond,
  },
  gauche: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arret: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: C.arret,
  },
  retour: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: -6, minHeight: 36 },
  titreRetour: { width: '100%', marginTop: 10 },
  fond: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.voile },
  feuille: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.carte,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: MARGE,
    paddingTop: 10,
  },
  poignee: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#D5DFE3', marginBottom: 14 },
  choix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: C.fond,
  },
  choixActif: { backgroundColor: C.neige, borderWidth: 1, borderColor: C.brume },
});
