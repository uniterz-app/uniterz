/**
 * リザルトカード面の市場偏り / TOP SCORER / Upset·Score。
 * 予想オーバーレイも同じ面を使う。
 */
import { useLayoutEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  MATCH_CARD_METRIC_FONT,
  MATCH_CARD_SCORE_FONT,
} from "../games/matchCardTypography";
import { resultCardFaceCopy } from "../../../../../lib/result/resultCardFaceCopy";
import type { Language } from "../../../../../lib/i18n/language";

const BIAS_SEGS = 16;
const BIAS_SEG_STAGGER_MS = 32;
const AMBER = "#FBBF24";
const UPSET_RED = "#DC2626";
const SCORER_HIT_COLOR = "#FBBF24";
const SCORER_MISS_COLOR = "rgba(148,163,184,0.55)";

function hexWithAlpha(hex: string, alphaHex: string): string {
  const n = hex.startsWith("#") ? hex : `#${hex}`;
  if (n.length === 9) return n;
  return `${n}${alphaHex}`;
}

function BiasSegFace({
  index,
  progress,
  accent,
  targetOp,
  animate,
}: {
  index: number;
  progress: SharedValue<number>;
  accent: string;
  targetOp: number;
  animate: boolean;
}) {
  const style = useAnimatedStyle(() => {
    if (!animate) {
      return { opacity: targetOp, transform: [{ scaleX: 1 }] };
    }
    const t = interpolate(
      progress.value,
      [index, index + 0.8],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: t * targetOp,
      transform: [{ scaleX: 0.12 + t * 0.88 }],
    };
  });
  return (
    <View style={styles.biasSegSlot}>
      <View style={styles.biasSegSkew}>
        <Animated.View
          style={[
            styles.biasSegFace,
            {
              borderColor: hexWithAlpha(accent, "88"),
              backgroundColor: accent,
            },
            style,
          ]}
        />
      </View>
    </View>
  );
}

export function ResultCardMarketBiasNative({
  homePct,
  awayPct,
  homeAccent,
  awayAccent,
  ja,
  language,
  animate = false,
  revealDelayMs = 0,
  predictionCount = null,
  predictionCountLabel,
}: {
  homePct: number;
  awayPct: number;
  homeAccent: string;
  awayAccent: string;
  ja?: boolean;
  language?: Language;
  animate?: boolean;
  revealDelayMs?: number;
  predictionCount?: number | null;
  /** 例: 「総予想数：」 / "Total predictions: " */
  predictionCountLabel?: string;
}) {
  const copy = resultCardFaceCopy(language ?? (ja === false ? "en" : "ja"));
  const homeSegs = Math.max(
    0,
    Math.min(BIAS_SEGS, Math.round((homePct / 100) * BIAS_SEGS))
  );
  const progress = useSharedValue(animate ? 0 : BIAS_SEGS);
  const showCount =
    typeof predictionCount === "number" &&
    Number.isFinite(predictionCount) &&
    predictionCount >= 0;
  const countLabel = predictionCountLabel ?? copy.totalPredictions;

  useLayoutEffect(() => {
    if (!animate) {
      progress.value = BIAS_SEGS;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      revealDelayMs,
      withTiming(BIAS_SEGS, {
        duration: BIAS_SEGS * BIAS_SEG_STAGGER_MS,
        easing: Easing.linear,
      })
    );
  }, [animate, revealDelayMs, progress]);

  return (
    <View style={styles.biasRoot}>
      <View style={styles.biasPctHeader}>
        <Text style={[styles.biasPctHeaderNum, { color: homeAccent }]}>
          {homePct.toFixed(1)}%
        </Text>
        <View style={styles.biasPctHeaderMidCol}>
          <Text style={styles.biasPctHeaderMid}>
            — {copy.marketBias} —
          </Text>
          {showCount ? (
            <Text style={styles.biasCount}>
              {countLabel}
              <Text style={styles.biasCountNum}>{Math.floor(predictionCount)}</Text>
            </Text>
          ) : null}
        </View>
        <Text
          style={[
            styles.biasPctHeaderNum,
            styles.biasPctHeaderNumAway,
            { color: awayAccent },
          ]}
        >
          {awayPct.toFixed(1)}%
        </Text>
      </View>
      <View style={styles.biasBarInner}>
        {Array.from({ length: BIAS_SEGS }).map((_, i) => {
          const home = i < homeSegs;
          return (
            <BiasSegFace
              key={i}
              index={i}
              progress={progress}
              accent={home ? homeAccent : awayAccent}
              targetOp={home ? 0.95 : 0.85}
              animate={animate}
            />
          );
        })}
      </View>
    </View>
  );
}

export function ResultCardTopScorerRowNative({
  name,
  hit = null,
  settled = false,
}: {
  name: string | null | undefined;
  hit?: boolean | null;
  settled?: boolean;
}) {
  if (!name || name === "—") return null;
  const showOutcome = settled && hit != null;

  return (
    <View style={styles.scorerBlock}>
      <View style={styles.scorerValueRow}>
        <View style={styles.skewWrap}>
          <Text style={styles.scorerLabel}>TOP SCORER</Text>
        </View>
        <View style={styles.scorerNameWrap}>
          <View style={styles.scorerNameSkew}>
            <Text style={styles.scorerName} numberOfLines={1}>
              {name}
            </Text>
          </View>
        </View>
        {showOutcome ? (
          <View style={styles.scorerHitCluster}>
            <MaterialCommunityIcons
              name={hit ? "check" : "close"}
              size={14}
              color={hit ? SCORER_HIT_COLOR : SCORER_MISS_COLOR}
            />
            <Text
              style={[
                styles.scorerHit,
                hit ? styles.scorerHitOn : styles.scorerHitOff,
              ]}
            >
              {hit ? "HIT" : "MISS"}
            </Text>
          </View>
        ) : (
          <View style={styles.scorerHitCluster} />
        )}
      </View>
    </View>
  );
}

export function ResultCardUpsetScoreSplitNative({
  ja,
  language,
  settled = false,
  upsetPoints = null,
  totalPoints = null,
  scoreRel = null,
}: {
  ja?: boolean;
  language?: Language;
  settled?: boolean;
  upsetPoints?: number | null;
  totalPoints?: number | null;
  scoreRel?: "max" | "top5" | "top10" | null;
}) {
  const copy = resultCardFaceCopy(language ?? (ja === false ? "en" : "ja"));
  const hasUpset = settled && upsetPoints != null;
  const upsetValue = hasUpset ? upsetPoints!.toFixed(1) : "--";
  const rel =
    settled && scoreRel
      ? scoreRel === "max"
        ? "#1"
        : scoreRel === "top5"
          ? "TOP 5%"
          : "TOP 10%"
      : null;
  const relHot = scoreRel === "max" || scoreRel === "top5";

  return (
    <View style={styles.splitRow}>
      <View style={[styles.splitSide, !hasUpset && styles.splitSideMuted]}>
        <Text style={styles.splitLabel}>{copy.upset}</Text>
        <View style={styles.skewWrap}>
          <Text
            style={[
              styles.splitValue,
              hasUpset ? styles.splitValueUpset : styles.splitValueEmpty,
            ]}
          >
            {upsetValue}
          </Text>
        </View>
        <Text style={styles.splitRelSpacer}> </Text>
      </View>
      <View style={styles.splitRule} />
      <View style={styles.splitSide}>
        <Text style={styles.splitLabel}>{copy.score}</Text>
        <View style={styles.skewWrap}>
          <Text style={[styles.splitValue, styles.splitValueScore]}>
            {settled && totalPoints != null ? totalPoints.toFixed(1) : "--"}
          </Text>
        </View>
        {rel ? (
          <Text style={[styles.splitRel, relHot && styles.splitRelHot]}>
            {rel}
          </Text>
        ) : (
          <Text style={styles.splitRelSpacer}> </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  biasRoot: { width: "100%", marginBottom: 6 },
  biasPctHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 6,
    paddingHorizontal: 28,
  },
  biasPctHeaderNum: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.4,
    minWidth: 48,
    transform: [{ skewX: "-6deg" }],
  },
  biasPctHeaderNumAway: {
    marginRight: -6,
    textAlign: "right",
  },
  biasPctHeaderMidCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minWidth: 0,
  },
  biasPctHeaderMid: {
    textAlign: "center",
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(0,245,255,0.55)",
    textTransform: "uppercase",
  },
  biasCount: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "rgba(226,232,240,0.55)",
  },
  biasCountNum: {
    fontWeight: "800",
    color: "rgba(248,250,252,0.88)",
    fontVariant: ["tabular-nums"],
  },
  biasBarInner: {
    flexDirection: "row",
    width: "100%",
    padding: 2,
    gap: 2,
  },
  biasSegSlot: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  biasSegSkew: { transform: [{ skewX: "-16deg" }] },
  biasSegFace: {
    height: 10,
    width: "100%",
    borderWidth: 1,
    transformOrigin: "left center",
  },
  scorerBlock: {
    marginBottom: 0,
    paddingVertical: 3,
  },
  scorerValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  skewWrap: {
    transform: [{ skewX: "-10deg" }],
    alignSelf: "center",
  },
  scorerLabel: {
    fontFamily: "Oxanium_600SemiBold",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "rgba(248,250,252,0.92)",
    textTransform: "uppercase",
    flexShrink: 0,
    width: 88,
    includeFontPadding: false,
  },
  scorerNameWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  scorerNameSkew: {
    transform: [{ skewX: "-10deg" }],
    maxWidth: "100%",
  },
  scorerName: {
    fontFamily: "Oxanium_600SemiBold",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: "#F8FAFC",
    textTransform: "uppercase",
    textAlign: "center",
    includeFontPadding: false,
  },
  scorerHitCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    width: 88,
    justifyContent: "flex-end",
  },
  scorerHit: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    lineHeight: 14,
  },
  scorerHitOn: { color: SCORER_HIT_COLOR },
  scorerHitOff: { color: SCORER_MISS_COLOR },
  splitRow: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: 2,
  },
  splitSide: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  splitSideMuted: { opacity: 0.55 },
  splitRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginVertical: 2,
  },
  splitLabel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(148,163,184,0.7)",
    textTransform: "uppercase",
  },
  splitValue: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.4,
    color: "#F8FAFC",
  },
  splitValueUpset: { color: UPSET_RED },
  splitValueScore: { color: AMBER },
  splitValueEmpty: { color: "rgba(148,163,184,0.55)" },
  splitRel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "rgba(226,232,240,0.55)",
    textTransform: "uppercase",
    marginTop: 1,
  },
  splitRelHot: {
    color: AMBER,
  },
  splitRelSpacer: {
    fontSize: 9,
    lineHeight: 12,
    opacity: 0,
  },
});
