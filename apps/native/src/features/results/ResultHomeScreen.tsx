import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  UIManager,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { doc, getDoc } from "firebase/firestore";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { db } from "../../lib/firebase";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import { colors, spacing, typography } from "../../theme/tokens";
import { getTeamAlias, splitTeamNameByLeague } from "../../utils/teamName";
import JerseyMarkAdaptive from "../games/JerseyMarkAdaptive";
import { resolveTeamJerseyPalette, resolveTeamPrimaryColor } from "../games/teamColors";
import type { PostWithMillis, ResultDayGroup } from "./nativeResultModel";
import { canDismissResultListPostNow, formatResultPostCardDateLabel } from "./nativeResultModel";
import {
  dayPointsHeaderForNative,
  type NativeDayPointsHeader,
} from "./nativeResultDaySummary";
import { useNativeResultPosts } from "./useNativeResultPosts";
import {
  deletePredictionPostApi,
  PredictionApiError,
} from "../games/submitPredictionApi";
import ResultStatRatingBarNative from "./ResultStatRatingBarNative";
import ResultDetailScreen from "./ResultDetailScreen";
import ResultLeagueLabelSkia from "./ResultLeagueLabelSkia";
import ResultDeleteConfirmModal from "./ResultDeleteConfirmModal";
import ResultPredictEditModal from "./ResultPredictEditModal";
import { MatchCardListGridOverlay } from "../games/MatchCardListGridOverlay";
import { gamesScheduleCardDaySwitchEnter } from "../games/predictMotion";

const hasNativeBlurView =
  Platform.OS !== "web" &&
  Boolean(
    UIManager.getViewManagerConfig?.("ExpoBlurView") ??
      UIManager.getViewManagerConfig?.("ViewManagerAdapter_ExpoBlur_ExpoBlurView")
  );

const JERSEY_SIZE_RESULT = 52;
/** 上段／下段 50% 分割のカード高さ */
const RESULT_CARD_SPLIT_HEIGHT = 214;

/** Web `ResultCard` の `transition-all duration-300 ease-out`（モバイルフライアウトの translate 含む） */
const CORNER_FAB_TRANSITION_MS = 300;
const cornerFabTransitionEasing = Easing.out(Easing.cubic);

/** Web `ResultDayPipeGroup` の日付帯グリッド（11px・シアン） */
const DAY_HEADER_GRID_STEP = 11;
const DAY_HEADER_GRID_LINE = "rgba(34,211,238,0.5)";
const DAY_HEADER_GRID_OPACITY = 0.12;

const dayHeaderGridStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
});

function ResultDayHeaderGridOverlay() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const verticalLefts = useMemo(() => {
    const out: number[] = [];
    for (let x = DAY_HEADER_GRID_STEP; x < size.w; x += DAY_HEADER_GRID_STEP) {
      out.push(x);
    }
    return out;
  }, [size.w]);
  const horizontalTops = useMemo(() => {
    const out: number[] = [];
    for (let y = DAY_HEADER_GRID_STEP; y < size.h; y += DAY_HEADER_GRID_STEP) {
      out.push(y);
    }
    return out;
  }, [size.h]);

  function onGridLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  return (
    <View pointerEvents="none" style={dayHeaderGridStyles.overlay} onLayout={onGridLayout}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { opacity: DAY_HEADER_GRID_OPACITY }]}
      >
        {verticalLefts.map((left) => (
          <View
            key={`dhgv-${left}`}
            style={[dayHeaderGridStyles.gridLineV, { left, backgroundColor: DAY_HEADER_GRID_LINE }]}
          />
        ))}
        {horizontalTops.map((top) => (
          <View
            key={`dhgh-${top}`}
            style={[dayHeaderGridStyles.gridLineH, { top, backgroundColor: DAY_HEADER_GRID_LINE }]}
          />
        ))}
      </View>
    </View>
  );
}

/** 試合カード（GameCardList）と同じブラー用スタイル */
const gridStyles = StyleSheet.create({
  cardBlurLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBlurLayerFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24,28,38,0.12)",
  },
});

const LEAGUE_LABEL: Record<string, string> = {
  nba: "NBA",
  bj: "B1",
  pl: "PL",
  j1: "J1",
};

const NUMERIC_FONT_FAMILY = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});
const DISPLAY_FONT_FAMILY = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});
function normalizeLeague(raw: unknown): "nba" | "bj" | "j1" | "pl" {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "bj" || v === "b1" || v.includes("b.league")) return "bj";
  if (v === "j1" || v === "j") return "j1";
  if (v === "pl" || v.includes("premier") || v.includes("epl")) return "pl";
  return "nba";
}

/** Firestore は数値フィールドが文字列で返ることがあるため Number に寄せる */
function toNumber(v: unknown, fallback = 0) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (t !== "") {
      const n = Number(t);
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function toInt(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

function isYellow10pt(v: unknown): boolean {
  const n = toNumber(v, NaN);
  return Number.isFinite(n) && n >= 7;
}

function isRedUpset(v: unknown): boolean {
  const n = toNumber(v, NaN);
  return Number.isFinite(n) && n > 0;
}

type StreakBadge = { label: string; tone: "gold" | "orange" | "red" };

/** `GameCardList` の `CardBlurLayer` と同一 */
function ResultCardBlurLayer() {
  if (!hasNativeBlurView) {
    return <View style={gridStyles.cardBlurLayerFallback} />;
  }
  if (Platform.OS === "ios") {
    return <BlurView intensity={30} tint="default" style={gridStyles.cardBlurLayer} />;
  }
  if (Platform.OS === "android") {
    return (
      <BlurView
        intensity={28}
        tint="default"
        experimentalBlurMethod="dimezisBlurView"
        style={gridStyles.cardBlurLayer}
      />
    );
  }
  return <View style={gridStyles.cardBlurLayerFallback} />;
}

function getStreakBadge(activeWinStreak: unknown, isEn: boolean): StreakBadge | null {
  const v =
    typeof activeWinStreak === "number" && Number.isFinite(activeWinStreak)
      ? Math.floor(activeWinStreak)
      : 0;
  if (v < 3) return null;
  if (v >= 7) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      tone: "red",
    };
  }
  if (v >= 5) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      tone: "orange",
    };
  }
  return {
    label: isEn ? `${v} Win Streak` : `${v}連勝`,
    tone: "gold",
  };
}

type ResultBadge = "hit" | "upset" | "miss" | "streak" | null;

function getMobileTeamName(
  league: "nba" | "bj" | "j1" | "pl",
  rawName: string,
  l1: string,
  l2?: string
): string {
  if (league === "nba") return l2 || rawName;
  if (league === "pl") return getTeamAlias(rawName) ?? rawName;
  return [l1, l2].filter(Boolean).join(" ");
}

function ResultDayHeader({
  dateLabel,
  dayPoints,
}: {
  dateLabel: string;
  dayPoints: NativeDayPointsHeader;
}) {
  return (
    <View style={[styles.listRowOuter, styles.dayHeaderSpacing]}>
      <View style={styles.dayHeaderClip}>
        <ResultDayHeaderGridOverlay />
        <View style={styles.cornerTl} />
        <View style={styles.cornerBr} />
        <View style={styles.cornerTr} />
        <View style={styles.cornerBl} />
        <View style={styles.dayHeaderRow}>
          <Text style={styles.dayHeaderDate}>{dateLabel}</Text>
          {dayPoints?.variant === "total" &&
          typeof dayPoints.hitTotal === "number" &&
          dayPoints.hitTotal > 0 ? (
            <View style={styles.dayHitWrap}>
              <Text style={styles.dayHitLabel}>hit</Text>
              <Text style={styles.dayHitNums}>
                {dayPoints.hitWins ?? 0}/{dayPoints.hitTotal}
              </Text>
            </View>
          ) : null}
          {dayPoints?.variant === "total" ? (
            <View style={styles.dayTotalWrap}>
              <Text style={styles.dayTotalPrefix}>{dayPoints.prefix}</Text>
              <Text style={styles.dayTotalValue}>{dayPoints.value}</Text>
              <Text style={styles.dayTotalUnit}>{dayPoints.unit}</Text>
            </View>
          ) : dayPoints?.variant === "pending" ? (
            <View style={styles.pendingRow}>
              <View style={styles.pendingPill}>
                <Text style={styles.pendingPillText}>{dayPoints.line}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const AnimatedResultCardPressable = Animated.createAnimatedComponent(Pressable);

function ResultPostCard({
  post,
  language,
  nowMs,
  viewerUid,
  listEnterIndex,
  onOpenDetail,
  onRequestDeleteConfirm,
  onRequestPredictEdit,
}: {
  post: PostWithMillis;
  language: "ja" | "en";
  nowMs: number;
  viewerUid: string | null;
  /** 一覧入場のスタッガー（試合一覧と同じ `gamesScheduleCardDaySwitchEnter`） */
  listEnterIndex: number;
  onOpenDetail: (id: string) => void;
  /** Web 同様：カスタム削除確認モーダルを開く */
  onRequestDeleteConfirm: (post: PostWithMillis) => void;
  /** Web `onRequestPredictEdit`（未接続時はペンを出さない） */
  onRequestPredictEdit?: (post: PostWithMillis) => void;
}) {
  const isEn = language === "en";
  const [cornerFabOpen, setCornerFabOpen] = useState(false);
  const reduceMotionList = useReducedMotion() ?? false;
  const cardListEntering = reduceMotionList
    ? undefined
    : gamesScheduleCardDaySwitchEnter(listEnterIndex);

  const postStatus = typeof post.status === "string" ? post.status : "";
  const startAtMs =
    typeof post.startAtMillis === "number" && Number.isFinite(post.startAtMillis)
      ? post.startAtMillis
      : null;
  /** Web `ResultCard` の `isMatchStarted` と同じ */
  const isMatchStarted =
    postStatus === "live" ||
    postStatus === "final" ||
    (postStatus === "scheduled" &&
      startAtMs != null &&
      nowMs >= startAtMs);

  const authorUid =
    typeof post.authorUid === "string" && post.authorUid.length > 0 ? post.authorUid : null;
  const gameId =
    typeof post.gameId === "string" && post.gameId.length > 0 ? post.gameId : null;
  const hasCornerTrash = canDismissResultListPostNow(post, nowMs);
  const hasCornerEdit = Boolean(
    viewerUid &&
      authorUid === viewerUid &&
      gameId &&
      onRequestPredictEdit
  );
  const hasCornerActions =
    !isMatchStarted && (hasCornerTrash || hasCornerEdit);

  useEffect(() => {
    if (isMatchStarted) setCornerFabOpen(false);
  }, [isMatchStarted]);

  const penFlyProgress = useSharedValue(0);
  const trashFlyProgress = useSharedValue(0);

  useEffect(() => {
    const target = cornerFabOpen ? 1 : 0;
    const cfg = {
      duration: CORNER_FAB_TRANSITION_MS,
      easing: cornerFabTransitionEasing,
    };
    penFlyProgress.value = withTiming(hasCornerEdit ? target : 0, cfg);
    trashFlyProgress.value = withTiming(hasCornerTrash ? target : 0, cfg);
  }, [cornerFabOpen, hasCornerEdit, hasCornerTrash]);

  /** Web `flyoutPenClass`：閉じ時 translate-x-2（+8px）、開くと 0 */
  const cornerFlyoutPenMotion = useAnimatedStyle(() => ({
    opacity: penFlyProgress.value,
    transform: [{ translateX: 8 * (1 - penFlyProgress.value) }],
  }));

  /** Web `flyoutTrashClass`：閉じ時 -translate-y-2（-8px）、開くと 0 */
  const cornerFlyoutTrashMotion = useAnimatedStyle(() => ({
    opacity: trashFlyProgress.value,
    transform: [{ translateY: -8 * (1 - trashFlyProgress.value) }],
  }));

  /** Web ResultCard の isLiveGame と同じ：開始〜確定まで LIVE */
  const showLiveMark =
    postStatus !== "final" &&
    (postStatus === "live" ||
      (postStatus === "scheduled" &&
        startAtMs != null &&
        nowMs >= startAtMs));

  const requestDeletePost = useCallback(() => {
    if (!canDismissResultListPostNow(post, Date.now())) return;
    setCornerFabOpen(false);
    onRequestDeleteConfirm(post);
  }, [onRequestDeleteConfirm, post]);

  const requestPredictEdit = useCallback(() => {
    if (!onRequestPredictEdit || !gameId) return;
    setCornerFabOpen(false);
    onRequestPredictEdit(post);
  }, [gameId, onRequestPredictEdit, post]);

  const leagueKey = normalizeLeague(post.league);
  const pillText = LEAGUE_LABEL[leagueKey] ?? leagueKey.toUpperCase();

  const home = post.home as { name?: string; teamId?: string } | undefined;
  const away = post.away as { name?: string; teamId?: string } | undefined;
  const pred = post.prediction as
    | { score?: { home?: number; away?: number }; winner?: string }
    | undefined;
  const result = post.result as { home?: number; away?: number } | null | undefined;
  const stats = post.stats as Record<string, unknown> | undefined;
  const hadUpsetGame = Boolean(stats?.hadUpsetGame);

  const homeFallback = "#0ea5e9";
  const awayFallback = "#f43f5e";
  const homeColor = resolveTeamPrimaryColor(post.league, home, homeFallback);
  const awayColor = resolveTeamPrimaryColor(post.league, away, awayFallback);
  const homeJersey = resolveTeamJerseyPalette(post.league, home, homeColor);
  const awayJersey = resolveTeamJerseyPalette(post.league, away, awayColor);

  const [homeL1, homeL2] = splitTeamNameByLeague(leagueKey, home?.name ?? "");
  const [awayL1, awayL2] = splitTeamNameByLeague(leagueKey, away?.name ?? "");
  const homeName = getMobileTeamName(leagueKey, home?.name ?? "", homeL1, homeL2);
  const awayName = getMobileTeamName(leagueKey, away?.name ?? "", awayL1, awayL2);

  const ph = pred?.score?.home;
  const pa = pred?.score?.away;
  const predictedScore =
    typeof ph === "number" && typeof pa === "number" ? `${ph} - ${pa}` : "— - —";
  const cardDateLabel = formatResultPostCardDateLabel(post, isEn ? "en" : "ja");

  const rh = result?.home;
  const ra = result?.away;
  const hasFinal = typeof rh === "number" && typeof ra === "number";
  const finalScore = hasFinal ? `${rh} - ${ra}` : null;

  const activeWinStreak =
    toInt((stats?.pointsV3Detail as { activeWinStreak?: number } | undefined)?.activeWinStreak) ??
    0;
  const streakBadge = getStreakBadge(activeWinStreak, isEn);
  let badge: ResultBadge = null;
  if (Boolean(stats?.upsetHit)) badge = "upset";
  else if (streakBadge) badge = "streak";
  else if (stats?.isWin === true) badge = "hit";
  else if (stats && stats.isWin === false) badge = "miss";

  const statRows = useMemo(() => {
    const scorePrecision = toNumber(stats?.scorePrecision, 0);
    const upsetPoints = toNumber(stats?.upsetPoints, 0);
    const pointsV3 = toNumber(stats?.pointsV3, 0);
    return [
      {
        key: "scorePrecision" as const,
        label: isEn ? "Score Precision" : "スコア精度",
        value: scorePrecision,
        barMax: 10,
        format: (v: number) => v.toFixed(1),
      },
      {
        key: "upsetPoints" as const,
        label: isEn ? "Upset Score" : "Upsetスコア",
        value: upsetPoints,
        barMax: 10,
        format: (v: number) =>
          hadUpsetGame ? `${(Math.round(v * 10) / 10).toFixed(1)}` : "--",
      },
      {
        key: "pointsV3" as const,
        label: isEn ? "Total Score" : "総合スコア",
        value: pointsV3,
        barMax: 10,
        format: (v: number) => `${(Math.round(v * 10) / 10).toFixed(1)}`,
      },
    ];
  }, [stats, isEn, hadUpsetGame]);

  const frameStyle =
    badge === "upset"
      ? styles.cardFrameUpset
      : badge === "streak" && activeWinStreak >= 7
        ? styles.cardFrameStreakRed
        : badge === "streak" && activeWinStreak >= 5
          ? styles.cardFrameStreakOrange
          : badge === "streak"
            ? styles.cardFrameStreakGold
            : badge === "hit"
              ? styles.cardFrameHit
              : badge === "miss"
                ? styles.cardFrameMiss
                : null;

  const shellOverflowStyle =
    cornerFabOpen && hasCornerActions ? styles.cardShellOverflowVisible : null;

  return (
    <AnimatedResultCardPressable
      collapsable={false}
      entering={cardListEntering}
      style={({ pressed }) => [
        styles.listRowOuter,
        styles.cardOuter,
        styles.resultCardPressable,
        pressed && styles.cardPressed,
      ]}
      onPress={() => {
        /** Web：FAB 外タップでメニューを閉じる（詳細は閉じた後のタップで） */
        if (cornerFabOpen) {
          setCornerFabOpen(false);
          return;
        }
        onOpenDetail(post.id);
      }}
    >
      <View style={[styles.cardShell, frameStyle, shellOverflowStyle]} collapsable={false}>
        <View pointerEvents="none" style={styles.cardGridUnderlay}>
          <MatchCardListGridOverlay styles={styles} tone="resultList" />
        </View>
        <View style={styles.cardPressableBody}>
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(14,18,28,0.92)",
              "rgba(10,13,22,0.86)",
              "rgba(7,10,17,0.92)",
            ]}
            locations={[0, 0.52, 1]}
            style={styles.cardLayerBase}
          />
          <ResultCardBlurLayer />
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.018)",
              "rgba(255,255,255,0.004)",
              "rgba(255,255,255,0)",
            ]}
            locations={[0, 0.24, 1]}
            style={styles.cardLayerTopGlow}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.018)",
              "rgba(255,255,255,0.008)",
              "rgba(255,255,255,0)",
            ]}
            locations={[0, 0.6, 1]}
            style={styles.cardLayerGlassFog}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.012)",
              "rgba(255,255,255,0.003)",
              "rgba(255,255,255,0)",
            ]}
            locations={[0, 0.2, 1]}
            style={styles.cardLayerShine}
          />
          <View style={styles.cardGlowOverlay} />
          {hasCornerActions ? (
            <View style={styles.cornerFabCluster} pointerEvents="box-none">
              {hasCornerEdit ? (
                <Animated.View
                  style={[styles.cornerFlyoutPenSlot, cornerFlyoutPenMotion]}
                  pointerEvents={cornerFabOpen ? "auto" : "none"}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.cornerFlyoutPen,
                      pressed && styles.cornerFlyoutPressed,
                    ]}
                    onPress={requestPredictEdit}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={isEn ? "Edit prediction" : "予想を修正"}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={10}
                      color="rgba(207,250,254,0.88)"
                    />
                  </Pressable>
                </Animated.View>
              ) : null}
              {hasCornerTrash ? (
                <Animated.View
                  style={[styles.cornerFlyoutTrashSlot, cornerFlyoutTrashMotion]}
                  pointerEvents={cornerFabOpen ? "auto" : "none"}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.cornerFlyoutTrash,
                      pressed && styles.cornerFlyoutPressed,
                    ]}
                    onPress={requestDeletePost}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={isEn ? "Remove from list" : "一覧から除外"}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={10}
                      color="rgba(252,165,165,0.88)"
                    />
                  </Pressable>
                </Animated.View>
              ) : null}
              <Pressable
                style={({ pressed }) => [
                  styles.cornerMenuBtn,
                  pressed && styles.cornerMenuBtnPressed,
                ]}
                onPress={() => setCornerFabOpen((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityState={{ expanded: cornerFabOpen }}
                accessibilityLabel={isEn ? "Open actions" : "操作メニュー"}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={["rgba(39,39,42,0.96)", "rgba(0,0,0,0.92)"]}
                  locations={[0, 1]}
                  style={styles.cornerMenuBtnGradient}
                />
                <View style={styles.cornerMenuIconWrap}>
                  <MaterialCommunityIcons
                    name="menu"
                    size={10}
                    color="rgba(224,250,254,0.72)"
                  />
                </View>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.cardContent}>
          <View style={styles.cardUpperPane}>
            <View
              style={[styles.cardTopRow, hasCornerActions && styles.cardTopRowWithCornerFab]}
            >
              <ResultLeagueLabelSkia text={pillText} style={styles.leagueLabelSlot} />
              <View style={styles.badgeRow}>
                {badge === "streak" && streakBadge ? (
                  <View style={[styles.miniBadge, streakToneStyle(streakBadge.tone)]}>
                    <MaterialCommunityIcons name="fire" size={11} color="#fef08a" />
                    <Text style={styles.miniBadgeText} numberOfLines={1}>
                      {streakBadge.label}
                    </Text>
                  </View>
                ) : null}
                {badge === "hit" ? (
                  <View style={[styles.miniBadge, styles.badgeHit]}>
                    <Text style={styles.badgeHitText}>HIT</Text>
                  </View>
                ) : null}
                {badge === "upset" ? (
                  <View style={[styles.miniBadge, styles.badgeUpset]}>
                    <Text style={styles.badgeUpsetText}>UPSET</Text>
                  </View>
                ) : null}
                {badge === "miss" ? (
                  <View style={[styles.miniBadge, styles.badgeMiss]}>
                    <Text style={styles.badgeMissText}>MISS</Text>
                  </View>
                ) : null}
                {showLiveMark ? (
                  <View style={[styles.miniBadge, styles.badgeLive]} accessibilityLabel={isEn ? "Live" : "ライブ中"}>
                    <Text style={styles.badgeLiveText}>LIVE</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.matchGrid}>
              <View style={styles.sideCol}>
                <JerseyMarkAdaptive
                  accent={homeJersey.primary}
                  accentEnd={homeJersey.secondary}
                  size={JERSEY_SIZE_RESULT}
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {homeName.toUpperCase()}
                </Text>
              </View>
              <View style={styles.centerCol}>
                <Text style={styles.scoreDateLabel}>{cardDateLabel}</Text>
                <Text style={styles.predictedScore}>{predictedScore}</Text>
                {finalScore ? <Text style={styles.finalScore}>{finalScore}</Text> : null}
              </View>
              <View style={styles.sideCol}>
                <JerseyMarkAdaptive
                  accent={awayJersey.primary}
                  accentEnd={awayJersey.secondary}
                  size={JERSEY_SIZE_RESULT}
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {awayName.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardLowerPane}>
            <View style={styles.divider} />
            <View style={styles.statBlock}>
            {statRows.map((row, index) => {
              const cap = row.barMax;
              const ratio =
                row.key === "upsetPoints" && !hadUpsetGame
                  ? 0
                  : cap > 0
                    ? clamp01(row.value / cap)
                    : 0;
              const display = row.format(row.value);
              const valueStyle =
                row.key === "scorePrecision"
                  ? isYellow10pt(stats?.scorePrecision)
                    ? styles.statValueYellow
                    : styles.statValueWhite
                  : row.key === "upsetPoints"
                    ? hadUpsetGame && isRedUpset(stats?.upsetPoints)
                      ? styles.statValueRed
                      : styles.statValueWhite
                    : isYellow10pt(stats?.pointsV3)
                      ? styles.statValueYellow
                      : styles.statValueWhite;
              return (
                <View key={row.key} style={styles.statRow}>
                  <Text style={styles.statLabel} numberOfLines={1}>
                    {row.label}
                  </Text>
                  <ResultStatRatingBarNative
                    ratio={ratio}
                    delayMs={index * 80}
                    size="sm"
                  />
                  <Text style={[styles.statValue, valueStyle]}>{display}</Text>
                </View>
              );
            })}
            </View>
          </View>
          </View>
        </View>
      </View>
    </AnimatedResultCardPressable>
  );
}

function streakToneStyle(tone: StreakBadge["tone"]) {
  if (tone === "red") return styles.streakRed;
  if (tone === "orange") return styles.streakOrange;
  return styles.streakGold;
}

type SectionT = {
  title: string;
  dateLabel: string;
  pending: PostWithMillis[];
  final: PostWithMillis[];
  data: PostWithMillis[];
  /** リスト全体でのカード入場スタッガー用の先頭インデックス */
  baseFlatIndex: number;
};

export default function ResultHomeScreen({
  bottomReserveY = 0,
}: {
  bottomReserveY?: number;
}) {
  const { fUser } = useFirebaseUser();
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const uid = fUser?.uid ?? null;

  useEffect(() => {
    let alive = true;
    async function loadLang() {
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!alive) return;
        const row = snap.data() as { language?: unknown } | undefined;
        setLanguage(row?.language === "en" ? "en" : "ja");
      } catch {
        if (!alive) return;
        setLanguage("ja");
      }
    }
    void loadLang();
    return () => {
      alive = false;
    };
  }, [uid]);

  const t = useMemo(
    () =>
      language === "ja"
        ? {
            empty: "まだ予想の投稿がありません。",
            cacheHint: "古い投稿の一部は表示を省略しています。",
            pull: "引っ張って更新",
            filterFold: "絞り込み条件を指定",
            filterSoon: "フィルターは次フェーズで接続します。",
          }
        : {
            empty: "No predictions yet.",
            cacheHint: "Older posts may be omitted from this list.",
            pull: "Pull to refresh",
            filterFold: "Specify filters",
            filterSoon: "Filters will be available in a later release.",
          },
    [language]
  );

  const [listNowTick, setListNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setListNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  /** Web `ResultListWithOverlay` と同様：一覧上で予想修正モーダルを開く */
  const [predictEditPost, setPredictEditPost] = useState<PostWithMillis | null>(null);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<PostWithMillis | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const deleteSubmittingRef = useRef(false);

  const { grouped, loading, postsCacheCapped, refreshPosts, loadMore, removePostById } =
    useNativeResultPosts(uid, language);

  const sections: SectionT[] = useMemo(() => {
    let baseFlatIndex = 0;
    return grouped.map((g: ResultDayGroup) => {
      const data = [...g.pending, ...g.final];
      const section: SectionT = {
        title: g.dateLabel,
        dateLabel: g.dateLabel,
        pending: g.pending,
        final: g.final,
        data,
        baseFlatIndex,
      };
      baseFlatIndex += data.length;
      return section;
    });
  }, [grouped]);

  const onRefresh = useCallback(async () => {
    setManualRefreshing(true);
    try {
      await refreshPosts();
    } finally {
      setManualRefreshing(false);
    }
  }, [refreshPosts]);

  const confirmDismissPostFromList = useCallback(async () => {
    const post = deleteConfirmPost;
    if (!post || deleteSubmittingRef.current) return;
    if (!canDismissResultListPostNow(post, Date.now())) {
      setDeleteConfirmPost(null);
      return;
    }
    deleteSubmittingRef.current = true;
    setDeleteInProgress(true);
    try {
      await deletePredictionPostApi(post.id);
      removePostById(post.id);
      setDeleteConfirmPost(null);
    } catch (err) {
      const msg =
        err instanceof PredictionApiError
          ? err.message
          : language === "en"
            ? "Could not delete."
            : "削除に失敗しました。";
      Alert.alert(language === "en" ? "Error" : "エラー", msg);
    } finally {
      deleteSubmittingRef.current = false;
      setDeleteInProgress(false);
    }
  }, [deleteConfirmPost, language, removePostById]);

  const listHeader = (
    <View style={styles.headerBlock}>
      {postsCacheCapped ? <Text style={styles.hint}>{t.cacheHint}</Text> : null}
      <View style={styles.listRowOuter}>
        <Pressable
          style={({ pressed }) => [styles.filterBar, pressed && styles.filterBarPressed]}
          onPress={() => Alert.alert(language === "en" ? "Coming soon" : "準備中", t.filterSoon)}
        >
          <Text style={styles.filterBarText}>{t.filterFold}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color="rgba(226,232,240,0.75)" />
        </Pressable>
      </View>
    </View>
  );

  const listEmpty =
    !loading && grouped.length === 0 ? (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>{t.empty}</Text>
      </View>
    ) : null;

  const showInitialSpinner = loading && grouped.length === 0;

  /** 下端はスクロール内容側のパディングのみ（親に付けるとナビ下が塗りつぶされリストが届かない） */
  const listContentWithBottomPad = useMemo(
    () => [styles.listContent, { paddingBottom: bottomReserveY }],
    [bottomReserveY]
  );

  return (
    <View style={styles.resultScreenWrap}>
    <View style={styles.root}>
      {showInitialSpinner ? (
        <View style={[styles.centered, { paddingBottom: bottomReserveY }]}>
          <BlocksPulseLoader />
        </View>
      ) : sections.length === 0 ? (
        <View style={[styles.listContent, { paddingBottom: bottomReserveY }]}>
          {listHeader}
          {listEmpty}
        </View>
      ) : (
        <SectionList<PostWithMillis, SectionT>
          style={styles.listScroll}
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={listContentWithBottomPad}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={
            loading && sections.some((s) => s.data.length > 0) ? (
              <View style={styles.footer}>
                <BlocksPulseLoader pixelScale={0.78} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={manualRefreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.accent}
            />
          }
          onEndReached={() => loadMore()}
          onEndReachedThreshold={0.4}
          renderSectionHeader={({ section }) => (
            <ResultDayHeader
              dateLabel={section.dateLabel}
              dayPoints={dayPointsHeaderForNative(section.final, section.pending, language)}
            />
          )}
          renderItem={({ item, index, section }) => (
            <ResultPostCard
              post={item}
              language={language}
              nowMs={listNowTick}
              viewerUid={uid}
              listEnterIndex={section.baseFlatIndex + index}
              onOpenDetail={setDetailPostId}
              onRequestDeleteConfirm={setDeleteConfirmPost}
              onRequestPredictEdit={setPredictEditPost}
            />
          )}
          SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
        />
      )}
    </View>
    <ResultDetailScreen
      visible={detailPostId != null}
      postId={detailPostId}
      language={language}
      onClose={() => setDetailPostId(null)}
    />
    <ResultDeleteConfirmModal
      visible={deleteConfirmPost != null}
      isEn={language === "en"}
      loading={deleteInProgress}
      onCancel={() => {
        if (!deleteInProgress) setDeleteConfirmPost(null);
      }}
      onConfirm={() => void confirmDismissPostFromList()}
    />
    <ResultPredictEditModal
      visible={predictEditPost != null}
      post={predictEditPost}
      language={language}
      onClose={() => setPredictEditPost(null)}
      onUpdated={() => void refreshPosts()}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  /** リザルト詳細オーバーレイの containing block */
  resultScreenWrap: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    position: "relative",
  },
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    minHeight: 0,
  },
  /** フローティングナビの背後までスクロール背景を伸ばす */
  listScroll: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  listContent: {
    /** `mainArea` の 8px に加えて少し狭く見せる */
    paddingHorizontal: spacing.sm,
    paddingTop: 2,
    flexGrow: 1,
    /** 絞り込み・日付帯・カードの縦間隔をやや詰める */
    gap: 2,
  },
  headerBlock: {
    marginBottom: 4,
  },
  hint: {
    marginBottom: 6,
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  /** 絞り込み・日付帯・リザルトカードで共通の横幅（`listContent` の内側いっぱい） */
  listRowOuter: {
    alignSelf: "stretch",
    width: "100%",
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
    /** 高さが低いので 16 だとカプセル感が強い → 控えめな角丸 */
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.22)",
    backgroundColor: "rgba(8,11,20,0.72)",
  },
  filterBarPressed: {
    opacity: 0.88,
  },
  filterBarText: {
    color: "rgba(226,232,240,0.88)",
    fontSize: 13,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyWrap: {
    paddingVertical: spacing.xl * 2,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  sectionGap: {
    height: 2,
  },
  dayHeaderSpacing: {
    marginBottom: 3,
  },
  dayHeaderClip: {
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.55)",
    backgroundColor: "rgba(3,3,8,0.96)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    overflow: "hidden",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  dayHeaderRow: {
    position: "relative",
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  /** Web `ResultDayPipeGroup` の日付：`font-mono … text-cyan-50` + シアングロー */
  dayHeaderDate: {
    flexShrink: 0,
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(236,254,255,0.95)",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    textShadowColor: "rgba(34,211,238,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  dayHitWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
    minWidth: 0,
  },
  dayHitLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
  },
  dayHitNums: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.92)",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  dayTotalWrap: {
    flexShrink: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "flex-end",
    gap: 4,
    maxWidth: "46%",
  },
  dayTotalPrefix: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
  },
  dayTotalValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  dayTotalUnit: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
  },
  /** Web `ResultDayPipeGroup` の pending 右寄せラッパ */
  pendingRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingLeft: 4,
  },
  /**
   * Web `ResultDayPipeGroup` pending と同型:
   * `border-dashed border-fuchsia-500/50 bg-black/60 px-2.5 py-1.5 font-mono … text-fuchsia-300/80`
   * `box-shadow:0_0_16px_-4px_rgba(217,70,239,0.4)` … 親が overflow:hidden のため外側シャドウはテキスト側のグローで代替
   */
  pendingPill: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(217,70,239,0.5)",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 0,
  },
  pendingPillText: {
    fontSize: 11,
    fontWeight: "600",
    /** Web `tracking-wide` 相当 */
    letterSpacing: 0.35,
    /** Tailwind `text-fuchsia-300/80` に近い */
    color: "rgba(240,171,252,0.82)",
    backgroundColor: "transparent",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    textShadowColor: "rgba(217,70,239,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: Platform.OS === "ios" ? 10 : 6,
  },
  cornerTl: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: "rgba(34,211,238,0.95)",
    zIndex: 2,
  },
  cornerBr: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(217,70,239,0.88)",
    zIndex: 2,
  },
  cornerTr: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: "rgba(34,211,238,0.45)",
    zIndex: 2,
  },
  cornerBl: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(34,211,238,0.38)",
    zIndex: 2,
  },
  cardOuter: {
    marginBottom: 2,
  },
  /** SectionList セル計測ぶれ防止：行全体を一覧カード高さに固定 */
  resultCardPressable: {
    height: RESULT_CARD_SPLIT_HEIGHT,
    minHeight: RESULT_CARD_SPLIT_HEIGHT,
    maxHeight: RESULT_CARD_SPLIT_HEIGHT,
    flexShrink: 0,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  cardShell: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    /** HIT だけ太枠にしない（全バッジ共通 2px で外寸を揃える） */
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,11,18,0.84)",
    flexShrink: 0,
    height: RESULT_CARD_SPLIT_HEIGHT,
    minHeight: RESULT_CARD_SPLIT_HEIGHT,
    maxHeight: RESULT_CARD_SPLIT_HEIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 7,
  },
  cardGridUnderlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  /** `MatchCardListGridOverlay` の線スタイル（濃さは `tone="resultList"` 側の定数） */
  cardGridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardGridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
  },
  cardGridLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  /** シェルと同寸の全面レイヤー（上下 50% 分割の高さ基準にする） */
  cardPressableBody: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: 3,
    paddingBottom: 3,
  },
  /** Web の `right-11` 相当：コンパクト FAB とバッジ列の干渉を避ける */
  cardTopRowWithCornerFab: {
    paddingRight: 28,
  },
  /** メニュー展開でフライアウトがはみ出すときのクリップ解除（Web と同様） */
  cardShellOverflowVisible: {
    overflow: "visible",
  },
  /** Web `ResultCard` の右上アクション簇（ハンバーガー＋フライアウト） */
  cornerFabCluster: {
    position: "absolute",
    top: 8,
    /** 右端から離してハンバーガーをやや左へ */
    right: 13,
    zIndex: 50,
    minWidth: 22,
    minHeight: 22,
    alignItems: "flex-end",
  },
  cornerMenuBtn: {
    width: 22,
    height: 22,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    /** Web `border-cyan-400/50` に寄せたメインボタン枠 */
    borderColor: "rgba(34,211,238,0.5)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  /** Web `from-zinc-800/95 to-black/92` の縦グラデーション */
  cornerMenuBtnGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
  },
  /** 線が詰まって見えるので横だけやや潰して細めに（グラデの上に載せる） */
  cornerMenuIconWrap: {
    zIndex: 1,
    transform: [{ scaleX: 0.82 }],
  },
  cornerMenuBtnPressed: {
    opacity: 0.9,
  },
  /** Web `absolute top-full left-1/2 mt-2` に相当するスロット */
  cornerFlyoutTrashSlot: {
    position: "absolute",
    /** メニュー高さ 22 + Web `mt-2` 相当の間隔 */
    top: 30,
    right: 0,
    zIndex: 55,
  },
  cornerFlyoutTrash: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.5)",
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f87171",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 6,
  },
  /** Web `absolute right-full top-1/2 mr-2` に相当するスロット */
  cornerFlyoutPenSlot: {
    position: "absolute",
    top: 0,
    /** メニュー幅 22 + Web `mr-2` 相当の間隔 */
    right: 30,
    zIndex: 55,
  },
  cornerFlyoutPen: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.55)",
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 6,
  },
  cornerFlyoutPressed: {
    opacity: 0.85,
  },
  cardLayerBase: {
    ...StyleSheet.absoluteFillObject,
  },
  cardLayerTopGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  cardLayerGlassFog: {
    ...StyleSheet.absoluteFillObject,
  },
  cardLayerShine: {
    ...StyleSheet.absoluteFillObject,
  },
  cardGlowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  cardFrameUpset: {
    borderColor: "rgba(185,28,28,0.85)",
    shadowColor: "rgba(220,38,38,0.75)",
    shadowOpacity: 0.55,
    shadowRadius: 24,
  },
  cardFrameStreakRed: {
    borderColor: "rgba(248,113,113,0.75)",
    shadowColor: "rgba(239,68,68,0.45)",
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  cardFrameStreakOrange: {
    borderColor: "rgba(253,186,116,0.75)",
    shadowColor: "rgba(249,115,22,0.4)",
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  cardFrameStreakGold: {
    borderColor: "rgba(253,224,71,0.75)",
    shadowColor: "rgba(250,204,21,0.35)",
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  cardFrameHit: {
    borderColor: "rgba(250,204,21,0.72)",
    shadowColor: "rgba(250,204,21,0.45)",
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  cardFrameMiss: {
    borderColor: "rgba(107,114,128,0.55)",
    shadowColor: "rgba(100,116,139,0.35)",
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  cardContent: {
    flex: 1,
    minHeight: 0,
    flexDirection: "column",
    position: "relative",
    zIndex: 2,
  },
  /** 上半：リーグ行の直下にユニ・スコアを置く（`space-between` だとブロックが下に寄りすぎる） */
  cardUpperPane: {
    flex: 1,
    minHeight: 0,
    justifyContent: "flex-start",
    gap: 6,
  },
  /** 下半：区切り＋スタッツ（可用高さの 50%） */
  cardLowerPane: {
    flex: 1,
    minHeight: 0,
    justifyContent: "center",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 0,
    backgroundColor: "transparent",
  },
  /** リーグ略称スロット（Skia ラベル：位置の微調整） */
  leagueLabelSlot: {
    marginTop: 4,
    marginLeft: 4,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 6,
    maxWidth: "72%",
  },
  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    maxWidth: 120,
  },
  streakRed: {
    backgroundColor: "rgba(185,28,28,0.95)",
    borderWidth: 1,
    borderColor: "rgba(254,202,202,0.5)",
  },
  streakOrange: {
    backgroundColor: "rgba(234,88,12,0.95)",
    borderWidth: 1,
    borderColor: "rgba(254,215,170,0.55)",
  },
  streakGold: {
    backgroundColor: "rgba(234,179,8,0.95)",
    borderWidth: 1,
    borderColor: "rgba(254,249,195,0.7)",
  },
  badgeHit: {
    backgroundColor: "rgba(250,204,21,0.95)",
  },
  badgeHitText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0a0a0a",
  },
  badgeUpset: {
    backgroundColor: "rgba(239,68,68,0.95)",
  },
  badgeUpsetText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#fff",
  },
  badgeMiss: {
    backgroundColor: "rgba(100,116,139,0.95)",
  },
  badgeMissText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#fff",
  },
  /** Web LiveMatchMark（resultMobile）に寄せた LIVE ピル */
  badgeLive: {
    backgroundColor: "rgba(220,38,38,0.95)",
    borderWidth: 1,
    borderColor: "rgba(254,202,202,0.5)",
  },
  badgeLiveText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.6,
  },
  matchGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  sideCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  centerCol: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  scoreDateLabel: {
    color: "rgba(248,250,252,0.45)",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  teamName: {
    marginTop: 7,
    fontSize: 15,
    fontWeight: "800",
    color: "rgba(248,250,252,0.95)",
    letterSpacing: 0.65,
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  predictedScore: {
    fontSize: 19,
    fontWeight: "800",
    color: "rgba(255,255,255,0.88)",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  finalScore: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(253,224,71,0.95)",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  divider: {
    marginTop: 0,
    marginBottom: 3,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.14)",
  },
  statBlock: {
    flex: 1,
    minHeight: 0,
    justifyContent: "center",
    gap: 9,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 1,
  },
  statLabel: {
    width: 96,
    flexShrink: 0,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
  },
  statValue: {
    width: 40,
    flexShrink: 0,
    textAlign: "right",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  statValueWhite: {
    color: "rgba(255,255,255,0.95)",
  },
  statValueYellow: {
    color: "rgba(253,224,71,0.95)",
  },
  statValueRed: {
    color: "rgba(248,113,113,0.95)",
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: "center",
    gap: 8,
  },
});
