import { Feather } from '@expo/vector-icons';
import { Tabs, type TabsScreenOptions } from 'expo-router/js-tabs';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconeFeather } from '@/components/ui';
import { useDobby } from '@/state/dobby';
import { C, F } from '@/theme';

function Icone({ nom, couleur, actif }: { nom: IconeFeather; couleur: ColorValue; actif: boolean }) {
  return (
    <View style={[st.icone, actif && st.iconeActive]}>
      <Feather name={nom} size={20} color={typeof couleur === 'string' ? couleur : C.gris} />
    </View>
  );
}

export default function Onglets() {
  const { etat } = useDobby();
  const insets = useSafeAreaInsets();
  const onglet = (titre: string, icone: IconeFeather): TabsScreenOptions => ({
    title: titre,
    tabBarIcon: ({ color, focused }) => <Icone nom={icone} couleur={color} actif={focused} />,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: C.fond },
        tabBarActiveTintColor: C.nuit,
        tabBarInactiveTintColor: C.gris,
        tabBarStyle: { backgroundColor: C.carte, borderTopColor: C.filet, height: 72 + insets.bottom, paddingTop: 4 },
        tabBarIconStyle: { width: 54, height: 30 },
        tabBarLabelStyle: { fontFamily: F.demi, fontSize: 11, marginTop: 4 },
        tabBarBadgeStyle: { backgroundColor: C.nuit, color: '#FFFFFF', fontFamily: F.gras, fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={onglet('Accueil', 'home')} />
      <Tabs.Screen
        name="messages"
        options={{ ...onglet('Messages', 'message-circle'), tabBarBadge: etat.nonLus > 0 ? etat.nonLus : undefined }}
      />
      <Tabs.Screen name="plan" options={onglet('Plan', 'layout')} />
      <Tabs.Screen name="journal" options={onglet('Journal', 'clock')} />
      <Tabs.Screen name="reglages" options={onglet('Réglages', 'sliders')} />
    </Tabs>
  );
}

const st = StyleSheet.create({
  icone: { width: 54, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconeActive: { backgroundColor: C.givre },
});
