import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  CommonActions,
  StackActions,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
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
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../lib/firebase";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { useNativeProfileStats, seedNativeProfileStatsFromUserDoc } from "./useNativeProfileStats";
import {
  invalidateProfileUserDocNative,
  loadProfileUserDocNative,
  peekProfileUserDocNative,
} from "./profileUserDocCacheNative";
import { useNativeProfileDailyTrendChart } from "./useNativeProfileDailyTrendChart";
import { useNativeStreakTracker } from "./useNativeStreakTracker";
import {
  resolveAndExpireMyPlan,
  useNativeProfilePlan,
} from "./useNativeProfilePlan";
import { useNativeAnnouncementsUnread } from "./useNativeAnnouncementsUnread";
import { useNativeAdminInboxUnread } from "./useNativeAdminInboxUnread";
import { useIsAdminNative } from "../admin/useIsAdminNative";
import { useNativeProfileBadges, type ResolvedBadgeNative } from "./useNativeProfileBadges";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import ProfileKinetikHeroNative from "./kinetik/ProfileKinetikHeroNative";
import ProfileSideMenuModal from "./ProfileSideMenuModal";
import ProfileMenuEdgeHandleNative from "./ProfileMenuEdgeHandleNative";
import ProfileBackEdgeHandleNative from "./ProfileBackEdgeHandleNative";
import ProfileBadgeDetailModal from "./ProfileBadgeDetailModal";
import ProfileMarkListOverlayNative from "./ProfileMarkListOverlayNative";
import { useProfileMarksNative } from "./useProfileMarksNative";
import { maxMarksForPlan } from "../../../../../lib/marks/markTypes";
import { useNativeUserPlan } from "../../hooks/useNativeUserPlan";
import { navigateToPublicProfileNative } from "../../navigation/navigateToPublicProfileNative";
import { CyberSubpageHeaderNative } from "../../ui/CyberSubpageShellNative";
import type { MainTabParamList, ProfileStackParamList } from "../../navigation/types";
import GamesPageBackgroundNative from "../background/GamesPageBackgroundNative";
import { APP_MESH_BG_FALLBACK } from "../../../../../lib/app/appMeshBackground";
import SlantCtaNative from "../../ui/SlantCtaNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../rankings/CyberSlantedTabNative";
import ProfileAwardsTabNative from "./ProfileAwardsTabNative";
import ProfileBracketTabNative from "./ProfileBracketTabNative";
import ProfileStatsTabNative from "./ProfileStatsTabNative";
import ProfileReportDeliveryOverlayNative from "./reports/ProfileReportDeliveryOverlayNative";
import ProfileProSkinUnlockOverlayNative from "./reports/ProfileProSkinUnlockOverlayNative";
import { useProReportDeliveryOverlayNative } from "./reports/useProReportDeliveryOverlayNative";
import { useProSkinUnlockOverlayNative } from "./reports/useProSkinUnlockOverlayNative";
import { useNativeProfileByHandle } from "./useNativeProfileByHandle";
import ProfileOverviewSectionNative from "./ProfileOverviewSectionNative";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import {
  assertProfileTextsFreeOfGamblingTerms,
  isProfileGamblingTermsError,
  profileGamblingTermsUserMessage,
} from "../../../../../lib/profile/profileGamblingTerms";
import { COUNTRY_OPTIONS } from "../../../../../lib/rankings/country";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import { parseUserProfileViewCount, parseUserUnitBalance } from "../../../../../lib/profile/parseUserProfileFields";
import { parseUserPlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariantField";
import { currentSeasonWinStreak } from "../../../../../lib/profile/currentSeasonWinStreak";
import {
  PROFILE_PLAN_PRO_BG_DEFAULT,
  type ProfilePlanProBgVariant,
} from "../../../../../lib/profile/profilePlanProBgVariants";
import { peekOwnProfileSeedNative, seedOwnProfileFromUserDocNative } from "./seedOwnProfileFromUserDocNative";
import { hydrateMarksFromUserDoc } from "./marksFirestoreNative";
import TutorialLiveHostNative from "../tutorial/TutorialLiveHostNative";
import TutorialWelcomeWorldCameraNative from "../tutorial/TutorialWelcomeWorldCameraNative";
import TutorialLiveCoachNative from "../tutorial/TutorialLiveCoachNative";
import {
  readTutorialLivePhaseNative,
  writeTutorialLivePhaseNative,
} from "../tutorial/tutorialLivePhaseNative";
import { setTutorialLiveTrackNative } from "../tutorial/tutorialLiveTrackNative";
import { setTutorialHorizonSubstepNative } from "../tutorial/tutorialHorizonSubstepNative";
import {
  getTutorialWelcomeHandoffNative,
  hydrateTutorialWelcomeHandoffNative,
  setTutorialWelcomeHandoffNative,
} from "../tutorial/tutorialWelcomeHandoffNative";
import { markAppTutorialSeenNative } from "../tutorial/tutorialSeenNative";
import { clearTutorialLivePickNative } from "../tutorial/tutorialLivePickNative";
import { requestTutorialClearedNative } from "../tutorial/tutorialRestartEventsNative";
import { setTutorialWelcomeAudienceNative } from "../tutorial/tutorialWelcomeAudienceNative";
import { tutorialSkipConfirmProps } from "../../../../../lib/tutorial/tutorialSkipConfirmProps";
import { t as i18nT } from "../../../../../lib/i18n/t";
import type { Language } from "../../../../../lib/i18n/language";
import { TUTORIAL_WELCOME_LAND_HOLD_MS } from "../../../../../lib/tutorial/tutorialMotion";
import { setTutorialRestartCover } from "../../../../../lib/tutorial/tutorialRestartCover";
import {
  fetchProfileViewCountNative,
  recordProfileViewNative,
} from "./profileViewsApiNative";
import {
  peekProfileViewCountMemory,
  setProfileViewCountMemory,
} from "../../../../../lib/profile/profileViewCountMemory";

type ProfileTab = "overview" | "report" | "awards" | "bracket";

/** Web `Tabs.tsx` / CyberSlantedTab と同一の英語ラベル */
const PROFILE_TAB_LABELS_EN: Record<ProfileTab, string> = {
  overview: "OVERVIEW",
  report: "REPORT",
  awards: "AWARDS",
  bracket: "BRACKET",
};

const PROFILE_TAB_ORDER: ProfileTab[] = [
  "overview",
  "report",
  "awards",
  "bracket",
];

function profileCountryRowLabel(code: string, appLang: "ja" | "en"): string {
  const trimmed = code.trim();
  if (!trimmed) return appLang === "ja" ? "未設定" : "Not set";
  const row = COUNTRY_OPTIONS.find((c) => c.code === trimmed);
  return row ? (appLang === "ja" ? row.labelJa : row.labelEn) : trimmed;
}

export default function ProfileHomeScreen({
  bottomReserveY = 0,
  onSaved,
  routeHandle,
  fromRankings = false,
  fromLeaderboards = false,
  fromWeeklyReport = false,
  fromResultDetail = false,
  fromMarkList = false,
  resultDetailPostId,
  leaderboardsGroupId,
  openSettingsOnMount = false,
  openReportTabOnMount = false,
  openMarkListOnMount = false,
}: {
  bottomReserveY?: number;
  onSaved?: () => void;
  /** 他人プロフィール閲覧用（handle または uid） */
  routeHandle?: string;
  /** ランキングから遷移してきた他人プロフィール */
  fromRankings?: boolean;
  /** グループ（Leaderboards タブ）から遷移してきた他人プロフィール */
  fromLeaderboards?: boolean;
  /** 週次レポートのライバルから遷移してきた他人プロフィール */
  fromWeeklyReport?: boolean;
  /** リザルト詳細から遷移してきた他人プロフィール */
  fromResultDetail?: boolean;
  /** MARK LIST から遷移してきた他人プロフィール */
  fromMarkList?: boolean;
  /** リザルト詳細へ戻るときの投稿 ID */
  resultDetailPostId?: string;
  leaderboardsGroupId?: string;
  openSettingsOnMount?: boolean;
  openReportTabOnMount?: boolean;
  openMarkListOnMount?: boolean;
}) {
  const { fUser, status } = useFirebaseUser();
  const myUid = fUser?.uid;
  const { isPro: myIsPro } = useNativeUserPlan(myUid);
  const maxMarks = maxMarksForPlan(myIsPro);
  const {
    marks: markRows,
    loading: marksLoading,
    markCount,
    markedByCount,
    isMarked,
    addMark,
    removeMark,
  } = useProfileMarksNative(myUid, maxMarks);
  const publicRouteKey = routeHandle?.trim() ?? "";
  const isPublicProfileView = publicRouteKey.length > 0;
  const profileByHandle = useNativeProfileByHandle(
    isPublicProfileView ? publicRouteKey : null
  );
  const targetUid = isPublicProfileView ? profileByHandle.targetUid ?? undefined : myUid;
  const apiBase = getUniterzApiBaseUrl();

  const [tab, setTab] = useState<ProfileTab>("overview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** メニューへ戻るときは fade せず即閉じる */
  const [settingsAnim, setSettingsAnim] = useState<"fade" | "none">("fade");
  const [menuOpen, setMenuOpen] = useState(false);
  const [markListOpen, setMarkListOpen] = useState(false);
  const [welcomeFlyActive, setWelcomeFlyActive] = useState(
    () =>
      !isPublicProfileView &&
      getTutorialWelcomeHandoffNative() === "profile"
  );
  const [welcomeFlying, setWelcomeFlying] = useState(false);
  const welcomeFlyDoneRef = useRef(false);
  const welcomeLandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  /** 設定 Modal を閉じたあとサイドメニューを開く（iOS は onDismiss 待ち） */
  const reopenMenuAfterSettingsRef = useRef(false);
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { topContentPadY } = useBottomTabBarInsets();
  const showExternalBack =
    isPublicProfileView &&
    (fromRankings ||
      fromLeaderboards ||
      fromWeeklyReport ||
      fromResultDetail ||
      fromMarkList);

  const dismissPublicProfileRoute = useCallback(() => {
    const state = navigation.getState();
    const current = state.routes[state.index]?.name;
    if (current === "PublicProfile") {
      // ランキングから nested navigate すると PublicProfile だけがスタックに
      // 残ることがあり、その場合 pop / popToTop は失敗する。
      if (state.index > 0) {
        navigation.dispatch(StackActions.pop(state.index));
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "ProfileHome" }],
          })
        );
      }
      return;
    }
    navigation.setParams({
      handle: undefined,
      fromRankings: undefined,
      fromLeaderboards: undefined,
      fromWeeklyReport: undefined,
      fromResultDetail: undefined,
      fromMarkList: undefined,
      resultDetailPostId: undefined,
      leaderboardsGroupId: undefined,
    });
  }, [navigation]);

  /** iOS は Modal 同時表示不可。閉じ完了（onDismiss）後にメニューを開く */
  const openMenuAfterSettingsClosed = useCallback(() => {
    if (!reopenMenuAfterSettingsRef.current) return;
    reopenMenuAfterSettingsRef.current = false;
    setSettingsAnim("fade");
    setMenuOpen(true);
  }, []);

  const returnFromSettingsToMenu = useCallback(() => {
    setLangModalOpen(false);
    setCountryModalOpen(false);
    reopenMenuAfterSettingsRef.current = true;
    setSettingsAnim("none");
    // animationType を none に切り替えてから閉じる
    requestAnimationFrame(() => {
      setSettingsOpen(false);
      // Android は onDismiss が無いのでここで再開
      if (Platform.OS !== "ios") {
        setTimeout(() => openMenuAfterSettingsClosed(), 50);
      }
    });
  }, [openMenuAfterSettingsClosed]);

  const openSettingsFromMenu = useCallback(() => {
    reopenMenuAfterSettingsRef.current = false;
    setMenuOpen(false);
    // メニュー Modal が閉じたあと設定を開く
    const delay = Platform.OS === "ios" ? 320 : 60;
    setTimeout(() => {
      setSettingsAnim("fade");
      setSettingsOpen(true);
    }, delay);
  }, []);

  // iOS onDismiss が発火しない場合のフォールバック
  useEffect(() => {
    if (settingsOpen) return;
    if (!reopenMenuAfterSettingsRef.current) return;
    const id = setTimeout(() => {
      openMenuAfterSettingsClosed();
    }, Platform.OS === "ios" ? 380 : 0);
    return () => clearTimeout(id);
  }, [settingsOpen, openMenuAfterSettingsClosed]);

  const returnToPreviousScreen = useCallback(() => {
    if (fromMarkList) {
      if (navigation.canGoBack()) {
        navigation.navigate("ProfileHome", { openMarkList: true });
        return;
      }
      tabNavigation.navigate("ProfileTab", {
        screen: "ProfileHome",
        params: { openMarkList: true },
      });
      return;
    }
    if (fromResultDetail) {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
      const id = resultDetailPostId?.trim();
      tabNavigation.navigate("ResultTab", {
        screen: "ResultHome",
        params: id ? { reopenDetailPostId: id } : undefined,
      });
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (fromWeeklyReport) {
      dismissPublicProfileRoute();
      return;
    }
    if (fromLeaderboards) {
      const groupId = leaderboardsGroupId?.trim();
      tabNavigation.navigate("LeaderboardsTab", {
        screen: "LeaderboardsHome",
        params: groupId ? { reopenGroupId: groupId } : undefined,
      });
      return;
    }
    tabNavigation.navigate("RankingsTab", { screen: "RankingsHome" });
  }, [
    dismissPublicProfileRoute,
    fromLeaderboards,
    fromMarkList,
    fromResultDetail,
    fromWeeklyReport,
    leaderboardsGroupId,
    navigation,
    resultDetailPostId,
    tabNavigation,
  ]);

  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ResolvedBadgeNative | null>(null);

  /** Games 起動時 prefetch 済みなら、1 フレーム目から完成形のカードを出す */
  const ownSeedAtMount = useMemo(() => {
    if (isPublicProfileView) return null;
    return peekOwnProfileSeedNative(myUid);
  }, [isPublicProfileView, myUid]);

  const [profileLoading, setProfileLoading] = useState(
    () => !isPublicProfileView && !ownSeedAtMount
  );
  const [displayName, setDisplayName] = useState(
    () => ownSeedAtMount?.displayName ?? ""
  );
  const [bio, setBio] = useState(() => ownSeedAtMount?.bio ?? "");
  const [handle, setHandle] = useState(() => ownSeedAtMount?.handle ?? "");
  const [avatarUrl, setAvatarUrl] = useState(
    () => ownSeedAtMount?.avatarUrl ?? ""
  );
  const [language, setLanguage] = useState<"ja" | "en">(
    () => ownSeedAtMount?.language ?? "ja"
  );
  const [countryCode, setCountryCode] = useState(
    () => ownSeedAtMount?.countryCode ?? ""
  );
  const [plan, setPlan] = useState<"free" | "pro">(
    () => ownSeedAtMount?.plan ?? "free"
  );
  const [planProBgVariant, setPlanProBgVariant] =
    useState<ProfilePlanProBgVariant>(
      () => ownSeedAtMount?.planProBgVariant ?? PROFILE_PLAN_PRO_BG_DEFAULT
    );
  const [memberSinceMs, setMemberSinceMs] = useState<number | null>(
    () => ownSeedAtMount?.memberSinceMs ?? null
  );
  /** null = 未読込（獲得演出の誤発火防止） */
  const [unitBalance, setUnitBalance] = useState<number | null>(
    () => (ownSeedAtMount ? ownSeedAtMount.unitBalance : null)
  );

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  /** プロフィール保存成功 — システム Alert の代わりにサイバーガラストースト */
  const isJa = language === "ja";

  const externalBackLabel = fromMarkList
    ? isJa
      ? "マークリストに戻る"
      : "Back to MARK LIST"
    : isJa
      ? "戻る"
      : "Back";

  const renderProfileBackHandle = () =>
    showExternalBack ? (
      <ProfileBackEdgeHandleNative
        onPress={returnToPreviousScreen}
        accessibilityLabel={externalBackLabel}
      />
    ) : null;

  /** 自分プロフィールは routeHandle 無し。plan hook の getDoc より先に確定できる */
  const isMe = !isPublicProfileView && !!myUid && myUid === targetUid;
  const targetMarked = isMarked(targetUid);
  const onPressMark = useCallback(async () => {
    if (!myUid) return;
    const otherUid = targetUid?.trim() ?? "";
    if (isMe || otherUid === myUid) {
      setMenuOpen(false);
      setMarkListOpen(true);
      return;
    }
    if (!otherUid) {
      cyberAlert(
        "",
        isJa
          ? "プロフィールの読み込みを待ってから、もう一度押してください"
          : "Wait for the profile to load, then try again"
      );
      return;
    }
    if (isMarked(otherUid)) {
      const result = await removeMark(otherUid);
      if (result && "ok" in result && !result.ok) {
        cyberAlert("", isJa ? "マークを外せませんでした" : "Could not unmark");
      }
      return;
    }
    const markedName = displayName.trim() || handle.trim() || "User";
    const result = await addMark({
      targetUid: otherUid,
      handle: handle.trim(),
      displayName: markedName,
      photoURL: avatarUrl.trim() || null,
    });
    if (!result.ok) {
      const msg =
        result.error === "cap"
          ? isJa
            ? myIsPro
              ? `マークは ${maxMarks} 人までです`
              : `マークは ${maxMarks} 人までです（Pro は 50 人）`
            : myIsPro
              ? `You can MARK up to ${maxMarks} predictors`
              : `You can MARK up to ${maxMarks} predictors (Pro: 50)`
          : result.error === "empty"
            ? isJa
              ? "プロフィールの読み込みを待ってから、もう一度押してください"
              : "Wait for the profile to load, then try again"
            : isJa
              ? "マークできませんでした"
              : "Could not MARK this predictor";
      cyberAlert("", msg);
      return;
    }
    cyberAlert(
      isJa ? "マークしました" : "MARKED",
      isJa
        ? `${markedName} をマークリストに追加しました`
        : `${markedName} was added to your MARK list`,
      [
        {
          text: isJa ? "リストを見る" : "View list",
          onPress: () => setMarkListOpen(true),
        },
        { text: "OK", style: "cancel" },
      ],
      { variant: "success" }
    );
  }, [
    addMark,
    avatarUrl,
    displayName,
    handle,
    isJa,
    isMe,
    isMarked,
    maxMarks,
    myIsPro,
    myUid,
    removeMark,
    targetUid,
  ]);
  const [myPlanReady, setMyPlanReady] = useState(() => !!ownSeedAtMount);
  /** users/{uid} — Pro Skin overlay 等への共有（重複 read 回避） */
  const [myUserDoc, setMyUserDoc] = useState<
    Record<string, unknown> | null | undefined
  >(() => {
    if (isPublicProfileView || !myUid) return undefined;
    return peekProfileUserDocNative(myUid);
  });
  const profilePlanHook = useNativeProfilePlan({
    targetUid: targetUid ?? null,
    profilePlan: plan,
    myPlanOverride: plan,
    myPlanOverrideReady: isMe ? myPlanReady : false,
    deferOwnFetch: isMe,
  });
  const [profileViewCount, setProfileViewCount] = useState<number | null>(() =>
    ownSeedAtMount?.profileViewCount ??
    (targetUid ? peekProfileViewCountMemory(targetUid) : null)
  );

  useEffect(() => {
    let cancelled = false;
    if (status !== "ready" || !targetUid) {
      if (!targetUid) setProfileViewCount(null);
      return;
    }

    if (!isPublicProfileView && myUserDoc === undefined) return;

    const denorm = isPublicProfileView
      ? profileByHandle.profileViewCount
      : parseUserProfileViewCount(myUserDoc);

    if (denorm != null) {
      setProfileViewCountMemory(targetUid, denorm);
      setProfileViewCount(denorm);
      if (myUid && !isMe) {
        void recordProfileViewNative(targetUid)
          .then((counted) => {
            if (!counted) return;
            setProfileViewCount((prev) => {
              const count = (prev ?? denorm) + 1;
              setProfileViewCountMemory(targetUid, count);
              return count;
            });
          })
          .catch(() => undefined);
      }
      return;
    }

    const cached = peekProfileViewCountMemory(targetUid);
    setProfileViewCount(cached);

    void (async () => {
      try {
        if (myUid && !isMe) {
          void recordProfileViewNative(targetUid).catch(() => undefined);
        }
        const count = await fetchProfileViewCountNative(targetUid);
        setProfileViewCountMemory(targetUid, count);
        if (!cancelled) setProfileViewCount(count);
      } catch {
        // 閲覧数取得の失敗でプロフィール表示を壊さない。
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isMe,
    isPublicProfileView,
    myUid,
    myUserDoc,
    profileByHandle.profileViewCount,
    status,
    targetUid,
  ]);

  useEffect(() => {
    if (openSettingsOnMount && isMe) {
      setSettingsOpen(true);
    }
  }, [openSettingsOnMount, isMe]);

  useEffect(() => {
    if (openReportTabOnMount && isMe) {
      setTab("report");
    }
  }, [openReportTabOnMount, isMe]);

  useEffect(() => {
    if (!openMarkListOnMount || isPublicProfileView) return;
    setMarkListOpen(true);
    navigation.setParams({ openMarkList: undefined });
  }, [isPublicProfileView, navigation, openMarkListOnMount]);

  const { unreadCount: menuUnreadCount, readIds: announcementReadIds } =
    useNativeAnnouncementsUnread(myUid, status === "ready" && !!myUid, {
      enabled: isMe,
    });
  const { isAdmin: isAdminUser } = useIsAdminNative();
  const adminInbox = useNativeAdminInboxUnread(Boolean(isMe && isAdminUser));
  const { resolvedBadges } = useNativeProfileBadges(isMe ? myUid : targetUid);

  /** プロフィールは NBA のみ（W杯経路は使わない） */
  const profileStatsContext = useMemo<ProfileStatsStreakContext>(
    () => ({ rankingLeague: "nba" }),
    []
  );

  const authReady = status === "ready";

  const statsBundle = useNativeProfileStats(
    targetUid,
    !!targetUid,
    profileStatsContext,
    authReady
  );

  useEffect(() => {
    if (isPublicProfileView || !myUid || myUserDoc == null) return;
    seedNativeProfileStatsFromUserDoc(myUid, myUserDoc);
  }, [isPublicProfileView, myUid, myUserDoc]);
  const dailyTrendChart = useNativeProfileDailyTrendChart(targetUid, {
    enabled: tab === "overview" && !!targetUid && authReady,
    seedRows: statsBundle.dailyTrend,
    seedComplete: !statsBundle.dailyTrendLoading,
    deferIndependentFetch: statsBundle.dailyTrendLoading,
    rankingLeague: profileStatsContext.rankingLeague,
    wcStage: profileStatsContext.wcStage,
    nbaPeriod: "season",
    authReady,
  });
  const streakBundle = useNativeStreakTracker(
    targetUid,
    tab === "overview" && !!targetUid && authReady,
    profileStatsContext,
    { seedLast20: statsBundle.loading ? undefined : statsBundle.last20 }
  );

  const currentIsProView = profilePlanHook.isProView;
  const reportOverlayEnabled =
    isMe &&
    myPlanReady &&
    (currentIsProView || profilePlanHook.myPlan === "pro");
  const { active: reportOverlay, dismiss: dismissReportOverlay } =
    useProReportDeliveryOverlayNative({
      uid: myUid,
      enabled: reportOverlayEnabled,
    });
  const skinUnlockEnabled = Boolean(isMe && myUid) && reportOverlay == null;

  const tutorialCopy = useMemo(
    () => i18nT((language === "en" ? "en" : "ja") as Language),
    [language]
  );
  const tutorialSkipConfirm = tutorialSkipConfirmProps(tutorialCopy.tutorial);

  const finishWelcomeSkip = useCallback(() => {
    void markAppTutorialSeenNative(myUid ?? null);
    void writeTutorialLivePhaseNative(null);
    setTutorialLiveTrackNative(null);
    setTutorialWelcomeHandoffNative(null);
    setTutorialWelcomeAudienceNative(null);
    void clearTutorialLivePickNative();
    setWelcomeFlyActive(false);
    setWelcomeFlying(false);
    requestTutorialClearedNative();
  }, [myUid]);

  const startWelcomeFly = useCallback(() => {
    setWelcomeFlying(true);
  }, []);

  const goWelcomeFeaturesHorizon = useCallback(() => {
    if (welcomeFlyDoneRef.current) return;
    welcomeFlyDoneRef.current = true;
    if (welcomeLandTimerRef.current != null) {
      clearTimeout(welcomeLandTimerRef.current);
    }
    welcomeLandTimerRef.current = setTimeout(() => {
      setTutorialWelcomeHandoffNative(null);
      setTutorialLiveTrackNative("features");
      setTutorialHorizonSubstepNative(0);
      void writeTutorialLivePhaseNative("horizon");
      setWelcomeFlyActive(false);
      setWelcomeFlying(false);
    }, TUTORIAL_WELCOME_LAND_HOLD_MS);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const memOn =
        !isPublicProfileView &&
        getTutorialWelcomeHandoffNative() === "profile";
      if (memOn) setWelcomeFlyActive(true);
      void (async () => {
        await hydrateTutorialWelcomeHandoffNative();
        const phase = await readTutorialLivePhaseNative();
        if (cancelled) return;
        const on =
          !isPublicProfileView &&
          phase === "welcome" &&
          getTutorialWelcomeHandoffNative() === "profile";
        setWelcomeFlyActive(on);
        if (!on) setWelcomeFlying(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [isPublicProfileView])
  );
  const {
    activeIds: skinUnlockIds,
    ownerCounts: skinUnlockOwnerCounts,
    preview: skinUnlockPreview,
    dismiss: dismissSkinUnlock,
  } = useProSkinUnlockOverlayNative({
    uid: myUid,
    enabled: skinUnlockEnabled,
    userDoc: isMe ? myUserDoc : null,
  });

  const currentStreak = useMemo(() => {
    if (isPublicProfileView) {
      return profileByHandle.currentStreak;
    }
    const fromSummary = statsBundle.summary?.activeWinStreak;
    if (typeof fromSummary === "number" && Number.isFinite(fromSummary)) {
      return Math.max(0, Math.floor(fromSummary));
    }
    const st = statsBundle.stats as Record<string, unknown> | null;
    if (st != null) {
      return currentSeasonWinStreak(
        st.currentStreak ?? st.activeWinStreak,
        st.streakSeasonKeyBasketball
      );
    }
    return 0;
  }, [
    isPublicProfileView,
    profileByHandle.currentStreak,
    statsBundle.summary?.activeWinStreak,
    statsBundle.stats,
  ]);

  /** Web ヒーロー2行目に近づける：ハンドル優先、無ければメール（UID の一部は誤解を招くので避ける） */
  const secondaryIdLine =
    handle.trim() || fUser?.email?.trim() || fUser?.uid?.slice(0, 12) || "";

  const t = useMemo(
    () =>
      isJa
        ? {
            playoffsTitle: "2026 NBA PLAYOFFS STATS",
            apiMissing:
              "EXPO_PUBLIC_UNITERZ_API_BASE_URL を .env に設定し、Next.js を起動してください。",
            bracketSoon:
              "プレーオフブラケットは Web 版と同様の表示を順次対応します。",
            statsSoon: "詳細分析（Pro）は Web 版でご利用いただけます。",
            settingsTitle: "プロフィール設定",
            settingsSubtitle: "アイコン・名前・自己紹介・使用言語・国を編集できます",
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
            playoffsTitle: "2026 NBA PLAYOFFS STATS",
            apiMissing:
              "Set EXPO_PUBLIC_UNITERZ_API_BASE_URL and run the Next.js app.",
            bracketSoon: "Playoff bracket view will match the web app in a future update.",
            statsSoon: "Pro analysis is available on the web app.",
            settingsTitle: "Profile Settings",
            settingsSubtitle: "Edit your icon, name, bio, language, and country.",
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
    if (isPublicProfileView) return;
    let alive = true;
    async function load() {
      if (!myUid) {
        setProfileLoading(false);
        setMyPlanReady(true);
        setMyUserDoc(null);
        return;
      }

      const warm = peekOwnProfileSeedNative(myUid);
      if (warm) {
        setMyUserDoc(warm.data);
        setDisplayName(warm.displayName);
        setBio(warm.bio);
        setHandle(warm.handle);
        setAvatarUrl(warm.avatarUrl);
        setLanguage(warm.language);
        setCountryCode(warm.countryCode);
        setPlan(warm.plan);
        setPlanProBgVariant(warm.planProBgVariant);
        setMemberSinceMs(warm.memberSinceMs);
        setUnitBalance(warm.unitBalance);
        if (warm.profileViewCount != null) {
          setProfileViewCountMemory(myUid, warm.profileViewCount);
          setProfileViewCount(warm.profileViewCount);
        }
        seedNativeProfileStatsFromUserDoc(myUid, warm.data);
        hydrateMarksFromUserDoc(myUid, warm.data);
        setProfileLoading(false);
        setMyPlanReady(true);
      } else {
        setProfileLoading(true);
        setMyPlanReady(false);
        setMyUserDoc(undefined);
      }

      try {
        const loaded = await loadProfileUserDocNative(myUid);
        if (!alive) return;
        if (!loaded) {
          setMyUserDoc(null);
          return;
        }
        const data = loaded.data;
        const snapExists = loaded.exists;
        const seed = seedOwnProfileFromUserDocNative(
          data,
          auth.currentUser?.photoURL
        );
        setMyUserDoc(data);
        setDisplayName(seed.displayName);
        setBio(seed.bio);
        setHandle(seed.handle);
        setAvatarUrl(seed.avatarUrl);
        setLanguage(seed.language);
        setCountryCode(seed.countryCode);
        setPlan(seed.plan);
        setPlanProBgVariant(seed.planProBgVariant);
        setMemberSinceMs(seed.memberSinceMs);
        setUnitBalance(seed.unitBalance);
        if (seed.profileViewCount != null) {
          setProfileViewCountMemory(myUid, seed.profileViewCount);
          setProfileViewCount(seed.profileViewCount);
        }
        if (snapExists) {
          seedNativeProfileStatsFromUserDoc(myUid, data);
          hydrateMarksFromUserDoc(myUid, data);
        }
        // 期限解決を待たずカードを出す（空→埋めで伸びない）
        setProfileLoading(false);

        const resolvedPlan = snapExists
          ? await resolveAndExpireMyPlan(myUid, data)
          : "free";
        if (!alive) return;
        setPlan(resolvedPlan);
        setMyPlanReady(true);
      } finally {
        if (!alive) return;
        setProfileLoading(false);
        setMyPlanReady(true);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [myUid, isPublicProfileView]);

  /** Pro Skin / Unit 残高 — 復帰時に再読込（初回フォーカスは上の load と重複させない） */
  const skipFirstFocusUserDocRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isPublicProfileView || !myUid) return;
      if (skipFirstFocusUserDocRef.current) {
        skipFirstFocusUserDocRef.current = false;
        return;
      }
      let alive = true;
      void loadProfileUserDocNative(myUid).then((loaded) => {
        if (!alive || !loaded?.exists) return;
        const data = loaded.data;
        setMyUserDoc(data);
        setPlanProBgVariant(parseUserPlanProBgVariant(data.planProBgVariant));
        setPlan(data.plan === "pro" ? "pro" : "free");
        setUnitBalance(parseUserUnitBalance(data));
      });
      return () => {
        alive = false;
      };
    }, [isPublicProfileView, myUid])
  );

  /** しばらく離れて戻ったとき、ハングした overview 読み込みをやり直す */
  const skipFirstFocusStatsRef = useRef(true);
  const statsLoadingRef = useRef(statsBundle.loading);
  const statsSummaryRef = useRef(statsBundle.summary);
  statsLoadingRef.current = statsBundle.loading;
  statsSummaryRef.current = statsBundle.summary;
  useFocusEffect(
    useCallback(() => {
      if (!targetUid || !authReady) return;
      if (skipFirstFocusStatsRef.current) {
        skipFirstFocusStatsRef.current = false;
        return;
      }
      if (statsLoadingRef.current && !statsSummaryRef.current) {
        statsBundle.refetch();
      }
    }, [targetUid, authReady, statsBundle.refetch])
  );

  useEffect(() => {
    if (!isPublicProfileView) return;
    if (profileByHandle.loading && !profileByHandle.identityReady) {
      setProfileLoading(true);
      return;
    }
    if (profileByHandle.notFound) {
      setProfileLoading(false);
      return;
    }
    if (!profileByHandle.identityReady && profileByHandle.loading) {
      setProfileLoading(true);
      return;
    }
    setDisplayName(profileByHandle.displayName);
    setBio(profileByHandle.bio);
    setHandle(profileByHandle.handle);
    setAvatarUrl(profileByHandle.avatarUrl);
    setLanguage(profileByHandle.language);
    setCountryCode(profileByHandle.countryCode);
    setPlan(profileByHandle.plan);
    setPlanProBgVariant(profileByHandle.planProBgVariant);
    setMemberSinceMs(profileByHandle.memberSinceMs);
    setUnitBalance(profileByHandle.unitBalance);
    if (profileByHandle.profileViewCount != null) {
      const uid = profileByHandle.targetUid;
      if (uid) setProfileViewCountMemory(uid, profileByHandle.profileViewCount);
      setProfileViewCount(profileByHandle.profileViewCount);
    }
    setProfileLoading(false);
  }, [isPublicProfileView, profileByHandle]);

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
    if (!myUid || uploadingAvatar || saving) return;
    let ImagePicker: typeof import("expo-image-picker");
    try {
      ImagePicker = await import("expo-image-picker");
    } catch (e: unknown) {
      if (isImagePickerNativeMissingError(e)) {
        cyberAlert(t.imagePickerNativeTitle, t.imagePickerNativeHint);
      } else {
        cyberAlert(t.saveErrorTitle, t.uploadAvatarFail);
      }
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        cyberAlert(t.pickPhotoTitle, t.pickPhotoDenied);
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
      const fileRef = ref(storage, `avatars/${myUid}/${Date.now()}_profile.jpg`);
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
        cyberAlert(t.imagePickerNativeTitle, t.imagePickerNativeHint);
      } else {
        const detail = e instanceof Error ? e.message : String(e);
        cyberAlert(t.saveErrorTitle, `${t.uploadAvatarFail}\n\n${detail}`);
      }
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    if (!myUid || saving || uploadingAvatar) return;
    const safeName = displayName.trim();
    const safeBio = bio.trim();
    const safePhoto = avatarUrl.trim();
    if (safeName.length > 50) {
      cyberAlert(t.invalidTitle, t.invalidName);
      return;
    }
    try {
      assertProfileTextsFreeOfGamblingTerms(safeName, safeBio);
    } catch (e: unknown) {
      if (!isProfileGamblingTermsError(e)) throw e;
      cyberAlert(t.invalidTitle, profileGamblingTermsUserMessage(language));
      return;
    }
    setSaving(true);
    try {
      if (auth.currentUser && auth.currentUser.uid === myUid) {
        await updateProfile(auth.currentUser, {
          displayName: safeName || null,
          photoURL: safePhoto || null,
        });
      }
      await setDoc(
        doc(db, "users", myUid),
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
      invalidateProfileUserDocNative(myUid);
      onSaved?.();
      setSettingsOpen(false);
      cyberAlert(t.savedTitle, t.savedBody);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t.saveErrorBody;
      cyberAlert(t.saveErrorTitle, msg);
    } finally {
      setSaving(false);
    }
  }

  const apiConfigured = apiBase != null;

  // BRACKET タブは当面非表示（実装が揃うまで）
  useEffect(() => {
    if (tab === "bracket") setTab("overview");
  }, [tab]);

  function renderTabs() {
    const order: ProfileTab[] = PROFILE_TAB_ORDER.filter((id) => id !== "bracket");
    return (
      <CyberSlantedTabBarNative fill style={styles.tabBar}>
        {order.map((id) => (
          <CyberSlantedTabNative
            key={id}
            label={PROFILE_TAB_LABELS_EN[id]}
            active={tab === id}
            onPress={() => setTab(id)}
            compact
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === id }}
          />
        ))}
      </CyberSlantedTabBarNative>
    );
  }

  function renderOverview() {
    if (!apiConfigured) {
      return (
        <Text style={styles.warnText}>{t.apiMissing}</Text>
      );
    }
    if (statsBundle.error) {
      const isTimeout =
        /timed out|timeout|network request failed/i.test(statsBundle.error);
      const isFirestoreTransient =
        /UNAVAILABLE|ECONNRESET|ECONNREFUSED|DEADLINE_EXCEEDED|RST_STREAM/i.test(
          statsBundle.error
        );
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{statsBundle.error}</Text>
          <Text style={styles.warnText}>
            {isFirestoreTransient
              ? isJa
                ? "Firestore への接続が一時的に切れました。しばらくしてから画面を引き下げて再読み込みしてください。"
                : "Firestore connection dropped temporarily. Pull to refresh in a moment."
              : isTimeout
                ? isJa
                  ? "Next.js（npm run dev）が起動しているか、EXPO_PUBLIC_UNITERZ_API_BASE_URL がシミュレータなら http://127.0.0.1:3000 になっているか確認してください。"
                  : "Check that Next.js (npm run dev) is running and EXPO_PUBLIC_UNITERZ_API_BASE_URL is http://127.0.0.1:3000 for the iOS Simulator."
                : t.apiMissing}
          </Text>
        </View>
      );
    }

    const dailyChartLoading =
      dailyTrendChart.loading ||
      (statsBundle.dailyTrendLoading &&
        dailyTrendChart.chartData.length === 0);
    const overviewStageReady =
      Boolean(targetUid) &&
      (!statsBundle.loading || Boolean(statsBundle.summary));

    if (!targetUid) {
      return null;
    }

    return (
      <ProfileOverviewSectionNative
        targetUid={targetUid}
        language={language}
        profileStatsContext={profileStatsContext}
        currentIsProView={currentIsProView}
        stageReady={overviewStageReady}
        dailyChartLoading={dailyChartLoading}
        dailyChartData={dailyTrendChart.chartData}
        rankTrend={statsBundle.rankTrend}
        rankTrendLoading={statsBundle.rankTrendLoading}
        streakPoints={streakBundle.points}
        streakLoading={streakBundle.loading}
        streakUnavailable={streakBundle.unavailable}
      />
    );
  }

  if (isPublicProfileView && profileByHandle.loading && !profileByHandle.identityReady) {
    return (
      <View style={styles.screenRoot}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topContentPadY, paddingBottom: spacing.lg + bottomReserveY },
          ]}
        >

          <View style={styles.inlineLoading}>
            <BlocksPulseLoader pixelScale={0.9} />
          </View>
        </ScrollView>
        {renderProfileBackHandle()}
      </View>
    );
  }

  if (isPublicProfileView && !profileByHandle.loading && profileByHandle.notFound) {
    return (
      <View style={styles.screenRoot}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topContentPadY, paddingBottom: spacing.lg + bottomReserveY },
          ]}
        >

          <Text style={styles.errorText}>
            {isJa ? "ユーザーが見つかりません" : "User not found"}
          </Text>
        </ScrollView>
        {renderProfileBackHandle()}
      </View>
    );
  }

  return (
    <View style={styles.screenRoot}>
    <TutorialWelcomeWorldCameraNative
      active={welcomeFlyActive}
      flying={welcomeFlying}
      onFlyComplete={goWelcomeFeaturesHorizon}
      overlay={
        welcomeFlyActive ? (
          <TutorialLiveCoachNative
            open
            embedInCamera
            autoWelcomeFly="features"
            title={tutorialCopy.tutorial.practice.welcomeTitle}
            body={tutorialCopy.tutorial.practice.welcomeBody}
            skipLabel={tutorialCopy.tutorial.skip}
            nextLabel={tutorialCopy.tutorial.practice.welcomeFullCta}
            altNextLabel={tutorialCopy.tutorial.practice.welcomeFeaturesCta}
            visual="welcome"
            {...tutorialSkipConfirm}
            onSkip={finishWelcomeSkip}
            onWelcomeFlyStart={startWelcomeFly}
            onNext={goWelcomeFeaturesHorizon}
            onAltNext={goWelcomeFeaturesHorizon}
          />
        ) : null
      }
    >
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: topContentPadY, paddingBottom: spacing.lg + bottomReserveY + (tab === "report" ? 48 : 0) },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {isPublicProfileView || !profileLoading ? (
      <ProfileKinetikHeroNative
        displayName={displayName.trim() || handle.trim()}
        handle={handle.trim()}
        avatarUrl={
          avatarUrl.trim() ||
          (!isPublicProfileView ? fUser?.photoURL?.trim() : "") ||
          ""
        }
        bio={bio}
        countryCode={countryCode}
        plan={currentIsProView ? "pro" : plan}
        callerIsPro={profilePlanHook.isMyPro}
        planProBgVariant={planProBgVariant}
        language={language}
        memberSinceMs={memberSinceMs}
        summary={statsBundle.summary}
        summaryRanks={statsBundle.summaryRanks}
        profileStatsContext={profileStatsContext}
        winStreak={currentStreak}
        statsLoading={statsBundle.loading && !statsBundle.summary}
        metricValueDeltas={statsBundle.metricValueDeltas}
        isMe={isMe}
        onOpenMenu={() => setMenuOpen(true)}
        menuUnreadCount={menuUnreadCount}
        badges={resolvedBadges}
        onBadgePress={(badge) => {
          setSelectedBadge(badge);
          setBadgeModalOpen(true);
        }}
        targetUid={targetUid ?? null}
        profileViewCount={profileViewCount}
        unitBalance={unitBalance}
        onOpenUnitLedger={
          isMe ? () => navigation.navigate("UnitLedger") : undefined
        }
        markMode={isMe || (!!myUid && myUid === targetUid) ? "list" : "toggle"}
        marked={targetMarked}
        markCount={markCount}
        onPressMark={myUid && !isMe ? onPressMark : undefined}
      />
      ) : null}

      {renderTabs()}

      {tab === "overview" ? (
        renderOverview()
      ) : tab === "report" ? (
        <ProfileStatsTabNative
          uid={targetUid}
          language={language}
          isProView={currentIsProView}
          myPlan={profilePlanHook.myPlan}
          isMe={isMe}
          isMyPro={profilePlanHook.isMyPro}
          isTargetPro={profilePlanHook.isTargetPro}
        />
      ) : tab === "awards" ? (
        <ProfileAwardsTabNative uid={targetUid} language={language} />
      ) : (
        <ProfileBracketTabNative uid={targetUid} language={language} />
      )}
    </ScrollView>
    </TutorialWelcomeWorldCameraNative>

    {isMe ? (
      <>
        <ProfileMenuEdgeHandleNative
          onOpen={() => setMenuOpen(true)}
          unreadCount={menuUnreadCount}
          adminUnreadCount={adminInbox.total}
          hidden={menuOpen || markListOpen || welcomeFlyActive}
        />
        <ProfileMenuEdgeHandleNative
          variant="mark"
          label="MARK"
          onOpen={() => setMarkListOpen(true)}
          hidden={menuOpen || markListOpen || welcomeFlyActive}
        />
      </>
    ) : null}

    {renderProfileBackHandle()}

    <Modal
      visible={settingsOpen}
      transparent
      animationType={settingsAnim}
      onRequestClose={() => {
        if (langModalOpen || countryModalOpen) {
          setLangModalOpen(false);
          setCountryModalOpen(false);
          return;
        }
        returnFromSettingsToMenu();
      }}
      onDismiss={() => {
        // iOS: Modal が完全に閉じたあとサイドメニューを開く
        openMenuAfterSettingsClosed();
      }}
      {...(Platform.OS === "ios" ? ({ presentationStyle: "overFullScreen" } as const) : {})}
    >
      <View style={styles.profileModalRoot}>
        <GamesPageBackgroundNative lite />
        <SafeAreaView style={styles.profileModalSafe}>
          <View style={styles.profileModalLayer}>
            <KeyboardAvoidingView
              style={styles.profileModalFill}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              {/* 他サブページと同様: ヘッダー固定 / 本文のみスクロール */}
              <CyberSubpageHeaderNative
                eyebrow="PROFILE"
                title="SETTINGS"
                subtitle={t.settingsSubtitle}
                onBack={returnFromSettingsToMenu}
                edgeBack
                hideBrandShelf={false}
              />
              <ProfileBackEdgeHandleNative
                onPress={returnFromSettingsToMenu}
                accessibilityLabel={isJa ? "戻る" : "Back"}
              />
              <ScrollView
                style={styles.profileModalFill}
                contentContainerStyle={[
                  styles.settingsPageScrollContent,
                  { paddingBottom: Math.max(bottomReserveY, 12) + 40 },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
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
                      onPress={() => {
                        setCountryModalOpen(false);
                        setLangModalOpen(true);
                      }}
                      disabled={saving || uploadingAvatar}
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
                      onPress={() => {
                        setLangModalOpen(false);
                        setCountryModalOpen(true);
                      }}
                      disabled={saving || uploadingAvatar}
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

                  <SlantCtaNative
                    label={saving || uploadingAvatar ? t.saving : t.save}
                    variant="accent"
                    onPress={() => void handleSaveProfile()}
                    disabled={saving || uploadingAvatar}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
            {(langModalOpen || countryModalOpen) && (
              <View style={styles.profileInlinePickerRoot} pointerEvents="box-none">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.settingsClose}
                  style={styles.modalBackdropFill}
                  onPress={() => {
                    setLangModalOpen(false);
                    setCountryModalOpen(false);
                  }}
                />
                {langModalOpen ? (
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
                ) : (
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
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>

    <ProfileSideMenuModal
      visible={menuOpen && isMe}
      onClose={() => setMenuOpen(false)}
      language={language}
      apiBase={apiBase}
      unreadAnnouncements={menuUnreadCount}
      adminInbox={adminInbox}
      uid={fUser?.uid ?? null}
      isAdmin={isAdminUser}
      plan={plan}
      displayName={
        displayName.trim() ||
        fUser?.displayName?.trim() ||
        ""
      }
      handle={handle.trim()}
      avatarUrl={
        avatarUrl.trim() ||
        fUser?.photoURL?.trim() ||
        ""
      }
      unitBalance={unitBalance ?? undefined}
      onOpenProfileSettings={openSettingsFromMenu}
      onOpenInApp={(page) => {
        setMenuOpen(false);
        if (page === "badges") navigation.navigate("Badges");
        else if (page === "invite") navigation.navigate("Invite");
        else if (page === "unitLedger") navigation.navigate("UnitLedger");
        else if (page === "redeem") navigation.navigate("Redeem");
        else if (page === "announcements") navigation.navigate("Announcements");
        else if (page === "plan") navigation.navigate("PlanStatus");
        else if (page === "subscribe") navigation.navigate("ProSubscribe");
        else if (page === "proSkin") navigation.navigate("ProSkin");
        else if (page === "deleteAccount") navigation.navigate("DeleteAccount");
        else if (page === "guidelines") navigation.navigate("CommunityGuidelines");
        else if (page === "help") navigation.navigate("Help");
        else if (page === "terms") navigation.navigate("Terms");
        else if (page === "contact") navigation.navigate("Contact");
        else if (page === "privacy") navigation.navigate("Privacy");
        else if (page === "password") navigation.navigate("ProfilePassword");
        else if (page === "notifications") navigation.navigate("NotificationSettings");
        else if (page === "featureRequest") navigation.navigate("FeatureRequest");
        else if (page === "adminFeatureInbox")
          navigation.navigate("AdminInbox", { kind: "feature" });
        else if (page === "adminContactInbox")
          navigation.navigate("AdminInbox", { kind: "inbox" });
        else if (page === "adminRedemptions")
          navigation.navigate("AdminRedemptions");
        else if (page === "adminGroupBattles")
          navigation.navigate("AdminGroupBattles");
        else if (page === "electronicNotice") navigation.navigate("ElectronicNotice");
        else if (page === "notificationDev" && __DEV__) navigation.navigate("NotificationDev");
        else if (page === "restartTutorial") {
          setTutorialRestartCover(true);
          void (async () => {
            const uid = fUser?.uid ?? null;
            const {
              prepareTutorialRestartNative,
              pulseTutorialRestartNative,
            } = await import("../tutorial/tutorialRestartEventsNative");
            const at = await prepareTutorialRestartNative(uid);
            /** Stack → Tab まで親をたどる（getParent 1段だと届かないことがある） */
            let tabNav:
              | BottomTabNavigationProp<MainTabParamList>
              | undefined;
            let cursor: { getParent?: () => unknown } | undefined =
              navigation as { getParent?: () => unknown };
            for (let i = 0; i < 4 && cursor; i += 1) {
              const parent = cursor.getParent?.() as
                | {
                    getState?: () => { routeNames?: string[] };
                    navigate?: BottomTabNavigationProp<MainTabParamList>["navigate"];
                  }
                | undefined;
              if (!parent) break;
              if (parent.getState?.()?.routeNames?.includes("GamesTab")) {
                tabNav = parent as BottomTabNavigationProp<MainTabParamList>;
                break;
              }
              cursor = parent as { getParent?: () => unknown };
            }
            const nav = tabNav ?? tabNavigation;
            /**
             * armTutorialTabTransitionQuiet の購読反映を1フレーム待つ。
             * 同ティックで navigate するとスライド付きのまま welcome が載る。
             */
            await new Promise<void>((resolve) => {
              requestAnimationFrame(() => resolve());
            });
            nav.navigate({
              name: "GamesTab",
              params: {
                screen: "GamesHome",
                params: { restartTutorialAt: at },
                initial: false,
              },
              merge: true,
            });
            /** lazy タブがマウントされるまでイベントを連続送出 */
            pulseTutorialRestartNative();
          })();
        }
        else if (page === "seasonPreview" && __DEV__) navigation.navigate("SeasonPredictPreview");
        else if (page === "squadBattlePreview" && __DEV__)
          navigation.navigate("SquadBattlePreview");
        else if (page === "futuristicBgPreview" && __DEV__)
          navigation.navigate("FuturisticBgPreview");
        else if (page === "titleSkinPreview" && __DEV__)
          navigation.navigate("TitleSkinPreview");
        else if (page === "waveProSkinPreview" && __DEV__)
          navigation.navigate("WaveProSkinPreview");
        else if (page === "uniterzLogoTypePreview" && __DEV__)
          navigation.navigate("UniterzLogoTypePreview");
        else if (page === "uniterzLogo3dPreview" && __DEV__)
          navigation.navigate("UniterzLogo3dPreview");
        else if (page === "uniterzProBadgePreview" && __DEV__)
          navigation.navigate("UniterzProBadgePreview");
        else if (page === "markedChipDesignPreview" && __DEV__)
          navigation.navigate("MarkedChipDesignPreview");
        else if (page === "splashLogoPreview" && __DEV__)
          navigation.navigate("SplashLogoPreview");
        else if (page === "liveGameStatsPreview" && __DEV__)
          navigation.navigate("LiveGameStatsPreview");
        else if (page === "leagueStatsPreview" && __DEV__)
          navigation.navigate("LeagueStatsPreview");
        else if (page === "proLeagueGatePreview" && __DEV__)
          navigation.navigate("ProLeagueGatePreview");
      }}
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
    <ProfileMarkListOverlayNative
      visible={markListOpen}
      language={language}
      marks={markRows}
      loading={marksLoading}
      maxMarks={maxMarks}
      markedByCount={markedByCount}
      onClose={() => setMarkListOpen(false)}
      onOpenProfile={(h) => {
        setMarkListOpen(false);
        navigateToPublicProfileNative(navigation, {
          handle: h,
          fromMarkList: true,
        });
      }}
      onUnmark={(uid) => {
        void removeMark(uid);
      }}
    />
    {reportOverlay ? (
      <ProfileReportDeliveryOverlayNative
        active={reportOverlay}
        language={language}
        onDismiss={dismissReportOverlay}
      />
    ) : null}
    {skinUnlockIds && skinUnlockIds.length > 0 ? (
      <ProfileProSkinUnlockOverlayNative
        unlockedIds={skinUnlockIds}
        language={language === "ja" ? "ja" : "en"}
        preview={skinUnlockPreview}
        visible
        ownerCounts={skinUnlockOwnerCounts}
        onDismiss={dismissSkinUnlock}
        onApplied={(id) => {
          setPlanProBgVariant(id);
        }}
      />
    ) : null}
    {!isPublicProfileView ? (
      <View style={styles.tutorialHostLayer} pointerEvents="box-none">
        <TutorialLiveHostNative
          page="profile"
          language={(language === "en" ? "en" : "ja") as Language}
        />
      </View>
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    position: "relative",
    backgroundColor: "transparent",
  },
  tutorialHostLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 500,
    elevation: 500,
  },
  scroll: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    flexGrow: 1,
    alignSelf: "stretch",
    width: "100%",
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
  menuSquareOffset: {
    marginTop: 2,
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
  /** Web `CyberSlantedTabBar`（fill）相当。本体デザインは CyberSlantedTabNative に委譲 */
  tabBar: {
    marginBottom: spacing.md,
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
  profileModalRoot: {
    flex: 1,
    backgroundColor: APP_MESH_BG_FALLBACK,
  },
  profileModalSafe: {
    flex: 1,
  },
  /** 設定シート内に言語・国ピッカーを重ねる（ネスト Modal 回避） */
  profileModalLayer: {
    flex: 1,
    position: "relative",
  },
  profileInlinePickerRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  profileModalFill: {
    flex: 1,
  },
  settingsPageScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
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
    borderRadius: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditCircle: {
    width: 108,
    height: 108,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.4)",
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
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.25)",
  },
  avatarEditCameraFab: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 0,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.35)",
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
  /** Web プロフィール編集の角ばり入力に相当 */
  fieldInput: {
    minHeight: 40,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.28)",
    backgroundColor: "rgba(0,0,0,0.35)",
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
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.28)",
    backgroundColor: "rgba(0,0,0,0.35)",
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
  modalBackdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalSheet: {
    position: "relative",
    zIndex: 1,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.28)",
    backgroundColor: "rgba(15,23,42,0.98)",
    paddingVertical: 8,
    overflow: "hidden",
  },
  modalSheetTall: {
    position: "relative",
    zIndex: 1,
    maxHeight: 480,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.28)",
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
});
