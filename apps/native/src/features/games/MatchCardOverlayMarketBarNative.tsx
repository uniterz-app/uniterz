import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useGameMarketDistributionNative } from "./useGameMarketDistributionNative";
import type { GamesLanguage, GamesTexts } from "./gamesI18n";
import type { MarketBiasFallback } from "../../../../../lib/predict/gameMarketDistribution";
import { MATCH_CARD_METRIC_FONT } from "./matchCardTypography";

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

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
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
    <View style={[styles.barOuter, compact && styles.barOuterCompact]}>
      <View style={[styles.barRow, { gap }]}>
        {kinds.map((key, i) => {
          const highlighted = highlightedKeys.has(key);
          const colors =
            key === "home"
              ? ([homeColor, `${homeColor}cc`] as const)
              : key === "draw"
              ? (["rgba(156,163,175,0.92)", "rgba(107,114,128,0.88)"] as const)
              : ([awayColor, `${awayColor}cc`] as const);
          const borderColor =
            key === "home"
              ? highlighted
                ? `${homeColor}aa`
                : `${homeColor}88`
              : key === "draw"
              ? highlighted
                ? "rgba(209,213,219,0.85)"
                : "rgba(156,163,175,0.45)"
              : highlighted
              ? `${awayColor}aa`
              : `${awayColor}88`;

          return (
            <View
              key={`${key}-${i}`}
              style={[
                styles.segWrap,
                {
                  height: segH,
                  borderColor,
                  shadowColor: key === "home" ? homeColor : key === "away" ? awayColor : "#9ca3af",
                  shadowOpacity: highlighted ? 0.55 : 0.38,
                  shadowRadius: highlighted ? 6 : 4,
                  elevation: highlighted ? 3 : 2,
                },
              ]}
            >
              <LinearGradient colors={colors} style={StyleSheet.absoluteFillObject} />
            </View>
          );
        })}
      </View>
    </View>
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
  const accent =
    variant === "home" ? homeColor : variant === "away" ? awayColor : "#c8d0dc";

  return (
    <View
      style={[
        styles.statBox,
        compact && styles.statBoxCompact,
        {
          borderColor: isHighlighted ? `${accent}aa` : `${accent}99`,
          backgroundColor:
            variant === "draw" ? "rgba(186,195,210,0.18)" : `${accent}22`,
        },
      ]}
    >
      <Text
        style={[
          styles.statLabel,
          compact && styles.statLabelCompact,
          variant === "draw" && styles.statLabelDraw,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text style={[styles.statPct, compact && styles.statPctCompact]}>
        {formatPct(pct)}
      </Text>
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

  const marketBiasLabel = language === "ja" ? "市場バイアス" : "Market bias";
  const totalLabel = language === "ja" ? "予想 " : "Picks ";
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
                { color: markerAccent },
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
            label={t.predictToolDrawLabel}
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
  root: { width: "100%", paddingHorizontal: 4 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 8,
  },
  headerRowCompact: { marginBottom: 2 },
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
    height: 12,
    width: "100%",
    marginBottom: 2,
  },
  markerRowCompact: { height: 10 },
  markerCol: {
    position: "absolute",
    bottom: 0,
    transform: [{ translateX: -12 }],
    alignItems: "center",
  },
  markerYou: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  markerYouCompact: { fontSize: 7 },
  markerTriangle: {
    marginTop: 1,
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
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.1)",
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: 3,
    marginBottom: 6,
    overflow: "hidden",
  },
  barOuterCompact: { padding: 2, marginBottom: 4 },
  barRow: { flexDirection: "row", width: "100%" },
  segWrap: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    overflow: "hidden",
    transform: [{ skewX: "-14deg" }],
  },
  statsRow: { flexDirection: "row", gap: 6 },
  statsRowCompact: { gap: 4 },
  statBox: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  statBoxCompact: { paddingHorizontal: 6, paddingVertical: 6 },
  statLabel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.92)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
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
  },
  statPctCompact: { fontSize: 14 },
});
