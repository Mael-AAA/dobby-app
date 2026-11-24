import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BarreRetour } from '@/components/barre';
import { Apparition, Carte, Section, T } from '@/components/ui';
import { DROITS } from '@/data/maison';
import { useDobby } from '@/state/dobby';
import { C, MARGE } from '@/theme';

export default function Famille() {
  const { famille } = useDobby();

  return (
    <View style={st.ecran}>
      <BarreRetour titre="Famille et profils" />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Apparition style={st.intro}>
          <T variante="doux">
            Chacun a son profil. Dobby reconnaît la voix de chaque membre de la famille et adapte ce qu’il accepte de faire.
          </T>
        </Apparition>

        <Section titre="Profils" />
        <Carte style={[st.bloc, { paddingVertical: 4 }]}>
          {famille.map((p, i) => (
            <View key={p.id} style={[st.ligne, i < famille.length - 1 && st.filet]}>
              <View style={[st.avatar, p.role === 'Parent' && { backgroundColor: C.givre }]}>
                <T variante="fort">{p.nom.charAt(0)}</T>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T variante="fort">{p.nom}</T>
                <T variante="note">{`${p.role} · ${p.droits}`}</T>
              </View>
            </View>
          ))}
        </Carte>

        <Section titre="Ce que chacun peut demander" />
        <Carte style={[st.bloc, { paddingVertical: 4 }]}>
          <View style={[st.ligne, st.filet]}>
            <T variante="etiquette" style={{ flex: 1 }}>
              Demande
            </T>
            <T variante="etiquette" style={st.colonne}>
              Parents
            </T>
            <T variante="etiquette" style={st.colonne}>
              Enfants
            </T>
          </View>
          {DROITS.map((d, i) => (
            <View key={d.droit} style={[st.ligne, i < DROITS.length - 1 && st.filet]}>
              <T variante="corps" style={{ flex: 1 }}>
                {d.droit}
              </T>
              {[d.parents, d.enfants].map((ok, j) => (
                <View key={j} style={st.colonne} accessible accessibilityLabel={ok ? 'Autorisé' : 'Non autorisé'}>
                  <Feather name={ok ? 'check' : 'x'} size={18} color={ok ? C.nuit : C.gris} />
                </View>
              ))}
            </View>
          ))}
        </Carte>
        <T variante="note" style={st.note}>
          Les enfants peuvent toujours arrêter Dobby. Aucun achat ni aucune sortie ne se fait sans un parent.
        </T>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.fond },
  intro: { paddingHorizontal: MARGE, paddingTop: 4 },
  bloc: { marginHorizontal: MARGE },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  filet: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.filet },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.neige, alignItems: 'center', justifyContent: 'center' },
  colonne: { width: 58, alignItems: 'center', textAlign: 'center' },
  note: { paddingHorizontal: MARGE + 4, marginTop: 14 },
});
