import { Feather } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DobbyFace } from '@/components/dobby-face';
import { T } from '@/components/ui';
import { heure } from '@/lib/temps';
import { useDobby } from '@/state/dobby';
import { C, F, MARGE } from '@/theme';

const MAINTIEN = 1200;

/**
 * Écran affiché après l'arrêt d'urgence. Pour relancer Dobby, il faut un second geste, volontaire :
 * maintenir le bouton un peu plus d'une seconde.
 */
export function EcranArret() {
  const insets = useSafeAreaInsets();
  const { etat, residence, relancer } = useDobby();
  const [jauge] = useState(() => new Animated.Value(0));
  const [onde] = useState(() => new Animated.Value(0));
  const [relance, setRelance] = useState(false);
  const fini = useRef(false);
  const visible = etat.arret !== null;

  // une onde s'échappe une fois du bouton, au moment de l'arrêt
  useEffect(() => {
    if (!visible) return;
    fini.current = false;
    jauge.setValue(0);
    onde.setValue(0);
    Animated.timing(onde, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [visible, jauge, onde]);

  const appui = () => {
    setRelance(true);
    Animated.timing(jauge, { toValue: 1, duration: MAINTIEN, easing: Easing.linear, useNativeDriver: false }).start(({ finished }) => {
      if (finished && !fini.current) {
        fini.current = true;
        relancer();
      }
    });
  };

  const relache = () => {
    setRelance(false);
    if (fini.current) return;
    jauge.stopAnimation();
    Animated.timing(jauge, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  };

  const largeur = jauge.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => {}} statusBarTranslucent>
      <View style={[st.ecran, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 28 }]}>
        <View style={st.haut}>
          <View style={st.cercle}>
            <Animated.View
              style={[
                st.onde,
                {
                  opacity: onde.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                  transform: [{ scale: onde.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }],
                },
              ]}
            />
            <View style={st.bouton}>
              <Feather name="power" size={46} color="#FFFFFF" />
            </View>
          </View>

          <T variante="titre" style={st.centre} accessibilityRole="header">
            Dobby est à l’arrêt.
          </T>
          <View style={st.mesure}>
            <T variante="etiquette">Temps d’arrêt</T>
            <T variante="chiffre" style={{ fontSize: 40, lineHeight: 46 }}>
              0,4 s
            </T>
          </View>
          <T variante="doux" style={[st.centre, { maxWidth: 330 }]}>
            {`Ses moteurs sont coupés depuis ${etat.arret ? heure(etat.arret) : ''}. Il reste immobile à ${residence.nom}, là où il se trouvait, jusqu’à ce que vous le relanciez.`}
          </T>
        </View>

        <View style={st.bas}>
          <View style={st.visage}>
            <DobbyFace taille={28} eteint vivant={false} />
            <T variante="note">Le bouton de sa nuque et la commande « Dobby, stop. » font de même.</T>
          </View>
          <Pressable
            onPressIn={appui}
            onPressOut={relache}
            accessibilityRole="button"
            accessibilityLabel="Maintenir pour relancer Dobby"
            accessibilityHint="Gardez le doigt appuyé un peu plus d’une seconde"
            onAccessibilityAction={(e) => {
              if (e.nativeEvent.actionName === 'activate') relancer();
            }}
            accessibilityActions={[{ name: 'activate' }]}
            style={st.relancer}
          >
            <Animated.View style={[st.remplissage, { width: largeur }]} />
            <Feather name="refresh-cw" size={17} color={C.nuit} />
            <T variante="fort" style={{ fontFamily: F.gras }}>
              {relance ? 'Relance en cours…' : 'Maintenir pour relancer'}
            </T>
          </Pressable>
          <T variante="note" style={st.centre}>
            Un second geste, volontaire, pour qu’il ne reparte jamais par erreur.
          </T>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.fond, paddingHorizontal: MARGE + 8, justifyContent: 'space-between' },
  haut: { alignItems: 'center', gap: 18 },
  cercle: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  onde: { position: 'absolute', width: 132, height: 132, borderRadius: 66, backgroundColor: C.arret },
  bouton: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: C.arret,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: { textAlign: 'center' },
  mesure: { alignItems: 'center', gap: 2 },
  bas: { gap: 14 },
  visage: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  relancer: {
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.carte,
    borderWidth: 1,
    borderColor: 'rgba(64, 78, 84, 0.3)',
  },
  remplissage: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.givre },
});
