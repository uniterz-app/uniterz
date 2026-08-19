import { useEffect, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../lib/firebase";
import AuthFormShellNative from "./AuthFormShellNative";
import { AUTH_LANDING } from "./authLandingPalette";
import SlantCtaNative from "../../ui/SlantCtaNative";
import { LEAGUES } from "../../../../../lib/leagues";
import { hideNativeBootSplash } from "../../bootstrap/nativeBootSplash";
import { ensureUserSlug } from "../../../../../lib/ensureSlug";
import { normalizeReferralInviteCode } from "../../../../../lib/referral/referralInviteCode";
import { bindMeReferralNative } from "../profile/referralApiNative";
import {
  assertProfileTextsFreeOfGamblingTerms,
  isProfileGamblingTermsError,
  profileGamblingTermsUserMessage,
} from "../../../../../lib/profile/profileGamblingTerms";
import { RankingsDefaultAvatarGlyphNative } from "../rankings/RankingsAvatarAndTabs";
import { rankingFlagImageUri } from "../rankings/rankingFlagUri";
import { COUNTRY_OPTIONS } from "../../../../../lib/rankings/country";
import ProfileBackEdgeHandleNative from "../profile/ProfileBackEdgeHandleNative";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

type PendingAvatar = {
  uri: string;
  base64?: string;
  mimeType?: string;
};

function base64ToUint8Array(b64: string): Uint8Array {
  const atobFn = (globalThis as { atob?: (data: string) => string }).atob;
  if (typeof atobFn !== "function") throw new Error("atob unavailable");
  const bin = atobFn(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff;
  return out;
}

function isImagePickerNativeMissingError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /ExponentImagePicker|Cannot find native module/i.test(msg);
}

const COPY = {
  ja: {
    desc: "ユーザー名と言語を設定してください。画像・国・招待コードは任意です。",
    pickPhoto: "プロフィール画像を選ぶ",
    username: "ユーザー名",
    country: "住んでいる国（任意）",
    countryNotSet: "未設定",
    invite: "招待コード（任意）",
    inviteHint: "招待コードを入力し条件を満たすとUnitが獲得できます.",
    continue: "CONTINUE",
    saving: "保存中...",
    nameTooLong: "ユーザー名は50文字以内にしてください。",
    invalidTitle: "入力エラー",
    saveFail: "プロフィールの保存に失敗しました。",
    photoDeniedTitle: "写真へのアクセス",
    photoDenied: "設定から写真へのアクセスを許可してください。",
    photoPickerTitle: "写真を選べません",
    photoPickerHint:
      "このビルドでは画像ライブラリが使えません。開発クライアントを入れ直してください。",
    photoFail: "画像の読み込みに失敗しました。",
    backFail: "戻るのに失敗しました。",
  },
  en: {
    desc: "Set your username and language. Photo, country, and invite code are optional.",
    pickPhoto: "Choose profile photo",
    username: "Username",
    country: "Country (optional)",
    countryNotSet: "Not set",
    invite: "Invite code (optional)",
    inviteHint: "Enter an invite code and meet the conditions to earn Units.",
    continue: "CONTINUE",
    saving: "Saving...",
    nameTooLong: "Username must be 50 characters or fewer.",
    invalidTitle: "Invalid input",
    saveFail: "Could not save your profile.",
    photoDeniedTitle: "Photo access",
    photoDenied: "Allow photo access in Settings, then try again.",
    photoPickerTitle: "Can't pick a photo",
    photoPickerHint:
      "The image library isn't available in this build. Reinstall the dev client.",
    photoFail: "Could not load the image.",
    backFail: "Could not go back. Try again.",
  },
} as const;

function countryRowLabel(code: string, appLang: "ja" | "en"): string {
  const trimmed = code.trim();
  if (!trimmed) return "";
  const row = COUNTRY_OPTIONS.find((c) => c.code === trimmed);
  return row ? (appLang === "ja" ? row.labelJa : row.labelEn) : trimmed;
}

export default function OnboardingScreenNative() {
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [countryCode, setCountryCode] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [avatar, setAvatar] = useState<PendingAvatar | null>(null);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    hideNativeBootSplash();
  }, []);

  const canSubmit = displayName.trim().length > 0;
  const t = COPY[language];
  const selectedFlagUri = rankingFlagImageUri(countryCode.trim() || undefined);

  async function handleBack() {
    if (saving) return;
    if (countryOpen) {
      setCountryOpen(false);
      return;
    }
    try {
      await signOut(auth);
    } catch {
      cyberAlert(t.invalidTitle, t.backFail);
    }
  }

  async function pickAvatar() {
    if (saving || picking) return;
    let ImagePicker: typeof import("expo-image-picker");
    try {
      ImagePicker = await import("expo-image-picker");
    } catch (e: unknown) {
      if (isImagePickerNativeMissingError(e)) {
        cyberAlert(t.photoPickerTitle, t.photoPickerHint);
      } else {
        cyberAlert(t.invalidTitle, t.photoFail);
      }
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        cyberAlert(t.photoDeniedTitle, t.photoDenied);
        return;
      }
      setPicking(true);
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.75,
        base64: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      setAvatar({
        uri: asset.uri,
        base64: asset.base64 ?? undefined,
        mimeType: asset.mimeType,
      });
    } catch (e: unknown) {
      if (isImagePickerNativeMissingError(e)) {
        cyberAlert(t.photoPickerTitle, t.photoPickerHint);
      } else {
        cyberAlert(t.invalidTitle, t.photoFail);
      }
    } finally {
      setPicking(false);
    }
  }

  async function uploadAvatarIfNeeded(uid: string): Promise<string | null> {
    if (!avatar) return null;
    const fileRef = ref(storage, `avatars/${uid}/onboarding_profile.jpg`);
    const contentType =
      avatar.mimeType && avatar.mimeType.startsWith("image/")
        ? avatar.mimeType
        : "image/jpeg";
    if (avatar.base64 && avatar.base64.length > 0) {
      const bytes = base64ToUint8Array(avatar.base64);
      if (bytes.byteLength === 0) throw new Error("empty image");
      await uploadBytes(fileRef, bytes, { contentType });
    } else {
      const res = await fetch(avatar.uri);
      const buf = await res.arrayBuffer();
      if (!buf || buf.byteLength === 0) throw new Error("empty image");
      await uploadBytes(fileRef, new Uint8Array(buf), { contentType });
    }
    return getDownloadURL(fileRef);
  }

  async function handleSubmit() {
    const user = auth.currentUser;
    if (!user || !canSubmit) return;
    const name = displayName.trim();
    if (name.length > 50) {
      cyberAlert(t.invalidTitle, t.nameTooLong);
      return;
    }
    try {
      assertProfileTextsFreeOfGamblingTerms(name, "");
    } catch (e: unknown) {
      if (isProfileGamblingTermsError(e)) {
        cyberAlert(t.invalidTitle, profileGamblingTermsUserMessage(language));
        return;
      }
      throw e;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const existing = snap.exists() ? snap.data() : {};
      await ensureUserSlug(db, user.uid);
      const uploadedPhotoURL = await uploadAvatarIfNeeded(user.uid);
      const photoURL =
        uploadedPhotoURL ??
        (typeof existing.photoURL === "string" ? existing.photoURL : "");

      const body = {
        displayName: name,
        bio: typeof existing.bio === "string" ? existing.bio : "",
        photoURL,
        language,
        countryCode: countryCode.trim() || null,
        completeOnboarding: true,
        preferredLeague: LEAGUES.NBA,
      };

      if (API_BASE) {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE}/api/me/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("profile save failed");
      } else {
        const { setDoc, serverTimestamp } = await import("firebase/firestore");
        const handle =
          name.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20) || "user";
        await setDoc(
          userRef,
          {
            displayName: name,
            photoURL,
            language,
            countryCode: countryCode.trim() || null,
            preferredLeague: LEAGUES.NBA,
            handle: existing.handle || handle,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      const code = normalizeReferralInviteCode(inviteCode);
      if (code) {
        try {
          await bindMeReferralNative(code);
        } catch {
          /* 招待の失敗ではオンボーディングを止めない */
        }
      }
    } catch (e) {
      if (isProfileGamblingTermsError(e)) {
        cyberAlert(t.invalidTitle, profileGamblingTermsUserMessage(language));
      } else {
        cyberAlert(t.invalidTitle, t.saveFail);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AuthFormShellNative title="WELCOME">
        <Text style={styles.desc}>{t.desc}</Text>

        <Pressable
          onPress={() => void pickAvatar()}
          disabled={saving || picking}
          style={styles.avatarHit}
          accessibilityRole="button"
          accessibilityLabel={t.pickPhoto}
        >
          <View style={styles.avatar}>
            {avatar?.uri ? (
              <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
            ) : (
              <RankingsDefaultAvatarGlyphNative size={76} />
            )}
            {picking ? (
              <View style={styles.avatarBusy}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
          </View>
          <View style={styles.cameraFab}>
            <MaterialCommunityIcons name="camera" size={14} color="#050508" />
          </View>
        </Pressable>

        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder={t.username}
            placeholderTextColor="rgba(186,200,210,0.45)"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={50}
          />
        </View>
        <Pressable
          style={styles.field}
          onPress={() => {
            if (saving) return;
            setCountryOpen(true);
          }}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={t.country}
        >
          <View style={styles.selectRow}>
            {selectedFlagUri ? (
              <Image
                source={{ uri: selectedFlagUri }}
                style={styles.flag}
                resizeMode="cover"
              />
            ) : null}
            <Text
              style={[
                styles.selectText,
                !countryCode.trim() && styles.selectPlaceholder,
              ]}
              numberOfLines={1}
            >
              {countryRowLabel(countryCode, language) || t.country}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color="rgba(226,232,240,0.65)"
            />
          </View>
        </Pressable>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder={t.invite}
            placeholderTextColor="rgba(186,200,210,0.45)"
            value={inviteCode}
            onChangeText={(t) => setInviteCode(normalizeReferralInviteCode(t))}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
        <Text style={styles.inviteHint}>{t.inviteHint}</Text>

        <View style={styles.langRow}>
          {(["ja", "en"] as const).map((lang) => {
            const on = language === lang;
            return (
              <Pressable
                key={lang}
                style={[styles.langBtn, on && styles.langBtnOn]}
                onPress={() => setLanguage(lang)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.langLabel, on && styles.langLabelOn]}>
                  {lang === "ja" ? "日本語" : "English"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <SlantCtaNative
          display
          variant="mono"
          label={saving ? t.saving : t.continue}
          onPress={handleSubmit}
          disabled={!canSubmit || saving}
        />
      </AuthFormShellNative>
      <ProfileBackEdgeHandleNative onPress={() => void handleBack()} />
      <Modal
        visible={countryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryOpen(false)}
      >
        <View style={styles.pickerRoot}>
          <Pressable
            style={styles.pickerBackdrop}
            onPress={() => setCountryOpen(false)}
          />
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>{t.country}</Text>
            <ScrollView
              style={styles.pickerScroll}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable
                style={({ pressed }) => [
                  styles.pickerOption,
                  pressed && styles.pickerOptionPressed,
                ]}
                onPress={() => {
                  setCountryCode("");
                  setCountryOpen(false);
                }}
              >
                <View style={styles.pickerOptionMain}>
                  <View style={styles.flagSlot} />
                  <Text style={styles.pickerOptionText}>{t.countryNotSet}</Text>
                </View>
                {!countryCode.trim() ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color="rgba(255,255,255,0.92)"
                  />
                ) : null}
              </Pressable>
              {COUNTRY_OPTIONS.map((c) => {
                const selected = countryCode.trim() === c.code;
                const flagUri = rankingFlagImageUri(c.code);
                return (
                  <Pressable
                    key={c.code}
                    style={({ pressed }) => [
                      styles.pickerOption,
                      pressed && styles.pickerOptionPressed,
                    ]}
                    onPress={() => {
                      setCountryCode(c.code);
                      setCountryOpen(false);
                    }}
                  >
                    <View style={styles.pickerOptionMain}>
                      <View style={styles.flagSlot}>
                        {flagUri ? (
                          <Image
                            source={{ uri: flagUri }}
                            style={styles.flag}
                            resizeMode="cover"
                          />
                        ) : null}
                      </View>
                      <Text style={styles.pickerOptionText}>
                        {language === "ja" ? c.labelJa : c.labelEn}
                      </Text>
                    </View>
                    {selected ? (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color="rgba(255,255,255,0.92)"
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  desc: {
    color: "rgba(226,232,240,0.65)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 2,
  },
  avatarHit: {
    alignSelf: "center",
    width: 84,
    height: 84,
    marginTop: 2,
    marginBottom: 2,
  },
  avatar: {
    width: 76,
    height: 76,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#0a0c14",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarBusy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraFab: {
    position: "absolute",
    right: 0,
    bottom: 4,
    width: 24,
    height: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: AUTH_LANDING.accentDim,
    backgroundColor: "rgba(4,10,14,0.72)",
    justifyContent: "center",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#f1f5f9",
    fontSize: 16,
    minHeight: 52,
  },
  selectRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  selectText: {
    flex: 1,
    minWidth: 0,
    color: "#f1f5f9",
    fontSize: 16,
  },
  selectPlaceholder: {
    color: "rgba(186,200,210,0.45)",
  },
  flagSlot: {
    width: 22,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  flag: {
    width: 22,
    height: 15,
    borderRadius: 1,
  },
  pickerRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  pickerSheet: {
    maxHeight: "72%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  pickerTitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "rgba(248,250,252,0.92)",
    fontSize: 14,
    fontWeight: "700",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  pickerScroll: {
    maxHeight: 420,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  pickerOptionMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pickerOptionPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  pickerOptionText: {
    flex: 1,
    color: "rgba(248,250,252,0.95)",
    fontSize: 15,
  },
  inviteHint: {
    marginTop: -8,
    paddingHorizontal: 2,
    color: "rgba(210,220,228,0.82)",
    fontSize: 11,
    lineHeight: 15,
  },
  langRow: {
    flexDirection: "row",
    gap: 10,
  },
  langBtn: {
    flex: 1,
    minHeight: 32,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(4,10,14,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  langBtnOn: {
    borderColor: "rgba(255,255,255,0.88)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  langLabel: {
    color: "rgba(226,232,240,0.62)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  langLabelOn: {
    color: "#FFFFFF",
  },
});
