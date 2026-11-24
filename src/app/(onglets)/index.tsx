import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';

import { Barre } from '@/components/barre';
import { CarteResidence } from '@/components/carte-residence';
import { Apparition, Bouton, Carte, Pastille, Section, T } from '@/components/ui';
import { ORDRE } from '@/data/maison';
import { nomPiece } from '@/lib/dobby-parle';
import { heure, salutation } from '@/lib/temps';
import { useDobby } from '@/state/dobby';
import { C, MARGE } from '@/theme';

export default function Accueil() {
  const { etat, residence: r, choisirResidence, lancerRaccourci, decider } = useDobby();
  const { width } = useWindowDimensions();
  const largeur = Math.min(width, 560) - MARGE * 2;
  const pas = largeur + 12;
  const defile = useRef<ScrollViewInstance>(null);
  const index = ORDRE.indexOf(etat.residence);

  // la résidence choisie dans l'en-tête fait glisser les cartes
  useEffect(() => {
    defile.current?.scrollTo({ x: index * pas, animated: true });
  }, [index, pas]);

  const phrase = etat.arret
    ? 'Dobby est à l’arrêt.'
    : r.tache
      ? `Dobby ${r.tache.label.charAt(0).toLowerCase()}${r.tache.label.slice(1)}. Le reste est en ordre.`
      : r.repos;

  const attente = etat.validations
    .filter((v) => v.statut === 'attente')
    .sort((a, b) => Number(b.residence === etat.residence) - Number(a.residence === etat.residence));
  const recents = etat.journal.filter((j) => j.residence === etat.residence).slice(0, 4);
  const tuile = (largeur - 12) / 2;

  const confier = (id: string) => {
    lancerRaccourci(id);
    router.navigate('/messages');
  };

  return (
    <View style={st.ecran}>
      <Barre />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Apparition style={st.bonjour}>
          <T variante="grand" accessibilityRole="header">{`${salutation()}.`}</T>
          <T variante="doux">{phrase}</T>
        </Apparition>

        <Apparition delai={120}>
          <ScrollView
            ref={defile}
            horizontal
            snapToInterval={pas}
            decelerationRate="fast"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: MARGE, gap: 12 }}
            contentOffset={{ x: index * pas, y: 0 }}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / pas);
              if (ORDRE[i]) choisirResidence(ORDRE[i]);
            }}
          >
            {ORDRE.map((id) => (
              <CarteResidence
                key={id}
                r={etat.residences[id]}
                largeur={largeur}
                arret={!!etat.arret && id === etat.residence}
                volet={etat.volet}
              />
            ))}
          </ScrollView>
          <View style={st.points}>
            {ORDRE.map((id) => (
              <Pressable
                key={id}
                onPress={() => choisirResidence(id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={etat.residences[id].nom}
                accessibilityState={{ selected: id === etat.residence }}
              >
                <View style={[st.point, id === etat.residence && st.pointActif]} />
              </Pressable>
            ))}
          </View>
        </Apparition>

        <Apparition delai={220}>
          <Section titre="Lui confier une tâche" lien="Écrire à Dobby" onLien={() => router.navigate('/messages')} />
          <View style={st.grille}>
            {r.raccourcis.slice(0, 5).map((rc) => (
              <Pressable
                key={rc.id}
                onPress={() => confier(rc.id)}
                accessibilityRole="button"
                accessibilityLabel={rc.label}
                style={({ pressed }) => [st.tuile, { width: tuile }, pressed && st.presse]}
              >
                <Pastille fond={C.givre} taille={40}>
                  <MaterialCommunityIcons name={rc.icone} size={21} color={C.nuit} />
                </Pastille>
                <View style={{ gap: 1 }}>
                  <T variante="fort">{rc.label}</T>
                  <T variante="note">{nomPiece(r, rc.piece)}</T>
                </View>
              </Pressable>
            ))}
            <Pressable
              onPress={() => router.navigate('/messages')}
              accessibilityRole="button"
              style={({ pressed }) => [st.tuile, st.tuileEcrire, { width: tuile }, pressed && st.presse]}
            >
              <Pastille fond={C.carte} taille={40}>
                <Feather name="edit-3" size={19} color={C.nuit} />
              </Pastille>
              <View style={{ gap: 1 }}>
                <T variante="fort">Autre chose ?</T>
                <T variante="note">Écrivez-lui</T>
              </View>
            </Pressable>
          </View>
        </Apparition>

        {attente.length > 0 ? (
          <Apparition delai={300}>
            <Section titre="Votre accord" />
            <View style={{ gap: 12 }}>
              {attente.map((v) => (
                <Carte key={v.id} style={st.accord}>
                  <View style={st.rangee}>
                    <Pastille>
                      <MaterialCommunityIcons name={v.icone} size={20} color={C.nuit} />
                    </Pastille>
                    <View style={{ flex: 1, gap: 2 }}>
                      <T variante="fort">{v.titre}</T>
                      <T variante="note">{`${v.detail} · ${etat.residences[v.residence].nom}`}</T>
                    </View>
                    <T variante="section">{`${v.montant} €`}</T>
                  </View>
                  <T variante="note">{`Au-delà de votre budget de ${etat.budget} € par achat, Dobby attend votre accord.`}</T>
                  <View style={st.rangee}>
                    <Bouton label="Refuser" genre="contour" petit style={{ flex: 1 }} onPress={() => decider(v.id, false)} />
                    <Bouton label="Accepter" genre="sombre" petit style={{ flex: 1 }} onPress={() => decider(v.id, true)} />
                  </View>
                </Carte>
              ))}
            </View>
          </Apparition>
        ) : null}

        <Apparition delai={380}>
          <Section titre="Dernières actions" lien="Journal" onLien={() => router.navigate('/journal')} />
          <Carte style={st.liste}>
            {recents.map((j, i) => (
              <View key={j.id} style={[st.entree, i < recents.length - 1 && st.filet]}>
                <T variante="fort" style={st.heure}>
                  {heure(j.ts)}
                </T>
                <View style={{ flex: 1, gap: 1 }}>
                  <T variante="corps">{j.texte}</T>
                  {j.piece ? <T variante="note">{nomPiece(r, j.piece)}</T> : null}
                </View>
              </View>
            ))}
          </Carte>
        </Apparition>

        <View style={st.signature}>
          <T variante="titre" style={{ fontSize: 26, lineHeight: 32, color: C.orage }}>
            Le temps vous appartient.
          </T>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.fond },
  bonjour: { paddingHorizontal: MARGE, paddingTop: 10, paddingBottom: 22, gap: 4 },
  points: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 14 },
  point: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C5D3D9' },
  pointActif: { width: 22, backgroundColor: C.orage },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: MARGE },
  tuile: {
    backgroundColor: C.carte,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.filet,
    padding: 14,
    gap: 12,
    minHeight: 118,
  },
  tuileEcrire: { backgroundColor: C.neige, borderColor: 'transparent' },
  presse: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  accord: { marginHorizontal: MARGE, gap: 14 },
  rangee: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liste: { marginHorizontal: MARGE, paddingVertical: 4 },
  entree: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  filet: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.filet },
  heure: { width: 62 },
  signature: { alignItems: 'center', marginTop: 40 },
});
