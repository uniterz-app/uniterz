import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
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
import {
  assertProfileTextsFreeOfGamblingTerms,
  isProfileGamblingTermsError,
  profileGamblingTermsUserMessage,
} from "../../../../../lib/profile/profileGamblingTerms";

type ProfileTab = "overview" | "bracket" | "stats";

/** Web `Tabs.tsx` と同一の英語ラベル */
const PROFILE_TAB_LABELS_EN: Record<ProfileTab, string> = {
  overview: "Overview",
  stats: "Pro Stats",
  bracket: "Bracket",
};

const PROFILE_TAB_ORDER: ProfileTab[] = ["overview", "stats", "bracket"];

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
  const [plan, setPlan] = useState<"free" | "pro">("free");

  const [saving, setSaving] = useState(false);

  const isJa = language === "ja";

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
            title: "PROFILE",
            displayName: "表示名",
            displayNamePlaceholder: "表示名を入力",
            bio: "自己紹介",
            bioPlaceholder: "自己紹介を入力",
            langLabel: "表示言語",
            save: "プロフィール保存",
            saving: "保存中…",
            account: "ログイン中アカウント",
            uid: "uid",
            logout: "ログアウト",
            invalidTitle: "入力不正",
            invalidName: "表示名は50文字以内で入力してください。",
            savedTitle: "保存完了",
            savedBody: "プロフィールを更新しました。",
            saveErrorTitle: "保存エラー",
            saveErrorBody: "プロフィール更新に失敗しました。",
            proBadge: "PRO",
            streakLabel: "連勝",
          }
        : {
            playoffsTitle: "2026 PLAYOFFS STATS",
            apiMissing:
              "Set EXPO_PUBLIC_UNITERZ_API_BASE_URL and run the Next.js app.",
            bracketSoon: "Playoff bracket view will match the web app in a future update.",
            statsSoon: "Pro analysis is available on the web app.",
            title: "PROFILE",
            displayName: "Display name",
            displayNamePlaceholder: "Enter display name",
            bio: "Bio",
            bioPlaceholder: "Enter bio",
            langLabel: "Language",
            save: "Save profile",
            saving: "Saving…",
            account: "Signed-in account",
            uid: "uid",
            logout: "Log out",
            invalidTitle: "Invalid input",
            invalidName: "Display name must be 50 characters or fewer.",
            savedTitle: "Saved",
            savedBody: "Profile has been updated.",
            saveErrorTitle: "Save error",
            saveErrorBody: "Failed to update profile.",
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
        const mergedAvatar =
          typeof data?.photoURL === "string" && data.photoURL.trim().length > 0
            ? data.photoURL
            : typeof data?.avatarUrl === "string"
              ? data.avatarUrl
              : "";
        setAvatarUrl(mergedAvatar);
        setLanguage(data?.language === "en" ? "en" : "ja");
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

  async function handleSaveProfile() {
    if (!uid || saving) return;
    const safeName = displayName.trim();
    const safeBio = bio.trim();
    if (safeName.length > 50) {
      Alert.alert(t.invalidTitle, t.invalidName);
      return;
    }
    try {
      assertProfileTextsFreeOfGamblingTerms(safeName, safeBio);
    } catch (e: unknown) {
      if (!isProfileGamblingTermsError(e)) throw e;
      Alert.alert(t.invalidTitle, profileGamblingTermsUserMessage(language));
      return;
    }
    setSaving(true);
    try {
      if (auth.currentUser && auth.currentUser.uid === uid) {
        await updateProfile(auth.currentUser, { displayName: safeName || null });
      }
      await setDoc(
        doc(db, "users", uid),
        {
          displayName: safeName,
          bio: safeBio,
          language,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      onSaved?.();
      Alert.alert(t.savedTitle, t.savedBody);
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

      {settingsOpen ? (
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>{t.title}</Text>

          <Text style={styles.body}>{t.displayName}</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            style={styles.input}
            placeholder={t.displayNamePlaceholder}
            placeholderTextColor={colors.textSecondary}
            maxLength={50}
          />
          <Text style={styles.metaText}>{displayName.length}/50</Text>

          <Text style={styles.body}>{t.bio}</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            style={[styles.input, styles.bioInput]}
            placeholder={t.bioPlaceholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={280}
          />
          <Text style={styles.metaText}>{bio.length}/280</Text>

          <Text style={styles.body}>{t.langLabel}</Text>
          <View style={styles.languageRow}>
            <Pressable
              style={[
                styles.languageChip,
                language === "ja" && styles.languageChipActive,
              ]}
              onPress={() => setLanguage("ja")}
            >
              <Text style={styles.languageChipText}>日本語</Text>
            </Pressable>
            <Pressable
              style={[
                styles.languageChip,
                language === "en" && styles.languageChipActive,
              ]}
              onPress={() => setLanguage("en")}
            >
              <Text style={styles.languageChipText}>English</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={() => void handleSaveProfile()}
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? t.saving : t.save}</Text>
          </Pressable>

          <Text style={styles.body}>{t.account}</Text>
          <Text style={styles.value}>{fUser?.email ?? "-"}</Text>
          <Text style={styles.body}>{t.uid}</Text>
          <Text style={styles.value}>{fUser?.uid ?? "-"}</Text>

        </View>
      ) : null}
    </ScrollView>
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
  settingsCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#0b1120",
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 11,
    alignSelf: "flex-end",
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.86)",
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bioInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  languageRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  languageChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,21,38,0.84)",
  },
  languageChipActive: {
    borderColor: "rgba(103,232,249,0.46)",
    backgroundColor: "rgba(124,92,255,0.22)",
  },
  languageChipText: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  saveButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(45,99,235,0.92)",
    marginTop: spacing.sm,
  },
  saveText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "700",
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
