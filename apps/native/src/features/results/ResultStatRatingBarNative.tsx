import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { rankingMetricAccent } from "../../../../../lib/rankings/rankingMetricAccent";

const SEGMENTS = 10;
const SEG_GAP = 4;
/** Web `.cyber-slanted-seg` skewX(-16deg) */
const SEG_SKEW_DEG = "-16deg";
const UNLIT_BORDER = "rgba(0,245,255,0.22)";
const UNLIT_BG = "rgba(255,255,255,0.03)";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/** Web `CyberSlantedSegBar` filledSegCount */
function filledSegCount(ratio: number, segmentCount: number): number {
  const pct = clamp01(ratio) * 100;
  return Math.round((Math.min(100, Math.max(0, pct)) / 100) * segmentCount);
}

/** Web `ResultStatRatingBar` の metricKey → ランキング指標キー */
function resultMetricToRankingKey(
  metricKey?: "scorePrecision" | "upsetPoints" | "pointsV3"
): string {
  switch (metricKey) {
    case "scorePrecision":
      return "marginPrecision";
    case "upsetPoints":
      return "upsetScore";
    case "pointsV3":
      return "totalScore";
    default:
      return "totalScore";
  }
}

/** Web `.cyber-slanted-seg__scan` — 横ストライプ */
function SegGrillLines({ height }: { height: number }) {
  const lineCount = Math.max(1, Math.floor(height / 2));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: lineCount }, (_, i) => (
        <View key={`grill-${i}`} style={[styles.grillLine, { top: i * 2 + 1 }]} />
      ))}
    </View>
  );
}

function CyberSlantedSeg({
  lit,
  height,
  borderColor,
  glowColor,
  bgTint,
  hiColor,
  loColor,
}: {
  lit: boolean;
  height: number;
  borderColor: string;
  glowColor: string;
  bgTint: string;
  hiColor: string;
  loColor: string;
}) {
  return (
    <View style={styles.segSlot}>
      <View
        style={[
          styles.segGlowWrap,
          lit
            ? {
                shadowColor: glowColor,
                shadowOpacity: 0.72,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
                elevation: 5,
              }
            : null,
        ]}
      >
        <View style={styles.segSkew}>
          <View
            style={[
              styles.segFace,
              { height },
              lit
                ? { borderColor: bgTint }
                : {
                    backgroundColor: UNLIT_BG,
                    borderColor: UNLIT_BORDER,
                    opacity: 0.55,
                  },
            ]}
          >
            {lit ? (
              <>
                <LinearGradient
                  colors={[hiColor, loColor]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View
                  pointerEvents="none"
                  style={[styles.segInsetGlow, { backgroundColor: borderColor }]}
                />
                <View pointerEvents="none" style={styles.segTopHighlight} />
                <SegGrillLines height={height} />
              </>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

type Props = {
  ratio: number;
  /** Web 互換（API 揃え） */
  animateMs?: number;
  delayMs?: number;
  size?: "sm" | "md";
  metricKey?: "scorePrecision" | "upsetPoints" | "pointsV3";
};

/**
 * Web `ResultStatRatingBar` / `CyberSlantedSegBar` のネイティブ版
 */
export default function ResultStatRatingBarNative({
  ratio,
  size = "md",
  metricKey,
}: Props) {
  const accent = rankingMetricAccent(resultMetricToRankingKey(metricKey));
  const filled = filledSegCount(ratio, SEGMENTS);
  const segH = size === "sm" ? 9 : 11;

  return (
    <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <CyberSlantedSeg
          key={`seg-${i}`}
          lit={i < filled}
          height={segH}
          borderColor={accent.border}
          glowColor={accent.bar.glow}
          bgTint={accent.bg}
          hiColor={accent.bar.hi}
          loColor={accent.bar.lo}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: SEG_GAP,
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
    transform: [{ skewX: SEG_SKEW_DEG }],
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
    opacity: 0.28,
  },
  /** Web `inset 0 1px 0 rgba(255,255,255,0.18)` */
  segTopHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  grillLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
});
