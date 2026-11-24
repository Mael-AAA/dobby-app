import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';

import { Barre } from '@/components/barre';
import { Apparition, T } from '@/components/ui';
import type { Entree, IconeMC, TypeEntree } from '@/data/maison';
import { nomPiece } from '@/lib/dobby-parle';
import { heure, jour } from '@/lib/temps';
import { useDobby } from '@/state/dobby';
import { C, MARGE } from '@/theme';

const ICONES: Record<TypeEntree, IconeMC> = {
  tache: 'check',
  maison: 'home-outline',
  achat: 'cart-outline',
  securite: 'shield-outline',
};

export default function Journal() {
  const { etat, residence: r } = useDobby();
  const [toutes, setToutes] = useState(false);

  const entrees = etat.journal.filter((j) => toutes || j.residence === etat.residence);
  const sections: { titre: string; data: Entree[] }[] = [];
  for (const j of entrees) {
    const titre = jour(j.ts);
    const derniere = sections[sections.length - 1];
    if (derniere && derniere.titre === titre) derniere.data.push(j);
    else sections.push({ titre, data: [j] });
  }

  return (
    <View style={st.ecran}>
      <Barre />
      <SectionList
        sections={sections}
        keyExtractor={(j) => j.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Apparition style={st.tete}>
            <T variante="titre" accessibilityRole="header">
              Journal
            </T>
            <T variante="doux">Chaque action de Dobby, à la minute près. Rien ne se fait dans votre dos.</T>
            <View style={st.filtres} accessibilityRole="tablist">
              {[
                { valeur: false, label: r.nom },
                { valeur: true, label: 'Toutes les résidences' },
              ].map((f) => (
                <Pressable
                  key={f.label}
                  onPress={() => setToutes(f.valeur)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: toutes === f.valeur }}
                  style={[st.filtre, toutes === f.valeur && st.filtreActif]}
                >
                  <T variante="fort" style={{ fontSize: 14 }}>
                    {f.label}
                  </T>
                </Pressable>
              ))}
            </View>
          </Apparition>
        }
        renderSectionHeader={({ section }) => (
          <T variante="section" style={st.jour} accessibilityRole="header">
            {section.titre}
          </T>
        )}
        renderItem={({ item, index, section }) => {
          const res = etat.residences[item.residence];
          const lieu = [item.piece ? nomPiece(res, item.piece) : null, toutes ? res.nom : null].filter(Boolean).join(' · ');
          const alerte = item.type === 'securite' && item.texte.startsWith('Arrêt');
          return (
            <View style={st.entree}>
              <T variante="fort" style={st.heure}>
                {heure(item.ts)}
              </T>
              <View style={st.fil}>
                <View style={[st.pastille, alerte && { backgroundColor: C.arret }]}>
                  <MaterialCommunityIcons name={ICONES[item.type]} size={13} color={alerte ? '#FFFFFF' : C.nuit} />
                </View>
                {index < section.data.length - 1 ? <View style={st.trait} /> : null}
              </View>
              <View style={st.contenu}>
                <T variante="corps">{item.texte}</T>
                {lieu ? <T variante="note">{lieu}</T> : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.fond },
  tete: { paddingHorizontal: MARGE, paddingTop: 10, gap: 4 },
  filtres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  filtre: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    justifyContent: 'center',
    backgroundColor: C.carte,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(64, 78, 84, 0.25)',
  },
  filtreActif: { backgroundColor: C.givre, borderColor: C.givre },
  jour: { paddingHorizontal: MARGE, marginTop: 26, marginBottom: 10 },
  entree: { flexDirection: 'row', paddingHorizontal: MARGE, gap: 12 },
  heure: { width: 60, paddingTop: 2 },
  fil: { width: 24, alignItems: 'center' },
  pastille: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.givre,
  },
  trait: { flex: 1, width: 1.5, backgroundColor: 'rgba(64, 78, 84, 0.18)', marginVertical: 3 },
  contenu: { flex: 1, gap: 2, paddingBottom: 18 },
});
