import { useEffect, useMemo, useState } from "react";
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
import { resolveDeviceLocalizedLang } from "../../i18n/resolveDeviceAppLanguage";
import { LANGUAGE_NATIVE_NAMES, type Language } from "../../../../../lib/i18n/language";
import { countryName } from "../../../../../lib/i18n/t";
import {
  LOCALIZED_UI_LANGUAGES,
  type LocalizedLang,
} from "../../../../../lib/i18n/localize";
import { onboardingWelcomeCopy } from "../../../../../lib/auth/onboardingWelcomeCopy";
import { ensureUserSlug } from "../../../../../lib/ensureSlug";
import { normalizeReferralInviteCode } from "../../../../../lib/referral/referralInviteCode";
import { referralBindUserMessage } from "../../../../../lib/referral/referralBindErrorCopy";
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

function countryRowLabel(code: string, appLang: LocalizedLang): string {
  const trimmed = code.trim();
  if (!trimmed) return "";
  const named = countryName(appLang as Language, trimmed);
  if (named && named !== trimmed) return named;
  const row = COUNTRY_OPTIONS.find((c) => c.code === trimmed);
  return row?.labelEn ?? trimmed;
}

type PickerKind = "language" | "country" | null;

export default function OnboardingScreenNative() {
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [language, setLanguage] = useState<LocalizedLang>(
    resolveDeviceLocalizedLang
  );
  const [countryCode, setCountryCode] = useState("");
  const [picker, setPicker] = useState<PickerKind>(null);
  const [avatar, setAvatar] = useState<PendingAvatar | null>(null);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    hideNativeBootSplash();
  }, []);

  const canSubmit = displayName.trim().length > 0;
  const t = useMemo(() => onboardingWelcomeCopy(language), [language]);
  const selectedFlagUri = rankingFlagImageUri(countryCode.trim() || undefined);

  async function handleBack() {
    if (saving) return;
    if (picker) {
      setPicker(null);
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
        } catch (e: unknown) {
          // 招待失敗でもオンボーディングは完了。自分コード等は明示する。
          const errCode = e instanceof Error ? e.message : "";
          const msg = referralBindUserMessage(errCode, language);
          if (msg) cyberAlert(t.invalidTitle, msg);
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
            setPicker("language");
          }}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={t.language}
        >
          <View style={styles.selectRow}>
            <Text style={styles.selectText} numberOfLines={1}>
              {LANGUAGE_NATIVE_NAMES[language]}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color="rgba(226,232,240,0.65)"
            />
          </View>
        </Pressable>
        <Pressable
          style={styles.field}
          onPress={() => {
            if (saving) return;
            setPicker("country");
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
            onChangeText={(v) => setInviteCode(normalizeReferralInviteCode(v))}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
        <Text style={styles.inviteHint}>{t.inviteHint}</Text>

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
        visible={picker != null}
        transparent
        animationType="fade"
        onRequestClose={() => setPicker(null)}
      >
        <View style={styles.pickerRoot}>
          <Pressable
            style={styles.pickerBackdrop}
            onPress={() => setPicker(null)}
          />
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>
              {picker === "language" ? t.language : t.country}
            </Text>
            <ScrollView
              style={styles.pickerScroll}
              keyboardShouldPersistTaps="handled"
            >
              {picker === "language"
                ? LOCALIZED_UI_LANGUAGES.map((code) => {
                    const selected = language === code;
                    return (
                      <Pressable
                        key={code}
                        style={({ pressed }) => [
                          styles.pickerOption,
                          pressed && styles.pickerOptionPressed,
                        ]}
                        onPress={() => {
                          setLanguage(code);
                          setPicker(null);
                        }}
                      >
                        <View style={styles.pickerOptionMain}>
                          <Text style={styles.pickerOptionText}>
                            {LANGUAGE_NATIVE_NAMES[code]}
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
                  })
                : (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.pickerOption,
                        pressed && styles.pickerOptionPressed,
                      ]}
                      onPress={() => {
                        setCountryCode("");
                        setPicker(null);
                      }}
                    >
                      <View style={styles.pickerOptionMain}>
                        <View style={styles.flagSlot} />
                        <Text style={styles.pickerOptionText}>
                          {t.countryNotSet}
                        </Text>
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
                            setPicker(null);
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
                              {countryRowLabel(c.code, language)}
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
                  </>
                )}
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
    color: "rgba(248,250,252,0.92)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 2,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
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
    color: "rgba(248,250,252,0.9)",
    fontSize: 11,
    lineHeight: 16,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});
