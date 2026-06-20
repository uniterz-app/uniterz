import { useMemo } from "react";
import { StyleSheet, Text, View, type TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useGameMarketDistributionNative } from "./useGameMarketDistributionNative";
import type { GamesLanguage, GamesTexts } from "./gamesI18n";
import type { MarketBiasFallback } from "../../../../../lib/predict/gameMarketDistribution";
import { MATCH_CARD_METRIC_FONT } from "./matchCardTypography";
import PredictOverlayChamferedFrameNative from "./PredictOverlayChamferedFrameNative";
import {
  MATCH_LIST_CYBER_CUT_MARKET_BAR,
  MATCH_LIST_CYBER_CUT_STAT_BOX,
} from "./matchListCyberClipPath";

type MarketKey = "home" | "away" | "draw";
type Status = "scheduled" | "live" | "final";

type Props = {
  gameId: string;
  league: string;
  status: Status;
  score: { home: number; away: number } | null;
  fallbackMarketBias?: MarketBiasFallback | null;
  homeColor: string;
  awayColor: string;
  homeLabel: string;
  awayLabel: string;
  compact?: boolean;
  language: GamesLanguage;
  t: GamesTexts;
  userPredictionWinner?: MarketKey | null;
};

const CYBER_TAB_CYAN = "#22d3ee";
const MARKET_BAR_SEGMENTS = 20;
const DRAW_ACCENT = "#c8d0dc";
const DRAW_SEG_ACCENT = "#9ca3af";

function winningMarketBorder(accent: string): string {
  return hexWithAlpha(accent, "aa");
}

/** Web `segmentMarketGlow` の外側光彩近似 */
function segmentOuterShadow(accent: string, highlighted: boolean) {
  return highlighted
    ? {
        shadowColor: accent,
        shadowOpacity: 0.62,
        shadowRadius: 7,
        shadowOffset: { width: 0, height: 0 },
        elevation: 5,
      }
    : {
        shadowColor: accent,
        shadowOpacity: 0.52,
        shadowRadius: 5.5,
        shadowOffset: { width: 0, height: 0 },
        elevation: 4,
      };
}

function segmentFillColors(
  key: MarketKey,
  homeColor: string,
  awayColor: string
): readonly [string, string] {
  if (key === "home") return [homeColor, hexWithAlpha(homeColor, "cc")];
  if (key === "draw") {
    return ["rgba(156,163,175,0.92)", "rgba(107,114,128,0.88)"];
  }
  return [awayColor, hexWithAlpha(awayColor, "cc")];
}

function segmentBorderColor(
  key: MarketKey,
  homeColor: string,
  awayColor: string,
  highlighted: boolean
): string {
  if (key === "home") {
    return highlighted ? winningMarketBorder(homeColor) : hexWithAlpha(homeColor, "88");
  }
  if (key === "draw") {
    return highlighted ? "rgba(209,213,219,0.85)" : "rgba(156,163,175,0.45)";
  }
  return highlighted ? winningMarketBorder(awayColor) : hexWithAlpha(awayColor, "88");
}

function segmentAccent(
  key: MarketKey,
  homeColor: string,
  awayColor: string
): string {
  if (key === "home") return homeColor;
  if (key === "away") return awayColor;
  return DRAW_SEG_ACCENT;
}

function MarketBarSegment({
  marketKey,
  homeColor,
  awayColor,
  highlighted,
  height,
}: {
  marketKey: MarketKey;
  homeColor: string;
  awayColor: string;
  highlighted: boolean;
  height: number;
}) {
  const accent = segmentAccent(marketKey, homeColor, awayColor);
  const colors = segmentFillColors(marketKey, homeColor, awayColor);
  const borderColor = segmentBorderColor(marketKey, homeColor, awayColor, highlighted);

  return (
    <View style={styles.segSlot}>
      <View style={[styles.segGlowWrap, segmentOuterShadow(accent, highlighted)]}>
        <View style={styles.segSkew}>
          <View style={[styles.segFace, { height, borderColor }]}>
            <LinearGradient
              colors={colors}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              pointerEvents="none"
              style={[
                styles.segInsetGlow,
                { backgroundColor: hexWithAlpha(accent, highlighted ? "30" : "28") },
              ]}
            />
            <View pointerEvents="none" style={styles.segTopHighlight} />
          </View>
        </View>
      </View>
    </View>
  );
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function hexWithAlpha(hex: string, alphaHex: string): string {
  const normalized = hex.startsWith("#") ? hex : `#${hex}`;
  if (normalized.length === 9) return normalized;
  return `${normalized}${alphaHex}`;
}

function statTextNeon(accent: string): TextStyle {
  return {
    textShadowColor: hexWithAlpha(accent, "55"),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  };
}

function statBoxSurface(
  variant: MarketKey,
  homeColor: string,
  awayColor: string,
  isHighlighted: boolean
): { colors: readonly string[]; locations: readonly number[]; borderColor: string; glowColor: string; glowOpacity: number; glowRadius: number } {
  const accent =
    variant === "home" ? homeColor : variant === "away" ? awayColor : DRAW_ACCENT;

  if (isHighlighted) {
    return {
      colors: [hexWithAlpha(accent, "58"), "rgba(0,0,0,0.24)"],
      locations: [0, 0.72],
      borderColor: winningMarketBorder(accent),
      glowColor: accent,
      glowOpacity: 0.72,
      glowRadius: 10,
    };
  }
  if (variant === "draw") {
    return {
      colors: ["rgba(186,195,210,0.34)", "rgba(0,0,0,0.3)"],
      locations: [0, 0.72],
      borderColor: "rgba(200,210,225,0.62)",
      glowColor: DRAW_ACCENT,
      glowOpacity: 0.48,
      glowRadius: 6,
    };
  }
  return {
    colors: [hexWithAlpha(accent, "44"), "rgba(0,0,0,0.3)"],
    locations: [0, 0.72],
    borderColor: hexWithAlpha(accent, "99"),
    glowColor: accent,
    glowOpacity: 0.48,
    glowRadius: 6,
  };
}

function allocateSegmentCounts(
  barHome: number,
  barDraw: number,
  barAway: number,
  isSoccer: boolean,
  total: number
): Record<MarketKey, number> {
  const items: { key: MarketKey; share: number }[] = [
    { key: "home", share: barHome },
    ...(isSoccer ? [{ key: "draw" as const, share: barDraw }] : []),
    { key: "away", share: barAway },
  ];
  const sum = items.reduce((s, i) => s + i.share, 0) || 1;
  const scaled = items.map((i) => ({
    key: i.key,
    exact: (i.share / sum) * total,
  }));
  const counts = Object.fromEntries(
    scaled.map((s) => [s.key, Math.floor(s.exact)])
  ) as Record<MarketKey, number>;
  let used = Object.values(counts).reduce((a, b) => a + b, 0);
  const remainders = scaled
    .map((s) => ({ key: s.key, rem: s.exact - counts[s.key] }))
    .sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (used < total) {
    const key = remainders[i % remainders.length].key;
    counts[key] = (counts[key] ?? 0) + 1;
    used += 1;
    i += 1;
  }
  return counts;
}

function buildSegmentKinds(
  barHome: number,
  barDraw: number,
  barAway: number,
  isSoccer: boolean
): MarketKey[] {
  const counts = allocateSegmentCounts(
    barHome,
    barDraw,
    barAway,
    isSoccer,
    MARKET_BAR_SEGMENTS
  );
  const kinds: MarketKey[] = [];
  (["home", "draw", "away"] as const).forEach((key) => {
    if (!isSoccer && key === "draw") return;
    for (let n = 0; n < (counts[key] ?? 0); n++) kinds.push(key);
  });
  return kinds;
}

function markerCenterFromKinds(kinds: MarketKey[], pick: MarketKey): number | null {
  const total = kinds.length;
  if (!total) return null;
  let start = 0;
  while (start < total && kinds[start] !== pick) start++;
  if (start >= total) return null;
  let end = start;
  while (end < total && kinds[end] === pick) end++;
  return ((start + (end - start) / 2) / total) * 100;
}

function pickAccentColor(
  pick: MarketKey,
  homeColor: string,
  awayColor: string
): string {
  if (pick === "home") return homeColor;
  if (pick === "away") return awayColor;
  return "#d1d5db";
}

function resolveWinningMarketKeys(
  status: Status,
  score: { home: number; away: number } | null,
  isSoccer: boolean
): Set<MarketKey> {
  if (status !== "final" || !score) return new Set();
  const { home, away } = score;
  if (isSoccer && home === away) return new Set(["draw"]);
  if (home > away) return new Set(["home"]);
  if (away > home) return new Set(["away"]);
  return new Set();
}

function SegmentedMarketBar({
  kinds,
  homeColor,
  awayColor,
  compact,
  highlightedKeys,
}: {
  kinds: MarketKey[];
  homeColor: string;
  awayColor: string;
  compact?: boolean;
  highlightedKeys: Set<MarketKey>;
}) {
  const segH = compact ? 10 : 14;
  const gap = compact ? 2 : 3;

  return (
    <PredictOverlayChamferedFrameNative
      cut={MATCH_LIST_CYBER_CUT_MARKET_BAR}
      gradientColors={["rgba(0,0,0,0.25)", "rgba(0,0,0,0.25)"]}
      borderColor="rgba(34,211,238,0.1)"
      style={styles.barOuter}
      contentStyle={[styles.barOuterInner, compact && styles.barOuterInnerCompact, { gap }]}
    >
      {kinds.map((key, i) => (
        <MarketBarSegment
          key={`${key}-${i}`}
          marketKey={key}
          homeColor={homeColor}
          awayColor={awayColor}
          highlighted={highlightedKeys.has(key)}
          height={segH}
        />
      ))}
    </PredictOverlayChamferedFrameNative>
  );
}

function StatBox({
  label,
  pct,
  variant,
  homeColor,
  awayColor,
  compact,
  isHighlighted = false,
}: {
  label: string;
  pct: number;
  variant: MarketKey;
  homeColor: string;
  awayColor: string;
  compact?: boolean;
  isHighlighted?: boolean;
}) {
  const labelAccent =
    variant === "home" ? homeColor : variant === "away" ? awayColor : DRAW_ACCENT;
  const surface = statBoxSurface(variant, homeColor, awayColor, isHighlighted);

  return (
    <View style={styles.statBoxSlot}>
      <PredictOverlayChamferedFrameNative
        cut={MATCH_LIST_CYBER_CUT_STAT_BOX}
        gradientColors={surface.colors}
        gradientLocations={surface.locations}
        borderColor={surface.borderColor}
        borderWidth={isHighlighted ? 2 : 1}
        shadowColor={surface.glowColor}
        shadowOpacity={surface.glowOpacity}
        shadowRadius={isHighlighted ? surface.glowRadius + 2 : surface.glowRadius}
        style={styles.statBoxFrame}
        contentStyle={[
          styles.statBoxInner,
          compact ? styles.statBoxInnerCompact : null,
        ]}
      >
        <Text
          style={[
            styles.statLabel,
            compact && styles.statLabelCompact,
            variant === "draw" ? styles.statLabelDraw : { color: labelAccent },
            statTextNeon(labelAccent),
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.statPct,
            compact && styles.statPctCompact,
            styles.statPctGlow,
          ]}
        >
          {formatPct(pct)}
        </Text>
      </PredictOverlayChamferedFrameNative>
    </View>
  );
}

/** Web `MatchCardOverlayMarketBar` 相当 */
export default function MatchCardOverlayMarketBarNative({
  gameId,
  league,
  status,
  score,
  fallbackMarketBias,
  homeColor,
  awayColor,
  homeLabel,
  awayLabel,
  compact = false,
  language,
  t,
  userPredictionWinner = null,
}: Props) {
  const { isSoccer, total, homePct, awayPct, drawPct, fromFallback } =
    useGameMarketDistributionNative(gameId, league, fallbackMarketBias);

  const { highlightedKeys, segmentKinds } = useMemo(() => {
    const sum = Math.max(1e-6, homePct + awayPct + (isSoccer ? drawPct : 0));
    const bh = (homePct / sum) * 100;
    const bd = (drawPct / sum) * 100;
    const ba = (awayPct / sum) * 100;
    return {
      highlightedKeys: resolveWinningMarketKeys(status, score, isSoccer),
      segmentKinds: buildSegmentKinds(bh, bd, ba, isSoccer),
    };
  }, [awayPct, drawPct, homePct, isSoccer, score, status]);

  const hasData =
    total > 0 ||
    (fallbackMarketBias?.homePct ?? 0) + (fallbackMarketBias?.awayPct ?? 0) > 0;

  if (!hasData) return null;

  const marketBiasLabel = t.marketBias;
  const totalLabel = t.totalPredictions;
  const markerCenter =
    userPredictionWinner != null
      ? markerCenterFromKinds(segmentKinds, userPredictionWinner)
      : null;
  const markerAccent =
    userPredictionWinner != null
      ? pickAccentColor(userPredictionWinner, homeColor, awayColor)
      : "#fff";

  return (
    <View style={styles.root}>
      <View style={[styles.headerRow, compact && styles.headerRowCompact]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLine} />
          <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>
            {marketBiasLabel}
          </Text>
        </View>
        {total > 0 && !fromFallback ? (
          <Text style={[styles.totalText, compact && styles.totalTextCompact]}>
            {totalLabel}
            <Text style={styles.totalNum}>{total}</Text>
          </Text>
        ) : null}
      </View>

      {markerCenter != null ? (
        <View style={[styles.markerRow, compact && styles.markerRowCompact]}>
          <View style={[styles.markerCol, { left: `${markerCenter}%` }]}>
            <Text
              style={[
                styles.markerYou,
                compact && styles.markerYouCompact,
                {
                  color: markerAccent,
                  textShadowColor: hexWithAlpha(markerAccent, "88"),
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 8,
                },
              ]}
            >
              YOU
            </Text>
            <View style={[styles.markerTriangle, { borderTopColor: markerAccent }]} />
          </View>
        </View>
      ) : null}

      <SegmentedMarketBar
        kinds={segmentKinds}
        homeColor={homeColor}
        awayColor={awayColor}
        compact={compact}
        highlightedKeys={highlightedKeys}
      />

      <View style={[styles.statsRow, compact && styles.statsRowCompact]}>
        <StatBox
          label={homeLabel}
          pct={homePct}
          variant="home"
          homeColor={homeColor}
          awayColor={awayColor}
          compact={compact}
          isHighlighted={highlightedKeys.has("home")}
        />
        {isSoccer ? (
          <StatBox
            label={t.draw}
            pct={drawPct}
            variant="draw"
            homeColor={homeColor}
            awayColor={awayColor}
            compact={compact}
            isHighlighted={highlightedKeys.has("draw")}
          />
        ) : null}
        <StatBox
          label={awayLabel}
          pct={awayPct}
          variant="away"
          homeColor={homeColor}
          awayColor={awayColor}
          compact={compact}
          isHighlighted={highlightedKeys.has("away")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%" },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 0,
    gap: 8,
  },
  headerRowCompact: { marginBottom: 0 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0 },
  headerLine: {
    width: 8,
    height: 1,
    backgroundColor: CYBER_TAB_CYAN,
    shadowColor: CYBER_TAB_CYAN,
    shadowOpacity: 0.55,
    shadowRadius: 6,
  },
  headerTitle: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(0,245,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerTitleCompact: { fontSize: 8 },
  totalText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  totalTextCompact: { fontSize: 10 },
  totalNum: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.88)",
    fontWeight: "800",
  },
  markerRow: {
    position: "relative",
    height: 10,
    width: "100%",
    marginBottom: 0,
  },
  markerRowCompact: { height: 8 },
  markerCol: {
    position: "absolute",
    bottom: 0,
    transform: [{ translateX: -12 }],
    alignItems: "center",
  },
  markerYou: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    lineHeight: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  markerYouCompact: { fontSize: 7 },
  markerTriangle: {
    marginTop: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 4,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  barOuter: {
    width: "100%",
    marginTop: -1,
    marginBottom: 4,
  },
  barOuterInner: {
    flexDirection: "row",
    width: "100%",
    padding: 3,
  },
  barOuterInnerCompact: {
    padding: 2,
    marginBottom: 0,
  },
  segSlot: {
    flex: 1,
    minWidth: 0,
  },
  /** 光彩は overflow:hidden の外側 — Web box-shadow 相当 */
  segGlowWrap: {
    width: "100%",
  },
  segSkew: {
    transform: [{ skewX: "-14deg" }],
  },
  segFace: {
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  /** Web `inset 0 0 7px accent28` 近似 */
  segInsetGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.42,
  },
  /** Web `inset 0 1px 0 rgba(255,255,255,0.18)` */
  segTopHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    marginTop: 4,
  },
  statsRowCompact: { gap: 4, marginTop: 2 },
  statBoxSlot: {
    flex: 1,
    minWidth: 0,
  },
  statBoxFrame: {
    width: "100%",
  },
  statBoxInner: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  statBoxInnerCompact: {
    minHeight: 42,
    paddingHorizontal: 5,
    paddingVertical: 6,
  },
  statLabel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  statLabelCompact: { fontSize: 8 },
  statLabelDraw: { color: "rgba(255,255,255,0.82)" },
  statPct: {
    marginTop: 2,
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  statPctCompact: { fontSize: 13 },
  statPctGlow: {
    textShadowColor: "rgba(255,255,255,0.22)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
