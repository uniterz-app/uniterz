/** Web グループ編集 — 名前・説明・ヘッダー画像 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { Language } from "../../../../../lib/i18n/language";
import { storage } from "../../lib/firebase";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { RankingsShellGridOverlay } from "../rankings/rankingsUiDecorations";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import { communityApiUrl, communityAuthHeader } from "./communityApiNative";
import {
  communityFieldLabelStyle,
  communityModalCardStyle,
  communityPressableTapStyle,
} from "./communityCrtThemeNative";

type Props = {
  visible: boolean;
  groupId: string;
  language: Language;
  initialName: string;
  initialDescription: string | null;
  initialHeaderImageUrl: string | null;
  onClose: () => void;
  onSaved: () => void;
  getIdToken: () => Promise<string>;
};

const GLASS_FIELD = {
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.14)",
  backgroundColor: "rgba(255,255,255,0.06)",
  paddingHorizontal: 10,
  paddingVertical: 8,
} as const;

export default function CommunityEditGroupModalNative({
  visible,
  groupId,
  language,
  initialName,
  initialDescription,
  initialHeaderImageUrl,
  onClose,
  onSaved,
  getIdToken,
}: Props) {
  const { fUser } = useFirebaseUser();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [headerUri, setHeaderUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initialName);
    setDescription(initialDescription ?? "");
    setHeaderUri(null);
  }, [visible, initialName, initialDescription]);

  const t = useMemo(
    () =>
      language === "en"
        ? {
            title: "Edit group",
            name: "Group name",
            description: "Description (optional)",
            descriptionPh: "e.g. Weekend picks with friends",
            header: "Header image",
            pickImage: "Pick image",
            removeImage: "Remove image",
            cancel: "Cancel",
            save: "Save",
            saving: "Saving…",
            saved: "Group updated.",
            failed: "Update failed.",
          }
        : {
            title: "グループを編集",
            name: "グループ名",
            description: "説明（任意）",
            descriptionPh: "例：仲間との予想ランキング",
            header: "ヘッダー画像",
            pickImage: "画像を選ぶ",
            removeImage: "画像を削除",
            cancel: "キャンセル",
            save: "保存",
            saving: "保存中…",
            saved: "グループを更新しました。",
            failed: "更新に失敗しました。",
          },
    [language]
  );

  const previewUri = headerUri && headerUri !== "__remove__" ? headerUri : initialHeaderImageUrl;
  const removeHeader = headerUri === "__remove__";

  const closeReset = useCallback(() => {
    if (busy) return;
    onClose();
  }, [busy, onClose]);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("", language === "en" ? "Photo access is required." : "写真へのアクセスが必要です。");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setHeaderUri(result.assets[0].uri);
    }
  }, [language]);

  const onSubmit = useCallback(async () => {
    const n = name.trim();
    if (!fUser || n.length < 1 || busy) return;
    setBusy(true);
    try {
      const h = await communityAuthHeader(getIdToken);
      if (!h) return;

      let headerImageUrl: string | null | undefined = undefined;
      if (headerUri === "__remove__") {
        headerImageUrl = null;
      } else if (headerUri) {
        const resp = await fetch(headerUri);
        const blob = await resp.blob();
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const fileRef = ref(storage, `community_headers/${fUser.uid}/${id}.jpg`);
        await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
        headerImageUrl = await getDownloadURL(fileRef);
      }

      const body: Record<string, unknown> = {
        name: n,
        description: description.trim() || null,
      };
      if (headerImageUrl !== undefined) {
        body.headerImageUrl = headerImageUrl;
      }

      const res = await fetch(communityApiUrl(`/api/communities/${groupId}/update`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: h },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        Alert.alert("", String(json?.error ?? t.failed));
        return;
      }
      Alert.alert("", t.saved);
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  }, [name, description, headerUri, fUser, busy, getIdToken, groupId, t, onSaved, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeReset}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeReset} disabled={busy}>
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={Platform.OS === "ios" ? 18 : 10}
              tint="dark"
              {...nativeBlurViewExtraProps()}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <View style={styles.backdropDim} />
        </Pressable>

        <View style={styles.card}>
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={Platform.OS === "ios" ? 28 : 16}
              tint="dark"
              {...nativeBlurViewExtraProps()}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.14)",
              "rgba(255,255,255,0.05)",
              "rgba(5,12,24,0.55)",
              "rgba(5,8,20,0.72)",
            ]}
            locations={[0, 0.18, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View pointerEvents="none" style={styles.insetHighlight} />
          <RankingsShellGridOverlay borderRadius={16} />

          <View style={styles.cardInner}>
            <Text style={styles.title}>{t.title}</Text>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={communityFieldLabelStyle}>{t.name}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                maxLength={60}
                style={[GLASS_FIELD, styles.input]}
              />

              <Text style={[communityFieldLabelStyle, styles.gapTop]}>{t.description}</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                maxLength={280}
                multiline
                placeholder={t.descriptionPh}
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={[GLASS_FIELD, styles.textarea]}
              />

              <Text style={[communityFieldLabelStyle, styles.gapTop]}>{t.header}</Text>
              {previewUri && !removeHeader ? (
                <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
              ) : null}
              <View style={styles.imageActions}>
                <Pressable onPress={() => void pickImage()} style={({ pressed }) => [styles.pickBtn, pressed && communityPressableTapStyle(true)]}>
                  <Text style={styles.pickBtnText}>{t.pickImage}</Text>
                </Pressable>
                {(initialHeaderImageUrl || headerUri) && headerUri !== "__remove__" ? (
                  <Pressable
                    onPress={() => setHeaderUri("__remove__")}
                    style={({ pressed }) => [styles.removeBtn, pressed && communityPressableTapStyle(true)]}
                  >
                    <Text style={styles.removeBtnText}>{t.removeImage}</Text>
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable disabled={busy} onPress={closeReset} style={({ pressed }) => [styles.cancelBtn, pressed && communityPressableTapStyle(true)]}>
                <Text style={styles.cancelText}>{t.cancel}</Text>
              </Pressable>
              <Pressable
                disabled={busy || name.trim().length < 1}
                onPress={() => void onSubmit()}
                style={({ pressed }) => [
                  styles.saveBtn,
                  (busy || name.trim().length < 1) && styles.submitDisabled,
                  pressed && communityPressableTapStyle(true),
                ]}
              >
                <Text style={styles.saveText}>{busy ? t.saving : t.save}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  card: {
    ...communityModalCardStyle,
    width: "100%",
    maxWidth: 400,
    maxHeight: "88%",
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(8,14,28,0.42)",
  },
  insetHighlight: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    zIndex: 2,
  },
  cardInner: {
    position: "relative",
    zIndex: 2,
    flexShrink: 1,
    maxHeight: "100%",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(236,254,255,0.96)",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  input: {
    color: "rgba(236,254,255,0.92)",
    fontSize: 14,
  },
  textarea: {
    color: "rgba(236,254,255,0.92)",
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
  },
  gapTop: {
    marginTop: 12,
  },
  preview: {
    marginTop: 8,
    width: "100%",
    height: 120,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  imageActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  pickBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 10,
    alignItems: "center",
  },
  pickBtnText: {
    fontSize: 12,
    color: "rgba(186,230,253,0.88)",
  },
  removeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.3)",
    backgroundColor: "rgba(244,63,94,0.08)",
    paddingVertical: 10,
    alignItems: "center",
  },
  removeBtnText: {
    fontSize: 12,
    color: "rgba(254,202,202,0.9)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
  },
  saveBtn: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.34)",
    backgroundColor: "rgba(34,211,238,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(236,254,255,0.96)",
  },
});
