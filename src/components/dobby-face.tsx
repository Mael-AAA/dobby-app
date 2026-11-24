import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { C } from '@/theme';

/**
 * Le logo de Dobby (« La présence ») : deux yeux en ovales verticaux et un sourire, sur sa tuile sombre.
 * Comme sur le site, il est vivant : les yeux clignent, s'éteignent à l'arrêt d'urgence
 * et un volet les couvre quand les caméras sont fermées.
 */
export function DobbyFace({
  taille,
  eteint = false,
  voile = false,
  vivant = true,
}: {
  taille: number;
  eteint?: boolean;
  voile?: boolean;
  vivant?: boolean;
}) {
  const [clin] = useState(() => new Animated.Value(1));
  const [ouverture] = useState(() => new Animated.Value(eteint ? 0.14 : 1));
  const [volet] = useState(() => new Animated.Value(voile ? 1 : 0));

  useEffect(() => {
    Animated.timing(ouverture, {
      toValue: eteint ? 0.14 : 1,
      duration: eteint ? 160 : 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [eteint, ouverture]);

  useEffect(() => {
    Animated.timing(volet, {
      toValue: voile ? 1 : 0,
      duration: 500,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [voile, volet]);

  // clignement lent, à intervalle irrégulier
  useEffect(() => {
    if (!vivant || eteint) return;
    let actif = true;
    let t: ReturnType<typeof setTimeout>;
    const suivant = () => {
      t = setTimeout(() => {
        Animated.sequence([
          Animated.timing(clin, { toValue: 0.08, duration: 90, useNativeDriver: true }),
          Animated.timing(clin, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start(() => {
          if (actif) suivant();
        });
      }, 2600 + Math.random() * 3800);
    };
    suivant();
    return () => {
      actif = false;
      clearTimeout(t);
    };
  }, [vivant, eteint, clin]);

  const k = taille / 64;
  const yeux = eteint ? C.ardoise : C.givre;

  return (
    <View
      style={{ width: taille, height: taille, borderRadius: taille * 0.23, backgroundColor: C.nuit, overflow: 'hidden' }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={taille} height={taille} viewBox="0 0 64 64" style={{ position: 'absolute' }}>
        <Path
          d="M18.5 41.5 Q32 51 45.5 41.5"
          fill="none"
          stroke={eteint ? C.ardoise : '#E7F3F9'}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </Svg>
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 12 * k,
          width: taille,
          height: 26 * k,
          transform: [{ scaleY: Animated.multiply(clin, ouverture) }],
        }}
      >
        <Svg width={taille} height={26 * k} viewBox="0 12 64 26">
          {!eteint ? (
            <>
              <Ellipse cx={22.5} cy={25} rx={7.6} ry={11.4} fill={C.givre} opacity={0.2} />
              <Ellipse cx={41.5} cy={25} rx={7.6} ry={11.4} fill={C.givre} opacity={0.2} />
            </>
          ) : null}
          <Ellipse cx={22.5} cy={25} rx={5.4} ry={9} fill={yeux} />
          <Ellipse cx={41.5} cy={25} rx={5.4} ry={9} fill={yeux} />
        </Svg>
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          left: 12 * k,
          top: 11 * k,
          width: 40 * k,
          height: 27 * k,
          borderRadius: 4 * k,
          backgroundColor: C.orage,
          transformOrigin: 'top',
          transform: [{ scaleY: volet }],
        }}
      />
    </View>
  );
}
