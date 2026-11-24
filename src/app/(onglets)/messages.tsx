import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Barre } from '@/components/barre';
import { DobbyFace } from '@/components/dobby-face';
import { Bouton, T } from '@/components/ui';
import { Visionneuse } from '@/components/visionneuse';
import { PHOTOS, type PhotoId } from '@/data/maison';
import { heure, jour } from '@/lib/temps';
import { useDobby } from '@/state/dobby';
import type { Message } from '@/state/types';
import { C, F, MARGE } from '@/theme';

export default function Messages() {
  const { etat, residence: r, envoyer, lancerRaccourci, messagesVus } = useDobby();
  const [texte, setTexte] = useState('');
  const [photo, setPhoto] = useState<{ id: PhotoId; legende?: string } | null>(null);
  const liste = useRef<FlatList<Message>>(null);

  useFocusEffect(
    useCallback(() => {
      messagesVus(true);
      return () => messagesVus(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const descendre = () => setTimeout(() => liste.current?.scrollToEnd({ animated: true }), 60);

  const valider = () => {
    if (!texte.trim()) return;
    envoyer(texte);
    setTexte('');
  };

  return (
    <KeyboardAvoidingView style={st.ecran} behavior="padding">
      <Barre />
      <FlatList
        ref={liste}
        data={etat.messages}
        keyExtractor={(m) => m.id}
        style={{ flex: 1 }}
        contentContainerStyle={st.fil}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={descendre}
        onLayout={descendre}
        ListHeaderComponent={
          <View style={st.entete}>
            <T variante="note" style={st.centre}>
              {etat.messages[0] ? jour(etat.messages[0].ts) : ''}
            </T>
            <View style={st.chiffre}>
              <Feather name="lock" size={12} color={C.gris} />
              <T variante="note" style={st.centre}>
                Messages chiffrés de bout en bout
              </T>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Bulle
            m={item}
            premier={etat.messages[index - 1]?.auteur !== item.auteur}
            dernier={etat.messages[index + 1]?.auteur !== item.auteur}
            ouvrirPhoto={setPhoto}
          />
        )}
        ListFooterComponent={etat.ecrit > 0 ? <Ecrit /> : undefined}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={st.raccourcis}
        contentContainerStyle={{ gap: 8, paddingHorizontal: MARGE }}
      >
        {r.raccourcis.map((rc) => (
          <Pressable
            key={rc.id}
            onPress={() => lancerRaccourci(rc.id)}
            accessibilityRole="button"
            style={({ pressed }) => [st.puce, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name={rc.icone} size={17} color={C.nuit} />
            <T variante="fort" style={{ fontSize: 14 }}>
              {rc.label}
            </T>
          </Pressable>
        ))}
      </ScrollView>

      <View style={st.saisie}>
        <TextInput
          value={texte}
          onChangeText={setTexte}
          placeholder="Écrire à Dobby"
          placeholderTextColor={C.gris}
          style={st.champ}
          multiline
          rows={Platform.OS === 'web' ? 1 : undefined}
          maxLength={500}
          accessibilityLabel="Votre message à Dobby"
          onSubmitEditing={valider}
          submitBehavior="submit"
          returnKeyType="send"
        />
        <Pressable
          onPress={valider}
          disabled={!texte.trim()}
          accessibilityRole="button"
          accessibilityLabel="Envoyer"
          style={({ pressed }) => [st.envoyer, !texte.trim() && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.94 }] }]}
        >
          <Feather name="arrow-up" size={21} color={C.nuit} />
        </Pressable>
      </View>

      <Visionneuse photo={photo?.id ?? null} legende={photo?.legende} fermer={() => setPhoto(null)} />
    </KeyboardAvoidingView>
  );
}

function Bulle({
  m,
  premier,
  dernier,
  ouvrirPhoto,
}: {
  m: Message;
  premier: boolean;
  dernier: boolean;
  ouvrirPhoto: (p: { id: PhotoId; legende?: string }) => void;
}) {
  const moi = m.auteur === 'moi';
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [v]);

  return (
    <Animated.View
      style={[
        st.ligne,
        moi ? st.droite : st.gauche,
        { marginTop: premier ? 10 : 2 },
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
      ]}
    >
      {!moi ? <View style={st.avatar}>{dernier ? <DobbyFace taille={26} vivant={false} /> : null}</View> : null}
      <View style={[st.colonne, moi && { alignItems: 'flex-end' }]}>
        {m.photo ? (
          <Pressable
            onPress={() => ouvrirPhoto({ id: m.photo as PhotoId, legende: m.legende })}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Photo : ${m.legende ?? 'confirmation'}. Afficher en grand`}
          >
            <Image source={PHOTOS[m.photo]} style={st.photo} contentFit="cover" transition={300} />
            {m.legende ? (
              <T variante="note" style={{ marginTop: 6 }}>
                {m.legende}
              </T>
            ) : null}
          </Pressable>
        ) : (
          <View style={[st.bulle, moi ? st.bulleMoi : st.bulleDobby, premier && (moi ? { borderTopRightRadius: 6 } : { borderTopLeftRadius: 6 })]}>
            <T variante="corps">{m.texte}</T>
          </View>
        )}
        {m.validation ? <Accord id={m.validation} /> : null}
        {dernier && !m.photo ? (
          <T variante="note" style={{ fontSize: 11.5, marginTop: 4 }}>
            {heure(m.ts)}
          </T>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** Demande d'accord, dans la conversation */
function Accord({ id }: { id: string }) {
  const { etat, decider } = useDobby();
  const v = etat.validations.find((x) => x.id === id);
  if (!v) return null;
  if (v.statut !== 'attente') {
    return (
      <View style={st.decision}>
        <Feather name={v.statut === 'acceptee' ? 'check' : 'x'} size={14} color={C.orage} />
        <T variante="note">{v.statut === 'acceptee' ? `Accepté, ${v.montant} €` : 'Refusé'}</T>
      </View>
    );
  }
  return (
    <View style={st.accord}>
      <T variante="fort">{`${v.titre}, ${v.montant} €`}</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Bouton label="Refuser" genre="contour" petit style={{ flex: 1 }} onPress={() => decider(v.id, false)} />
        <Bouton label="Accepter" genre="sombre" petit style={{ flex: 1 }} onPress={() => decider(v.id, true)} />
      </View>
    </View>
  );
}

/** Dobby écrit… */
function Ecrit() {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const boucle = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1100, useNativeDriver: true }));
    boucle.start();
    return () => boucle.stop();
  }, [v]);
  const point = (i: number) => ({
    opacity: v.interpolate({
      inputRange: [0, 0.2 + i * 0.2, 0.4 + i * 0.2, 1],
      outputRange: [0.3, 1, 0.3, 0.3],
    }),
  });
  return (
    <View style={[st.ligne, st.gauche, { marginTop: 10 }]} accessibilityLabel="Dobby écrit" accessibilityLiveRegion="polite">
      <View style={st.avatar}>
        <DobbyFace taille={26} />
      </View>
      <View style={[st.bulle, st.bulleDobby, st.points]}>
        {[0, 1, 2].map((i) => (
          <Animated.View key={i} style={[st.point, point(i)]} />
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.fond },
  fil: { paddingHorizontal: MARGE - 4, paddingBottom: 16 },
  entete: { alignItems: 'center', gap: 4, paddingVertical: 10 },
  chiffre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  centre: { textAlign: 'center' },
  ligne: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  gauche: { justifyContent: 'flex-start', paddingRight: 48 },
  droite: { justifyContent: 'flex-end', paddingLeft: 64 },
  avatar: { width: 26, marginBottom: 22 },
  colonne: { flexShrink: 1 },
  bulle: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  bulleDobby: { backgroundColor: C.carte, borderWidth: StyleSheet.hairlineWidth, borderColor: C.filet },
  bulleMoi: { backgroundColor: C.givre },
  photo: { width: 236, height: 158, borderRadius: 18, backgroundColor: C.neige },
  accord: {
    marginTop: 8,
    padding: 12,
    gap: 10,
    borderRadius: 18,
    backgroundColor: C.neige,
    minWidth: 250,
  },
  decision: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  points: { flexDirection: 'row', gap: 5, paddingVertical: 15 },
  point: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.orage },
  raccourcis: { flexGrow: 0, paddingVertical: 8 },
  puce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: C.carte,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(64, 78, 84, 0.25)',
  },
  saisie: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: MARGE - 4,
    paddingTop: 4,
    paddingBottom: 10,
  },
  champ: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 23,
    backgroundColor: C.carte,
    borderWidth: 1,
    borderColor: 'rgba(64, 78, 84, 0.2)',
    fontFamily: F.texte,
    fontSize: 15.5,
    color: C.nuit,
  },
  envoyer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.givre,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
