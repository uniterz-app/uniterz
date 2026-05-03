import { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import type { GamesLanguage, GamesTexts } from "./gamesI18n";
import { listFinalH2hGamesFromPeers } from "./peerH2hGames";
import { rawTeamIdFromGameSide } from "./resolveNativeSeriesStanding";
import { resolveStaticNbaH2hAverages, resolveStaticNbaH2hRows } from "./nbaStaticH2hFallback";
import { colors, spacing } from "../../theme/tokens";
import type { NativeGameRow, SupportedLeague } from "./useTodayGames";
import { usePairTeamStats, type PairTeamStatsView } from "./usePairTeamStats";
import { usePredictionPostDistribution } from "./usePredictionPostDistribution";
import { predictMarketInnerEnter, predictStatsCompareRowEnter } from "./predictMotion";

const DISPLAY_FONT_FAMILY = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});
const NUMERIC_FONT_FAMILY = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});

type Props = {
  tab: "h2h" | "market" | "stats";
  language: GamesLanguage;
  t: GamesTexts;
  gameId: string;
  league: SupportedLeague;
  subjectGame: NativeGameRow;
  peerGames: ReadonlyArray<NativeGameRow>;
  formatGameDateMs: (ms: number) => string;
  homeColor: string;
  awayColor: string;
  isSoccerLeague: boolean;
};

function resolveTeamDisplay(side: unknown, fallback: string): string {
  if (typeof (side as { name?: unknown })?.name === "string") {
    const n = String((side as { name: string }).name).trim();
    if (n) return n;
  }
  if (typeof side === "string" && side.trim()) return side.trim();
  return fallback;
}

function formatRankNba(
  n: number | undefined,
  language: GamesLanguage,
  t: GamesTexts
): string | null {
  if (n == null || n < 1 || !Number.isFinite(n)) return null;
  const r = Math.round(n);
  if (language === "en") return `#${r}`;
  return t.predictToolRank.replace("{n}", String(r));
}

function formatH2hDateOnly(ms: number, language: GamesLanguage): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  if (language === "en") {
    return new Date(ms).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return new Date(ms).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function compactTeamLabel(name: string): string {
  const safe = (name ?? "").trim();
  if (!safe) return "—";
  const parts = safe.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : safe;
}

/** #RGB / #RRGGBBAA を #RRGGBB に正規化（グラデ計算用） */
function normalizeHexForMarketGradient(input: string): string {
  let h = (input ?? "").trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3 && /^[0-9a-fA-F]{3}$/.test(h)) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (h.length === 8 && /^[0-9a-fA-F]{8}$/.test(h)) h = h.slice(0, 6);
  if (h.length === 6 && /^[0-9a-fA-F]{6}$/.test(h)) return `#${h}`;
  return "#64748b";
}

/** Web `DonutChart.buildSegmentGradientStops` と同一ロジック（チーム色ベースのリンググラデ） */
function hexToRgbMarket(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHexForMarketGradient(hex);
  const h = normalized.replace("#", "").trim();
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (!Number.isFinite(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixRgbMarket(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function rgbToCssMarket(rgb: { r: number; g: number; b: number }) {
  return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

function marketSegmentGradientStops(baseHex: string): {
  light: string;
  base: string;
  dark: string;
} {
  const normalized = normalizeHexForMarketGradient(baseHex);
  const rgb = hexToRgbMarket(normalized);
  if (!rgb) {
    return { light: normalized, base: normalized, dark: normalized };
  }
  const light = rgbToCssMarket(mixRgbMarket({ r: 255, g: 255, b: 255 }, rgb, 0.75));
  const dark = rgbToCssMarket(mixRgbMarket({ r: 0, g: 0, b: 0 }, rgb, 0.55));
  return { light, base: normalized, dark };
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Web `DonutChart` の円周ストローク伸長（1.2s cubic-bezier）に相当 */
function MarketDonutSegmentArc({
  size,
  radius,
  strokeW,
  strokeUrl,
  segArcLen,
  accPctBefore,
  circumference,
  progress,
}: {
  size: number;
  radius: number;
  strokeW: number;
  strokeUrl: string;
  segArcLen: number;
  accPctBefore: number;
  circumference: number;
  progress: SharedValue<number>;
}) {
  const half = size / 2;
  const animatedProps = useAnimatedProps(() => {
    const drawn = Math.max(0, progress.value * segArcLen);
    return {
      strokeDasharray: `${drawn} ${circumference}`,
      strokeDashoffset: -circumference * accPctBefore,
    };
  });
  return (
    <AnimatedCircle
      cx={half}
      cy={half}
      r={radius}
      stroke={strokeUrl}
      strokeWidth={strokeW}
      strokeLinecap="butt"
      fill="none"
      animatedProps={animatedProps}
    />
  );
}

function resolveTeamScoreFromRow(
  row: {
    leftTeamId: string | null;
    rightTeamId: string | null;
    leftScore: number;
    rightScore: number;
  },
  teamId: string | null
): number | null {
  if (!teamId) return null;
  if (row.leftTeamId && row.leftTeamId === teamId) return row.leftScore;
  if (row.rightTeamId && row.rightTeamId === teamId) return row.rightScore;
  return null;
}

function barPctMaxNorm(left: number, right: number): [number, number] {
  const m = Math.max(left, right);
  if (!Number.isFinite(m) || m <= 0) return [0, 0];
  return [
    Math.min(100, Math.max(0, Math.round((left / m) * 100))),
    Math.min(100, Math.max(0, Math.round((right / m) * 100))),
  ];
}

function barPctMinPaNorm(left: number, right: number): [number, number] {
  const lo = Math.min(left, right);
  const hi = Math.max(left, right);
  if (hi <= 0 || !Number.isFinite(hi)) return [0, 0];
  const l = left > 0 ? Math.min(100, Math.round((lo / left) * 100)) : 0;
  const r = right > 0 ? Math.min(100, Math.round((lo / right) * 100)) : 0;
  return [Math.max(0, l), Math.max(0, r)];
}

function barPctDiffNorm(left: number, right: number): [number, number] {
  const mPos = Math.max(left, right);
  if (mPos > 0) {
    return [
      Math.min(100, Math.max(0, Math.round((Math.max(0, left) / mPos) * 100))),
      Math.min(100, Math.max(0, Math.round((Math.max(0, right) / mPos) * 100))),
    ];
  }
  if (left === 0 && right === 0) return [0, 0];
  const worst = Math.min(left, right);
  const best = Math.max(left, right);
  const span = best - worst;
  if (span <= 0) return [50, 50];
  return [
    Math.min(100, Math.max(0, Math.round(((left - worst) / span) * 100))),
    Math.min(100, Math.max(0, Math.round(((right - worst) / span) * 100))),
  ];
}

function MarketBars({
  home,
  away,
  draw,
  isSoccer,
  homeC,
  awayC,
  t,
  language,
  homeName,
  awayName,
}: {
  home: number;
  away: number;
  draw: number;
  isSoccer: boolean;
  homeC: string;
  awayC: string;
  t: GamesTexts;
  language: GamesLanguage;
  homeName: string;
  awayName: string;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const effTotal = isSoccer ? home + away + draw : home + away;
  if (effTotal <= 0) {
    return <Text style={s.muted}>{t.predictToolMarketNoPosts}</Text>;
  }
  const wHome = (100 * home) / effTotal;
  const wAway = (100 * away) / effTotal;
  const wDraw = isSoccer ? (100 * draw) / effTotal : 0;
  /** Web `GamePredictionDistribution` predictForm の DonutChart: size 176, thickness 56 */
  const size = 176;
  const strokeW = 56;
  const radius = (size - strokeW) / 2;
  const c = 2 * Math.PI * radius;
  const homePct = Math.max(0, Math.min(1, home / effTotal));
  const awayPct = Math.max(0, Math.min(1, away / effTotal));
  const drawPct = isSoccer ? Math.max(0, Math.min(1, draw / effTotal)) : 0;
  const homeLegend = resolveTeamDisplay(homeName, "HOME");
  const awayLegend = resolveTeamDisplay(awayName, "AWAY");
  const segs: Array<{
    key: string;
    pct: number;
    swatchColor: string;
    gradientBase: string;
    legendLabel: string;
    ratioText: string;
  }> = [
    {
      key: "home",
      pct: homePct,
      swatchColor: homeC,
      gradientBase: homeC,
      legendLabel: homeLegend,
      ratioText: `${wHome.toFixed(1)}%`,
    },
    ...(isSoccer
      ? [
          {
            key: "draw",
            pct: drawPct,
            swatchColor: "#9ca3af",
            gradientBase: "#9ca3af",
            legendLabel: t.predictToolDrawLabel,
            ratioText: `${wDraw.toFixed(1)}%`,
          },
        ]
      : []),
    {
      key: "away",
      pct: awayPct,
      swatchColor: awayC,
      gradientBase: awayC,
      legendLabel: awayLegend,
      ratioText: `${wAway.toFixed(1)}%`,
    },
  ];
  /** 12時位置スタート（Web DonutChart と同様に G で -90°） */
  let accPct = 0;
  const arcList = segs.map((seg) => {
    const segArcLen = c * seg.pct;
    const row = { key: seg.key, segArcLen, accPctBefore: accPct };
    accPct += seg.pct;
    return row;
  });
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const distKey = `${home}-${away}-${draw}-${effTotal}-${isSoccer ? 1 : 0}`;
  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    // progress は useSharedValue の安定参照のため依存に含めない
  }, [distKey, reduceMotion]);
  const mEnter = (i: number) => (reduceMotion ? undefined : predictMarketInnerEnter(i));
  const titleText = language === "en" ? "Market bias" : "市場の偏り";
  const totalPrefix = language === "en" ? "Total predictions: " : "総予想数：";
  return (
    <View style={s.marketDonutWrap}>
      <View style={s.marketDonutContent}>
        <Animated.View entering={mEnter(0)} style={s.marketDonutTopBlock}>
          <Text style={s.marketTitle}>{titleText}</Text>
          <View style={s.marketDonutCanvasWrap}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <Defs>
                {segs.map((seg) => {
                  const { light, base, dark } = marketSegmentGradientStops(seg.gradientBase);
                  return (
                    <SvgLinearGradient
                      key={`grad-${seg.key}`}
                      id={`market-grad-${seg.key}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <Stop offset="0%" stopColor={light} stopOpacity={0.95} />
                      <Stop offset="55%" stopColor={base} stopOpacity={0.95} />
                      <Stop offset="100%" stopColor={dark} stopOpacity={0.95} />
                    </SvgLinearGradient>
                  );
                })}
              </Defs>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={strokeW}
                fill="none"
              />
              <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                {arcList.map((a) => (
                  <MarketDonutSegmentArc
                    key={`seg-${a.key}`}
                    size={size}
                    radius={radius}
                    strokeW={strokeW}
                    strokeUrl={`url(#market-grad-${a.key})`}
                    segArcLen={a.segArcLen}
                    accPctBefore={a.accPctBefore}
                    circumference={c}
                    progress={progress}
                  />
                ))}
              </G>
            </Svg>
          </View>
        </Animated.View>
        <Animated.View entering={mEnter(1)}>
          <View style={s.marketTotalRow}>
            <Text style={s.marketTotalPrefix}>{totalPrefix}</Text>
            <Text style={s.marketTotalNumber}>{effTotal}</Text>
          </View>
        </Animated.View>
        <View style={s.marketLegendWrap}>
          {segs.map((seg, segIdx) => (
            <Animated.View key={`legend-${seg.key}`} entering={mEnter(2 + segIdx)}>
              <View style={s.marketLegendRow}>
                <View style={[s.marketLegendSwatch, { backgroundColor: seg.swatchColor }]} />
                <Text style={s.marketLegendLabel} numberOfLines={1}>
                  {seg.legendLabel}
                </Text>
                <Text style={s.marketLegendValue}>{seg.ratioText}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Web `SymmetricalCompareRow` + `CyberBar` に相当（詳細スタッツ用） */
function StatsToolRow({
  label,
  leftPrimary,
  rightPrimary,
  leftRankBelow,
  rightRankBelow,
  leftRecordBelow,
  rightRecordBelow,
  leftBarPct,
  rightBarPct,
  leftWin,
  rightWin,
  isLast = false,
}: {
  label: string;
  leftPrimary: string;
  rightPrimary: string;
  leftRankBelow: string | null;
  rightRankBelow: string | null;
  leftRecordBelow: string | null;
  rightRecordBelow: string | null;
  leftBarPct: number;
  rightBarPct: number;
  leftWin: boolean;
  rightWin: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[s.statDetailRow, isLast && s.statDetailRowLast]}>
      <View style={s.statDetailSideLeft}>
        <View
          style={[
            s.statDetailBarTrack,
            s.statDetailBarTrackLeft,
            leftWin && s.statDetailBarTrackLeftWin,
          ]}
        >
          <View
            style={[
              s.statDetailBarFillLeft,
              { width: `${leftBarPct}%` },
              leftWin && s.statDetailBarFillLeftWin,
            ]}
          />
        </View>
        <View style={s.statDetailRankSlot} />
        <View style={s.statDetailValueStackEnd}>
          <Text
            style={[s.statDetailLeftVal, leftWin && s.statDetailLeftValWin]}
            numberOfLines={1}
          >
            {leftPrimary}
          </Text>
          {leftRankBelow ? (
            <Text style={s.statDetailRankBelow}>{leftRankBelow}</Text>
          ) : null}
          {leftRecordBelow ? (
            <Text style={s.statDetailRecordBelow}>{leftRecordBelow}</Text>
          ) : null}
        </View>
      </View>
      <Text style={s.statDetailLabel} numberOfLines={2}>
        {label}
      </Text>
      <View style={s.statDetailSideRight}>
        <View style={s.statDetailValueStackStart}>
          <Text
            style={[s.statDetailRightVal, rightWin && s.statDetailRightValWin]}
            numberOfLines={1}
          >
            {rightPrimary}
          </Text>
          {rightRankBelow ? (
            <Text style={s.statDetailRankBelow}>{rightRankBelow}</Text>
          ) : null}
          {rightRecordBelow ? (
            <Text style={s.statDetailRecordBelow}>{rightRecordBelow}</Text>
          ) : null}
        </View>
        <View style={s.statDetailRankSlot} />
        <View
          style={[
            s.statDetailBarTrack,
            s.statDetailBarTrackRight,
            rightWin && s.statDetailBarTrackRightWin,
          ]}
        >
          <View
            style={[
              s.statDetailBarFillRight,
              { width: `${rightBarPct}%` },
              rightWin && s.statDetailBarFillRightWin,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function fmtDiffSigned(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
}

function fmtNetSigned(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
}

function NbaStatsBody({
  home,
  away,
  t,
  language,
}: {
  home: PairTeamStatsView;
  away: PairTeamStatsView;
  t: GamesTexts;
  language: GamesLanguage;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const isEn = language === "en";
  const r = (n: number | undefined) => formatRankNba(n, language, t);

  const [ppgL, ppgR] = barPctMaxNorm(home.avgFor, away.avgFor);
  const [papgL, papgR] = barPctMinPaNorm(home.avgAgainst, away.avgAgainst);
  const [diffL, diffR] = barPctDiffNorm(home.diff, away.diff);

  const ho = home.ofrtg;
  const ao = away.ofrtg;
  const hd = home.dfrtg;
  const ad = away.dfrtg;
  const hn = home.netrtg;
  const an = away.netrtg;
  const bothO = ho != null && ao != null;
  const bothD = hd != null && ad != null;
  const bothN = hn != null && an != null;
  const [oL, oR] = bothO ? barPctMaxNorm(ho, ao) : [0, 0];
  const [dL, dR] = bothD ? barPctMinPaNorm(hd, ad) : [0, 0];
  const [nL, nR] =
    bothN && hn != null && an != null ? barPctDiffNorm(hn, an) : [0, 0];

  const homeLbl = isEn ? "Home" : "ホーム戦績";
  const awayLbl = isEn ? "Away" : "アウェイ戦績";
  const hWinBar = Math.round(Math.min(100, Math.max(0, home.homeWinPct)));
  const aWinBar = Math.round(Math.min(100, Math.max(0, away.homeWinPct)));
  const hAwayBar = Math.round(Math.min(100, Math.max(0, home.awayWinPct)));
  const aAwayBar = Math.round(Math.min(100, Math.max(0, away.awayWinPct)));

  const rows: Parameters<typeof StatsToolRow>[0][] = [
    {
      label: t.predictToolPpg,
      leftPrimary: home.avgFor.toFixed(1),
      rightPrimary: away.avgFor.toFixed(1),
      leftRankBelow: r(home.ppgRank),
      rightRankBelow: r(away.ppgRank),
      leftRecordBelow: null,
      rightRecordBelow: null,
      leftBarPct: ppgL,
      rightBarPct: ppgR,
      leftWin: home.avgFor > away.avgFor,
      rightWin: away.avgFor > home.avgFor,
    },
    {
      label: "OFRTG",
      leftPrimary: ho != null ? ho.toFixed(1) : "—",
      rightPrimary: ao != null ? ao.toFixed(1) : "—",
      leftRankBelow: r(home.ofrtgRank),
      rightRankBelow: r(away.ofrtgRank),
      leftRecordBelow: null,
      rightRecordBelow: null,
      leftBarPct: oL,
      rightBarPct: oR,
      leftWin: bothO && ho > ao,
      rightWin: bothO && ao > ho,
    },
    {
      label: t.predictToolPapg,
      leftPrimary: home.avgAgainst.toFixed(1),
      rightPrimary: away.avgAgainst.toFixed(1),
      leftRankBelow: r(home.papgRank),
      rightRankBelow: r(away.papgRank),
      leftRecordBelow: null,
      rightRecordBelow: null,
      leftBarPct: papgL,
      rightBarPct: papgR,
      leftWin: home.avgAgainst < away.avgAgainst,
      rightWin: away.avgAgainst < home.avgAgainst,
    },
    {
      label: "DFRTG",
      leftPrimary: hd != null ? hd.toFixed(1) : "—",
      rightPrimary: ad != null ? ad.toFixed(1) : "—",
      leftRankBelow: r(home.dfrtgRank),
      rightRankBelow: r(away.dfrtgRank),
      leftRecordBelow: null,
      rightRecordBelow: null,
      leftBarPct: dL,
      rightBarPct: dR,
      leftWin: bothD && hd < ad,
      rightWin: bothD && ad < hd,
    },
    {
      label: t.predictToolDiff,
      leftPrimary: fmtDiffSigned(home.diff),
      rightPrimary: fmtDiffSigned(away.diff),
      leftRankBelow: r(home.diffRank),
      rightRankBelow: r(away.diffRank),
      leftRecordBelow: null,
      rightRecordBelow: null,
      leftBarPct: diffL,
      rightBarPct: diffR,
      leftWin: home.diff > away.diff,
      rightWin: away.diff > home.diff,
    },
    {
      label: "NETRTG",
      leftPrimary: hn != null ? fmtNetSigned(hn) : "—",
      rightPrimary: an != null ? fmtNetSigned(an) : "—",
      leftRankBelow: r(home.netrtgRank),
      rightRankBelow: r(away.netrtgRank),
      leftRecordBelow: null,
      rightRecordBelow: null,
      leftBarPct: nL,
      rightBarPct: nR,
      leftWin: bothN && hn > an,
      rightWin: bothN && an > hn,
    },
    {
      label: homeLbl,
      leftPrimary: `${Math.round(home.homeWinPct)}%`,
      rightPrimary: `${Math.round(away.homeWinPct)}%`,
      leftRankBelow: null,
      rightRankBelow: null,
      leftRecordBelow: `${home.homeW}-${home.homeL}`,
      rightRecordBelow: `${away.homeW}-${away.homeL}`,
      leftBarPct: hWinBar,
      rightBarPct: aWinBar,
      leftWin: home.homeWinPct > away.homeWinPct,
      rightWin: away.homeWinPct > home.homeWinPct,
    },
    {
      label: awayLbl,
      leftPrimary: `${Math.round(home.awayWinPct)}%`,
      rightPrimary: `${Math.round(away.awayWinPct)}%`,
      leftRankBelow: null,
      rightRankBelow: null,
      leftRecordBelow: `${home.awayW}-${home.awayL}`,
      rightRecordBelow: `${away.awayW}-${away.awayL}`,
      leftBarPct: hAwayBar,
      rightBarPct: aAwayBar,
      leftWin: home.awayWinPct > away.awayWinPct,
      rightWin: away.awayWinPct > home.awayWinPct,
    },
  ];

  return (
    <View style={s.statBlock}>
      {rows.map((row, idx) => (
        <Animated.View
          key={`nba-stat-${idx}-${row.label}`}
          entering={reduceMotion ? undefined : predictStatsCompareRowEnter(idx)}
        >
          <StatsToolRow {...row} isLast={idx === rows.length - 1} />
        </Animated.View>
      ))}
    </View>
  );
}

function NonNbaStatsBody({
  home,
  away,
  t,
  language,
}: {
  home: PairTeamStatsView;
  away: PairTeamStatsView;
  t: GamesTexts;
  language: GamesLanguage;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const isEn = language === "en";
  const [ppgL, ppgR] = barPctMaxNorm(home.avgFor, away.avgFor);
  const [papgL, papgR] = barPctMinPaNorm(home.avgAgainst, away.avgAgainst);
  const [diffL, diffR] = barPctDiffNorm(home.diff, away.diff);
  const homeLbl = isEn ? "Home" : "ホーム戦績";
  const awayLbl = isEn ? "Away" : "アウェイ戦績";
  const hWinBar = Math.round(Math.min(100, Math.max(0, home.homeWinPct)));
  const aWinBar = Math.round(Math.min(100, Math.max(0, away.homeWinPct)));
  const hAwayBar = Math.round(Math.min(100, Math.max(0, home.awayWinPct)));
  const aAwayBar = Math.round(Math.min(100, Math.max(0, away.awayWinPct)));

  const rows: Parameters<typeof StatsToolRow>[0][] = [
    {
      label: t.predictToolPpg,
      leftPrimary: home.avgFor.toFixed(1),
      rightPrimary: away.avgFor.toFixed(1),
      leftRankBelow: null,
      rightRankBelow: null,
      leftRecordBelow: null,
      rightRecordBelow: null,
      leftBarPct: ppgL,
      rightBarPct: ppgR,
      leftWin: home.avgFor > away.avgFor,
      rightWin: away.avgFor > home.avgFor,
    },
    {
      label: t.predictToolPapg,
      leftPrimary: home.avgAgainst.toFixed(1),
      rightPrimary: away.avgAgainst.toFixed(1),
      leftRankBelow: null,
      rightRankBelow: null,
      leftRecordBelow: null,
      rightRecordBelow: null,
      leftBarPct: papgL,
      rightBarPct: papgR,
      leftWin: home.avgAgainst < away.avgAgainst,
      rightWin: away.avgAgainst < home.avgAgainst,
    },
    {
      label: t.predictToolDiff,
      leftPrimary: fmtDiffSigned(home.diff),
      rightPrimary: fmtDiffSigned(away.diff),
      leftRankBelow: null,
      rightRankBelow: null,
      leftRecordBelow: null,
      rightRecordBelow: null,
      leftBarPct: diffL,
      rightBarPct: diffR,
      leftWin: home.diff > away.diff,
      rightWin: away.diff > home.diff,
    },
    {
      label: homeLbl,
      leftPrimary: `${Math.round(home.homeWinPct)}%`,
      rightPrimary: `${Math.round(away.homeWinPct)}%`,
      leftRankBelow: null,
      rightRankBelow: null,
      leftRecordBelow: `${home.homeW}-${home.homeL}`,
      rightRecordBelow: `${away.homeW}-${away.homeL}`,
      leftBarPct: hWinBar,
      rightBarPct: aWinBar,
      leftWin: home.homeWinPct > away.homeWinPct,
      rightWin: away.homeWinPct > home.homeWinPct,
    },
    {
      label: awayLbl,
      leftPrimary: `${Math.round(home.awayWinPct)}%`,
      rightPrimary: `${Math.round(away.awayWinPct)}%`,
      leftRankBelow: null,
      rightRankBelow: null,
      leftRecordBelow: `${home.awayW}-${home.awayL}`,
      rightRecordBelow: `${away.awayW}-${away.awayL}`,
      leftBarPct: hAwayBar,
      rightBarPct: aAwayBar,
      leftWin: home.awayWinPct > away.awayWinPct,
      rightWin: away.awayWinPct > home.awayWinPct,
    },
  ];

  return (
    <View style={s.statBlock}>
      {rows.map((row, idx) => (
        <Animated.View
          key={`nonnba-stat-${idx}-${row.label}`}
          entering={reduceMotion ? undefined : predictStatsCompareRowEnter(idx)}
        >
          <StatsToolRow {...row} isLast={idx === rows.length - 1} />
        </Animated.View>
      ))}
    </View>
  );
}

export function PredictToolTabContent({
  tab,
  language,
  t,
  gameId,
  league,
  subjectGame,
  peerGames,
  formatGameDateMs,
  homeColor,
  awayColor,
  isSoccerLeague,
}: Props) {
  const [rsExpanded, setRsExpanded] = useState(false);
  const homeId = rawTeamIdFromGameSide(subjectGame.home);
  const awayId = rawTeamIdFromGameSide(subjectGame.away);
  /** Web `NbaPostseasonMatchupPanel` の `h2hAverages` と同一ソース（静的 pack） */
  const staticH2hAverages = useMemo(
    () =>
      league === "nba"
        ? resolveStaticNbaH2hAverages(
            homeId,
            awayId,
            resolveTeamDisplay(subjectGame.home, ""),
            resolveTeamDisplay(subjectGame.away, "")
          )
        : null,
    [league, homeId, awayId, subjectGame]
  );

  const h2hRows = useMemo(
    () => listFinalH2hGamesFromPeers(subjectGame as Record<string, unknown>, peerGames, 12),
    [subjectGame, peerGames]
  );
  const h2hStaticRows = useMemo(
    () =>
      league === "nba"
        ? resolveStaticNbaH2hRows(
            homeId,
            awayId,
            resolveTeamDisplay(subjectGame.home, ""),
            resolveTeamDisplay(subjectGame.away, "")
          )
        : [],
    [league, homeId, awayId, subjectGame]
  );
  // 入っている分を優先表示:
  // 1) NBA静的H2H（summary/欠場者を含む） 2) Firestore履歴
  const h2hRowsResolved = h2hStaticRows.length > 0 ? h2hStaticRows : h2hRows;
  const h2hRowsNewestFirst = useMemo(
    () => [...h2hRowsResolved].sort((a, b) => b.startMs - a.startMs),
    [h2hRowsResolved]
  );
  const h2hHomeName = useMemo(
    () => resolveTeamDisplay(subjectGame.home, "HOME"),
    [subjectGame]
  );
  const h2hAwayName = useMemo(
    () => resolveTeamDisplay(subjectGame.away, "AWAY"),
    [subjectGame]
  );

  const { data: postDist, loading: postLoad, error: postErr } = usePredictionPostDistribution(
    tab === "market" ? gameId : null
  );
  const { home: sHome, away: sAway, loading: stLoad, error: stErr } = usePairTeamStats(
    tab === "stats" ? homeId : null,
    tab === "stats" ? awayId : null
  );

  if (tab === "h2h") {
    if (h2hRowsNewestFirst.length === 0) {
      return (
        <View>
          <Text style={s.muted}>{t.predictToolH2hEmpty}</Text>
          <Text style={s.footnote}>{t.predictToolH2hScope}</Text>
        </View>
      );
    }
    const poGames = h2hRowsNewestFirst.filter((row) => Boolean(row.seriesGameLabel));
    const rsGames = h2hRowsNewestFirst.filter((row) => !row.seriesGameLabel);
    const statsRows = poGames.length > 0 ? poGames : h2hRowsNewestFirst;
    const h2hStatsRows = (() => {
      const h = staticH2hAverages;
      if (
        h &&
        h.homeAvgPts != null &&
        h.awayAvgPts != null &&
        h.homeAvgPtsAllowed != null &&
        h.awayAvgPtsAllowed != null &&
        h.homeNetRtg != null &&
        h.awayNetRtg != null
      ) {
        const homeAvgPts = h.homeAvgPts;
        const awayAvgPts = h.awayAvgPts;
        const homeAvgAllowed = h.homeAvgPtsAllowed;
        const awayAvgAllowed = h.awayAvgPtsAllowed;
        const homeNet = h.homeNetRtg;
        const awayNet = h.awayNetRtg;
        const [ptsBarL, ptsBarR] = barPctMaxNorm(homeAvgPts, awayAvgPts);
        const [allowedBarL, allowedBarR] = barPctMinPaNorm(
          homeAvgAllowed,
          awayAvgAllowed
        );
        const [netBarL, netBarR] = barPctDiffNorm(homeNet, awayNet);
        return [
          {
            key: "pts",
            label: language === "en" ? "H2H PTS / G" : "H2H平均得点",
            left: homeAvgPts,
            right: awayAvgPts,
            leftWin: homeAvgPts > awayAvgPts,
            rightWin: awayAvgPts > homeAvgPts,
            leftBarPct: ptsBarL,
            rightBarPct: ptsBarR,
            signed: false,
          },
          {
            key: "allowed",
            label: language === "en" ? "H2H OPP PTS / G" : "H2H平均失点",
            left: homeAvgAllowed,
            right: awayAvgAllowed,
            leftWin: homeAvgAllowed < awayAvgAllowed,
            rightWin: awayAvgAllowed < homeAvgAllowed,
            leftBarPct: allowedBarL,
            rightBarPct: allowedBarR,
            signed: false,
          },
          {
            key: "net",
            label: "H2H NET",
            left: homeNet,
            right: awayNet,
            leftWin: homeNet > awayNet,
            rightWin: awayNet > homeNet,
            leftBarPct: netBarL,
            rightBarPct: netBarR,
            signed: true,
          },
        ] as const;
      }
      let homePts = 0;
      let awayPts = 0;
      let homeAllowed = 0;
      let awayAllowed = 0;
      let count = 0;
      for (const row of statsRows) {
        const homeTeamPts = resolveTeamScoreFromRow(row, homeId);
        const awayTeamPts = resolveTeamScoreFromRow(row, awayId);
        if (homeTeamPts == null || awayTeamPts == null) continue;
        homePts += homeTeamPts;
        awayPts += awayTeamPts;
        homeAllowed += awayTeamPts;
        awayAllowed += homeTeamPts;
        count += 1;
      }
      if (count <= 0) return null;
      const homeAvgPts = homePts / count;
      const awayAvgPts = awayPts / count;
      const homeAvgAllowed = homeAllowed / count;
      const awayAvgAllowed = awayAllowed / count;
      const homeNet = homeAvgPts - homeAvgAllowed;
      const awayNet = awayAvgPts - awayAvgAllowed;
      const [ptsBarL, ptsBarR] = barPctMaxNorm(homeAvgPts, awayAvgPts);
      const [allowedBarL, allowedBarR] = barPctMinPaNorm(homeAvgAllowed, awayAvgAllowed);
      const [netBarL, netBarR] = barPctDiffNorm(homeNet, awayNet);
      return [
        {
          key: "pts",
          label: language === "en" ? "H2H PTS / G" : "H2H平均得点",
          left: homeAvgPts,
          right: awayAvgPts,
          leftWin: homeAvgPts > awayAvgPts,
          rightWin: awayAvgPts > homeAvgPts,
          leftBarPct: ptsBarL,
          rightBarPct: ptsBarR,
          signed: false,
        },
        {
          key: "allowed",
          label: language === "en" ? "H2H OPP PTS / G" : "H2H平均失点",
          left: homeAvgAllowed,
          right: awayAvgAllowed,
          leftWin: homeAvgAllowed < awayAvgAllowed,
          rightWin: awayAvgAllowed < homeAvgAllowed,
          leftBarPct: allowedBarL,
          rightBarPct: allowedBarR,
          signed: false,
        },
        {
          key: "net",
          label: "H2H NET",
          left: homeNet,
          right: awayNet,
          leftWin: homeNet > awayNet,
          rightWin: awayNet > homeNet,
          leftBarPct: netBarL,
          rightBarPct: netBarR,
          signed: true,
        },
      ] as const;
    })();
    const renderH2hRows = (rows: typeof h2hRowsNewestFirst) => (
      <View style={s.h2hListCard}>
        {rows.map((row, idx) => (
          <View
            key={row.id}
            style={[s.h2hRow, idx !== rows.length - 1 && s.h2hRowDivider]}
          >
            <Text style={s.h2hDate} numberOfLines={1}>
              {formatH2hDateOnly(row.startMs, language)}
            </Text>
            {row.seriesGameLabel ? (
              <Text style={s.h2hGameLabel} numberOfLines={1}>
                {row.seriesGameLabel}
              </Text>
            ) : null}
            <View style={s.h2hGameCenter}>
              <View style={s.h2hTeamCol}>
                {row.homeTeamSide ? (
                  <Text style={s.h2hSideTag}>
                    {row.homeTeamSide === "left" ? "HOME" : "AWAY"}
                  </Text>
                ) : null}
                <Text style={s.h2hTeamName} numberOfLines={1}>
                  {row.leftTeamDisplay}
                </Text>
              </View>
              <View style={s.h2hScoreCol}>
                <Text style={s.h2hOvertimeTag}>
                  {(row as { wentToOvertime?: unknown }).wentToOvertime === true ? "OT" : " "}
                </Text>
                <Text style={s.h2hScore} numberOfLines={1}>
                  <Text
                    style={
                      row.leftScore > row.rightScore ? s.h2hScoreWin : s.h2hScoreLose
                    }
                  >
                    {row.leftScore}
                  </Text>
                  <Text style={s.h2hScoreDash}> - </Text>
                  <Text
                    style={
                      row.rightScore > row.leftScore ? s.h2hScoreWin : s.h2hScoreLose
                    }
                  >
                    {row.rightScore}
                  </Text>
                </Text>
              </View>
              <View style={s.h2hTeamCol}>
                {row.homeTeamSide ? (
                  <Text style={s.h2hSideTag}>
                    {row.homeTeamSide === "right" ? "HOME" : "AWAY"}
                  </Text>
                ) : null}
                <Text style={s.h2hTeamName} numberOfLines={1}>
                  {row.rightTeamDisplay}
                </Text>
              </View>
            </View>
            {(() => {
              const leftInjuries =
                row.injuriesLeft ?? (row.homeTeamSide === "right" ? row.injuriesAway : row.injuriesHome);
              const rightInjuries =
                row.injuriesRight ?? (row.homeTeamSide === "right" ? row.injuriesHome : row.injuriesAway);
              return leftInjuries.length > 0 || rightInjuries.length > 0 ? (
                <View style={s.h2hInjuryCard}>
                  <View style={s.h2hInjuryGrid}>
                    <Text style={[s.h2hInjuryLine, s.h2hInjuryLineLeft]}>
                      {leftInjuries.length > 0 ? leftInjuries.join(" ・ ") : "—"}
                    </Text>
                    <Text style={s.h2hInjuryTitle}>{language === "en" ? "Inactive" : "欠場"}</Text>
                    <Text style={[s.h2hInjuryLine, s.h2hInjuryLineRight]}>
                      {rightInjuries.length > 0 ? rightInjuries.join(" ・ ") : "—"}
                    </Text>
                  </View>
                </View>
              ) : null;
            })()}
            {((language === "en" ? row.summaryEn : row.summaryJa) ??
              row.summaryJa ??
              row.summaryEn) ? (
              <View style={s.h2hSummaryCard}>
                <Text style={s.h2hSummaryTitle}>Game Summary</Text>
                <Text style={s.h2hSummaryBody}>
                  {(language === "en" ? row.summaryEn : row.summaryJa) ??
                    row.summaryJa ??
                    row.summaryEn}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    );
    return (
      <View style={s.h2hWrap}>
        {(() => {
          let leftWins = 0;
          let rightWins = 0;
          for (const row of poGames.length > 0 ? poGames : h2hRowsNewestFirst) {
            if (row.leftScore === row.rightScore) continue;
            if (row.leftScore > row.rightScore) leftWins += 1;
            else if (row.rightScore > row.leftScore) rightWins += 1;
          }
          const first = (poGames.length > 0 ? poGames : h2hRowsNewestFirst)[0];
          const leftName = compactTeamLabel(first?.leftTeamDisplay ?? h2hHomeName);
          const rightName = compactTeamLabel(first?.rightTeamDisplay ?? h2hAwayName);
          return (
            <View style={s.h2hTrendCard}>
              <Text style={s.h2hTrendTitle}>Series Trend</Text>
              <Text style={s.h2hTrendScore}>
                <Text style={s.h2hTrendTeam}>{leftName} </Text>
                <Text style={leftWins > rightWins ? s.h2hTrendNumLead : s.h2hTrendNum}>
                  {leftWins}
                </Text>
                <Text style={s.h2hTrendDash}> - </Text>
                <Text style={rightWins > leftWins ? s.h2hTrendNumLead : s.h2hTrendNum}>
                  {rightWins}
                </Text>
                <Text style={s.h2hTrendTeam}> {rightName}</Text>
              </Text>
            </View>
          );
        })()}
        {poGames.length > 0 ? renderH2hRows(poGames) : null}
        <View style={s.rsAccordionWrap}>
          <View style={s.rsToggleRow}>
            <Text style={s.rsLabel}>RS</Text>
            <Text
              style={s.rsAction}
              onPress={() => {
                setRsExpanded((v) => !v);
              }}
            >
              {rsExpanded ? (language === "en" ? "Hide" : "閉じる") : language === "en" ? "Show" : "表示"}
            </Text>
          </View>
          {rsExpanded
            ? rsGames.length > 0
              ? renderH2hRows(rsGames)
              : (
                <View style={s.rsEmptyWrap}>
                  <Text style={s.muted}>{language === "en" ? "No RS head-to-head data yet." : "RSの直接対決データはまだありません。"}</Text>
                </View>
              )
            : null}
        </View>
        {h2hStatsRows ? (
          <View style={s.h2hStatsCard}>
            <Text style={s.h2hStatsTitle}>
              {language === "en" ? "Head-to-head stats" : "直接対決のスタッツ"}
            </Text>
            {h2hStatsRows.map((row) => (
              <View key={row.key} style={s.h2hStatsRow}>
                <View style={[s.h2hStatsBarTrack, s.h2hStatsBarTrackLeft, row.leftWin && s.h2hStatsBarTrackLeftWin]}>
                  <View
                    style={[
                      s.h2hStatsBarFillLeft,
                      { width: `${row.leftBarPct}%` },
                      row.leftWin && s.h2hStatsBarFillLeftWin,
                    ]}
                  />
                </View>
                <Text style={[s.h2hStatsLeftVal, row.leftWin && s.h2hStatsLeftValWin]}>
                  {row.signed
                    ? row.left > 0
                      ? `+${row.left.toFixed(1)}`
                      : row.left.toFixed(1)
                    : row.left.toFixed(1)}
                </Text>
                <Text style={s.h2hStatsLabel}>{row.label}</Text>
                <Text style={[s.h2hStatsRightVal, row.rightWin && s.h2hStatsRightValWin]}>
                  {row.signed
                    ? row.right > 0
                      ? `+${row.right.toFixed(1)}`
                      : row.right.toFixed(1)
                    : row.right.toFixed(1)}
                </Text>
                <View style={[s.h2hStatsBarTrack, s.h2hStatsBarTrackRight, row.rightWin && s.h2hStatsBarTrackRightWin]}>
                  <View
                    style={[
                      s.h2hStatsBarFillRight,
                      { width: `${row.rightBarPct}%` },
                      row.rightWin && s.h2hStatsBarFillRightWin,
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  if (tab === "market") {
    if (postLoad) {
      return <Text style={s.muted}>{t.predictToolLoading}</Text>;
    }
    if (postErr) {
      return <Text style={s.muted}>{t.predictToolLoadError}</Text>;
    }
    return (
      <MarketBars
        home={postDist.home}
        away={postDist.away}
        draw={postDist.draw}
        isSoccer={isSoccerLeague}
        homeC={homeColor}
        awayC={awayColor}
        t={t}
        language={language}
        homeName={h2hHomeName}
        awayName={h2hAwayName}
      />
    );
  }

  if (!homeId || !awayId) {
    return <Text style={s.muted}>{t.predictToolStatsNoTeam}</Text>;
  }
  if (stLoad) {
    return <Text style={s.muted}>{t.predictToolLoading}</Text>;
  }
  if (stErr) {
    return <Text style={s.muted}>{t.predictToolLoadError}</Text>;
  }
  if (!sHome || !sAway) {
    return <Text style={s.muted}>{t.predictToolLoadError}</Text>;
  }
  if (league === "nba") {
    return <NbaStatsBody home={sHome} away={sAway} t={t} language={language} />;
  }
  return <NonNbaStatsBody home={sHome} away={sAway} t={t} language={language} />;
}

const s = StyleSheet.create({
  muted: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    lineHeight: 16,
  },
  footnote: {
    marginTop: spacing.xs,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    lineHeight: 14,
  },
  h2hWrap: {
    position: "relative",
    gap: 8,
    overflow: "hidden",
  },
  h2hTrendCard: {
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  h2hTrendTitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    marginBottom: 4,
    textAlign: "center",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  h2hTrendScore: {
    textAlign: "center",
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  h2hTrendTeam: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  h2hTrendNum: {
    color: "rgba(232,250,255,0.95)",
  },
  h2hTrendNumLead: {
    color: "#fde047",
    textShadowColor: "rgba(253,224,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  h2hTrendDash: {
    color: "rgba(103,232,249,0.6)",
  },
  h2hListCard: {
    position: "relative",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.025)",
    overflow: "hidden",
  },
  rsAccordionWrap: {
    position: "relative",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(56,130,246,0.14)",
    padding: 8,
    gap: 6,
    overflow: "hidden",
  },
  rsToggleRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
    minHeight: 30,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rsLabel: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  rsAction: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  rsEmptyWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  h2hRow: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 7,
  },
  h2hRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  h2hDate: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "700",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  h2hGameLabel: {
    textAlign: "center",
    color: "rgba(255,255,255,0.64)",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  h2hGameCenter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  h2hTeamCol: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  h2hSideTag: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  h2hTeamName: {
    marginTop: 0,
    color: "rgba(235,246,255,0.9)",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  h2hScoreCol: {
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 104,
  },
  h2hOvertimeTag: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 1,
    fontFamily: NUMERIC_FONT_FAMILY,
  },
  h2hScore: {
    textAlign: "center",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  h2hScoreDash: {
    color: "rgba(255,255,255,0.6)",
  },
  h2hScoreWin: {
    color: "#fde047",
    textShadowColor: "rgba(253,224,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  h2hScoreLose: {
    color: colors.textPrimary,
  },
  h2hInjuryCard: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.26)",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  h2hInjuryGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  h2hInjuryTitle: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    paddingTop: 1,
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  h2hInjuryLine: {
    color: "rgba(240,248,255,0.86)",
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
    fontFamily: NUMERIC_FONT_FAMILY,
  },
  h2hInjuryLineLeft: {
    textAlign: "right",
  },
  h2hInjuryLineRight: {
    textAlign: "left",
  },
  h2hSummaryCard: {
    marginTop: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 3,
  },
  h2hSummaryTitle: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  h2hSummaryBody: {
    color: "rgba(245,250,255,0.8)",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    fontFamily: NUMERIC_FONT_FAMILY,
  },
  h2hStatsCard: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    gap: 8,
  },
  h2hStatsTitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  h2hStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  h2hStatsBarTrack: {
    height: 3,
    width: 94,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  h2hStatsBarTrackLeft: {
    borderColor: "rgba(92,240,181,0.28)",
    shadowColor: "#5cf0b5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  h2hStatsBarTrackRight: {
    borderColor: "rgba(179,136,255,0.28)",
    shadowColor: "#b388ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  h2hStatsBarTrackLeftWin: {
    shadowOpacity: 0.38,
    shadowRadius: 8,
  },
  h2hStatsBarTrackRightWin: {
    shadowOpacity: 0.36,
    shadowRadius: 8,
  },
  h2hStatsBarFillLeft: {
    height: "100%",
    backgroundColor: "#5cf0b5",
  },
  h2hStatsBarFillRight: {
    height: "100%",
    marginLeft: "auto",
    backgroundColor: "#b388ff",
  },
  h2hStatsBarFillLeftWin: {
    shadowColor: "#5cf0b5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
  },
  h2hStatsBarFillRightWin: {
    shadowColor: "#b388ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  h2hStatsLeftVal: {
    width: 84,
    textAlign: "right",
    color: "#5cf0b5",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "800",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  h2hStatsLeftValWin: {
    textShadowColor: "rgba(92,240,181,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  h2hStatsRightVal: {
    width: 84,
    textAlign: "left",
    color: "#b388ff",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "800",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  h2hStatsRightValWin: {
    textShadowColor: "rgba(179,136,255,0.52)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  h2hStatsLabel: {
    width: 128,
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "600",
    fontFamily: NUMERIC_FONT_FAMILY,
  },
  smallMuted: {
    marginTop: 4,
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
  },
  marketDonutWrap: {
    position: "relative",
    overflow: "visible",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  /** Web predictForm: flex-col gap-5（ドーナツ〜凡例）。タイトルは左寄せ・ドーナツ以下は従来どおり中央 */
  marketDonutContent: {
    alignItems: "center",
    gap: 16,
    width: "100%",
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 10,
  },
  /** タイトルをカード上辺の左に寄せるため幅いっぱいに伸ばす */
  marketDonutTopBlock: {
    alignSelf: "stretch",
    width: "100%",
    alignItems: "center",
  },
  /** Web: text-sm font-semibold（配置は左上） */
  marketTitle: {
    alignSelf: "stretch",
    textAlign: "left",
    marginBottom: 4,
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  marketDonutCanvasWrap: {
    marginTop: 0,
    marginBottom: 0,
  },
  marketTotalRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 2,
  },
  /** Web: text-[11px] text-white/70 */
  marketTotalPrefix: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 11,
    lineHeight: 14,
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  marketTotalNumber: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  /** Web: max-w-[280px] space-y-3 */
  marketLegendWrap: {
    width: "100%",
    maxWidth: 280,
    alignSelf: "center",
    gap: 12,
    paddingHorizontal: 0,
    paddingBottom: 2,
  },
  /** Web: gap-3、凡例＋チーム名＋％を一行 */
  marketLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  /** Web: h-3 w-3 rounded-sm */
  marketLegendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
    flexShrink: 0,
  },
  /** Web: text-xs font-bold text-white/85 truncate max-w-[58%] */
  marketLegendLabel: {
    flexShrink: 1,
    flexGrow: 0,
    maxWidth: "58%",
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  /** Web: metric フォント + text-white/70 */
  marketLegendValue: {
    flexShrink: 0,
    color: "rgba(255,255,255,0.70)",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  marketWrap: { gap: 8 },
  barLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginBottom: 4,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3, minWidth: 2 },
  statBlock: { gap: 0 },
  /** Web `SymmetricalCompareRow`（詳細スタッツ） */
  statDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  statDetailRowLast: {
    borderBottomWidth: 0,
  },
  statDetailSideLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    minWidth: 0,
  },
  statDetailSideRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    minWidth: 0,
  },
  statDetailRankSlot: {
    width: 6,
  },
  statDetailBarTrack: {
    width: 70,
    height: 3,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  statDetailBarTrackLeft: {
    borderColor: "rgba(92,240,181,0.28)",
    shadowColor: "#5cf0b5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
  },
  statDetailBarTrackRight: {
    borderColor: "rgba(179,136,255,0.28)",
    shadowColor: "#b388ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
  },
  statDetailBarTrackLeftWin: {
    shadowOpacity: 0.32,
    shadowRadius: 7,
  },
  statDetailBarTrackRightWin: {
    shadowOpacity: 0.3,
    shadowRadius: 7,
  },
  statDetailBarFillLeft: {
    height: "100%",
    backgroundColor: "#5cf0b5",
  },
  statDetailBarFillRight: {
    height: "100%",
    marginLeft: "auto",
    backgroundColor: "#b388ff",
  },
  statDetailBarFillLeftWin: {
    shadowColor: "#5cf0b5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
  },
  statDetailBarFillRightWin: {
    shadowColor: "#b388ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 5,
  },
  statDetailValueStackEnd: {
    alignItems: "flex-end",
    gap: 2,
    maxWidth: 80,
    minWidth: 0,
  },
  statDetailValueStackStart: {
    alignItems: "flex-start",
    gap: 2,
    maxWidth: 80,
    minWidth: 0,
  },
  statDetailLeftVal: {
    color: "#5cf0b5",
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "800",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  statDetailLeftValWin: {
    textShadowColor: "rgba(92,240,181,0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  statDetailRightVal: {
    color: "#b388ff",
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "800",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  statDetailRightValWin: {
    textShadowColor: "rgba(179,136,255,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  statDetailLabel: {
    width: 86,
    paddingHorizontal: 2,
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    fontFamily: NUMERIC_FONT_FAMILY,
  },
  statDetailRankBelow: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    lineHeight: 12,
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  statDetailRecordBelow: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    lineHeight: 12,
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
});
