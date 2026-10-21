import { Platform, StyleSheet, View } from "react-native";
import {
  cyberRankNumStyle,
  cyberRankPalette,
  type CyberRankNumVariant,
} from "../../../../../lib/rankings/cyberRankVisual";
import { cyberRankNumGlowLayers } from "../../../../../lib/rankings/cyberGlyphGlowLayers";
import { RANK_DISPLAY_FONT } from "./rankingsUiTheme";
import { rankingRankLabel } from "../../../../../lib/rankings/rankingDisplayRank";
import { CyberGlyphGlowTextNative } from "./CyberGlyphGlowTextNative";

type Props = {
  rank: number;
  compact?: boolean;
  displayValue?: string;
  muted?: boolean;
  variant?: CyberRankNumVariant;
  /** 1位でもサイズを変えない（表の列揃え） */
  uniform?: boolean;
  /** 列の中央ではなく左端に置く */
  flushLeft?: boolean;
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
  uniform = false,
  flushLeft = false,
}: Props) {
  const label = rankingRankLabel(rank, displayValue);
  const fourDigits = label.length >= 4;
  const uniformSize =
    variant === "tower" ? (compact ? 38 : 48) : compact ? 26 : 34;
  const resolvedStyle = muted
    ? {
        fontSize: uniformSize,
        color: "rgba(255,255,255,0.42)",
        lineHeight: Math.ceil(uniformSize * 1.15),
      }
    : {
        ...nativeRankStyleFromWeb(rank, compact, variant),
        ...(uniform
          ? {
              fontSize: uniformSize,
              lineHeight: Math.ceil(uniformSize * 1.15),
            }
          : {}),
      };

  const numStyle = {
    ...styles.num,
    fontSize: resolvedStyle.fontSize,
    lineHeight: resolvedStyle.lineHeight,
    color: resolvedStyle.color,
  };

  const lineStyle = fourDigits
    ? [numStyle, flushLeft ? styles.numFlushLeft : styles.numSingleLine]
    : numStyle;

  return (
    <View
      style={[
        styles.wrap,
        fourDigits ? styles.wrapFourDigits : null,
        flushLeft ? styles.wrapFlushLeft : null,
      ]}
    >
      {muted ? (
        <CyberGlyphGlowTextNative style={lineStyle} layers={[]} singleLine={fourDigits}>
          {label}
        </CyberGlyphGlowTextNative>
      ) : (
        <CyberGlyphGlowTextNative
          style={lineStyle}
          layers={cyberRankNumGlowLayers(rank)}
          singleLine={fourDigits}
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
    transform: [{ skewX: "-6deg" }],
    overflow: "visible",
  },
  /** 親の4桁用の幅いっぱいに縮小して1行 */
  wrapFourDigits: {
    alignSelf: "stretch",
    width: "100%",
  },
  wrapFlushLeft: {
    alignSelf: "flex-start",
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
  numSingleLine: {
    width: "100%",
    textAlign: "center",
  },
  numFlushLeft: {
    width: "100%",
    textAlign: "left",
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
