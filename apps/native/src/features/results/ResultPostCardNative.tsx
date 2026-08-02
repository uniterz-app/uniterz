/**
 * Web `ResultCard` mobile dense 相当。リザルト一覧・プロフィール Result Drop 共用。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useReducedMotion } from "react-native-reanimated";
import type { Language } from "../../../../../lib/i18n/language";
import { t as i18nT } from "../../../../../lib/i18n/t";
import { resolvePostListLeague } from "../../../../../lib/leagues";
import { resolveResultBadgeDisplay } from "../../../../../lib/result/resultBadge";
import { isResultPostLiveGame, isResultPostMatchStarted } from "../../../../../lib/result/resultLiveGame";
import { resolvePkScoreFromResultPost } from "../../../../../lib/games/pkScore";
import { buildResultShareUrl, getShareAppOrigin } from "../../../../../lib/share/shareAppUrls";
import { getTeamAlias, splitTeamNameByLeague } from "../../utils/teamName";
import JerseyMarkAdaptive from "../games/JerseyMarkAdaptive";
import CountryFlagNative from "../games/CountryFlagNative";
import {
  isWcKnockoutGame,
  WcGroupStandingRecordLineNative,
  resolveWcGroupStageStandingForKnockoutDisplay,
  resolveWcResultCardGroupStanding,
  resolveWcGroupCodeLabel,
  WcMatchGoalScorersColumnNative,
  WcTeamFlagWithMetaNative,
  WcTeamNameMobileNative,
  WcGoalScorerResultRowNative,
  useWcGoalScorerResultNative,
  resolveWcMatchGoalScorersForDisplay,
  type WcGoalScorerPostLike,
} from "../games/legacyWcNativeShims";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_SCORE_FONT,
} from "../games/matchCardTypography";
import { resolveTeamJerseyPalette, resolveTeamPrimaryColor } from "../games/teamColors";
import { toCompactTeamName } from "../games/gameCardDisplayUtils";
import MatchPkResultLineNative from "../games/MatchPkResultLineNative";
import { useTeamRecordLineNative } from "../games/useTeamRecordLineNative";
import CornerMenuClusterNative from "../../ui/CornerMenuClusterNative";
import CyberChamferButtonNative from "../../ui/CyberChamferButtonNative";
import ShareLinkCaptureFooterNative from "../share/ShareLinkCaptureFooterNative";
import { cyberAlert } from "../../components/cyberAlert";
import type { PostWithMillis } from "./nativeResultModel";
import { canDismissResultListPostNow } from "./nativeResultModel";
import ResultGlassShellNative from "./ResultGlassShellNative";
import ResultHitCyberFrameNative from "./ResultHitCyberFrameNative";
import ResultPerfectCyberFrameNative from "./ResultPerfectCyberFrameNative";
import ResultStreakCyberFrameNative from "./ResultStreakCyberFrameNative";
import ResultMatchScoreLineNative from "./ResultMatchScoreLineNative";
import ResultOutcomeBadgesNative from "./ResultOutcomeBadgesNative";
import ResultStatRatingBarNative from "./ResultStatRatingBarNative";
import { RESULT_CYBER_FRAME_STROKE_WIDTH } from "./resultCyberFrameNativeMetrics";
import {
  DISPLAY_FONT,
  MOBILE_RESULT_CARD_GAP,
  MOBILE_RESULT_CARD_MAX_W,
  MOBILE_RESULT_JERSEY_SIZE,
  MOBILE_RESULT_JERSEY_WIDTH_SCALE,
  MOBILE_RESULT_MATCH_SIDE_SCORE_PAD,
  MOBILE_RESULT_STAT_LABEL_W,
  MOBILE_RESULT_STAT_ROW_GAP,
  MOBILE_RESULT_STAT_VALUE_W,
  NUMERIC_FONT,
  resultCardShellNative,
} from "./resultMobileUiNative";
import {
  useResultPostCardEntrance,
  type ResultStatRowEntranceMeta,
} from "./useResultHomeEntrance";
import { shareResultCardNative } from "./shareResultCardNative";

const JERSEY_SIZE_RESULT = MOBILE_RESULT_JERSEY_SIZE;
const JERSEY_WIDTH_SCALE = MOBILE_RESULT_JERSEY_WIDTH_SCALE;
const NUMERIC_FONT_FAMILY = NUMERIC_FONT;
const DISPLAY_FONT_FAMILY = DISPLAY_FONT;

const AnimatedResultCardPressable = Animated.createAnimatedComponent(Pressable);

const LEAGUE_LABEL: Record<string, string> = {
  nba: "NBA",
  bj: "B1",
  pl: "PL",
  j1: "J1",
  wc: "WC",
};

const LEAGUE_PILL_BG: Record<string, string> = {
  nba: "#1D428A",
  bj: "#C8102E",
  pl: "#3A0CA3",
  j1: "#E10600",
  wc: "#56042C",
};

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

export default function ResultPostCardNative({
  post,
  language,
  nowMs,
  viewerUid,
  listEnterIndex,
  entranceEnabled,
  siblingOverlayOpen,
  onOpenDetail,
  onRequestDeleteConfirm,
  onRequestPredictEdit,
  pkScore: pkScoreProp = null,
  compactSpacing = false,
}: {
  post: PostWithMillis;
  language: "ja" | "en";
  nowMs: number;
  viewerUid: string | null;
  /** 一覧入場のスタッガー（試合一覧と同じ「浮き出し」入場） */
  listEnterIndex: number;
  /** 結果タブ初回表示のみ入場アニメを有効化 */
  entranceEnabled: boolean;
  /** 詳細オーバーレイ表示中は一覧の Skia FX を止めて GPU 負荷を下げる */
  siblingOverlayOpen?: boolean;
  onOpenDetail: (id: string) => void;
  /** Web 同様：カスタム削除確認モーダルを開く */
  onRequestDeleteConfirm?: (post: PostWithMillis) => void;
  /** Web `onRequestPredictEdit`（未接続時はペンを出さない） */
  onRequestPredictEdit?: (post: PostWithMillis) => void;
  /** プロフィール等 — カード下マージンを抑える */
  compactSpacing?: boolean;
  pkScore?: { home: number; away: number } | null;
}) {
  const isEn = language === "en";
  const resultCopy = i18nT(language).results;
  const [cornerFabOpen, setCornerFabOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const captureRef = useRef<View>(null);
  const reduceMotionList = useReducedMotion() ?? false;
  const pauseListFx = Boolean(siblingOverlayOpen);

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
  const hasCornerTrash =
    Boolean(onRequestDeleteConfirm) && canDismissResultListPostNow(post, nowMs);
  const isPredictionFinalized = postStatus === "final";
  const hasCornerEdit = Boolean(
    viewerUid &&
      authorUid === viewerUid &&
      gameId &&
      !isPredictionFinalized &&
      onRequestPredictEdit
  );
  const hasCornerActions =
    !isMatchStarted && (hasCornerTrash || hasCornerEdit);
  const canShare =
    Boolean(viewerUid && authorUid === viewerUid) && !sharing;

  useEffect(() => {
    if (isMatchStarted) setCornerFabOpen(false);
  }, [isMatchStarted]);

  /** Web ResultCard の isLiveGame と同じ：開始〜確定まで LIVE */
  const showLiveMark = isResultPostLiveGame(
    { status: postStatus, startAtMillis: startAtMs },
    nowMs
  );

  const requestDeletePost = useCallback(() => {
    if (!onRequestDeleteConfirm) return;
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
  const postStageMeta = post as PostWithMillis & {
    wcStage?: string | null;
    roundLabel?: string | null;
    knockout?: boolean | null;
  };
  const isWcKnockout =
    isWcCard &&
    isWcKnockoutGame({
      league: post.league,
      wcStage: postStageMeta.wcStage,
      roundLabel: postStageMeta.roundLabel,
      knockout: postStageMeta.knockout,
    });
  const isBasketballCard = leagueKey === "nba" || leagueKey === "bj";
  const listScoreDensity = isBasketballCard ? "listBasketball" : "list";
  const pillText = LEAGUE_LABEL[leagueKey] ?? leagueKey.toUpperCase();

  const home = post.home as { name?: string; teamId?: string } | undefined;
  const away = post.away as { name?: string; teamId?: string } | undefined;
  const homeRecordLine = useTeamRecordLineNative(
    isWcCard ? home?.teamId : null,
    leagueKey
  );
  const awayRecordLine = useTeamRecordLineNative(
    isWcCard ? away?.teamId : null,
    leagueKey
  );
  const homeGroupStanding = useMemo(() => {
    if (!isWcCard) return null;
    return isWcKnockout
      ? resolveWcGroupStageStandingForKnockoutDisplay(home?.teamId, homeRecordLine)
      : resolveWcResultCardGroupStanding(home?.teamId, homeRecordLine);
  }, [isWcCard, isWcKnockout, home?.teamId, homeRecordLine]);
  const awayGroupStanding = useMemo(() => {
    if (!isWcCard) return null;
    return isWcKnockout
      ? resolveWcGroupStageStandingForKnockoutDisplay(away?.teamId, awayRecordLine)
      : resolveWcResultCardGroupStanding(away?.teamId, awayRecordLine);
  }, [isWcCard, isWcKnockout, away?.teamId, awayRecordLine]);
  const wcGroupCodeLabel = useMemo(
    () =>
      isWcCard
        ? resolveWcGroupCodeLabel(home?.teamId, away?.teamId)
        : null,
    [isWcCard, home?.teamId, away?.teamId]
  );
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
  const homeCompact = isWcCard
    ? toCompactTeamName(leagueKey, home?.name ?? "")
    : homeName;
  const awayCompact = isWcCard
    ? toCompactTeamName(leagueKey, away?.name ?? "")
    : awayName;

  const ph = pred?.score?.home;
  const pa = pred?.score?.away;
  const hasPredictedScore = typeof ph === "number" && typeof pa === "number";

  const rh = result?.home;
  const ra = result?.away;
  const hasFinal = typeof rh === "number" && typeof ra === "number";
  const pkScore =
    pkScoreProp ?? resolvePkScoreFromResultPost(post as Record<string, unknown>);
  const showShareInMenu = canShare;

  const shareLinkUrl = useMemo(
    () => buildResultShareUrl(post.id),
    [post.id]
  );

  const handleShareResult = useCallback(async () => {
    if (!canShare) return;
    setCornerFabOpen(false);
    setSharing(true);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    try {
      const pointsV3 = toNumber(stats?.pointsV3, NaN);
      const shareOutcome = await shareResultCardNative(captureRef, {
        language,
        homeName,
        awayName,
        predictedHome: hasPredictedScore ? ph : null,
        predictedAway: hasPredictedScore ? pa : null,
        finalHome: hasFinal ? rh : null,
        finalAway: hasFinal ? ra : null,
        totalPoints: hasFinal && Number.isFinite(pointsV3) ? pointsV3 : null,
        postId: post.id,
        appBaseUrl: getShareAppOrigin(),
      });
      if (shareOutcome === "failed") {
        cyberAlert("", resultCopy.shareResultCardFailed);
      }
    } finally {
      setSharing(false);
    }
  }, [
    awayName,
    canShare,
    hasFinal,
    hasPredictedScore,
    homeName,
    language,
    pa,
    ph,
    post.id,
    ra,
    resultCopy.shareResultCardFailed,
    rh,
    stats?.pointsV3,
  ]);

  const wcMatchGoalScorers = useMemo(() => {
    if (!isWcCard || !hasFinal) return [];
    return resolveWcMatchGoalScorersForDisplay({
      league: "wc",
      isFinal: true,
      matchGoalScorersRaw: (post as { matchGoalScorers?: unknown }).matchGoalScorers,
      homeTeamId: home?.teamId,
      awayTeamId: away?.teamId,
    });
  }, [isWcCard, hasFinal, post, home?.teamId, away?.teamId]);

  const wcGoalScorer = useWcGoalScorerResultNative(post as WcGoalScorerPostLike);

  const activeWinStreak =
    toInt((stats?.pointsV3Detail as { activeWinStreak?: number } | undefined)?.activeWinStreak) ??
    0;
  const streakBadge = getStreakBadge(activeWinStreak, isEn);
  const {
    frameBadge: badge,
    outcomeBadge,
    showStreakBadge,
    stackBadges,
  } = resolveResultBadgeDisplay({
    stats,
    prediction: pred,
    result,
    upsetHit: Boolean(stats?.upsetHit),
    isWin:
      stats?.isWin === true ? true : stats?.isWin === false ? false : undefined,
    activeWinStreak,
  });

  const statRows = useMemo(() => {
    const upsetPoints = toNumber(stats?.upsetPoints, 0);
    const pointsV3 = toNumber(stats?.pointsV3, 0);
    return [
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
    entranceEnabled: entranceEnabled && !pauseListFx,
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

  const showCornerControl =
    (!isMatchStarted && hasCornerActions) || canShare;
  const shellOverflowStyle =
    cornerFabOpen && showCornerControl ? styles.cardShellOverflowVisible : null;

  const shellBorderColor =
    typeof (frameStyle as ViewStyle | null)?.borderColor === "string"
      ? ((frameStyle as ViewStyle).borderColor as string)
      : "rgba(255,255,255,0.10)";
  const shellStrokeWidth =
    badge === "hit" ||
    badge === "perfect" ||
    badge === "upset" ||
    badge === "streak"
      ? RESULT_CYBER_FRAME_STROKE_WIDTH
      : 1;
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
      style={[
        styles.listRowOuter,
        compactSpacing ? styles.cardOuterCompact : styles.cardOuter,
        entrance.cardShellMotionStyle,
      ]}
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
      <View style={styles.cardCaptureWrap}>
      <View ref={captureRef} collapsable={false}>
      <ResultGlassShellNative
        borderColor={shellBorderColor}
        strokeWidth={shellStrokeWidth}
        shellStyle={[styles.cardShell, shellShadowStyle]}
        overflowVisible={Boolean(shellOverflowStyle)}
      >
        {(leagueKey !== "nba" && leagueKey !== "wc") ? (
        <View style={styles.cardBadgeOverlay} pointerEvents="none">
          <Animated.View style={[styles.cardBadgeLeague, entrance.subBadgesStyle]}>
            <View
              style={[
                styles.leaguePill,
                { backgroundColor: LEAGUE_PILL_BG[leagueKey] ?? "#334155" },
              ]}
            >
              <Text style={styles.leaguePillText}>{pillText}</Text>
            </View>
          </Animated.View>
        </View>
        ) : null}
        <Animated.View
          style={[styles.cardBadgeOutcomeAbsolute, entrance.hitMissBadgeStyle]}
          pointerEvents="none"
        >
          <ResultOutcomeBadgesNative
            badge={badge}
            outcomeBadge={outcomeBadge}
            showStreakBadge={showStreakBadge}
            stackBadges={stackBadges}
            streakBadge={streakBadge}
            activeWinStreak={activeWinStreak}
            showLiveMark={showLiveMark}
            hitBadgeSubtle
          />
        </Animated.View>
        <Animated.View style={[resultCardShellNative.body, entrance.cardBodyGateStyle]}>
          <View style={styles.cardContent}>
          <View style={styles.matchArea}>
            <View style={styles.matchGrid}>
              <View style={[styles.sideCol, styles.sideColHome]}>
                <Animated.View
                  style={[
                    entrance.homeJerseyMarkStyle,
                    isWcCard ? styles.wcTeamStack : styles.flagStack,
                  ]}
                >
                  {isWcCard ? (
                    <WcTeamFlagWithMetaNative teamId={home?.teamId} knockout={isWcKnockout}>
                      <CountryFlagNative teamId={home?.teamId} variant="result" />
                    </WcTeamFlagWithMetaNative>
                  ) : (
                    <View
                      style={{ transform: [{ scaleX: JERSEY_WIDTH_SCALE }] }}
                    >
                      <JerseyMarkAdaptive
                        accent={homeJersey.primary}
                        accentEnd={homeJersey.secondary}
                        size={JERSEY_SIZE_RESULT}
                      />
                    </View>
                  )}
                </Animated.View>
                <Animated.View style={entrance.homeTeamLabelStyle}>
                  {isWcCard ? (
                    <WcTeamNameMobileNative
                      name={homeCompact}
                      fit
                      containerStyle={styles.teamNameWcWrap}
                      style={[styles.teamName, styles.teamNameWc]}
                    />
                  ) : (
                    <Text style={styles.teamName} numberOfLines={1}>
                      {homeName}
                    </Text>
                  )}
                </Animated.View>
                {isWcCard && homeGroupStanding ? (
                  <WcGroupStandingRecordLineNative
                    standing={homeGroupStanding}
                    language={language}
                    textStyle={styles.teamRecordText}
                  />
                ) : null}
                {wcMatchGoalScorers.length > 0 ? (
                  <WcMatchGoalScorersColumnNative
                    scorers={wcMatchGoalScorers}
                    side="home"
                  />
                ) : null}
              </View>
              <View style={[styles.sideCol, styles.sideColAway]}>
                <Animated.View
                  style={[
                    entrance.awayJerseyMarkStyle,
                    isWcCard ? styles.wcTeamStack : styles.flagStack,
                  ]}
                >
                  {isWcCard ? (
                    <WcTeamFlagWithMetaNative teamId={away?.teamId} knockout={isWcKnockout}>
                      <CountryFlagNative teamId={away?.teamId} variant="result" />
                    </WcTeamFlagWithMetaNative>
                  ) : (
                    <View
                      style={{ transform: [{ scaleX: JERSEY_WIDTH_SCALE }] }}
                    >
                      <JerseyMarkAdaptive
                        accent={awayJersey.primary}
                        accentEnd={awayJersey.secondary}
                        size={JERSEY_SIZE_RESULT}
                      />
                    </View>
                  )}
                </Animated.View>
                <Animated.View style={entrance.awayTeamLabelStyle}>
                  {isWcCard ? (
                    <WcTeamNameMobileNative
                      name={awayCompact}
                      fit
                      containerStyle={styles.teamNameWcWrap}
                      style={[styles.teamName, styles.teamNameWc]}
                    />
                  ) : (
                    <Text style={styles.teamName} numberOfLines={1}>
                      {awayName}
                    </Text>
                  )}
                </Animated.View>
                {isWcCard && awayGroupStanding ? (
                  <WcGroupStandingRecordLineNative
                    standing={awayGroupStanding}
                    language={language}
                    textStyle={styles.teamRecordText}
                  />
                ) : null}
                {wcMatchGoalScorers.length > 0 ? (
                  <WcMatchGoalScorersColumnNative
                    scorers={wcMatchGoalScorers}
                    side="away"
                  />
                ) : null}
              </View>
            </View>
            <View style={styles.centerScoreOverlay} pointerEvents="none">
              {wcGroupCodeLabel ? (
                <Text style={styles.groupCodeLabel} numberOfLines={1}>
                  {wcGroupCodeLabel}
                </Text>
              ) : null}
              <Animated.View style={entrance.predictedScoreStyle}>
                {hasPredictedScore ? (
                  <ResultMatchScoreLineNative
                    home={ph}
                    away={pa}
                    variant="predicted"
                    density={listScoreDensity}
                  />
                ) : (
                  <Text
                    style={[
                      styles.predictedScoreFallback,
                      isBasketballCard && styles.predictedScoreFallbackBasketball,
                    ]}
                  >
                    — – —
                  </Text>
                )}
              </Animated.View>
              {hasFinal ? (
                <Animated.View style={[entrance.finalScoreStyle, styles.finalScoreWrap]}>
                  <ResultMatchScoreLineNative
                    home={rh}
                    away={ra}
                    variant="final"
                    density={listScoreDensity}
                  />
                  {pkScore ? (
                    <MatchPkResultLineNative
                      pkScore={pkScore}
                      density="card"
                      wc={isWcCard}
                    />
                  ) : null}
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
                row.key === "upsetPoints"
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
          <ShareLinkCaptureFooterNative url={shareLinkUrl} visible={sharing} />
          </View>
        </Animated.View>
        {!pauseListFx && badge === "hit" ? <ResultHitCyberFrameNative /> : null}
        {!pauseListFx && badge === "perfect" ? <ResultPerfectCyberFrameNative /> : null}
        {!pauseListFx && badge === "streak" ? (
          <ResultStreakCyberFrameNative activeWinStreak={activeWinStreak} />
        ) : null}
      </ResultGlassShellNative>
      </View>

      {showCornerControl ? (
        <View style={styles.leftActionCluster} pointerEvents="box-none">
          <CornerMenuClusterNative
            open={cornerFabOpen}
            onToggle={() => setCornerFabOpen((v) => !v)}
            menuLabel={isEn ? "Open actions" : "操作メニュー"}
            horizontalFlyout="right"
            sideFlyout={
              <>
                {showShareInMenu ? (
                  <CyberChamferButtonNative
                    size="xs"
                    embedded
                    variant="share"
                    onPress={() => {
                      setCornerFabOpen(false);
                      void handleShareResult();
                    }}
                    disabled={!canShare || sharing}
                    accessibilityLabel={resultCopy.shareMyResult}
                  />
                ) : null}
                {hasCornerActions && hasCornerEdit ? (
                  <CyberChamferButtonNative
                    size="xs"
                    embedded
                    variant="edit"
                    onPress={requestPredictEdit}
                    accessibilityLabel={isEn ? "Edit prediction" : "予想を修正"}
                  />
                ) : null}
              </>
            }
            bottomFlyout={
              hasCornerActions && hasCornerTrash ? (
                <CyberChamferButtonNative
                  size="xs"
                  embedded
                  variant="delete"
                  onPress={requestDeletePost}
                  accessibilityLabel={isEn ? "Remove from list" : "一覧から除外"}
                />
              ) : null
            }
          />
        </View>
      ) : null}
      </View>
      </AnimatedResultCardPressable>
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  listRowOuter: {
    width: "100%",
  },
  cardOuter: {
    marginBottom: MOBILE_RESULT_CARD_GAP,
    maxWidth: MOBILE_RESULT_CARD_MAX_W,
    alignSelf: "center",
    width: "100%",
  },
  resultCardPressable: {
    flexShrink: 0,
    position: "relative",
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
  /** Web モバイル：左上リーグ */
  cardBadgeOverlay: {
    position: "absolute",
    left: 0,
    top: 6,
    zIndex: 22,
    paddingLeft: 8,
  },
  cardBadgeLeague: {
    maxWidth: 160,
  },
  /** Web `absolute top-1.5 right-11` — HIT 等（メニューと分離） */
  cardBadgeOutcomeAbsolute: {
    position: "absolute",
    top: 6,
    right: 8,
    zIndex: 22,
    maxWidth: "68%",
    alignItems: "flex-end",
  },
  /** メニュー展開でフライアウトがはみ出すときのクリップ解除（Web と同様） */
  cardShellOverflowVisible: {
    overflow: "visible",
  },
  cardCaptureWrap: {
    position: "relative",
  },
  /** 左上：Web mobile `CyberMenuButton` + 右／下フライアウト */
  leftActionCluster: {
    position: "absolute",
    top: 6,
    left: 8,
    zIndex: 60,
    overflow: "visible",
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
  flagStack: {
    alignItems: "center",
  },
  sideColHome: {
    paddingTop: 0,
    paddingRight: MOBILE_RESULT_MATCH_SIDE_SCORE_PAD,
  },
  sideColAway: {
    paddingTop: 0,
    paddingLeft: MOBILE_RESULT_MATCH_SIDE_SCORE_PAD,
  },
  wcTeamStack: {
    alignItems: "center",
    width: 88,
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
  teamRecordText: {
    marginTop: 2,
    fontSize: 10,
    letterSpacing: 0.4,
    color: "rgba(248,250,252,0.6)",
    textAlign: "center",
  },
  teamNameWcWrap: {
    width: 88,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  teamNameWc: {
    width: 88,
    maxWidth: 88,
    alignSelf: "center",
    fontSize: 13,
    lineHeight: 15,
    paddingTop: 0,
    letterSpacing: 0.35,
    textTransform: "uppercase",
    includeFontPadding: false,
  },
  predictedScoreFallback: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    textAlign: "center",
  },
  predictedScoreFallbackBasketball: {
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  finalScoreWrap: {
    marginTop: 3,
  },
  groupCodeLabel: {
    marginBottom: 6,
    maxWidth: "100%",
    fontSize: 18,
    lineHeight: 18,
    fontFamily: DISPLAY_FONT_FAMILY,
    letterSpacing: 5,
    color: "#FFFFFF",
    textAlign: "center",
    textTransform: "uppercase",
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
    alignItems: "flex-start",
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

  cardOuterCompact: {
    marginBottom: 0,
    maxWidth: MOBILE_RESULT_CARD_MAX_W,
    alignSelf: "center",
    width: "100%",
  },
});
