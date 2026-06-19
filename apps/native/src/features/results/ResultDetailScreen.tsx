/**
 * Web `app/mobile/result/[postId]/page.tsx` + `MobileResultDetail` に相当するリザルト詳細。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useReducedMotion } from "react-native-reanimated";
import type { GamePointsDistributionV1 } from "../../../../../lib/results/gamePointsDistribution";
import { SCORE_CHART_MAX } from "../../../../../lib/results/resultPointsDistributionChartModel";
import { getTeamAlias, splitTeamNameByLeague } from "../../utils/teamName";
import JerseyMarkAdaptive from "../games/JerseyMarkAdaptive";
import CountryFlagNative from "../games/CountryFlagNative";
import { resolvePostListLeague } from "../../../../../lib/leagues";
import { resolveTeamJerseyPalette, resolveTeamPrimaryColor } from "../games/teamColors";
import ResultStatRatingBarNative from "./ResultStatRatingBarNative";
import ResultGlassShellNative from "./ResultGlassShellNative";
import ResultLeagueLabelSkia from "./ResultLeagueLabelSkia";
import ResultPointsDistributionChartSkia from "./ResultPointsDistributionChartSkia";
import ResultMarketDonutSvg, { type DonutSegment } from "./ResultMarketDonutSvg";
import {
  loadResultPostDetailNative,
  type ResultDetailPost,
  type ResultPostDetailMarket,
} from "./loadResultPostDetailNative";
import { resolveResultOutcomeBadge } from "../../../../../lib/result/resultBadge";
import { RESULT_DETAIL_ENTRANCE, resultDetailSectionEnter } from "./resultDetailEntranceNative";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import { formatResultPostCardDateLabel } from "./nativeResultModel";
import WcMatchGoalScorersColumnNative from "./WcMatchGoalScorersColumnNative";
import WcGoalScorerResultRowNative from "./WcGoalScorerResultRowNative";
import { useWcGoalScorerResultNative, type WcGoalScorerPostLike } from "./useWcGoalScorerResultNative";
import { resolveWcMatchGoalScorersForDisplay } from "../../../../../lib/wc/matchGoalScorers";
import { db } from "../../lib/firebase";
import { useWcGroupStandingRanks } from "../../../../../lib/wc/useWcGroupStandingRanks";
import WcTeamFlagWithMetaNative from "./WcTeamFlagWithMetaNative";
import WcGroupStandingRecordLineNative from "./WcGroupStandingRecordLineNative";
import { resolveWcGroupCodeLabel } from "../../../../../lib/wc/wcGroupStandingRank";

const hasNativeBlurView =
  Platform.OS !== "web" &&
  Boolean(
    UIManager.getViewManagerConfig?.("ExpoBlurView") ??
      UIManager.getViewManagerConfig?.("ViewManagerAdapter_ExpoBlur_ExpoBlurView")
  );

/** 一覧の背後を透かすガラス調レイヤー（タッチは `pointerEvents="none"` で下の Pressable へ） */
function ResultDetailOverlayBackdrop() {
  if (!hasNativeBlurView) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, styles.overlayBlurFallback]}
      />
    );
  }
  if (Platform.OS === "ios") {
    return (
      <BlurView
        pointerEvents="none"
        intensity={26}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />
    );
  }
  if (Platform.OS === "android") {
    return (
      <BlurView
        pointerEvents="none"
        intensity={20}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFillObject}
      />
    );
  }
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, styles.overlayBlurFallback]}
    />
  );
}

const LEAGUE_LABEL: Record<string, string> = {
  nba: "NBA",
  wc: "WC",
  bj: "B1",
  pl: "PL",
  j1: "J1",
};

function leagueFromResultPost(post: ResultDetailPost) {
  return resolvePostListLeague({
    league: post.league,
    gameId: post.gameId,
  });
}
const DISPLAY_FONT_TEAM = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});

function getMobileTeamName(
  league: "nba" | "bj" | "j1" | "pl" | "wc",
  rawName: string,
  l1: string,
  l2?: string
): string {
  if (league === "nba") return l2 || rawName;
  if (league === "pl") return getTeamAlias(rawName) ?? rawName;
  if (league === "wc") return rawName;
  return [l1, l2].filter(Boolean).join(" ");
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

type StreakBadge = { label: string; tone: "silver" | "platinum" | "gold" };

function getStreakBadge(activeWinStreak: unknown, isEn: boolean): StreakBadge | null {
  const v =
    typeof activeWinStreak === "number" && Number.isFinite(activeWinStreak)
      ? Math.floor(activeWinStreak)
      : 0;
  if (v < 3) return null;
  if (v >= 7) return { label: isEn ? `${v} Win Streak` : `${v}連勝`, tone: "gold" };
  if (v >= 5) return { label: isEn ? `${v} Win Streak` : `${v}連勝`, tone: "platinum" };
  return { label: isEn ? `${v} Win Streak` : `${v}連勝`, tone: "silver" };
}

type ResultBadge = "hit" | "perfect" | "upset" | "miss" | "streak" | null;

function streakToneStyle(tone: StreakBadge["tone"]) {
  if (tone === "gold") return styles.streakGold;
  if (tone === "platinum") return styles.streakPlatinum;
  return styles.streakSilver;
}

function streakFlameColor(tone: StreakBadge["tone"]) {
  if (tone === "gold") return "#fef08a";
  if (tone === "platinum") return "#cffafe";
  return "#f8fafc";
}

/**
 * リザルト一覧 `ResultPostCard` と同色のガラスシェル（方眼なし）。
 */
function ShellCard({
  children,
  frameStyle,
}: {
  children: ReactNode;
  /** HIT 時など一覧 `cardFrameHit` に合わせた外枠 */
  frameStyle?: StyleProp<ViewStyle>;
}) {
  const borderColor =
    typeof (frameStyle as ViewStyle | undefined)?.borderColor === "string"
      ? ((frameStyle as ViewStyle).borderColor as string)
      : "rgba(255,255,255,0.10)";
  const shadowStyle: ViewStyle | undefined = frameStyle
    ? {
        shadowColor: (frameStyle as ViewStyle).shadowColor,
        shadowOpacity: (frameStyle as ViewStyle).shadowOpacity,
        shadowRadius: (frameStyle as ViewStyle).shadowRadius,
        elevation: (frameStyle as ViewStyle).elevation,
      }
    : undefined;

  return (
    <ResultGlassShellNative borderColor={borderColor} shellStyle={shadowStyle}>
      <View style={styles.shellInner}>{children}</View>
    </ResultGlassShellNative>
  );
}

function ResultDetailMarketSection({
  post,
  market,
  language,
}: {
  post: ResultDetailPost;
  market: ResultPostDetailMarket | null;
  language: "ja" | "en";
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const donutDrawDelayMs = reduceMotion ? 0 : RESULT_DETAIL_ENTRANCE.donutDrawDelayMs;
  const isEn = language === "en";
  const leagueKey = leagueFromResultPost(post);
  const isSoccer = leagueKey === "j1" || leagueKey === "pl";
  const home = post.home as { name?: string; teamId?: string } | undefined;
  const away = post.away as { name?: string; teamId?: string } | undefined;
  const [homeL1, homeL2] = splitTeamNameByLeague(leagueKey, home?.name ?? "");
  const [awayL1, awayL2] = splitTeamNameByLeague(leagueKey, away?.name ?? "");
  const homeName = getMobileTeamName(leagueKey, home?.name ?? "", homeL1, homeL2);
  const awayName = getMobileTeamName(leagueKey, away?.name ?? "", awayL1, awayL2);
  const homeFallback = "#0ea5e9";
  const awayFallback = "#f43f5e";
  /** 一覧カード／試合ページの市場ドーナツと同じ：NBA はジャージ用オーバーライド色（Magic 等は primary テーブルが黒でも青で統一） */
  const homeC = resolveTeamJerseyPalette(post.league, home, homeFallback).primary;
  const awayC = resolveTeamJerseyPalette(post.league, away, awayFallback).primary;

  if (!market) {
    return (
      <ShellCard>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="scale-balance" size={16} color="#fb923c" />
          <Text style={styles.sectionTitle}>Market Bias</Text>
        </View>
        <Text style={styles.muted}>
          {isEn ? "No market data for this match." : "この試合のマーケットデータがありません。"}
        </Text>
      </ShellCard>
    );
  }

  const h = market.homeRate ?? 0;
  const a = market.awayRate ?? 0;
  const d = market.drawRate ?? 0;
  /** Firestore の market.total：0 のとき比率は未確定（0% 表示のガラストラックのみ） */
  const marketRatesConfirmed =
    typeof market.total === "number" && Number.isFinite(market.total) && market.total > 0;

  const legendHomeName = leagueKey === "nba" ? homeName.toUpperCase() : homeName;
  const legendAwayName = leagueKey === "nba" ? awayName.toUpperCase() : awayName;

  const segments = useMemo((): DonutSegment[] => {
    if (isSoccer) {
      return [
        { label: legendHomeName, value: h, color: homeC },
        { label: isEn ? "Draw" : "引き分け", value: d, color: "#9ca3af" },
        { label: legendAwayName, value: a, color: awayC },
      ];
    }
    return [
      { label: legendHomeName, value: h, color: homeC },
      { label: legendAwayName, value: a, color: awayC },
    ];
  }, [isSoccer, legendHomeName, legendAwayName, homeC, awayC, h, a, d, isEn]);

  return (
    <ShellCard>
      <View style={styles.marketHeaderRow}>
        <MaterialCommunityIcons name="scale-balance" size={20} color="#fb923c" />
        <Text style={styles.marketBiasTitle}>Market Bias</Text>
      </View>
      <View style={styles.marketDonutRow}>
        <ResultMarketDonutSvg
          segments={segments}
          size={132}
          thickness={42}
          drawDelayMs={donutDrawDelayMs}
          marketRatesConfirmed={marketRatesConfirmed}
        />
        <View style={styles.marketLegendCol}>
          {typeof market.total === "number" && market.total > 0 ? (
            <Text style={styles.marketTotalTop}>
              Total: <Text style={styles.marketTotalNum}>{market.total}</Text>
            </Text>
          ) : null}
          {segments.map((seg, i) => {
            const isDraw = seg.label === "Draw" || seg.label === "引き分け";
            return (
              <View key={`${seg.label}-${i}`} style={styles.marketLegendBlock}>
                <View style={[styles.swatch, { backgroundColor: seg.color }]} />
                <View style={styles.legendTextCol}>
                  <Text
                    style={[styles.legendName, isDraw && styles.legendNameDraw]}
                    numberOfLines={2}
                  >
                    {seg.label}
                  </Text>
                  <Text style={styles.legendPct}>{(seg.value * 100).toFixed(1)}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ShellCard>
  );
}

const DIST_MEDIAN_LEGEND = "#22d3ee";
const DIST_MEAN_LEGEND = "#fb7185";
const DIST_HEADER_ICON = "rgba(196, 181, 253, 0.9)";

function ResultDetailDistributionSection({
  distribution,
  post,
  language,
}: {
  distribution: GamePointsDistributionV1 | null;
  post: ResultDetailPost;
  language: "ja" | "en";
}) {
  const isEn = language === "en";
  const stats = post.stats as Record<string, unknown> | undefined;
  const myScoreRaw = stats?.pointsV3;
  const my =
    typeof myScoreRaw === "number" && Number.isFinite(myScoreRaw) ? myScoreRaw : null;

  const result = post.result as { home?: unknown; away?: unknown } | null | undefined;
  const isMatchFinal =
    typeof result?.home === "number" && typeof result?.away === "number";
  const distLoading = false;
  const showChart = isMatchFinal && !distLoading && distribution != null;
  const dist = showChart ? distribution : null;

  const title = isEn ? "Score distribution" : "得点の分布";
  const subtitle = !isMatchFinal
    ? isEn
      ? "Score distribution appears after the match ends."
      : "試合が終了したら、得点の分布が表示されます。"
    : distLoading
      ? "LOADING"
      : distribution == null
        ? isEn
          ? "Could not load score distribution for this match."
          : "この試合の得点分布を表示できません。"
        : isEn
          ? "All scored posts for this match (same rules as your result)."
          : "この試合の採点済み予想の分布（あなたの得点と同じルール）";

  const scoringNote = showChart
    ? isEn
      ? "Wrong winner → 0. Hits start at 4; streak/upset bonuses can exceed 10. Chart caps at 10 (ceiling). No 1–3."
      : "勝者を外すと0点。的中は4点から。連勝・アップセットで10点超もあり得ますが、分布図の縦軸は10で頭打ち表示。1〜3点は出ません。"
    : null;

  const axisLabel = isEn ? "pointsV3" : "総合点 (pointsV3)";
  const axisFoot = isEn ? "0 / 4–10+ · chart max 10" : "0 / 4–10+ ・表示上限10";
  const nLabel = isEn ? "n" : "件数";
  const medianLabel = isEn ? "Median" : "中央値";
  const meanLabel = isEn ? "Mean" : "平均";
  const youLabel = isEn ? "You" : "あなた";

  const nText = showChart && dist ? String(dist.n) : "--";
  const medianText =
    showChart && dist?.median != null && Number.isFinite(dist.median)
      ? dist.median.toFixed(2)
      : "--";
  const meanText =
    showChart && dist?.mean != null && Number.isFinite(dist.mean) ? dist.mean.toFixed(2) : "--";

  return (
    <ShellCard>
      <View style={styles.distHeaderRow}>
        <MaterialCommunityIcons name="chart-box-outline" size={20} color={DIST_HEADER_ICON} />
        <View style={styles.distTitleBlock}>
          <Text style={styles.distCardTitle}>{title}</Text>
          <Text style={styles.distCardSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.distStatsRow}>
        <View style={styles.distStatPair}>
          <Text style={styles.distStatLabel}>{nLabel}:</Text>
          <Text style={styles.distStatNum}>{nText}</Text>
        </View>
        <View style={styles.distStatPair}>
          <View style={[styles.distStatSwatch, { backgroundColor: DIST_MEDIAN_LEGEND }]} />
          <Text style={styles.distStatLabel}>{medianLabel}:</Text>
          <Text style={styles.distStatNum}>{medianText}</Text>
        </View>
        <View style={styles.distStatPair}>
          <View style={[styles.distStatSwatch, { backgroundColor: DIST_MEAN_LEGEND }]} />
          <Text style={styles.distStatLabel}>{meanLabel}:</Text>
          <Text style={styles.distStatNum}>{meanText}</Text>
        </View>
      </View>

      <View style={[styles.distChartSection, !showChart && styles.distChartSectionEmpty]}>
        {showChart && distribution ? (
          <ResultPointsDistributionChartSkia distribution={distribution} myScore={my} />
        ) : null}
      </View>

      {showChart ? (
        <Text style={styles.distAxisFoot}>
          {axisLabel}（{axisFoot}）
        </Text>
      ) : null}

      {scoringNote ? <Text style={styles.distFootnote}>{scoringNote}</Text> : null}

      {isMatchFinal && my != null ? (
        <View style={styles.distYouRow}>
          <View style={styles.distYouDot} />
          <Text style={styles.distYouLabel}>{youLabel}:</Text>
          <Text style={styles.distYouValue}>
            {my.toFixed(2)}
            {my > SCORE_CHART_MAX + 1e-6 ? (
              <Text style={styles.distYouChartCap}>
                {isEn ? " · on chart: 10+" : " · 図上は10+"}
              </Text>
            ) : null}
          </Text>
        </View>
      ) : null}
    </ShellCard>
  );
}

function ResultDetailStatsSection({ post, language }: { post: ResultDetailPost; language: "ja" | "en" }) {
  const isEn = language === "en";
  const wcGoalScorer = useWcGoalScorerResultNative(post as WcGoalScorerPostLike);
  const stats = post.stats as Record<string, unknown> | undefined;
  const hadUpsetGame = Boolean(stats?.hadUpsetGame);
  const showScorePrecision = leagueFromResultPost(post) !== "wc";
  const scorePrecision = toNumber(stats?.scorePrecision, 0);
  const upsetPoints = toNumber(stats?.upsetPoints, 0);
  const pointsV3 = toNumber(stats?.pointsV3, 0);
  const detail = stats?.pointsV3Detail as Record<string, unknown> | undefined;
  const basePoints = toNumber(
    detail?.basePoints,
    toNumber(detail?.winPoints, 0) + toNumber(detail?.diffPoints, 0)
  );
  const upsetBonus = toNumber(detail?.upsetBonus, 0);
  const streakBonus = toNumber(detail?.streakBonus, 0);
  const showUpsetBonus = upsetBonus > 1e-6;
  const showStreakBonus = streakBonus > 1e-6;
  const fmt1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "--");

  const rows = useMemo(
    () => [
      ...(showScorePrecision
        ? [
            {
              key: "scorePrecision" as const,
              label: isEn ? "Score Precision" : "スコア精度",
              desc: isEn
                ? "How close your predicted score is to the actual score (0–10 per match)."
                : "予想スコアが実スコアにどれだけ近いか（1試合 0〜10）。",
              value: scorePrecision,
              barMax: 10,
              format: (v: number) => v.toFixed(1),
            },
          ]
        : []),
      {
        key: "upsetPoints" as const,
        label: isEn ? "Upset Points" : "アップセット",
        desc: isEn
          ? "Points when the match was an upset and you had a minority pick that hit."
          : "アップセット試合で少数派予想が的中したときの加点（0〜10）。",
        value: upsetPoints,
        barMax: 10,
        format: (v: number) => (hadUpsetGame ? `${(Math.round(v * 10) / 10).toFixed(1)}` : "--"),
      },
      {
        key: "pointsV3" as const,
        label: isEn ? "Total Points" : "総合得点",
        desc: isEn
          ? "Overall score including base, upset bonus, and win-streak bonus."
          : "基本点・アップセット・連勝ボーナスを含む総合スコア。",
        value: pointsV3,
        barMax: 10,
        format: (v: number) => `${(Math.round(v * 10) / 10).toFixed(1)}`,
      },
    ],
    [hadUpsetGame, isEn, scorePrecision, showScorePrecision, upsetPoints, pointsV3]
  );

  return (
    <ShellCard>
      <View style={styles.sectionTitleRow}>
        <MaterialCommunityIcons name="chart-line" size={16} color="#fb923c" />
        <Text style={styles.sectionTitle}>{isEn ? "Performance" : "パフォーマンス"}</Text>
      </View>
      <View style={styles.statsRows}>
        {wcGoalScorer ? (
          <WcGoalScorerResultRowNative
            label={isEn ? "Goal scorer" : "ゴールする選手"}
            info={wcGoalScorer}
          />
        ) : null}
        {rows.map((r, index) => {
          const cap = r.barMax;
          const ratio =
            r.key === "upsetPoints" && !hadUpsetGame ? 0 : cap > 0 ? clamp01(r.value / cap) : 0;
          const display = r.format(r.value);
          return (
            <View key={r.key} style={styles.statRow}>
              <Text style={styles.statLabel} numberOfLines={1}>
                {r.label}
              </Text>
              <ResultStatRatingBarNative ratio={ratio} delayMs={index * 80} size="md" />
              <Text style={styles.statValue}>{display}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.bonusFoot}>
        <Text style={styles.bonusFootText}>
          {isEn ? "Base" : "基本点"} {fmt1(basePoints)}
          {showUpsetBonus ? (
            <>
              {" "}
              + {isEn ? "Upset" : "UPSET"} {fmt1(upsetBonus)}
            </>
          ) : null}
          {showStreakBonus ? (
            <>
              {" "}
              + {isEn ? "Streak" : "連勝"} {fmt1(streakBonus)}
            </>
          ) : null}
          {" = "}
          <Text style={styles.bonusTotal}>{pointsV3.toFixed(1)}</Text>
        </Text>
      </View>
      {rows.map((r) => (
        <Text key={`${r.key}-d`} style={styles.descLine}>
          <Text style={styles.descBold}>{r.label}</Text>
          {isEn ? ": " : "："}
          {r.desc}
        </Text>
      ))}
      <Text style={styles.helpHint}>
        {isEn ? "Full scoring rules are on the Uniterz web help page." : "得点の詳細は Web 版ヘルプを参照してください。"}
      </Text>
    </ShellCard>
  );
}

export default function ResultDetailScreen({
  visible,
  postId,
  language,
  onClose,
}: {
  visible: boolean;
  postId: string | null;
  language: "ja" | "en";
  onClose: () => void;
}) {
  const isEn = language === "en";
  const [loading, setLoading] = useState(false);
  const [missing, setMissing] = useState(false);
  const [post, setPost] = useState<ResultDetailPost | null>(null);
  const [market, setMarket] = useState<ResultPostDetailMarket | null>(null);
  const [distribution, setDistribution] = useState<GamePointsDistributionV1 | null>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const homeTeamId = (post?.home as { teamId?: string } | undefined)?.teamId;
  const awayTeamId = (post?.away as { teamId?: string } | undefined)?.teamId;
  const wcGroupRanks = useWcGroupStandingRanks(db, homeTeamId, awayTeamId);

  const reset = useCallback(() => {
    setPost(null);
    setMarket(null);
    setDistribution(null);
    setMissing(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!visible || !postId) {
      reset();
      return;
    }
    let alive = true;
    setLoading(true);
    setMissing(false);
    void (async () => {
      try {
        const r = await loadResultPostDetailNative(postId);
        if (!alive) return;
        if (!r.ok) {
          setMissing(true);
          setPost(null);
          return;
        }
        setPost(r.post);
        setMarket(r.market);
        setDistribution(r.pointsDistribution);
      } catch {
        if (alive) setMissing(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible, postId, reset]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const headerBody = useMemo(() => {
    if (!post) return null;
    const leagueKey = leagueFromResultPost(post);
    const isWcCard = leagueKey === "wc";
    const pillText = LEAGUE_LABEL[leagueKey] ?? leagueKey.toUpperCase();
    const home = post.home as { name?: string; teamId?: string } | undefined;
    const away = post.away as { name?: string; teamId?: string } | undefined;
    const pred = post.prediction as
      | { score?: { home?: number; away?: number }; winner?: string }
      | undefined;
    const result = post.result as { home?: number; away?: number } | null | undefined;
    const stats = post.stats as Record<string, unknown> | undefined;
    const homeFallback = "#0ea5e9";
    const awayFallback = "#f43f5e";
    const homeColor = resolveTeamPrimaryColor(post.league, home, homeFallback);
    const awayColor = resolveTeamPrimaryColor(post.league, away, awayFallback);
    const homeJersey = resolveTeamJerseyPalette(post.league, home, homeColor);
    const awayJersey = resolveTeamJerseyPalette(post.league, away, awayColor);
    const [homeL1, homeL2] = splitTeamNameByLeague(leagueKey, home?.name ?? "");
    const [awayL1, awayL2] = splitTeamNameByLeague(leagueKey, away?.name ?? "");
    const homeName = isWcCard
      ? (home?.name ?? "").trim().toUpperCase()
      : getMobileTeamName(leagueKey, home?.name ?? "", homeL1, homeL2);
    const awayName = isWcCard
      ? (away?.name ?? "").trim().toUpperCase()
      : getMobileTeamName(leagueKey, away?.name ?? "", awayL1, awayL2);
    const ph = pred?.score?.home;
    const pa = pred?.score?.away;
    const predictedScore =
      typeof ph === "number" && typeof pa === "number" ? `${ph} - ${pa}` : "— - —";
    const rh = result?.home;
    const ra = result?.away;
    const hasFinal = typeof rh === "number" && typeof ra === "number";
    const wcGroupCodeLabel = isWcCard
      ? resolveWcGroupCodeLabel(home?.teamId, away?.teamId)
      : null;
    const wcMatchGoalScorers =
      isWcCard && hasFinal
        ? resolveWcMatchGoalScorersForDisplay({
            league: "wc",
            isFinal: true,
            matchGoalScorersRaw: (post as { matchGoalScorers?: unknown })
              .matchGoalScorers,
            homeTeamId: home?.teamId,
            awayTeamId: away?.teamId,
          })
        : [];
    const finalScore = hasFinal ? `${rh} - ${ra}` : null;
    const cardDateLabel = formatResultPostCardDateLabel(post, isEn ? "en" : "ja");
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

    return (
      <ShellCard
        frameStyle={
          badge === "streak" && activeWinStreak >= 7
            ? styles.shellCardStreakGoldFrame
            : badge === "streak" && activeWinStreak >= 5
              ? styles.shellCardStreakPlatinumFrame
              : badge === "streak"
                ? styles.shellCardStreakSilverFrame
                : badge === "upset"
                  ? styles.shellCardUpsetRedFrame
                  : badge === "perfect"
                    ? styles.shellCardPerfectBlueFrame
                    : badge === "hit"
                      ? styles.shellCardHitGoldFrame
                      : undefined
        }
      >
        <View style={styles.matchTop}>
          <ResultLeagueLabelSkia text={pillText} style={styles.leagueLabelSlot} />
          <View style={styles.badgeRow}>
            {badge === "streak" && streakBadge ? (
              <View style={[styles.streakMiniBadge, streakToneStyle(streakBadge.tone)]}>
                <MaterialCommunityIcons
                  name="fire"
                  size={12}
                  color={streakFlameColor(streakBadge.tone)}
                />
                <Text style={styles.streakMiniBadgeText} numberOfLines={1}>
                  {streakBadge.label}
                </Text>
              </View>
            ) : null}
            {badge === "hit" ? (
              <View style={[styles.miniBadge, styles.badgeHit]}>
                <Text style={styles.badgeHitText}>HIT</Text>
              </View>
            ) : null}
            {badge === "perfect" ? (
              <View style={[styles.miniBadge, styles.badgePerfect]}>
                <Text style={styles.badgePerfectText}>PERFECT</Text>
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
          </View>
        </View>
        <View style={styles.matchGrid}>
          <View style={styles.sideCol}>
            {isWcCard ? (
              <WcTeamFlagWithMetaNative teamId={home?.teamId}>
                <CountryFlagNative teamId={home?.teamId} variant="result" />
              </WcTeamFlagWithMetaNative>
            ) : (
              <JerseyMarkAdaptive
                accent={homeJersey.primary}
                accentEnd={homeJersey.secondary}
                size={56}
              />
            )}
            <Text style={styles.teamName} numberOfLines={2}>
              {homeName}
            </Text>
            {isWcCard ? (
              <WcGroupStandingRecordLineNative
                standing={wcGroupRanks.homeStanding}
                language={language}
              />
            ) : null}
            {wcMatchGoalScorers.length > 0 ? (
              <WcMatchGoalScorersColumnNative scorers={wcMatchGoalScorers} side="home" />
            ) : null}
          </View>
          <View style={styles.centerCol}>
            {wcGroupCodeLabel ? (
              <Text style={styles.groupCodeLabel} numberOfLines={1}>
                {wcGroupCodeLabel}
              </Text>
            ) : (
              <Text style={styles.predLabel}>{cardDateLabel}</Text>
            )}
            {finalScore ? (
              <>
                <Text style={styles.finalScoreMain}>{finalScore}</Text>
                <Text style={styles.finalLabel}>{isEn ? "Final" : "試合終了"}</Text>
                <Text style={styles.predictedScoreOverlay}>{predictedScore}</Text>
              </>
            ) : (
              <Text style={styles.predictedScore}>{predictedScore}</Text>
            )}
          </View>
          <View style={styles.sideCol}>
            {isWcCard ? (
              <WcTeamFlagWithMetaNative teamId={away?.teamId}>
                <CountryFlagNative teamId={away?.teamId} variant="result" />
              </WcTeamFlagWithMetaNative>
            ) : (
              <JerseyMarkAdaptive
                accent={awayJersey.primary}
                accentEnd={awayJersey.secondary}
                size={56}
              />
            )}
            <Text style={styles.teamName} numberOfLines={2}>
              {awayName}
            </Text>
            {isWcCard ? (
              <WcGroupStandingRecordLineNative
                standing={wcGroupRanks.awayStanding}
                language={language}
              />
            ) : null}
            {wcMatchGoalScorers.length > 0 ? (
              <WcMatchGoalScorersColumnNative scorers={wcMatchGoalScorers} side="away" />
            ) : null}
          </View>
        </View>
      </ShellCard>
    );
  }, [post, isEn, wcGroupRanks, language]);

  if (!visible) return null;

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={isEn ? "Close detail" : "詳細を閉じる"}
      />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <ResultDetailOverlayBackdrop />
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.overlayDim]} />
      </View>
      <SafeAreaView style={styles.overlaySafe} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            hitSlop={14}
            style={({ pressed }) => [styles.closeIconBtn, pressed && { opacity: 0.72 }]}
            accessibilityRole="button"
            accessibilityLabel={isEn ? "Close detail" : "詳細を閉じる"}
          >
            <MaterialCommunityIcons name="close" size={26} color="rgba(248,250,252,0.92)" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerFill}>
            <BlocksPulseLoader />
          </View>
        ) : missing || !post ? (
          <View style={styles.centerFill}>
            <Text style={styles.missingTitle}>
              {isEn ? "Post not found" : "投稿が見つかりません"}
            </Text>
            <Pressable onPress={onClose} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>{isEn ? "Close" : "閉じる"}</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              entering={resultDetailSectionEnter(
                RESULT_DETAIL_ENTRANCE.delayHeaderMs,
                reduceMotion
              )}
            >
              {headerBody}
            </Animated.View>
            <View style={styles.sectionGap} />
            <Animated.View
              entering={resultDetailSectionEnter(
                RESULT_DETAIL_ENTRANCE.delayMarketMs,
                reduceMotion
              )}
            >
              <ResultDetailMarketSection post={post} market={market} language={language} />
            </Animated.View>
            <View style={styles.sectionGap} />
            <Animated.View
              entering={resultDetailSectionEnter(
                RESULT_DETAIL_ENTRANCE.delayDistributionMs,
                reduceMotion
              )}
            >
              <ResultDetailDistributionSection
                distribution={distribution}
                post={post}
                language={language}
              />
            </Animated.View>
            <View style={styles.sectionGap} />
            <Animated.View
              entering={resultDetailSectionEnter(
                RESULT_DETAIL_ENTRANCE.delayStatsMs,
                reduceMotion
              )}
            >
              <ResultDetailStatsSection post={post} language={language} />
            </Animated.View>
            <View style={{ height: Platform.OS === "ios" ? 32 : 24 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const DISPLAY_FONT = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});
const NUMERIC_FONT = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});

const styles = StyleSheet.create({
  /** `ResultHomeScreen` の `resultScreenWrap` 上に載せる詳細オーバーレイ */
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
  },
  overlayBlurFallback: {
    backgroundColor: "rgba(7,10,17,0.88)",
  },
  overlayDim: {
    backgroundColor: "rgba(5,8,14,0.42)",
  },
  overlaySafe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  closeIconBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 999,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 28,
  },
  centerFill: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  missingTitle: { color: "#f8fafc", fontSize: 17, fontWeight: "700" },
  primaryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(34,211,238,0.2)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.45)",
  },
  primaryBtnText: { color: "#ecfeff", fontWeight: "700" },
  /** 一覧 `cardFrameHit` と同一のゴールド枠（詳細ヘッダーカードのみ） */
  shellCardHitGoldFrame: {
    borderColor: "rgba(250,204,21,0.72)",
    shadowColor: "rgba(250,204,21,0.45)",
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  shellCardStreakSilverFrame: {
    borderColor: "rgba(226,232,240,0.82)",
    shadowColor: "rgba(255,255,255,0.55)",
    shadowOpacity: 0.48,
    shadowRadius: 18,
  },
  shellCardStreakPlatinumFrame: {
    borderColor: "rgba(34,211,238,0.82)",
    shadowColor: "rgba(0,245,255,0.5)",
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  shellCardStreakGoldFrame: {
    borderColor: "rgba(251,191,36,0.88)",
    shadowColor: "rgba(249,115,22,0.5)",
    shadowOpacity: 0.52,
    shadowRadius: 22,
  },
  shellCardUpsetRedFrame: {
    borderColor: "rgba(248,113,113,0.84)",
    shadowColor: "rgba(239,68,68,0.5)",
    shadowOpacity: 0.48,
    shadowRadius: 18,
  },
  shellCardPerfectBlueFrame: {
    borderColor: "rgba(167,139,250,0.8)",
    shadowColor: "rgba(139,92,246,0.45)",
    shadowOpacity: 0.44,
    shadowRadius: 16,
  },
  shellInner: {
    padding: 16,
    position: "relative",
    zIndex: 2,
  },
  sectionGap: { height: 16 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "rgba(248,250,252,0.95)",
    fontSize: 15,
    fontWeight: "700",
  },
  muted: { color: "rgba(248,250,252,0.55)", fontSize: 13, lineHeight: 20 },
  matchTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  leagueLabelSlot: {
    marginTop: 4,
    marginLeft: 4,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "72%",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  /** 一覧 `ResultHomeScreen` の miniBadge と同寸・同形状 */
  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  miniBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800", maxWidth: 120 },
  streakSilver: {
    backgroundColor: "rgba(100,116,139,0.94)",
    borderColor: "rgba(248,250,252,0.72)",
  },
  streakPlatinum: {
    backgroundColor: "rgba(8,145,178,0.94)",
    borderColor: "rgba(186,250,255,0.82)",
  },
  streakGold: {
    backgroundColor: "rgba(234,88,12,0.95)",
    borderColor: "rgba(254,249,195,0.78)",
  },
  streakMiniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  streakMiniBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    maxWidth: 120,
  },
  /** 一覧カードの HIT と同一（ソリッドゴールド・黒字・枠線なし） */
  badgeHit: {
    backgroundColor: "rgba(250,204,21,0.95)",
    borderWidth: 0,
  },
  badgeHitText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0a0a0a",
  },
  badgePerfect: {
    backgroundColor: "rgba(124,58,237,0.94)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.84)",
  },
  badgePerfectText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#f5f3ff",
    letterSpacing: 0.4,
  },
  badgeUpset: {
    backgroundColor: "rgba(220,38,38,0.94)",
    borderWidth: 1,
    borderColor: "rgba(252,165,165,0.82)",
  },
  badgeUpsetText: {
    color: "#fef2f2",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  badgeMiss: {
    backgroundColor: "rgba(51,65,85,0.55)",
    borderColor: "rgba(148,163,184,0.45)",
  },
  badgeMissText: { color: "rgba(226,232,240,0.95)", fontSize: 10, fontWeight: "800" },
  matchGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  sideCol: { flex: 1, alignItems: "center", minWidth: 0 },
  flagStack: { alignItems: "center" },
  centerCol: { alignItems: "center", paddingHorizontal: 4, minWidth: 100 },
  teamName: {
    marginTop: 10,
    color: "rgba(248,250,252,0.92)",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.65,
    fontFamily: DISPLAY_FONT,
  },
  predLabel: {
    color: "rgba(248,250,252,0.45)",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  predictedScore: {
    color: "#f8fafc",
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "800",
    fontFamily: NUMERIC_FONT,
    fontVariant: ["tabular-nums"],
  },
  /** Web overlay 確定スコア（大・白） */
  finalScoreMain: {
    color: "#fff",
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "900",
    fontFamily: NUMERIC_FONT,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  finalLabel: {
    color: "rgba(248,250,252,0.75)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 2,
  },
  /** Web overlay 予想スコア（小・amber） */
  predictedScoreOverlay: {
    color: "rgba(253,224,71,0.95)",
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "700",
    fontFamily: NUMERIC_FONT,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(251,191,36,0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  groupCodeLabel: {
    marginTop: 2,
    marginBottom: 4,
    maxWidth: "100%",
    fontSize: 15,
    lineHeight: 16,
    fontFamily: DISPLAY_FONT,
    letterSpacing: 3.5,
    color: "#FFFFFF",
    textAlign: "center",
    textTransform: "uppercase",
  },
  /** Web `MobileResultMarketCard`：`mb-3 flex … gap-2 text-[13px] font-semibold` */
  marketHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  marketBiasTitle: {
    color: "rgba(248,250,252,0.95)",
    fontSize: 13,
    fontWeight: "600",
  },
  /** Web `flex items-center gap-4`：ドーナツと凡例を縦中央揃え */
  marketDonutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  /** Web `space-y-3` */
  marketLegendCol: {
    flex: 1,
    minWidth: 0,
    gap: 12,
    justifyContent: "center",
  },
  marketTotalTop: {
    color: "rgba(248,250,252,0.55)",
    fontSize: 11,
    marginBottom: 2,
    paddingLeft: 4,
  },
  /** Web `flex items-start gap-2` ＋右カラムに名前／% を縦積み */
  marketLegendBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  /** Web `mt-1 h-2.5 w-2.5 rounded-sm`（10px 角丸） */
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginTop: 4,
  },
  legendTextCol: {
    flex: 1,
    minWidth: 0,
  },
  /** Web：チームは `font-bold` + Bebas 系、Draw はやや小さめ */
  legendName: {
    color: "rgba(248,250,252,0.9)",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT_TEAM,
    letterSpacing: 0.65,
  },
  legendNameDraw: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(248,250,252,0.8)",
    /** Draw は Bebas を外す（Web の `isDraw` 分岐に合わせる） */
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  /** Web `mt-0.5 text-[11px] text-white/80` */
  legendPct: {
    marginTop: 4,
    color: "rgba(248,250,252,0.65)",
    fontSize: 11,
    fontFamily: NUMERIC_FONT,
    fontVariant: ["tabular-nums"],
  },
  marketTotalNum: { fontFamily: NUMERIC_FONT, color: "rgba(248,250,252,0.85)" },
  /** Web `ResultPointsDistributionCard`：ヘッダー（BarChart3 + タイトル + サブタイトル） */
  distHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
  distTitleBlock: { flex: 1, minWidth: 0 },
  distCardTitle: {
    color: "rgba(248,250,252,0.95)",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  distCardSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(248,250,252,0.45)",
  },
  /** Web：`mb-4 flex flex-wrap gap-x-6 gap-y-2` */
  distStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 22,
    rowGap: 8,
    marginBottom: 16,
  },
  distStatPair: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  distStatSwatch: {
    width: 16,
    height: 2.5,
    borderRadius: 999,
    marginBottom: 1,
    alignSelf: "center",
  },
  distStatLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(248,250,252,0.8)",
  },
  distStatNum: {
    fontSize: 17,
    fontWeight: "600",
    color: "rgba(248,250,252,0.98)",
    fontFamily: NUMERIC_FONT,
    fontVariant: ["tabular-nums"],
  },
  distChartSection: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  /** Web：`min-h-[100px] items-center`（チャート非表示時） */
  distChartSectionEmpty: { minHeight: 100 },
  distAxisFoot: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(248,250,252,0.45)",
  },
  distYouRow: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "center",
    columnGap: 8,
    rowGap: 4,
  },
  distYouDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fbbf24",
    alignSelf: "center",
    shadowColor: "#fbbf24",
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  distYouLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(248,250,252,0.8)",
  },
  distYouValue: {
    fontSize: 17,
    fontWeight: "600",
    color: "rgba(248,250,252,0.98)",
    fontFamily: NUMERIC_FONT,
    fontVariant: ["tabular-nums"],
  },
  distYouChartCap: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(248,250,252,0.5)",
  },
  distFootnote: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 15,
    color: "rgba(248,250,252,0.45)",
  },
  statsRows: { gap: 12 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statLabel: {
    width: 100,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(248,250,252,0.9)",
  },
  statValue: {
    width: 44,
    flexShrink: 0,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(248,250,252,0.95)",
    fontFamily: NUMERIC_FONT,
    fontVariant: ["tabular-nums"],
  },
  bonusFoot: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bonusFootText: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(248,250,252,0.78)",
  },
  bonusTotal: {
    color: "rgba(253,224,71,0.95)",
    fontWeight: "800",
    fontFamily: NUMERIC_FONT,
  },
  descLine: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(248,250,252,0.5)",
  },
  descBold: { color: "rgba(248,250,252,0.75)", fontWeight: "700" },
  helpHint: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 10,
    color: "rgba(248,250,252,0.4)",
  },
});
