import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Barre } from '@/components/barre';
import { DobbyFace } from '@/components/dobby-face';
import { Apparition, Bouton, Carte, Ligne, Section, T, type IconeFeather } from '@/components/ui';
import { CONSEILLER } from '@/data/maison';
import { useDobby } from '@/state/dobby';
import { C, MARGE } from '@/theme';

const icone = (nom: IconeFeather) => <Feather name={nom} size={18} color={C.nuit} />;

export default function Reglages() {
  const { etat, residence: r, basculerVolet, changerBudget, famille } = useDobby();
  const routinesActives = etat.routines.filter((x) => x.active).length;

  const appeler = () => {
    Linking.openURL(CONSEILLER.lien).catch(() =>
      Alert.alert('Appel impossible', `Cet appareil ne peut pas passer d’appel. Numéro : ${CONSEILLER.telephone}`),
    );
  };

  return (
    <View style={st.ecran}>
      <Barre />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Apparition style={st.tete}>
          <T variante="titre" accessibilityRole="header">
            Réglages
          </T>
          <T variante="doux">Vos règles, toujours. Dobby prend l’initiative dans le cadre que vous fixez ici.</T>
        </Apparition>

        <Section titre="Sécurité" />
        <Carte style={st.bloc}>
          <View style={st.securite}>
            <View style={st.rond}>
              <Feather name="power" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <T variante="fort">Arrêt en 0,4 s</T>
              <T variante="note">
                Trois façons de l’arrêter : le bouton rouge de l’application, le bouton de sa nuque ou la phrase « Dobby, stop. »
              </T>
            </View>
          </View>
        </Carte>

        <Section titre="Confidentialité" />
        <Carte style={[st.bloc, st.sansMarge]}>
          <Ligne
            icone={icone(etat.volet ? 'eye-off' : 'eye')}
            titre="Couvrir les caméras"
            detail={etat.volet ? 'Le volet est fermé : vous le voyez, il ne voit plus.' : 'Un volet physique se ferme sur ses yeux.'}
            interrupteur={{ actif: etat.volet, onChange: basculerVolet }}
          />
          <Ligne
            icone={icone('lock')}
            titre="Zones privées"
            detail={`${r.privees.length} pièce${r.privees.length > 1 ? 's' : ''} fermée${r.privees.length > 1 ? 's' : ''} à ${r.nom}`}
            onPress={() => router.navigate('/plan')}
          />
          <Ligne
            icone={<MaterialCommunityIcons name="head-lightbulb-outline" size={19} color={C.nuit} />}
            titre="Ce que Dobby a appris"
            detail={etat.memoire.length ? `${etat.memoire.length} éléments, consultables et effaçables` : 'Mémoire effacée'}
            onPress={() => router.push('/memoire')}
            derniere
          />
        </Carte>
        <T variante="note" style={st.precision}>
          Ce qu’il voit et entend est traité dans la maison. Seules vos instructions sortent, chiffrées. Aucune donnée n’est vendue.
        </T>

        <Section titre="Achats" />
        <Carte style={st.bloc}>
          <T variante="fort">Accord demandé au-delà de</T>
          <View style={st.budget}>
            <Pressable
              onPress={() => changerBudget(-50)}
              accessibilityRole="button"
              accessibilityLabel="Baisser le budget de 50 euros"
              style={({ pressed }) => [st.pas, pressed && { opacity: 0.6 }]}
            >
              <Feather name="minus" size={20} color={C.nuit} />
            </Pressable>
            <T variante="chiffre" accessibilityLiveRegion="polite">{`${etat.budget} €`}</T>
            <Pressable
              onPress={() => changerBudget(50)}
              accessibilityRole="button"
              accessibilityLabel="Monter le budget de 50 euros"
              style={({ pressed }) => [st.pas, pressed && { opacity: 0.6 }]}
            >
              <Feather name="plus" size={20} color={C.nuit} />
            </Pressable>
          </View>
          <T variante="note">Par achat, réservation ou prestataire. En dessous, Dobby s’en charge et le note au journal.</T>
        </Carte>

        <Section titre="Organisation" />
        <Carte style={[st.bloc, st.sansMarge]}>
          <Ligne
            icone={icone('repeat')}
            titre="Routines"
            detail={`${routinesActives} actives sur ${etat.routines.length}`}
            onPress={() => router.push('/routines')}
          />
          <Ligne
            icone={icone('users')}
            titre="Famille et profils"
            detail={`${famille.length} profils, droits des enfants limités`}
            onPress={() => router.push('/famille')}
            derniere
          />
        </Carte>

        <Section titre="Votre Conseillère" />
        <Carte style={st.bloc}>
          <View style={st.conseiller}>
            <View style={st.initiales}>
              <T variante="fort">CD</T>
            </View>
            <View style={{ flex: 1 }}>
              <T variante="fort">{CONSEILLER.nom}</T>
              <T variante="note">Joignable 24 h/24, par téléphone</T>
            </View>
          </View>
          <Bouton label={`Appeler le ${CONSEILLER.telephone}`} genre="primaire" icone="phone" onPress={appeler} />
        </Carte>

        <Section titre="Garanties" />
        <Carte style={[st.bloc, st.sansMarge]}>
          <Ligne icone={icone('shield')} titre="Garantie Sérénité 10 ans" detail="Pièces, main-d’œuvre et déplacement inclus" />
          <Ligne icone={icone('refresh-cw')} titre="Remplacement sous 48 h" detail="Un Dobby configuré arrive chez vous s’il part en atelier" />
          <Ligne icone={icone('download')} titre="Mises à jour à vie" detail="Validées par le comité d’éthique" derniere />
        </Carte>

        <View style={st.pied}>
          <DobbyFace taille={24} vivant={false} />
          <T variante="note">Dobby, application version 1.0</T>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.fond },
  tete: { paddingHorizontal: MARGE, paddingTop: 10, gap: 4 },
  bloc: { marginHorizontal: MARGE, gap: 14 },
  sansMarge: { padding: 0, gap: 0 },
  securite: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rond: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.arret, alignItems: 'center', justifyContent: 'center' },
  precision: { paddingHorizontal: MARGE + 4, marginTop: 10 },
  budget: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pas: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.neige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conseiller: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  initiales: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.givre, alignItems: 'center', justifyContent: 'center' },
  pied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 36 },
});
