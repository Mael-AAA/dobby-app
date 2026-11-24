import { Feather } from '@expo/vector-icons';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BarreRetour } from '@/components/barre';
import { Apparition, Bouton, Carte, Section, T } from '@/components/ui';
import type { Souvenir } from '@/data/maison';
import { useDobby } from '@/state/dobby';
import { C, MARGE } from '@/theme';

const CATEGORIES: Souvenir['categorie'][] = ['Goûts', 'Habitudes', 'Maison'];

export default function Memoire() {
  const { etat, oublier, toutOublier } = useDobby();

  const confirmer = () => {
    const message = 'Dobby oubliera vos goûts et vos habitudes. Vos Zones privées et vos routines sont conservées.';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) toutOublier();
      return;
    }
    Alert.alert('Tout effacer ?', message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Tout effacer', style: 'destructive', onPress: toutOublier },
    ]);
  };

  return (
    <View style={st.ecran}>
      <BarreRetour titre="Ce que Dobby a appris" />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Apparition style={st.intro}>
          <T variante="doux">
            Vos habitudes, les goûts de chacun, le caractère du chat. Tout ce qu’il apprend reste dans votre maison, et vous pouvez l’effacer à tout moment.
          </T>
        </Apparition>

        {etat.memoire.length === 0 ? (
          <Carte style={[st.bloc, { alignItems: 'center', gap: 8, paddingVertical: 28 }]}>
            <Feather name="check-circle" size={26} color={C.orage} />
            <T variante="fort">Mémoire effacée</T>
            <T variante="note" style={{ textAlign: 'center' }}>
              Dobby réapprendra vos habitudes au fil des jours. Vos Zones privées n’ont pas bougé.
            </T>
          </Carte>
        ) : (
          CATEGORIES.map((cat) => {
            const items = etat.memoire.filter((m) => m.categorie === cat);
            if (!items.length) return null;
            return (
              <View key={cat}>
                <Section titre={cat} />
                <Carte style={[st.bloc, { paddingVertical: 4 }]}>
                  {items.map((m, i) => (
                    <View key={m.id} style={[st.ligne, i < items.length - 1 && st.filet]}>
                      <T variante="corps" style={{ flex: 1 }}>
                        {m.texte}
                      </T>
                      <Pressable
                        onPress={() => oublier(m.id)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={`Effacer : ${m.texte}`}
                        style={({ pressed }) => [st.effacer, pressed && { opacity: 0.6 }]}
                      >
                        <Feather name="trash-2" size={17} color={C.orage} />
                      </Pressable>
                    </View>
                  ))}
                </Carte>
              </View>
            );
          })
        )}

        {etat.memoire.length > 0 ? (
          <Bouton label="Tout effacer" genre="contour" icone="trash-2" onPress={confirmer} style={st.tout} />
        ) : null}
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
  effacer: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.neige, alignItems: 'center', justifyContent: 'center' },
  tout: { marginHorizontal: MARGE, marginTop: 28 },
});
