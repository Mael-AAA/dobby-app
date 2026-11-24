import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '@/components/ui';
import { PHOTOS, type PhotoId } from '@/data/maison';
import { C, MARGE } from '@/theme';

/** Photo envoyée par Dobby, en grand */
export function Visionneuse({ photo, legende, fermer }: { photo: PhotoId | null; legende?: string; fermer: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={photo !== null} animationType="fade" onRequestClose={fermer} statusBarTranslucent>
      <View style={[st.ecran, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <View style={st.haut}>
          <T variante="fort">Photo de Dobby</T>
          <Pressable onPress={fermer} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fermer la photo" style={st.fermer}>
            <Feather name="x" size={22} color={C.nuit} />
          </Pressable>
        </View>
        {photo ? (
          <Image source={PHOTOS[photo]} style={st.image} contentFit="contain" transition={250} accessibilityLabel={legende} />
        ) : null}
        <View style={st.bas}>
          {legende ? <T variante="fort">{legende}</T> : null}
          <T variante="note">Prise par Dobby pour vous confirmer que c’est fait. Elle reste dans votre maison.</T>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.fond, paddingHorizontal: MARGE },
  haut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  fermer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.carte,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.filet,
  },
  image: { flex: 1, borderRadius: 20 },
  bas: { gap: 4, marginTop: 16 },
});
