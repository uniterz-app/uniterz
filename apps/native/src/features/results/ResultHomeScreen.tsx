import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import CountryFlagNative from "../games/CountryFlagNative";
import { resolvePostListLeague } from "../../../../../lib/leagues";
import { MATCH_CARD_DISPLAY_FONT, MATCH_CARD_SCORE_FONT } from "../games/matchCardTypography";
import { resolveTeamJerseyPalette, resolveTeamPrimaryColor } from "../games/teamColors";
import type { PostWithMillis, ResultDayGroup } from "./nativeResultModel";
import { canDismissResultListPostNow } from "./nativeResultModel";
import ResultListFiltersNative, {
  type ResultFilterState,
} from "./ResultListFiltersNative";
import {
  DEFAULT_RESULT_LIST_FILTERS,
  isDefaultResultListFilters,
  postMatchesResultListFilters,
} from "../../../../../lib/result/resultListFilterMatch";
import UnderlineTabsNative from "../../ui/UnderlineTabsNative";
import CyberMenuButton from "../../ui/CyberMenuButton";
import { useResultLeagueFlagsNative, type ResultListLeagueTab } from "./useResultLeagueFlagsNative";
import ResultOutcomeBadgesNative from "./ResultOutcomeBadgesNative";
import {
  DISPLAY_FONT,
  MOBILE_RESULT_CARD_GAP,
  MOBILE_RESULT_CARD_MAX_W,
  MOBILE_RESULT_JERSEY_SIZE,
  MOBILE_RESULT_PAGE_PAD_X,
  MOBILE_RESULT_PAGE_PAD_Y,
  MOBILE_RESULT_SECTION_GAP,
  MOBILE_RESULT_STAT_LABEL_W,
  MOBILE_RESULT_STAT_ROW_GAP,
  MOBILE_RESULT_STAT_VALUE_W,
  NUMERIC_FONT,
  resultCardShellNative,
  resultDayStripPanelNative,
  resultFilterBarNative,
} from "./resultMobileUiNative";
import { isResultPostLiveGame, isResultPostMatchStarted } from "../../../../../lib/result/resultLiveGame";
import {
  dayPointsHeaderForNative,
  type NativeDayPointsHeader,
} from "./nativeResultDaySummary";
import { resolveResultOutcomeBadge } from "../../../../../lib/result/resultBadge";
import {
  deletePredictionPostApi,
  PredictionApiError,
} from "../games/submitPredictionApi";
import ResultStatRatingBarNative from "./ResultStatRatingBarNative";
import ResultDetailScreen from "./ResultDetailScreen";
import ResultLeagueLabelSkia from "./ResultLeagueLabelSkia";
import ResultHitCyberFrameNative from "./ResultHitCyberFrameNative";
import ResultMatchScoreLineNative from "./ResultMatchScoreLineNative";
import ResultDeleteConfirmModal from "./ResultDeleteConfirmModal";
import ResultPredictEditModal from "./ResultPredictEditModal";
import ResultGlassShellNative from "./ResultGlassShellNative";
import { useNativeResultPosts } from "./useNativeResultPosts";
import {
  useResultDayHeaderEntrance,
  useResultEntranceArmed,
  useResultFilterBarEntrance,
  useResultPostCardEntrance,
  type ResultStatRowEntranceMeta,
} from "./useResultHomeEntrance";
import WcMatchGoalScorersColumnNative from "./WcMatchGoalScorersColumnNative";
import WcGoalScorerResultRowNative from "./WcGoalScorerResultRowNative";
import { useWcGoalScorerResultNative, type WcGoalScorerPostLike } from "./useWcGoalScorerResultNative";
import { readPostMatchGoalScorers } from "../../../../../lib/wc/matchGoalScorers";

const JERSEY_SIZE_RESULT = MOBILE_RESULT_JERSEY_SIZE;

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

function ResultDayHeaderGridOverlay({ mobileStrip = false }: { mobileStrip?: boolean }) {
  const step = mobileStrip ? 14 : DAY_HEADER_GRID_STEP;
  const lineColor = mobileStrip ? "rgba(34,211,238,0.45)" : DAY_HEADER_GRID_LINE;
  const opacity = mobileStrip ? 1 : DAY_HEADER_GRID_OPACITY;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const verticalLefts = useMemo(() => {
    const out: number[] = [];
    for (let x = step; x < size.w; x += step) {
      out.push(x);
    }
    return out;
  }, [size.w, step]);
  const horizontalTops = useMemo(() => {
    const out: number[] = [];
    for (let y = step; y < size.h; y += step) {
      out.push(y);
    }
    return out;
  }, [size.h, step]);

  function onGridLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  return (
    <View pointerEvents="none" style={dayHeaderGridStyles.overlay} onLayout={onGridLayout}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { opacity }]}
      >
        {verticalLefts.map((left) => (
          <View
            key={`dhgv-${left}`}
            style={[dayHeaderGridStyles.gridLineV, { left, backgroundColor: lineColor }]}
          />
        ))}
        {horizontalTops.map((top) => (
          <View
            key={`dhgh-${top}`}
            style={[dayHeaderGridStyles.gridLineH, { top, backgroundColor: lineColor }]}
          />
        ))}
      </View>
    </View>
  );
}

const LEAGUE_LABEL: Record<string, string> = {
  nba: "NBA",
  bj: "B1",
  pl: "PL",
  j1: "J1",
  wc: "WC",
};

/** Web `ResultLeagueBadge` の pill 背景 */
const LEAGUE_PILL_BG: Record<string, string> = {
  nba: "#1D428A",
  bj: "#C8102E",
  pl: "#3A0CA3",
  j1: "#E10600",
  wc: "#56042C",
};

const NUMERIC_FONT_FAMILY = NUMERIC_FONT;
const DISPLAY_FONT_FAMILY = DISPLAY_FONT;
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

type StreakBadge = { label: string; tone: "silver" | "platinum" | "gold" };

function getStreakBadge(activeWinStreak: unknown, isEn: boolean): StreakBadge | null {
  const v =
    typeof activeWinStreak === "number" && Number.isFinite(activeWinStreak)
      ? Math.floor(activeWinStreak)
      : 0;
  if (v < 3) return null;
  if (v >= 7) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      tone: "gold",
    };
  }
  if (v >= 5) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      tone: "platinum",
    };
  }
  return {
    label: isEn ? `${v} Win Streak` : `${v}連勝`,
    tone: "silver",
  };
}

type ResultBadge = "hit" | "perfect" | "upset" | "miss" | "streak" | null;

function getMobileTeamName(
  league: "nba" | "bj" | "j1" | "pl" | "wc",
  rawName: string,
  l1: string,
  l2?: string
): string {
  if (league === "nba") return l2 || rawName;
  if (league === "pl") return getTeamAlias(rawName) ?? rawName;
  if (league === "wc") return rawName.trim().toUpperCase();
  return [l1, l2].filter(Boolean).join(" ");
}

function ResultListHeaderBlock({
  cacheCapped,
  hintText,
  filterLabel,
  filterCollapseLabel,
  entranceArmed,
  onFilterPress,
  filterPanelOpen,
  filterActive,
  filterPanel,
  leagueTabs,
}: {
  cacheCapped: boolean;
  hintText: string;
  filterLabel: string;
  filterCollapseLabel: string;
  entranceArmed: boolean;
  onFilterPress: () => void;
  filterPanelOpen: boolean;
  filterActive: boolean;
  filterPanel?: React.ReactNode;
  leagueTabs?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const filterMotion = useResultFilterBarEntrance(entranceArmed, reduceMotion);
  return (
    <View style={styles.headerBlock}>
      {leagueTabs}
      {cacheCapped ? <Text style={styles.hint}>{hintText}</Text> : null}
      <View style={styles.listRowOuter}>
        <Animated.View style={filterMotion}>
          <Pressable
            style={({ pressed }) => [
              resultFilterBarNative.bar,
              styles.filterBarRow,
              pressed && resultFilterBarNative.barPressed,
            ]}
            onPress={onFilterPress}
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={16}
              color="rgba(255,255,255,0.6)"
              style={filterPanelOpen ? styles.filterChevronOpen : undefined}
            />
            <Text style={resultFilterBarNative.text}>
              {filterPanelOpen ? filterCollapseLabel : filterLabel}
            </Text>
            {filterActive ? <View style={styles.filterActiveDot} /> : null}
          </Pressable>
        </Animated.View>
      </View>
      {filterPanelOpen ? filterPanel : null}
    </View>
  );
}

function ResultDayHeader({
  dateLabel,
  dayPoints,
  entranceActive,
  sectionStaggerIndex,
}: {
  dateLabel: string;
  dayPoints: NativeDayPointsHeader;
  entranceActive: boolean;
  sectionStaggerIndex: number;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const { clipStyle, dateClusterStyle, rightClusterStyle } = useResultDayHeaderEntrance(
    entranceActive,
    reduceMotion,
    sectionStaggerIndex
  );
  return (
    <View style={[styles.listRowOuter, styles.dayHeaderSpacing]}>
      <View style={resultDayStripPanelNative.outer}>
        <Animated.View style={[resultDayStripPanelNative.panel, clipStyle]}>
          <View style={resultDayStripPanelNative.leftAccent} pointerEvents="none" />
          <ResultDayHeaderGridOverlay mobileStrip />
          <View style={resultDayStripPanelNative.row}>
            <Animated.View style={dateClusterStyle}>
              <Text style={resultDayStripPanelNative.date}>{dateLabel}</Text>
            </Animated.View>
            <Animated.View style={[styles.dayHeaderRightCluster, rightClusterStyle]}>
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
            </Animated.View>
          </View>
        </Animated.View>
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
  entranceEnabled,
  onOpenDetail,
  onRequestDeleteConfirm,
  onRequestPredictEdit,
}: {
  post: PostWithMillis;
  language: "ja" | "en";
  nowMs: number;
  viewerUid: string | null;
  /** 一覧入場のスタッガー（試合一覧と同じ「浮き出し」入場） */
  listEnterIndex: number;
  /** 結果タブ初回表示のみ入場アニメを有効化 */
  entranceEnabled: boolean;
  onOpenDetail: (id: string) => void;
  /** Web 同様：カスタム削除確認モーダルを開く */
  onRequestDeleteConfirm: (post: PostWithMillis) => void;
  /** Web `onRequestPredictEdit`（未接続時はペンを出さない） */
  onRequestPredictEdit?: (post: PostWithMillis) => void;
}) {
  const isEn = language === "en";
  const [cornerFabOpen, setCornerFabOpen] = useState(false);
  const reduceMotionList = useReducedMotion() ?? false;

  const postStatus = typeof post.status === "string" ? post.status : "";
  const startAtMs =
    typeof post.startAtMillis === "number" && Number.isFinite(post.startAtMillis)
      ? post.startAtMillis
      : null;
  /** Web `ResultCard` の `isMatchStarted` と同じ */
  const isMatchStarted = isResultPostMatchStarted(
    { status: postStatus, startAtMillis: startAtMs },
    nowMs
  );

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
  const showLiveMark = isResultPostLiveGame(
    { status: postStatus, startAtMillis: startAtMs },
    nowMs
  );

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

  const leagueKey = resolvePostListLeague({
    league: post.league,
    gameId: post.gameId,
  });
  const isWcCard = leagueKey === "wc";
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
  const hasPredictedScore = typeof ph === "number" && typeof pa === "number";

  const rh = result?.home;
  const ra = result?.away;
  const hasFinal = typeof rh === "number" && typeof ra === "number";

  const wcMatchGoalScorers = useMemo(() => {
    if (!isWcCard || !hasFinal) return [];
    return readPostMatchGoalScorers(
      (post as { matchGoalScorers?: unknown }).matchGoalScorers
    );
  }, [isWcCard, hasFinal, post]);

  const wcGoalScorer = useWcGoalScorerResultNative(post as WcGoalScorerPostLike);

  const activeWinStreak =
    toInt((stats?.pointsV3Detail as { activeWinStreak?: number } | undefined)?.activeWinStreak) ??
    0;
  const streakBadge = getStreakBadge(activeWinStreak, isEn);
  const badge: ResultBadge = resolveResultOutcomeBadge({
    stats,
    prediction: pred,
    result,
    upsetHit: Boolean(stats?.upsetHit),
    isWin:
      stats?.isWin === true ? true : stats?.isWin === false ? false : undefined,
    activeWinStreak,
  });

  const statRows = useMemo(() => {
    const scorePrecision = toNumber(stats?.scorePrecision, 0);
    const upsetPoints = toNumber(stats?.upsetPoints, 0);
    const pointsV3 = toNumber(stats?.pointsV3, 0);
    const showScorePrecision = leagueKey !== "wc";
    return [
      ...(showScorePrecision
        ? [
            {
              key: "scorePrecision" as const,
              label: isEn ? "Score Precision" : "スコア精度",
              value: scorePrecision,
              barMax: 10,
              format: (v: number) => v.toFixed(1),
            },
          ]
        : []),
      {
        key: "upsetPoints" as const,
        label: isEn ? "Upset Score" : "アップセット",
        value: upsetPoints,
        barMax: 10,
        format: (v: number) =>
          hadUpsetGame ? `${(Math.round(v * 10) / 10).toFixed(1)}` : "--",
      },
      {
        key: "pointsV3" as const,
        label: isEn ? "Total Score" : "総合得点",
        value: pointsV3,
        barMax: 10,
        format: (v: number) => `${(Math.round(v * 10) / 10).toFixed(1)}`,
      },
    ];
  }, [stats, isEn, hadUpsetGame, leagueKey]);

  const statRowEntranceMeta = useMemo((): [
    ResultStatRowEntranceMeta,
    ResultStatRowEntranceMeta,
    ResultStatRowEntranceMeta,
  ] => {
    const metas = statRows.map((row) => {
      const cap = row.barMax;
      const ratio =
        row.key === "upsetPoints" && !hadUpsetGame
          ? 0
          : cap > 0
            ? clamp01(row.value / cap)
            : 0;
      return { skipBarGrow: ratio === 0 };
    });
    while (metas.length < 3) metas.push({ skipBarGrow: true });
    return metas.slice(0, 3) as [
      ResultStatRowEntranceMeta,
      ResultStatRowEntranceMeta,
      ResultStatRowEntranceMeta,
    ];
  }, [statRows, hadUpsetGame]);

  const entrance = useResultPostCardEntrance({
    rowIndex: listEnterIndex,
    entranceEnabled,
    reduceMotion: reduceMotionList,
    badge,
    hasFinalScore: hasFinal,
    statRowMeta: statRowEntranceMeta,
  });

  const frameStyle =
    badge === "upset"
      ? styles.cardFrameUpset
      : badge === "streak" && activeWinStreak >= 7
        ? styles.cardFrameStreakGold
        : badge === "streak" && activeWinStreak >= 5
          ? styles.cardFrameStreakPlatinum
          : badge === "streak"
            ? styles.cardFrameStreakSilver
            : badge === "perfect"
              ? styles.cardFramePerfect
            : badge === "hit"
              ? styles.cardFrameHit
              : badge === "miss"
                ? styles.cardFrameMiss
                : null;

  const shellOverflowStyle =
    cornerFabOpen && hasCornerActions ? styles.cardShellOverflowVisible : null;

  const shellBorderColor =
    typeof (frameStyle as ViewStyle | null)?.borderColor === "string"
      ? ((frameStyle as ViewStyle).borderColor as string)
      : "rgba(255,255,255,0.10)";
  const shellShadowStyle: ViewStyle | null = frameStyle
    ? {
        shadowColor: (frameStyle as ViewStyle).shadowColor,
        shadowOpacity: (frameStyle as ViewStyle).shadowOpacity,
        shadowRadius: (frameStyle as ViewStyle).shadowRadius,
        elevation: (frameStyle as ViewStyle).elevation,
      }
    : null;

  return (
    <Animated.View
      collapsable={false}
      style={[styles.listRowOuter, styles.cardOuter, entrance.cardShellMotionStyle]}
    >
      <AnimatedResultCardPressable
        collapsable={false}
        style={({ pressed }) => [styles.resultCardPressable, pressed && styles.cardPressed]}
        onPress={() => {
          /** Web：FAB 外タップでメニューを閉じる（詳細は閉じた後のタップで） */
          if (cornerFabOpen) {
            setCornerFabOpen(false);
            return;
          }
          onOpenDetail(post.id);
        }}
      >
      <ResultGlassShellNative
        borderColor={shellBorderColor}
        shellStyle={[styles.cardShell, shellShadowStyle]}
        overflowVisible={Boolean(shellOverflowStyle)}
      >
        <View style={styles.cardBadgeOverlay} pointerEvents="none">
          <Animated.View style={[styles.cardBadgeLeague, entrance.subBadgesStyle]}>
            {leagueKey === "nba" || leagueKey === "wc" ? (
              <ResultLeagueLabelSkia text={pillText} style={styles.leagueLabelSlot} />
            ) : (
              <View
                style={[
                  styles.leaguePill,
                  { backgroundColor: LEAGUE_PILL_BG[leagueKey] ?? "#334155" },
                ]}
              >
                <Text style={styles.leaguePillText}>{pillText}</Text>
              </View>
            )}
          </Animated.View>
          <Animated.View
            style={[
              styles.cardBadgeOutcome,
              hasCornerActions && styles.cardBadgeOutcomeWithFab,
              entrance.hitMissBadgeStyle,
            ]}
          >
            <ResultOutcomeBadgesNative
              badge={badge}
              streakBadge={streakBadge}
              activeWinStreak={activeWinStreak}
              showLiveMark={showLiveMark}
              hitBadgeSubtle
            />
          </Animated.View>
        </View>
        <Animated.View style={[resultCardShellNative.body, entrance.cardBodyGateStyle]}>
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
              <CyberMenuButton
                size="xs"
                onPress={() => setCornerFabOpen((v) => !v)}
                accessibilityLabel={isEn ? "Open actions" : "操作メニュー"}
                accessibilityState={{ expanded: cornerFabOpen }}
              />
            </View>
          ) : null}

          <View style={styles.cardContent}>
          <View style={styles.matchArea}>
            <View style={styles.matchGrid}>
              <View style={[styles.sideCol, styles.sideColHome]}>
                <Animated.View style={entrance.homeJerseyMarkStyle}>
                  {isWcCard ? (
                    <CountryFlagNative teamId={home?.teamId} variant="result" />
                  ) : (
                    <JerseyMarkAdaptive
                      accent={homeJersey.primary}
                      accentEnd={homeJersey.secondary}
                      size={JERSEY_SIZE_RESULT}
                    />
                  )}
                </Animated.View>
                <Animated.View style={entrance.homeTeamLabelStyle}>
                  <Text
                    style={[styles.teamName, isWcCard && styles.teamNameWc]}
                    numberOfLines={1}
                  >
                    {homeName}
                  </Text>
                </Animated.View>
                {wcMatchGoalScorers.length > 0 ? (
                  <WcMatchGoalScorersColumnNative
                    scorers={wcMatchGoalScorers}
                    side="home"
                  />
                ) : null}
              </View>
              <View style={[styles.sideCol, styles.sideColAway]}>
                <Animated.View style={entrance.awayJerseyMarkStyle}>
                  {isWcCard ? (
                    <CountryFlagNative teamId={away?.teamId} variant="result" />
                  ) : (
                    <JerseyMarkAdaptive
                      accent={awayJersey.primary}
                      accentEnd={awayJersey.secondary}
                      size={JERSEY_SIZE_RESULT}
                    />
                  )}
                </Animated.View>
                <Animated.View style={entrance.awayTeamLabelStyle}>
                  <Text
                    style={[styles.teamName, isWcCard && styles.teamNameWc]}
                    numberOfLines={1}
                  >
                    {awayName}
                  </Text>
                </Animated.View>
                {wcMatchGoalScorers.length > 0 ? (
                  <WcMatchGoalScorersColumnNative
                    scorers={wcMatchGoalScorers}
                    side="away"
                  />
                ) : null}
              </View>
            </View>
            <View style={styles.centerScoreOverlay} pointerEvents="none">
              <Animated.View style={entrance.predictedScoreStyle}>
                {hasPredictedScore ? (
                  <ResultMatchScoreLineNative
                    home={ph}
                    away={pa}
                    variant="predicted"
                    density="list"
                  />
                ) : (
                  <Text style={styles.predictedScoreFallback}>— – —</Text>
                )}
              </Animated.View>
              {hasFinal ? (
                <Animated.View style={[entrance.finalScoreStyle, styles.finalScoreWrap]}>
                  <ResultMatchScoreLineNative
                    home={rh}
                    away={ra}
                    variant="final"
                    density="list"
                  />
                </Animated.View>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />
          <View style={styles.statBlock}>
            {wcGoalScorer ? (
              <WcGoalScorerResultRowNative
                label={isEn ? "Goal scorer" : "ゴールする選手"}
                info={wcGoalScorer}
              />
            ) : null}
            {statRows.map((row, rowIndex) => {
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
              const ri = rowIndex as 0 | 1 | 2;
              return (
                <View key={row.key} style={styles.statRow}>
                  <Text style={styles.statLabel} numberOfLines={1}>
                    {row.label}
                  </Text>
                  <Animated.View
                    style={[styles.statBarRevealSlot, entrance.statBarSlotStyles[ri]]}
                  >
                    <ResultStatRatingBarNative ratio={ratio} size="sm" metricKey={row.key} />
                  </Animated.View>
                  <Animated.View style={entrance.statValueStyles[ri]}>
                    <Text style={[styles.statValue, valueStyle]}>{display}</Text>
                  </Animated.View>
                </View>
              );
            })}
          </View>
          </View>
        </Animated.View>
        {badge === "hit" ? <ResultHitCyberFrameNative /> : null}
      </ResultGlassShellNative>
      </AnimatedResultCardPressable>
    </Animated.View>
  );
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
  const insets = useSafeAreaInsets();
  const listTopPad = insets.top + MOBILE_RESULT_PAGE_PAD_Y;
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
            filterClose: "閉じる",
          }
        : {
            empty: "No predictions yet.",
            cacheHint: "Older posts may be omitted from this list.",
            pull: "Pull to refresh",
            filterFold: "Specify filters",
            filterClose: "Close",
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

  const { showResultLeagueTabs, defaultLeagueTab } = useResultLeagueFlagsNative(uid ?? null);
  const [leagueTab, setLeagueTab] = useState<ResultListLeagueTab>("nba");
  useEffect(() => {
    setLeagueTab(defaultLeagueTab);
  }, [defaultLeagueTab]);

  const [resultFilters, setResultFilters] = useState<ResultFilterState>({
    ...DEFAULT_RESULT_LIST_FILTERS,
    detailOpen: false,
  });

  const filteredGrouped = useMemo(() => {
    return grouped
      .map((g) => {
        const filterPost = (p: PostWithMillis) => {
          if (!postMatchesResultListFilters(p, resultFilters)) return false;
          if (showResultLeagueTabs && leagueTab !== "all") {
            const league = (p.leagueId ?? p.league) as string | undefined;
            if (leagueTab === "nba" && league === "wc") return false;
            if (leagueTab === "wc" && league !== "wc") return false;
          }
          return true;
        };
        const pending = g.pending.filter(filterPost);
        const final = g.final.filter(filterPost);
        return { ...g, pending, final };
      })
      .filter((g) => g.pending.length > 0 || g.final.length > 0);
  }, [grouped, resultFilters, leagueTab, showResultLeagueTabs]);

  const sections: SectionT[] = useMemo(() => {
    let baseFlatIndex = 0;
    return filteredGrouped.map((g: ResultDayGroup) => {
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
  }, [filteredGrouped]);

  /** 初回マウント時のみ一覧入場を有効化（スクロールで遅延マウントされた日付帯は除外） */
  const entranceArmed = useResultEntranceArmed();
  const [initialSectionIdSet, setInitialSectionIdSet] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (sections.length === 0 || initialSectionIdSet !== null) return;
    setInitialSectionIdSet(new Set(sections.map((s) => `${s.dateLabel}:${s.baseFlatIndex}`)));
  }, [sections, initialSectionIdSet]);

  const onFilterPress = useCallback(() => {
    setResultFilters((f) => ({ ...f, detailOpen: !f.detailOpen }));
  }, []);

  const listHeader = (
    <ResultListHeaderBlock
      cacheCapped={postsCacheCapped}
      hintText={t.cacheHint}
      filterLabel={t.filterFold}
      filterCollapseLabel={t.filterClose}
      entranceArmed={entranceArmed}
      onFilterPress={onFilterPress}
      filterPanelOpen={resultFilters.detailOpen}
      filterActive={!isDefaultResultListFilters(resultFilters)}
      leagueTabs={
        showResultLeagueTabs ? (
          <UnderlineTabsNative
            split
            items={[
              { id: "nba" as ResultListLeagueTab, label: "NBA" },
              { id: "wc" as ResultListLeagueTab, label: "WC" },
            ]}
            activeId={leagueTab}
            onChange={setLeagueTab}
          />
        ) : null
      }
      filterPanel={
        <ResultListFiltersNative
          language={language}
          filters={resultFilters}
          onChange={setResultFilters}
          hideScorePrecision={leagueTab === "wc"}
        />
      }
    />
  );

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

  const listEmpty =
    !loading && filteredGrouped.length === 0 ? (
      <View style={styles.emptyNoDataWrap}>
        <Text style={styles.emptyNoDataText}>NO DATA</Text>
      </View>
    ) : null;

  const showInitialSpinner = loading && grouped.length === 0;

  /** 下端はスクロール内容側のパディングのみ（親に付けるとナビ下が塗りつぶされリストが届かない） */
  const listContentWithBottomPad = useMemo(
    () => [styles.listContent, { paddingTop: listTopPad, paddingBottom: bottomReserveY }],
    [bottomReserveY, listTopPad]
  );

  return (
    <View style={styles.resultScreenWrap}>
    <View style={styles.root}>
      {showInitialSpinner ? (
        <View style={[styles.centered, { paddingTop: listTopPad, paddingBottom: bottomReserveY }]}>
          <BlocksPulseLoader />
        </View>
      ) : sections.length === 0 ? (
        <View style={[styles.listContent, { paddingTop: listTopPad, paddingBottom: bottomReserveY }]}>
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
          renderSectionHeader={({ section }) => {
            const sid = `${section.dateLabel}:${section.baseFlatIndex}`;
            const isInitialHeader = initialSectionIdSet?.has(sid) ?? false;
            const sectionIndex = sections.findIndex(
              (s) => s.dateLabel === section.dateLabel && s.baseFlatIndex === section.baseFlatIndex
            );
            return (
              <ResultDayHeader
                dateLabel={section.dateLabel}
                dayPoints={dayPointsHeaderForNative(section.final, section.pending, language)}
                entranceActive={entranceArmed && isInitialHeader}
                sectionStaggerIndex={sectionIndex >= 0 ? sectionIndex : 0}
              />
            );
          }}
          renderItem={({ item, index, section }) => (
            <ResultPostCard
              post={item}
              language={language}
              nowMs={listNowTick}
              viewerUid={uid}
              listEnterIndex={section.baseFlatIndex + index}
              entranceEnabled={entranceArmed}
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
    backgroundColor: "transparent",
  },
  root: {
    flex: 1,
    backgroundColor: "transparent",
    minHeight: 0,
    zIndex: 1,
  },
  /** フローティングナビの背後までスクロール背景を伸ばす */
  listScroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  listContent: {
    /** Web `/mobile/result` の px-[18px]（親 mainArea xs=8 を差し引く） */
    paddingHorizontal: Math.max(0, MOBILE_RESULT_PAGE_PAD_X - spacing.xs),
    flexGrow: 1,
    gap: MOBILE_RESULT_SECTION_GAP,
  },
  headerBlock: {
    marginBottom: MOBILE_RESULT_SECTION_GAP,
  },
  filterBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  filterChevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  filterActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(34,211,238,0.95)",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    marginLeft: "auto",
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.34)",
    backgroundColor: "rgba(8,11,18,0.84)",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  filterBarPressed: {
    opacity: 0.88,
  },
  filterBarText: {
    color: "rgba(224,250,254,0.88)",
    fontSize: 13,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyNoDataWrap: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl * 2,
  },
  emptyNoDataText: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 36,
    letterSpacing: 3.5,
    color: "rgba(255,255,255,0.92)",
    textShadowColor: "rgba(34,211,238,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  sectionGap: {
    height: MOBILE_RESULT_SECTION_GAP,
  },
  dayHeaderSpacing: {
    marginBottom: MOBILE_RESULT_CARD_GAP,
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
  /** 日付テキストのみスキャン方向の移動を付ける（レイアウト幅は維持） */
  dayHeaderDateSlot: {
    flexShrink: 0,
  },
  /** hit / 総合 / pending をまとめてフェード（日付より 100ms 遅れ） */
  dayHeaderRightCluster: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
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
    marginBottom: MOBILE_RESULT_CARD_GAP,
    maxWidth: MOBILE_RESULT_CARD_MAX_W,
    alignSelf: "center",
    width: "100%",
  },
  resultCardPressable: {
    flexShrink: 0,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  cardShell: {
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
  },
  /** Web モバイル `ResultCard` の contentPad（px-2 pb-2 pt-9） */
  cardPressableBody: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: 8,
    paddingTop: 36,
    paddingBottom: 8,
  },
  /** Web モバイル：左上リーグ / 右上 outcome を absolute 配置 */
  cardBadgeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 6,
    zIndex: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 8,
  },
  cardBadgeLeague: {
    maxWidth: "44%",
  },
  cardBadgeOutcome: {
    flex: 1,
    alignItems: "flex-end",
    maxWidth: "72%",
    paddingRight: 8,
  },
  cardBadgeOutcomeWithFab: {
    paddingRight: 44,
  },
  /** メニュー展開でフライアウトがはみ出すときのクリップ解除（Web と同様） */
  cardShellOverflowVisible: {
    overflow: "visible",
  },
  /** Web `ResultCard` の右上アクション簇（ハンバーガー＋フライアウト） */
  cornerFabCluster: {
    position: "absolute",
    top: 5,
    right: 9,
    zIndex: 50,
    minWidth: 22,
    minHeight: 22,
    alignItems: "flex-end",
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
  cardFrameUpset: {
    borderColor: "rgba(248,113,113,0.84)",
    shadowColor: "rgba(239,68,68,0.5)",
    shadowOpacity: 0.48,
    shadowRadius: 18,
  },
  cardFrameStreakSilver: {
    borderColor: "rgba(226,232,240,0.82)",
    shadowColor: "rgba(255,255,255,0.55)",
    shadowOpacity: 0.48,
    shadowRadius: 18,
  },
  cardFrameStreakPlatinum: {
    borderColor: "rgba(34,211,238,0.82)",
    shadowColor: "rgba(0,245,255,0.5)",
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  cardFrameStreakGold: {
    borderColor: "rgba(251,191,36,0.88)",
    shadowColor: "rgba(249,115,22,0.5)",
    shadowOpacity: 0.52,
    shadowRadius: 22,
  },
  cardFrameHit: {
    borderColor: "rgba(250,204,21,0.76)",
    shadowColor: "rgba(251,191,36,0.30)",
    shadowOpacity: 0.55,
    shadowRadius: 12,
  },
  cardFramePerfect: {
    borderColor: "rgba(167,139,250,0.8)",
    shadowColor: "rgba(139,92,246,0.45)",
    shadowOpacity: 0.44,
    shadowRadius: 16,
  },
  cardFrameMiss: {
    borderColor: "rgba(107,114,128,0.55)",
    shadowColor: "rgba(100,116,139,0.35)",
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  cardContent: {
    position: "relative",
    zIndex: 2,
    paddingTop: 0,
  },
  /** リーグ略称スロット（Web `ResultLeagueBadge` compact） */
  leagueLabelSlot: {
    marginTop: 0,
    marginLeft: 0,
  },
  leaguePill: {
    marginTop: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  leaguePillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
  },
  matchArea: {
    position: "relative",
    marginTop: 0,
    minHeight: 88,
  },
  matchGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  sideCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  sideColHome: {
    paddingTop: 0,
    paddingRight: 26,
  },
  sideColAway: {
    paddingTop: 0,
    paddingLeft: 26,
  },
  centerScoreOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 14,
    alignItems: "center",
    zIndex: 10,
    maxWidth: "100%",
    paddingHorizontal: 4,
  },
  teamName: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(248,250,252,0.95)",
    letterSpacing: 1.04,
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    textAlign: "center",
    width: "100%",
  },
  teamNameWc: {
    fontSize: 15,
    letterSpacing: 1.04,
  },
  predictedScoreFallback: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    textAlign: "center",
  },
  finalScoreWrap: {
    marginTop: 3,
  },
  divider: {
    marginTop: 6,
    marginBottom: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.14)",
  },
  statBlock: {
    marginTop: 4,
    gap: 6,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: MOBILE_RESULT_STAT_ROW_GAP,
    paddingVertical: 2,
  },
  /** Skia バーを左基点で scaleX 表示（親の overflow でクリップ） */
  statBarRevealSlot: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  statLabel: {
    width: MOBILE_RESULT_STAT_LABEL_W,
    flexShrink: 0,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
  },
  statValue: {
    width: MOBILE_RESULT_STAT_VALUE_W,
    flexShrink: 0,
    textAlign: "right",
    fontSize: 10,
    lineHeight: 14,
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
