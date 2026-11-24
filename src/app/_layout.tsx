import { Italiana_400Regular } from '@expo-google-fonts/italiana';
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { CadreTelephone, MargesTelephone, surOrdinateur } from '@/components/cadre-telephone';
import { EcranArret } from '@/components/ecran-arret';
import { cleOpenRouter, EN_LIGNE } from '@/lib/openrouter';
import { DobbyProvider } from '@/state/dobby';
import { C } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

console.log(
  EN_LIGNE
    ? '[Dobby] Version en ligne : Dobby répond par le Worker Cloudflare, qui garde la clé.'
    : cleOpenRouter()
      ? '[Dobby] Clé OpenRouter trouvée : Dobby répond librement dans Messages.'
      : '[Dobby] Pas de clé OpenRouter dans .env.local : Dobby répond avec des phrases préparées.',
);

export default function Racine() {
  const [pret, erreur] = useFonts({
    Italiana_400Regular,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (pret || erreur) SplashScreen.hideAsync().catch(() => {});
  }, [pret, erreur]);

  if (!pret && !erreur) return null;

  // Ouverte sur un ordinateur, la page montre l'appli dans un téléphone dessiné (cadre-telephone.web.tsx)
  if (surOrdinateur) return <CadreTelephone />;

  return (
    <MargesTelephone>
      <DobbyProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.fond } }}>
          <Stack.Screen name="(onglets)" />
          <Stack.Screen name="memoire" />
          <Stack.Screen name="routines" />
          <Stack.Screen name="famille" />
        </Stack>
        <EcranArret />
      </DobbyProvider>
    </MargesTelephone>
  );
}
