import { Platform, StyleSheet, View } from "react-native";
import {
  cyberRankNumStyle,
  cyberRankPalette,
  type CyberRankNumVariant,
} from "../../../../../lib/rankings/cyberRankVisual";
import { cyberRankNumGlowLayers } from "../../../../../lib/rankings/cyberGlyphGlowLayers";
import { RANK_DISPLAY_FONT } from "./rankingsUiTheme";
import { CyberGlyphGlowTextNative } from "./CyberGlyphGlowTextNative";

type Props = {
  rank: number;
  compact?: boolean;
  displayValue?: string;
  muted?: boolean;
  variant?: CyberRankNumVariant;
};

/** Web `.cyber-rank-num__scan` 相当 */
function RankNumScanOverlay() {
  return (
    <View pointerEvents="none" style={styles.scanOverlay}>
      {Array.from({ length: 8 }, (_, i) => (
        <View key={i} style={[styles.scanLine, { top: i * 3 }]} />
      ))}
    </View>
  );
}

/** Web `CyberRankNumber` のネイティブ版 */
export function CyberRankNumberNative({
  rank,
  compact = false,
  displayValue,
  muted = false,
  variant = "list",
}: Props) {
  const label = displayValue ?? String(rank).padStart(2, "0");
  const resolvedStyle = muted
    ? {
        fontSize: variant === "tower" ? (compact ? 38 : 48) : compact ? 26 : 34,
        color: "rgba(255,255,255,0.42)",
        lineHeight: variant === "tower" ? (compact ? 42 : 52) : compact ? 30 : 38,
      }
    : nativeRankStyleFromWeb(rank, compact, variant);

  const numStyle = {
    ...styles.num,
    fontSize: resolvedStyle.fontSize,
    lineHeight: resolvedStyle.lineHeight,
    color: resolvedStyle.color,
  };

  return (
    <View style={styles.wrap}>
      {muted ? (
        <CyberGlyphGlowTextNative style={numStyle} layers={[]}>
          {label}
        </CyberGlyphGlowTextNative>
      ) : (
        <CyberGlyphGlowTextNative
          style={numStyle}
          layers={cyberRankNumGlowLayers(rank)}
        >
          {label}
        </CyberGlyphGlowTextNative>
      )}
      {!muted ? <RankNumScanOverlay /> : null}
    </View>
  );
}

function nativeRankStyleFromWeb(
  rank: number,
  compact: boolean,
  variant: CyberRankNumVariant
) {
  const web = cyberRankNumStyle(rank, compact, variant);
  const palette = cyberRankPalette(rank);
  const fontSize = parseFloat(String(web.fontSize).replace("rem", "")) * 16;
  const resolvedSize = Number.isFinite(fontSize) ? fontSize : compact ? 28 : 36;

  return {
    fontSize: resolvedSize,
    lineHeight: Math.ceil(resolvedSize * 1.02),
    color: typeof web.color === "string" ? web.color : palette.textFill,
  };
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    transform: [{ skewX: "-12deg" }],
    overflow: "visible",
  },
  num: {
    fontFamily: RANK_DISPLAY_FONT,
    letterSpacing: 0.8,
    includeFontPadding: false,
    ...Platform.select({
      ios: { fontWeight: "400" },
      android: { fontWeight: "400" },
      default: {},
    }),
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    opacity: 0.55,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
});
