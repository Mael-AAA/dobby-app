import { Feather } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Barre } from '@/components/barre';
import { DobbyFace } from '@/components/dobby-face';
import { Apparition, Carte, Interrupteur, Section, T } from '@/components/ui';
import { COULOIR, STATION, type Piece } from '@/data/maison';
import { lieu } from '@/lib/dobby-parle';
import { useDobby } from '@/state/dobby';
import { C, F, MARGE } from '@/theme';

const MARQUEUR = 28;

export default function Plan() {
  const { etat, residence: r, basculerZone } = useDobby();
  const { width } = useWindowDimensions();
  const largeur = Math.min(width, 560) - MARGE * 2 - 2;
  const k = largeur / 600;
  const hauteur = 400 * k;

  // Dobby se déplace sur le plan quand il change de pièce
  const cible = r.pieces.find((p) => p.id === r.piece);
  const centre = cible ? { x: (cible.x + cible.w / 2) * k, y: (cible.y + cible.h / 2 + 22) * k } : { x: STATION.x * k, y: STATION.y * k };
  const [pos] = useState(() => new Animated.ValueXY(centre));
  const [halo] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(pos, { toValue: centre, useNativeDriver: true, damping: 18, stiffness: 90 }).start();
  }, [pos, centre.x, centre.y]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (etat.arret) return;
    const boucle = Animated.loop(Animated.timing(halo, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    boucle.start();
    return () => {
      boucle.stop();
      halo.setValue(0);
    };
  }, [halo, etat.arret]);

  const ou = etat.arret
    ? `Dobby est à l’arrêt, ${lieu(r, r.piece)}.`
    : r.tache
      ? `Dobby est ${lieu(r, r.piece)} et ${r.tache.label.charAt(0).toLowerCase()}${r.tache.label.slice(1)}.`
      : `Dobby est ${lieu(r, r.piece)}, disponible.`;

  return (
    <View style={st.ecran}>
      <Barre />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Apparition style={st.tete}>
          <T variante="titre" accessibilityRole="header">
            Plan
          </T>
          <T variante="doux">{`${r.nom}. ${ou}`}</T>
        </Apparition>

        <Apparition delai={100}>
          <Carte style={st.cartePlan}>
            <View style={{ width: largeur, height: hauteur }}>
              <View
                style={[
                  st.couloir,
                  { left: COULOIR.x * k, top: COULOIR.y * k, width: COULOIR.w * k, height: COULOIR.h * k },
                ]}
              />
              <View style={[st.station, { left: STATION.x * k - 7, top: STATION.y * k - 7 }]} accessibilityLabel="Station de recharge" />
              {r.pieces.map((p) => (
                <PieceVue
                  key={p.id}
                  p={p}
                  k={k}
                  privee={r.privees.includes(p.id)}
                  ici={r.piece === p.id}
                  onPress={() => basculerZone(p.id)}
                />
              ))}
              <Animated.View
                pointerEvents="none"
                style={[
                  st.marqueur,
                  { transform: [{ translateX: Animated.subtract(pos.x, MARQUEUR / 2) }, { translateY: Animated.subtract(pos.y, MARQUEUR / 2) }] },
                ]}
              >
                {!etat.arret ? (
                  <Animated.View
                    style={[
                      st.halo,
                      {
                        opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                        transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
                      },
                    ]}
                  />
                ) : null}
                <DobbyFace taille={MARQUEUR} eteint={!!etat.arret} voile={etat.volet} vivant={false} />
              </Animated.View>
            </View>
          </Carte>
          <View style={st.legende}>
            <Repere>
              <DobbyFace taille={16} vivant={false} />
              <T variante="note">Dobby</T>
            </Repere>
            <Repere>
              <View style={[st.carre, { backgroundColor: C.privee, borderColor: C.orage, borderStyle: 'dashed' }]} />
              <T variante="note">Zone privée</T>
            </Repere>
            <Repere>
              <View style={st.stationPetite} />
              <T variante="note">Station</T>
            </Repere>
          </View>
        </Apparition>

        <Apparition delai={180}>
          <Section titre="Zones privées" />
          <T variante="doux" style={st.texte}>
            Touchez une pièce pour la fermer à Dobby. Il n’y entre plus, même pour une tâche, jusqu’à ce que vous la rouvriez.
          </T>
          <Carte style={st.liste}>
            {r.pieces.map((p, i) => (
              <View key={p.id} style={[st.ligne, i < r.pieces.length - 1 && st.filet]}>
                <Feather name={r.privees.includes(p.id) ? 'lock' : 'unlock'} size={18} color={C.orage} />
                <View style={{ flex: 1 }}>
                  <T variante="fort">{p.nom}</T>
                  {r.piece === p.id ? <T variante="note">Dobby est ici</T> : null}
                </View>
                <Interrupteur actif={r.privees.includes(p.id)} onChange={() => basculerZone(p.id)} label={`${p.nom}, Zone privée`} />
              </View>
            ))}
          </Carte>
        </Apparition>
      </ScrollView>
    </View>
  );
}

function PieceVue({ p, k, privee, ici, onPress }: { p: Piece; k: number; privee: boolean; ici: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: privee }}
      accessibilityLabel={`${p.nom}${privee ? ', Zone privée' : ''}${ici ? ', Dobby est ici' : ''}`}
      style={({ pressed }) => [
        st.piece,
        { left: p.x * k + 2, top: p.y * k + 2, width: p.w * k - 4, height: p.h * k - 4 },
        privee && st.privee,
        pressed && { opacity: 0.75 },
      ]}
    >
      {privee ? <Feather name="lock" size={13} color={C.orage} /> : null}
      <T variante="etiquette" couleur={C.nuit} style={st.nomPiece} numberOfLines={2}>
        {p.nom}
      </T>
    </Pressable>
  );
}

function Repere({ children }: { children: ReactNode }) {
  return <View style={st.repere}>{children}</View>;
}

const st = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.fond },
  tete: { paddingHorizontal: MARGE, paddingTop: 10, paddingBottom: 18, gap: 4 },
  cartePlan: { marginHorizontal: MARGE, padding: 0, overflow: 'hidden', alignItems: 'center' },
  couloir: { position: 'absolute', backgroundColor: C.neige, borderRadius: 6 },
  station: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: C.ardoise,
    backgroundColor: C.carte,
  },
  piece: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: C.brume,
    borderRadius: 8,
    backgroundColor: C.carte,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 4,
    gap: 2,
  },
  privee: { backgroundColor: C.privee, borderColor: C.orage, borderStyle: 'dashed' },
  nomPiece: { textAlign: 'center', fontSize: 11, lineHeight: 14, fontFamily: F.demi },
  marqueur: { position: 'absolute', left: 0, top: 0, width: MARQUEUR, height: MARQUEUR },
  halo: { position: 'absolute', width: MARQUEUR, height: MARQUEUR, borderRadius: MARQUEUR / 2, backgroundColor: C.brume },
  legende: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 14 },
  repere: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  carre: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5 },
  stationPetite: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: C.ardoise, backgroundColor: C.carte },
  texte: { paddingHorizontal: MARGE, marginTop: -4, marginBottom: 14 },
  liste: { marginHorizontal: MARGE, paddingVertical: 4, paddingHorizontal: 16 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, minHeight: 56 },
  filet: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.filet },
});
