import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BarreRetour } from '@/components/barre';
import { Apparition, Carte, Ligne, Section, T } from '@/components/ui';
import { ORDRE } from '@/data/maison';
import { useDobby } from '@/state/dobby';
import { C, MARGE } from '@/theme';

export default function Routines() {
  const { etat, basculerRoutine } = useDobby();

  return (
    <View style={st.ecran}>
      <BarreRetour titre="Routines" />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Apparition style={st.intro}>
          <T variante="doux">
            Dobby repère vos habitudes et vous propose d’en faire des routines. Vous gardez celles qui vous conviennent.
          </T>
        </Apparition>
        {ORDRE.map((id) => {
          const liste = etat.routines.filter((x) => x.residence === id);
          if (!liste.length) return null;
          return (
            <View key={id}>
              <Section titre={etat.residences[id].nom} />
              <Carte style={st.bloc}>
                {liste.map((x, i) => (
                  <Ligne
                    key={x.id}
                    icone={<MaterialCommunityIcons name={x.icone} size={19} color={C.nuit} />}
                    titre={x.titre}
                    detail={x.quand}
                    interrupteur={{ actif: x.active, onChange: () => basculerRoutine(x.id) }}
                    derniere={i === liste.length - 1}
                  />
                ))}
              </Carte>
            </View>
          );
        })}
        <T variante="note" style={st.note}>
          Pour en créer une, écrivez-le simplement à Dobby : « chaque lundi, change les draps ».
        </T>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.fond },
  intro: { paddingHorizontal: MARGE, paddingTop: 4 },
  bloc: { marginHorizontal: MARGE, padding: 0 },
  note: { paddingHorizontal: MARGE + 4, marginTop: 18 },
});
