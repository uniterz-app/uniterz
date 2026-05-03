import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../lib/firebase";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { useNativeProfileStats } from "./useNativeProfileStats";
import { useNativeStreakTracker } from "./useNativeStreakTracker";
import { useNativeProfilePlan } from "./useNativeProfilePlan";
import { useNativeAnnouncementsUnread } from "./useNativeAnnouncementsUnread";
import { useNativeProfileBadges, type ResolvedBadgeNative } from "./useNativeProfileBadges";
import ProfileSummaryGridNative from "./ProfileSummaryGridNative";
import UniterzBrandShelfNative from "../UniterzBrandShelfNative";
import ProfileGridBackdrop from "./ProfileGridBackdrop";
import ProfileDailyTrendChartNative from "./ProfileDailyTrendChartNative";
import ProfileRankTrendChartNative from "./ProfileRankTrendChartNative";
import ProfileStreakTrackerNative from "./ProfileStreakTrackerNative";
import ProfileSideMenuModal from "./ProfileSideMenuModal";
import ProfileBadgeDetailModal from "./ProfileBadgeDetailModal";
import ProfileMobileStackModal from "./mobileScreens/ProfileMobileStackModal";
import type { ProfileMobileOverlayKind } from "./mobileScreens/profileMobileOverlayTypes";
import ProfileBracketTabNative from "./ProfileBracketTabNative";
import ProfileStatsTabNative from "./ProfileStatsTabNative";
import ProfileOverviewEntranceBlock from "./ProfileOverviewEntranceBlock";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import CyberGlassToastModal from "../../components/CyberGlassToastModal";
import { COUNTRY_OPTIONS } from "../../../../../lib/rankings/country";

const hasNativeBlurView =
  Platform.OS !== "web" &&
  Boolean(
    UIManager.getViewManagerConfig?.("ExpoBlurView") ??
      UIManager.getViewManagerConfig?.("ViewManagerAdapter_ExpoBlur_ExpoBlurView")
  );

/** Web `SettingsNeonCard` の conic-gradient に近い色（回転 LinearGradient 用） */
const SETTINGS_NEON_SPIN_COLORS = [
  "hsl(189, 92%, 58%)",
  "hsl(240, 15%, 9%)",
  "hsl(189, 99%, 26%)",
  "hsl(188, 94%, 13%)",
  "hsl(189, 92%, 58%)",
] as const;

/** Web `main` の `backdrop-blur-xl` 相当（フォールバックは単色） */
function ProfileSettingsBackdropBlur() {
  if (!hasNativeBlurView) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(11, 13, 18, 0.94)" }]}
      />
    );
  }
  if (Platform.OS === "ios") {
    return (
      <BlurView
        pointerEvents="none"
        intensity={44}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />
    );
  }
  if (Platform.OS === "android") {
    return (
      <BlurView
        pointerEvents="none"
        intensity={40}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFillObject}
      />
    );
  }
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(11, 13, 18, 0.94)" }]}
    />
  );
}

type ProfileTab = "overview" | "bracket" | "stats";

/** Web `Tabs.tsx` と同一の英語ラベル */
const PROFILE_TAB_LABELS_EN: Record<ProfileTab, string> = {
  overview: "Overview",
  stats: "Pro Stats",
  bracket: "Bracket",
};

const PROFILE_TAB_ORDER: ProfileTab[] = ["overview", "stats", "bracket"];

function profileCountryRowLabel(code: string, appLang: "ja" | "en"): string {
  const trimmed = code.trim();
  if (!trimmed) return appLang === "ja" ? "未設定" : "Not set";
  const row = COUNTRY_OPTIONS.find((c) => c.code === trimmed);
  return row ? (appLang === "ja" ? row.labelJa : row.labelEn) : trimmed;
}

export default function ProfileHomeScreen({
  bottomReserveY = 0,
  onSaved,
}: {
  bottomReserveY?: number;
  onSaved?: () => void;
}) {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid;
  const apiBase = getUniterzApiBaseUrl();

  const [tab, setTab] = useState<ProfileTab>("overview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOverlay, setMobileOverlay] = useState<ProfileMobileOverlayKind>(null);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ResolvedBadgeNative | null>(null);

  const [profileLoading, setProfileLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [handle, setHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [countryCode, setCountryCode] = useState("");
  const [plan, setPlan] = useState<"free" | "pro">("free");

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  /** プロフィール保存成功 — システム Alert の代わりにサイバーガラストースト */
  const [saveSuccessToast, setSaveSuccessToast] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const isJa = language === "ja";

  const reduceMotion = useReducedMotion();
  const neonSpinAngle = useSharedValue(0);
  const neonSpinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${neonSpinAngle.value}deg` }],
  }));

  useEffect(() => {
    if (!settingsOpen) {
      cancelAnimation(neonSpinAngle);
      neonSpinAngle.value = 0;
      return;
    }
    if (reduceMotion) {
      cancelAnimation(neonSpinAngle);
      neonSpinAngle.value = 0;
      return;
    }
    neonSpinAngle.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      cancelAnimation(neonSpinAngle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- neonSpinAngle は SharedValue で安定
  }, [settingsOpen, reduceMotion]);

  const profilePlanHook = useNativeProfilePlan({
    targetUid: uid ?? null,
    profilePlan: plan,
  });
  const { unreadCount: menuUnreadCount, readIds: announcementReadIds } =
    useNativeAnnouncementsUnread(uid, status === "ready" && !!uid, {
      enabled: profilePlanHook.isMe,
    });
  const { resolvedBadges } = useNativeProfileBadges(uid);

  const statsBundle = useNativeProfileStats(uid, tab === "overview");
  const streakBundle = useNativeStreakTracker(uid, tab === "overview");

  const currentIsProView = profilePlanHook.isProView;
  /** 概要6枚の並び: Web Pro は連勝→精度の順（`profileSummaryGridKeysProOverview`）。plan と hook のどちらかが Pro なら Pro 並びにする */
  const proSummaryGridLayout =
    profilePlanHook.effectivePlan === "pro" || plan === "pro";

  const maxStreak = useMemo(() => {
    const st = statsBundle.stats as Record<string, unknown> | null;
    if (st != null) {
      const raw = st.maxWinStreak;
      const legacy = st.maxStreak;
      const v = Number(raw ?? legacy);
      if (Number.isFinite(v)) return Math.max(0, Math.floor(v));
    }
    return 0;
  }, [statsBundle.stats]);

  const currentStreak = useMemo(() => {
    const st = statsBundle.stats as Record<string, unknown> | null;
    if (st != null) {
      const v = Number(st.currentStreak);
      if (Number.isFinite(v)) return Math.max(0, Math.floor(v));
    }
    return 0;
  }, [statsBundle.stats]);

  const showStreakBadge = currentStreak >= 3;

  /** Web ヒーロー2行目に近づける：ハンドル優先、無ければメール（UID の一部は誤解を招くので避ける） */
  const secondaryIdLine =
    handle.trim() || fUser?.email?.trim() || fUser?.uid?.slice(0, 12) || "";

  const t = useMemo(
    () =>
      isJa
        ? {
            playoffsTitle: "2026 PLAYOFFS STATS",
            apiMissing:
              "EXPO_PUBLIC_UNITERZ_API_BASE_URL を .env に設定し、Next.js を起動してください。",
            bracketSoon:
              "プレーオフブラケットは Web 版と同様の表示を順次対応します。",
            statsSoon: "詳細分析（Pro）は Web 版でご利用いただけます。",
            settingsTitle: "プロフィール設定",
            settingsSubtitle: "アイコン・名前・自己紹介を編集できます",
            settingsClose: "閉じる",
            nameLabel: "名前",
            namePlaceholder: "名前",
            bio: "自己紹介",
            bioPlaceholder: "自己紹介",
            langLabel: "使用言語",
            countryLabel: "住んでいる国（任意）",
            countryNotSet: "未設定",
            save: "変更を保存",
            saving: "保存中…",
            logout: "ログアウト",
            invalidTitle: "入力不正",
            invalidName: "名前は50文字以内で入力してください。",
            savedTitle: "保存完了",
            savedBody: "プロフィールを更新しました。",
            saveErrorTitle: "保存エラー",
            saveErrorBody: "プロフィール更新に失敗しました。",
            pickPhotoTitle: "写真へのアクセス",
            pickPhotoDenied: "プロフィール写真を選ぶには、写真ライブラリへのアクセスを許可してください。",
            uploadAvatarFail: "画像のアップロードに失敗しました。通信状況を確認して再度お試しください。",
            imagePickerNativeTitle: "写真の選択を使えません",
            imagePickerNativeHint:
              "expo-image-picker を組み込んだ開発ビルドが必要です。apps/native で `npx expo run:ios` または `npx expo run:android` を実行してアプリを再ビルドしてください。",
            changePhotoA11y: "プロフィール写真を変更",
            proBadge: "PRO",
            streakLabel: "連勝",
          }
        : {
            playoffsTitle: "2026 PLAYOFFS STATS",
            apiMissing:
              "Set EXPO_PUBLIC_UNITERZ_API_BASE_URL and run the Next.js app.",
            bracketSoon: "Playoff bracket view will match the web app in a future update.",
            statsSoon: "Pro analysis is available on the web app.",
            settingsTitle: "Profile Settings",
            settingsSubtitle: "Edit your icon, name, and bio.",
            settingsClose: "Close",
            nameLabel: "Name",
            namePlaceholder: "Name",
            bio: "Bio",
            bioPlaceholder: "Bio",
            langLabel: "App Language",
            countryLabel: "Country (optional)",
            countryNotSet: "Not set",
            save: "Save Changes",
            saving: "Saving…",
            logout: "Log out",
            invalidTitle: "Invalid input",
            invalidName: "Name must be 50 characters or fewer.",
            savedTitle: "Saved",
            savedBody: "Profile has been updated.",
            saveErrorTitle: "Save error",
            saveErrorBody: "Failed to update profile.",
            pickPhotoTitle: "Photo access",
            pickPhotoDenied: "Allow photo library access to choose a profile picture.",
            uploadAvatarFail: "Could not upload the image. Check your connection and try again.",
            imagePickerNativeTitle: "Photo picker unavailable",
            imagePickerNativeHint:
              "Rebuild the native app with expo-image-picker linked. From apps/native run `npx expo run:ios` or `npx expo run:android`.",
            changePhotoA11y: "Change profile photo",
            proBadge: "PRO",
            streakLabel: "Streak",
          },
    [isJa]
  );

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!uid) {
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!alive) return;
        const data = snap.data() as
          | {
              displayName?: unknown;
              bio?: unknown;
              handle?: unknown;
              photoURL?: unknown;
              avatarUrl?: unknown;
              language?: unknown;
              countryCode?: unknown;
              plan?: unknown;
            }
          | undefined;
        const fromDoc =
          typeof data?.displayName === "string" ? data.displayName.trim() : "";
        const fromAuth = auth.currentUser?.displayName?.trim() ?? "";
        /** Web はヒーロー名にハンドルを使わない。Firestore が空のときは Auth の表示名を補う */
        setDisplayName(fromDoc || fromAuth);
        setBio(typeof data?.bio === "string" ? data.bio : "");
        setHandle(typeof data?.handle === "string" ? data.handle : "");
        const fromFirestorePhoto =
          typeof data?.photoURL === "string" && data.photoURL.trim().length > 0
            ? data.photoURL.trim()
            : typeof data?.avatarUrl === "string" && data.avatarUrl.trim().length > 0
              ? data.avatarUrl.trim()
              : "";
        const authPhoto = auth.currentUser?.photoURL?.trim() ?? "";
        setAvatarUrl(fromFirestorePhoto || authPhoto);
        setLanguage(data?.language === "en" ? "en" : "ja");
        setCountryCode(typeof data?.countryCode === "string" ? data.countryCode : "");
        setPlan(data?.plan === "pro" ? "pro" : "free");
      } finally {
        if (!alive) return;
        setProfileLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [uid]);

  /** expo-image-picker の base64 をバイナリに変換（uploadString より uploadBytes の方がルール検証と相性がよいことがある） */
  function base64ToUint8Array(b64: string): Uint8Array {
    const atobFn = (globalThis as { atob?: (data: string) => string }).atob;
    if (typeof atobFn !== "function") throw new Error("atob unavailable");
    const bin = atobFn(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff;
    return out;
  }

  /** ネイティブ未リンクの開発ビルドでは静的 import だと起動時に落ちるため、利用時のみ動的 import する */
  function isImagePickerNativeMissingError(e: unknown): boolean {
    const msg = e instanceof Error ? e.message : String(e);
    return /ExponentImagePicker|Cannot find native module/i.test(msg);
  }

  /** Web プロフィール編集と同様：ライブラリから選び Storage に置いて URL を state に反映 */
  async function pickAvatar() {
    if (!uid || uploadingAvatar || saving) return;
    let ImagePicker: typeof import("expo-image-picker");
    try {
      ImagePicker = await import("expo-image-picker");
    } catch (e: unknown) {
      if (isImagePickerNativeMissingError(e)) {
        Alert.alert(t.imagePickerNativeTitle, t.imagePickerNativeHint);
      } else {
        Alert.alert(t.saveErrorTitle, t.uploadAvatarFail);
      }
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t.pickPhotoTitle, t.pickPhotoDenied);
        return;
      }
      // iOS で allowsEditing + fetch().blob() の組み合わせが落ちることがあるため、
      // クロップは使わず base64 経由で Storage に送る（無ければ arrayBuffer にフォールバック）
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.75,
        base64: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      const uri = asset.uri;
      setUploadingAvatar(true);
      const fileRef = ref(storage, `avatars/${uid}/${Date.now()}_profile.jpg`);
      const contentType =
        asset.mimeType && asset.mimeType.startsWith("image/") ? asset.mimeType : "image/jpeg";

      if (asset.base64 && asset.base64.length > 0) {
        const bytes = base64ToUint8Array(asset.base64);
        if (bytes.byteLength === 0) throw new Error("empty image");
        await uploadBytes(fileRef, bytes, { contentType });
      } else {
        const res = await fetch(uri);
        const buf = await res.arrayBuffer();
        if (!buf || buf.byteLength === 0) throw new Error("empty image");
        await uploadBytes(fileRef, new Uint8Array(buf), { contentType });
      }
      const url = await getDownloadURL(fileRef);
      setAvatarUrl(url);
    } catch (e: unknown) {
      if (isImagePickerNativeMissingError(e)) {
        Alert.alert(t.imagePickerNativeTitle, t.imagePickerNativeHint);
      } else {
        const detail = e instanceof Error ? e.message : String(e);
        Alert.alert(t.saveErrorTitle, `${t.uploadAvatarFail}\n\n${detail}`);
      }
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    if (!uid || saving || uploadingAvatar) return;
    const safeName = displayName.trim();
    const safeBio = bio.trim();
    const safePhoto = avatarUrl.trim();
    if (safeName.length > 50) {
      Alert.alert(t.invalidTitle, t.invalidName);
      return;
    }
    setSaving(true);
    try {
      if (auth.currentUser && auth.currentUser.uid === uid) {
        await updateProfile(auth.currentUser, {
          displayName: safeName || null,
          photoURL: safePhoto || null,
        });
      }
      await setDoc(
        doc(db, "users", uid),
        {
          displayName: safeName,
          bio: safeBio,
          photoURL: safePhoto || null,
          language,
          countryCode: countryCode.trim() || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      onSaved?.();
      setSettingsOpen(false);
      setSaveSuccessToast({ title: t.savedTitle, body: t.savedBody });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t.saveErrorBody;
      Alert.alert(t.saveErrorTitle, msg);
    } finally {
      setSaving(false);
    }
  }

  const apiConfigured = apiBase != null;

  function renderTabs() {
    const items: { id: ProfileTab; label: string }[] = PROFILE_TAB_ORDER.map((id) => ({
      id,
      label: PROFILE_TAB_LABELS_EN[id],
    }));
    return (
      <View style={styles.tabBar}>
        <View style={styles.tabRow}>
          {items.map((item) => {
            const active = tab === item.id;
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.tabHit,
                  pressed && styles.tabHitPressed,
                ]}
                onPress={() => setTab(item.id)}
              >
                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                  maxFontSizeMultiplier={1.2}
                >
                  {item.label}
                </Text>
                {active ? <View style={styles.tabIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderOverview() {
    if (!apiConfigured) {
      return (
        <Text style={styles.warnText}>{t.apiMissing}</Text>
      );
    }
    if (statsBundle.loading) {
      return (
        <View style={styles.inlineLoading}>
          <BlocksPulseLoader pixelScale={0.9} />
        </View>
      );
    }
    if (statsBundle.error) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{statsBundle.error}</Text>
          <Text style={styles.warnText}>{t.apiMissing}</Text>
        </View>
      );
    }
    if (!statsBundle.overviewReady || !statsBundle.summary) {
      return (
        <View style={styles.inlineLoading}>
          <BlocksPulseLoader pixelScale={0.9} />
        </View>
      );
    }

    const entranceKey = `${uid ?? ""}-${statsBundle.summary.posts}-${proSummaryGridLayout ? "p" : "f"}`;

    return (
      <View style={styles.overviewBlock}>
        <ProfileOverviewEntranceBlock index={0} entranceKey={entranceKey}>
          <Text
            style={styles.playoffsHeading}
            maxFontSizeMultiplier={1.2}
          >
            {t.playoffsTitle}
          </Text>
          <View style={styles.summaryGridWrap}>
            <ProfileSummaryGridNative
              summary={statsBundle.summary}
              ranks={statsBundle.summaryRanks}
              maxStreak={maxStreak}
              language={language}
              proOverviewLayout={proSummaryGridLayout}
            />
          </View>
        </ProfileOverviewEntranceBlock>
        <View style={styles.chartGap} />
        <ProfileOverviewEntranceBlock index={1} entranceKey={entranceKey}>
          <ProfileDailyTrendChartNative
            key={`dailyTrend:${uid ?? ""}:${statsBundle.dailyTrend.map((r) => r.date).join(",")}`}
            data={statsBundle.dailyTrend}
            language={language}
            allowAll={currentIsProView}
          />
        </ProfileOverviewEntranceBlock>
        <View style={styles.chartGap} />
        <ProfileOverviewEntranceBlock index={2} entranceKey={entranceKey}>
          <ProfileRankTrendChartNative
            data={statsBundle.rankTrend}
            loading={false}
            language={language}
          />
        </ProfileOverviewEntranceBlock>
        <View style={styles.chartGap} />
        <ProfileOverviewEntranceBlock index={3} entranceKey={entranceKey}>
          <ProfileStreakTrackerNative
            points={streakBundle.points}
            loading={streakBundle.loading}
            language={language}
          />
        </ProfileOverviewEntranceBlock>
      </View>
    );
  }

  if (uid && profilePlanHook.isMe && profilePlanHook.loadingPlan) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.lg + bottomReserveY },
        ]}
      >
        <View style={styles.inlineLoading}>
          <BlocksPulseLoader />
        </View>
      </ScrollView>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: spacing.lg + bottomReserveY },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <UniterzBrandShelfNative horizontalBleed={spacing.sm} />

      <ProfileGridBackdrop style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroLeftCol}>
            <View style={styles.avatarHalo}>
              {avatarUrl.trim().length > 0 ? (
                <Image source={{ uri: avatarUrl.trim() }} style={styles.avatarCircle} />
              ) : (
                <View style={[styles.avatarCircle, styles.avatarFallback]}>
                  <Text style={styles.avatarLetter}>
                    {(
                      displayName.trim()[0] ??
                      fUser?.displayName?.trim()?.[0] ??
                      handle.trim()[0] ??
                      "?"
                    ).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.heroCenterCol}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName} numberOfLines={1}>
                {displayName.trim() || fUser?.displayName?.trim() || "—"}
              </Text>
              {currentIsProView ? (
                <View style={styles.proPill}>
                  <Text style={styles.proPillText}>{t.proBadge}</Text>
                </View>
              ) : null}
              {showStreakBadge ? (
                <View style={styles.streakPill}>
                  <Text style={styles.streakPillText}>
                    {t.streakLabel} {currentStreak}
                  </Text>
                </View>
              ) : null}
            </View>
            {secondaryIdLine.length > 0 ? (
              <Text style={styles.heroIdLine} numberOfLines={1}>
                {handle.trim().length > 0 ? `@${handle.trim()}` : secondaryIdLine}
              </Text>
            ) : null}
            {bio.trim().length > 0 ? (
              <Text style={styles.bioHero} numberOfLines={3}>
                {bio.trim()}
              </Text>
            ) : null}
            {profileLoading ? (
              <View style={styles.heroLoadingRow}>
                <BlocksPulseLoader pixelScale={0.65} labelStyle={styles.heroLoadingLabel} />
              </View>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [styles.menuSquare, pressed && styles.menuSquarePressed]}
            onPress={() => setMenuOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="menu" size={15} color="rgba(248,250,252,0.92)" />
            {menuUnreadCount > 0 ? (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>
                  {menuUnreadCount > 99 ? "99+" : String(menuUnreadCount)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {resolvedBadges.length > 0 ? (
          <View style={styles.badgeRow}>
            {resolvedBadges.slice(0, 10).map((b) => (
              <Pressable
                key={b.id}
                style={styles.badgeThumb}
                onPress={() => {
                  setSelectedBadge(b);
                  setBadgeModalOpen(true);
                }}
              >
                {b.icon ? (
                  <Image source={{ uri: b.icon }} style={styles.badgeImg} resizeMode="contain" />
                ) : (
                  <Text style={styles.badgeFallback} numberOfLines={2}>
                    {b.title}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ) : null}
      </ProfileGridBackdrop>

      {renderTabs()}

      {tab === "overview" ? (
        renderOverview()
      ) : tab === "bracket" ? (
        <ProfileBracketTabNative uid={uid} language={language} />
      ) : (
        <ProfileStatsTabNative
          uid={uid}
          language={language}
          isProView={currentIsProView}
          myPlan={profilePlanHook.myPlan}
          isMe={profilePlanHook.isMe}
          isMyPro={profilePlanHook.isMyPro}
          isTargetPro={profilePlanHook.isTargetPro}
          apiBase={apiBase}
          handle={handle}
        />
      )}
    </ScrollView>

    <Modal
      visible={settingsOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setSettingsOpen(false)}
      {...(Platform.OS === "ios" ? ({ presentationStyle: "overFullScreen" } as const) : {})}
    >
      <View style={styles.profileModalRoot}>
        <ProfileSettingsBackdropBlur />
        <View pointerEvents="none" style={styles.profileModalTint} />
        <SafeAreaView style={styles.profileModalSafe}>
          <KeyboardAvoidingView
            style={styles.profileModalFill}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.settingsClose}
              onPress={() => setSettingsOpen(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.profileFloatingClose,
                pressed && styles.profileFloatingClosePressed,
              ]}
            >
              <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
            </Pressable>
            <ScrollView
              style={styles.profileModalFill}
              contentContainerStyle={[
                styles.profileOverlayScrollContent,
                { paddingBottom: Math.max(bottomReserveY, 12) + 28 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.settingsNeonShell}>
                <Animated.View
                  pointerEvents="none"
                  style={[styles.settingsNeonSpinWrap, neonSpinStyle]}
                >
                  <LinearGradient
                    colors={[...SETTINGS_NEON_SPIN_COLORS]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
                <View style={styles.settingsNeonInner}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={["rgba(255,255,255,0.07)", "transparent"]}
                    style={styles.settingsNeonInnerTopSheen}
                  />
                  <View style={styles.settingsHeaderBlock}>
                    <Text style={styles.settingsTitle}>{t.settingsTitle}</Text>
                    <Text style={styles.settingsSubtitle}>{t.settingsSubtitle}</Text>
                  </View>

                  <View style={styles.settingsFormGap}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.changePhotoA11y}
                      onPress={() => void pickAvatar()}
                      disabled={uploadingAvatar || saving}
                      style={({ pressed }) => [
                        styles.avatarEditWrap,
                        pressed && styles.avatarEditWrapPressed,
                      ]}
                    >
                      <View style={styles.avatarEditCircle}>
                        {avatarUrl.trim().length > 0 ? (
                          <Image source={{ uri: avatarUrl.trim() }} style={styles.avatarEditImage} />
                        ) : (
                          <View style={[styles.avatarEditImage, styles.avatarEditFallback]}>
                            <Text style={styles.avatarEditLetter}>
                              {(
                                displayName.trim()[0] ??
                                fUser?.displayName?.trim()?.[0] ??
                                handle.trim()[0] ??
                                "?"
                              ).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.avatarEditRing} />
                      </View>
                      <View style={styles.avatarEditCameraFab}>
                        <MaterialCommunityIcons name="camera" size={14} color="#fff" />
                      </View>
                      {uploadingAvatar ? (
                        <View style={styles.avatarEditUploading}>
                          <ActivityIndicator color="rgba(248,250,252,0.95)" />
                        </View>
                      ) : null}
                    </Pressable>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{t.nameLabel}</Text>
                      <TextInput
                        value={displayName}
                        onChangeText={setDisplayName}
                        style={styles.fieldInput}
                        placeholder={t.namePlaceholder}
                        placeholderTextColor="rgba(255,255,255,0.38)"
                        maxLength={50}
                        editable={!saving && !uploadingAvatar}
                        keyboardAppearance="dark"
                      />
                    </View>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{t.bio}</Text>
                      <TextInput
                        value={bio}
                        onChangeText={setBio}
                        style={[styles.fieldInput, styles.bioInput]}
                        placeholder={t.bioPlaceholder}
                        placeholderTextColor="rgba(255,255,255,0.38)"
                        multiline
                        maxLength={280}
                        editable={!saving && !uploadingAvatar}
                        keyboardAppearance="dark"
                      />
                    </View>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{t.langLabel}</Text>
                      <Pressable
                        style={({ pressed }) => [styles.selectRow, pressed && styles.selectRowPressed]}
                        onPress={() => setLangModalOpen(true)}
                      >
                        <Text style={styles.selectRowText}>
                          {language === "ja" ? "日本語" : "English"}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={20}
                          color="rgba(226,232,240,0.65)"
                        />
                      </Pressable>
                    </View>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{t.countryLabel}</Text>
                      <Pressable
                        style={({ pressed }) => [styles.selectRow, pressed && styles.selectRowPressed]}
                        onPress={() => setCountryModalOpen(true)}
                      >
                        <Text style={styles.selectRowText} numberOfLines={1}>
                          {profileCountryRowLabel(countryCode, language)}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={20}
                          color="rgba(226,232,240,0.65)"
                        />
                      </Pressable>
                    </View>

                    <Pressable
                      style={[
                        styles.saveButton,
                        (saving || uploadingAvatar) && styles.buttonDisabled,
                      ]}
                      onPress={() => void handleSaveProfile()}
                      disabled={saving || uploadingAvatar}
                    >
                      <Text style={styles.saveText}>{saving ? t.saving : t.save}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>

    <Modal
      visible={langModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setLangModalOpen(false)}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdropFill} onPress={() => setLangModalOpen(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalSheetTitle}>{t.langLabel}</Text>
          <Pressable
            style={({ pressed }) => [styles.modalOption, pressed && styles.modalOptionPressed]}
            onPress={() => {
              setLanguage("ja");
              setLangModalOpen(false);
            }}
          >
            <Text style={styles.modalOptionText}>日本語</Text>
            {language === "ja" ? (
              <MaterialCommunityIcons name="check" size={18} color="rgba(147,197,253,0.95)" />
            ) : null}
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.modalOption, pressed && styles.modalOptionPressed]}
            onPress={() => {
              setLanguage("en");
              setLangModalOpen(false);
            }}
          >
            <Text style={styles.modalOptionText}>English</Text>
            {language === "en" ? (
              <MaterialCommunityIcons name="check" size={18} color="rgba(147,197,253,0.95)" />
            ) : null}
          </Pressable>
        </View>
      </View>
    </Modal>

    <Modal
      visible={countryModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setCountryModalOpen(false)}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdropFill} onPress={() => setCountryModalOpen(false)} />
        <View style={styles.modalSheetTall}>
          <Text style={styles.modalSheetTitle}>{t.countryLabel}</Text>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Pressable
              style={({ pressed }) => [styles.modalOption, pressed && styles.modalOptionPressed]}
              onPress={() => {
                setCountryCode("");
                setCountryModalOpen(false);
              }}
            >
              <Text style={styles.modalOptionText}>{t.countryNotSet}</Text>
              {!countryCode.trim() ? (
                <MaterialCommunityIcons name="check" size={18} color="rgba(147,197,253,0.95)" />
              ) : null}
            </Pressable>
            {COUNTRY_OPTIONS.map((c) => (
              <Pressable
                key={c.code}
                style={({ pressed }) => [styles.modalOption, pressed && styles.modalOptionPressed]}
                onPress={() => {
                  setCountryCode(c.code);
                  setCountryModalOpen(false);
                }}
              >
                <Text style={styles.modalOptionText}>
                  {language === "ja" ? c.labelJa : c.labelEn}
                </Text>
                {countryCode.trim() === c.code ? (
                  <MaterialCommunityIcons name="check" size={18} color="rgba(147,197,253,0.95)" />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>

    <ProfileSideMenuModal
      visible={menuOpen}
      onClose={() => setMenuOpen(false)}
      language={language}
      apiBase={apiBase}
      unreadAnnouncements={menuUnreadCount}
      uid={fUser?.uid ?? null}
      plan={plan}
      onOpenProfileSettings={() => {
        setMenuOpen(false);
        setSettingsOpen(true);
      }}
      onOpenInApp={(page) => {
        setMenuOpen(false);
        setMobileOverlay(page);
      }}
    />
    <ProfileMobileStackModal
      kind={mobileOverlay}
      onClose={() => setMobileOverlay(null)}
      onNavigate={(next) => setMobileOverlay(next)}
      language={language}
      uid={uid}
      authReady={status === "ready"}
      plan={plan}
      apiBase={apiBase}
      readIds={announcementReadIds}
    />
    <ProfileBadgeDetailModal
      visible={badgeModalOpen}
      badge={selectedBadge}
      language={language}
      onClose={() => {
        setBadgeModalOpen(false);
        setSelectedBadge(null);
      }}
    />
    <CyberGlassToastModal
      visible={saveSuccessToast != null}
      title={saveSuccessToast?.title ?? ""}
      message={saveSuccessToast?.body ?? ""}
      onDismiss={() => setSaveSuccessToast(null)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    flexGrow: 1,
  },
  hero: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(9,14,24,0.94)",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  heroLeftCol: {
    width: 50,
    alignItems: "center",
  },
  avatarHalo: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(56,189,248,0.55)",
    backgroundColor: "rgba(14,165,233,0.06)",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(34,211,238,0.45)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.85,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(30,41,59,0.95)",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroCenterCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  heroIdLine: {
    color: "rgba(148,163,184,0.92)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  bioHero: {
    color: "rgba(248,250,252,0.92)",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
    fontWeight: "500",
  },
  heroLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  /** ヒーロー内ローダーの英字ラベル（やや小さめ） */
  heroLoadingLabel: {
    fontSize: 9,
    letterSpacing: 0.32,
    color: "rgba(165,243,252,0.88)",
  },
  inlineLoading: {
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  menuSquare: {
    position: "relative",
    marginTop: 2,
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(15,21,38,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuSquarePressed: {
    backgroundColor: "rgba(25,35,55,0.96)",
  },
  menuBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(239,68,68,0.95)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.9)",
  },
  menuBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800" },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.md,
  },
  badgeThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(5,8,20,0.65)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeImg: { width: 52, height: 52 },
  badgeFallback: {
    color: "rgba(148,163,184,0.85)",
    fontSize: 9,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  avatarLetter: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    fontFamily: Platform.select({
      ios: "Oxanium_800ExtraBold",
      android: "Oxanium_800ExtraBold",
      default: "sans-serif",
    }),
  },
  nameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    flexShrink: 1,
    fontFamily: Platform.select({
      ios: "Oxanium_800ExtraBold",
      android: "Oxanium_800ExtraBold",
      default: "sans-serif",
    }),
  },
  proPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(124,92,255,0.35)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.45)",
  },
  proPillText: {
    color: "rgba(248,250,252,0.95)",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: Platform.select({
      ios: "BebasNeue_400Regular",
      android: "BebasNeue_400Regular",
      default: "sans-serif",
    }),
    letterSpacing: 1.2,
  },
  streakPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(251,146,60,0.22)",
    borderWidth: 1,
    borderColor: "rgba(253,186,116,0.45)",
  },
  streakPillText: {
    color: "rgba(255,237,213,0.95)",
    fontSize: 11,
    fontWeight: "700",
  },
  /** Web `Tabs.tsx`（size lg + `bracketMarketTeamTypography`）に寄せる：Bebas・tracking 0.06em 相当・下線 #6EA8FE */
  tabBar: {
    marginBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: 24,
  },
  tabHit: {
    position: "relative",
    paddingTop: 2,
    paddingBottom: 10,
  },
  tabHitPressed: {
    opacity: 0.85,
  },
  tabLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontWeight: "400",
    /** Web `tracking-[0.06em]` に比例（15px 時は約 0.9px） */
    letterSpacing: 0.9,
    fontFamily: Platform.select({
      ios: "BebasNeue_400Regular",
      android: "BebasNeue_400Regular",
      default: "sans-serif",
    }),
  },
  tabLabelActive: {
    color: "#ffffff",
  },
  tabIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -StyleSheet.hairlineWidth,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#6EA8FE",
  },
  playoffsHeading: {
    alignSelf: "stretch",
    textAlign: "center",
    color: "rgba(136,201,211,0.95)",
    fontSize: 22,
    /** Web `tracking-[0.12em]`（22px 時おおよそ 2.6）に近づけつつ少し詰める */
    letterSpacing: 2.5,
    marginBottom: spacing.md,
    fontFamily: Platform.select({
      ios: "BebasNeue_400Regular",
      android: "BebasNeue_400Regular",
      default: "sans-serif",
    }),
  },
  overviewBlock: {
    gap: 0,
  },
  /** チャートカードと同じ利用幅（scroll の横パディング内で常に 100%） */
  summaryGridWrap: {
    alignSelf: "stretch",
    width: "100%",
  },
  chartGap: { height: 12 },
  muted: {
    color: colors.textSecondary,
    fontSize: typography.body,
    paddingVertical: spacing.md,
  },
  warnText: {
    color: "rgba(251,191,36,0.9)",
    fontSize: typography.caption,
    lineHeight: 20,
    marginVertical: spacing.sm,
  },
  errorBox: {
    marginVertical: spacing.sm,
  },
  errorText: {
    color: "rgba(251,113,133,0.95)",
    fontSize: typography.body,
    marginBottom: 8,
  },
  placeholderText: {
    color: "rgba(148,163,184,0.9)",
    fontSize: typography.body,
    lineHeight: 22,
    paddingVertical: spacing.lg,
  },
  /** Web `main` + `FloatingCloseButton` + `SettingsNeonCard` に寄せたプロフィール編集 Modal */
  profileModalRoot: {
    flex: 1,
  },
  profileModalTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  profileModalSafe: {
    flex: 1,
  },
  profileModalFill: {
    flex: 1,
  },
  profileFloatingClose: {
    position: "absolute",
    top: 10,
    right: 12,
    zIndex: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(24,24,27,0.85)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  profileFloatingClosePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
  },
  profileOverlayScrollContent: {
    flexGrow: 1,
    /** 画面中央より下寄り（上パディング多めで重心を下げる） */
    justifyContent: "center",
    /** 横に余白を多めにしてカードを視覚的に小さく */
    paddingHorizontal: 22,
    paddingTop: 96,
    paddingBottom: 6,
    alignItems: "center",
    width: "100%",
  },
  /** Web `SettingsNeonCard` の shell + spin + inner */
  settingsNeonShell: {
    position: "relative",
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "center",
  },
  settingsNeonSpinWrap: {
    position: "absolute",
    width: "220%",
    height: "220%",
    left: "-60%",
    top: "-60%",
    zIndex: 0,
  },
  settingsNeonInner: {
    position: "relative",
    zIndex: 1,
    margin: 1,
    borderRadius: 15,
    backgroundColor: "hsl(240, 15%, 9%)",
    /** Web innerPad より一回り詰めてモバイルでコンパクトに */
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: "hidden",
  },
  settingsNeonInnerTopSheen: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 72,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  settingsHeaderBlock: {
    marginBottom: 16,
  },
  settingsTitle: {
    color: "rgba(248,250,252,0.96)",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  settingsSubtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 17,
  },
  settingsFormGap: {
    gap: 14,
  },
  avatarEditWrap: {
    position: "relative",
    alignSelf: "center",
    /** Web h-36(144) より一回り小さく */
    width: 108,
    height: 108,
    marginBottom: 2,
  },
  avatarEditWrapPressed: {
    opacity: 0.9,
  },
  avatarEditUploading: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 54,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  avatarEditImage: {
    width: "100%",
    height: "100%",
  },
  avatarEditFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditLetter: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: "800",
  },
  avatarEditRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: "rgba(0,0,0,0.4)",
  },
  avatarEditCameraFab: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  fieldBlock: {
    gap: 4,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  /** Web `border-white/15 bg-black/20 rounded-xl` に相当（モバイルはややコンパクト） */
  fieldInput: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.2)",
    color: colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bioInput: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  selectRow: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  selectRowPressed: {
    opacity: 0.92,
  },
  selectRowText: {
    flex: 1,
    minWidth: 0,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  /** Web `mt-2` + `shadow-blue-500/30` に寄せる */
  saveButton: {
    minHeight: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgb(59,130,246)",
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: "rgb(59,130,246)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  saveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalBackdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalSheet: {
    position: "relative",
    zIndex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,23,42,0.98)",
    paddingVertical: 8,
    overflow: "hidden",
  },
  modalSheetTall: {
    position: "relative",
    zIndex: 1,
    maxHeight: 480,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,23,42,0.98)",
    paddingVertical: 8,
    overflow: "hidden",
  },
  modalScroll: {
    maxHeight: 420,
  },
  modalSheetTitle: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "rgba(248,250,252,0.92)",
    fontSize: 14,
    fontWeight: "700",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  modalOptionPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modalOptionText: {
    flex: 1,
    color: "rgba(248,250,252,0.95)",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.84)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  logoutText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
