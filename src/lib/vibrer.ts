import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Retour tactile discret (rien sur le web) */
export function vibrer(type: 'choix' | 'leger' | 'fort' | 'succes' = 'leger') {
  if (Platform.OS === 'web') return;
  const ignorer = () => {};
  if (type === 'choix') Haptics.selectionAsync().catch(ignorer);
  else if (type === 'succes') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignorer);
  else if (type === 'fort') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(ignorer);
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignorer);
}
