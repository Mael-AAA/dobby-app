import { Feather } from '@expo/vector-icons';
import { Children, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';

import { fr } from '@/lib/fr';
import { C, F, MARGE, RAYON } from '@/theme';

export type IconeFeather = ComponentProps<typeof Feather>['name'];

// ---------- Texte ----------

type Variante = 'grand' | 'titre' | 'section' | 'fort' | 'corps' | 'doux' | 'note' | 'etiquette' | 'chiffre';

/** Texte de l'appli : applique la typographie française aux chaînes */
export function T({
  variante = 'corps',
  couleur,
  style,
  children,
  ...rest
}: TextProps & { variante?: Variante; couleur?: string }) {
  return (
    <Text {...rest} style={[textes[variante], couleur ? { color: couleur } : null, style]}>
      {Children.map(children, (c) => (typeof c === 'string' ? fr(c) : c))}
    </Text>
  );
}

const textes = StyleSheet.create({
  grand: { fontFamily: F.titre, fontSize: 46, lineHeight: 52, color: C.nuit },
  titre: { fontFamily: F.titre, fontSize: 38, lineHeight: 44, color: C.nuit },
  section: { fontFamily: F.demi, fontSize: 17, lineHeight: 23, color: C.nuit },
  fort: { fontFamily: F.demi, fontSize: 15.5, lineHeight: 21, color: C.nuit },
  corps: { fontFamily: F.texte, fontSize: 15.5, lineHeight: 22, color: C.nuit },
  doux: { fontFamily: F.texte, fontSize: 15.5, lineHeight: 22, color: C.orage },
  note: { fontFamily: F.moyen, fontSize: 13, lineHeight: 18, color: C.gris },
  etiquette: { fontFamily: F.demi, fontSize: 12.5, lineHeight: 16, color: C.gris },
  chiffre: { fontFamily: F.leger, fontSize: 30, lineHeight: 34, color: C.nuit },
});

// ---------- Surfaces ----------

export function Carte({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return <View style={[s.carte, style]}>{children}</View>;
}

/** Apparition douce : fondu et léger glissement vers le haut */
export function Apparition({ delai = 0, style, children }: { delai?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 650,
      delay: delai,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [v, delai]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

// ---------- Boutons ----------

type Genre = 'primaire' | 'sombre' | 'contour' | 'discret';

export function Bouton({
  label,
  genre = 'primaire',
  icone,
  petit = false,
  style,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  genre?: Genre;
  icone?: IconeFeather;
  petit?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const couleur = genre === 'sombre' ? '#FFFFFF' : C.nuit;
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => [
        s.bouton,
        petit && s.boutonPetit,
        boutons[genre],
        pressed && s.presse,
        rest.disabled && { opacity: 0.45 },
        style,
      ]}
    >
      {icone ? <Feather name={icone} size={petit ? 15 : 17} color={couleur} /> : null}
      <T variante="fort" couleur={couleur} style={petit ? { fontSize: 14 } : null}>
        {label}
      </T>
    </Pressable>
  );
}

const boutons = StyleSheet.create({
  primaire: { backgroundColor: C.givre },
  sombre: { backgroundColor: C.nuit },
  contour: { borderWidth: 1, borderColor: 'rgba(64, 78, 84, 0.35)', backgroundColor: C.carte },
  discret: { backgroundColor: C.neige },
});

// ---------- Listes ----------

/** Titre de section, avec un lien facultatif à droite */
export function Section({ titre, lien, onLien, style }: { titre: string; lien?: string; onLien?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.section, style]}>
      <T variante="section" accessibilityRole="header">
        {titre}
      </T>
      {lien && onLien ? (
        <Pressable onPress={onLien} hitSlop={10} accessibilityRole="link" style={({ pressed }) => [s.lien, pressed && { opacity: 0.6 }]}>
          <T variante="etiquette" couleur={C.orage} style={{ fontSize: 14 }}>
            {lien}
          </T>
          <Feather name="chevron-right" size={16} color={C.orage} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Pastille ronde avec une icône, en tête de ligne */
export function Pastille({ children, fond = C.neige, taille = 38 }: { children: ReactNode; fond?: string; taille?: number }) {
  return <View style={[s.pastille, { width: taille, height: taille, borderRadius: taille / 2, backgroundColor: fond }]}>{children}</View>;
}

/** Ligne de réglage : icône, titre, détail, et à droite une valeur, une flèche ou un interrupteur */
export function Ligne({
  icone,
  titre,
  detail,
  valeur,
  onPress,
  interrupteur,
  derniere = false,
}: {
  icone?: ReactNode;
  titre: string;
  detail?: string;
  valeur?: string;
  onPress?: () => void;
  interrupteur?: { actif: boolean; onChange: () => void };
  derniere?: boolean;
}) {
  const contenu = (
    <>
      {icone ? <Pastille>{icone}</Pastille> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <T variante="fort">{titre}</T>
        {detail ? <T variante="note">{detail}</T> : null}
      </View>
      {valeur ? <T variante="note">{valeur}</T> : null}
      {interrupteur ? <Interrupteur actif={interrupteur.actif} onChange={interrupteur.onChange} label={titre} /> : null}
      {onPress ? <Feather name="chevron-right" size={18} color={C.gris} /> : null}
    </>
  );
  const style = [s.ligne, !derniere && s.ligneFilet];
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [style, pressed && { backgroundColor: C.fond }]}>
        {contenu}
      </Pressable>
    );
  }
  return <View style={style}>{contenu}</View>;
}

export function Interrupteur({ actif, onChange, label }: { actif: boolean; onChange: () => void; label: string }) {
  return (
    <Switch
      value={actif}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ false: '#D5DFE3', true: C.orage }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#D5DFE3"
    />
  );
}

/** Barre de progression */
export function Progression({ valeur }: { valeur: number }) {
  const [v] = useState(() => new Animated.Value(valeur));
  useEffect(() => {
    Animated.timing(v, { toValue: valeur, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  }, [v, valeur]);
  const width = v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  return (
    <View style={s.piste} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(valeur * 100) }}>
      <Animated.View style={[s.jauge, { width }]} />
    </View>
  );
}

export const s = StyleSheet.create({
  carte: {
    backgroundColor: C.carte,
    borderRadius: RAYON,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.filet,
    padding: 16,
  },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  boutonPetit: { minHeight: 40, paddingHorizontal: 16 },
  presse: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: MARGE,
    marginTop: 30,
    marginBottom: 12,
  },
  lien: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  pastille: { alignItems: 'center', justifyContent: 'center' },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  ligneFilet: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.filet },
  piste: { height: 6, borderRadius: 3, backgroundColor: C.neige, overflow: 'hidden' },
  jauge: { height: 6, borderRadius: 3, backgroundColor: C.ardoise },
});
