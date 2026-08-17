/** リザルト詳細 — 得点内訳ドーナツ（react-native-svg） */
import { View, StyleSheet, Text } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import {
  MATCH_CARD_METRIC_FONT,
  MATCH_CARD_SCORE_FONT,
} from "../games/matchCardTypography";

export type ScoreDonutSegment = {
  value: number;
  color: string;
};

type Props = {
  segments: ScoreDonutSegment[];
  total: number;
  totalLabel: string;
  size?: number;
  thickness?: number;
  gapDeg?: number;
};

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number
) {
  if (end - start >= 359.99) {
    return [
      `M ${cx} ${cy - r}`,
      `A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`,
    ].join(" ");
  }
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

export default function ResultDetailScoreDonutNative({
  segments,
  total,
  totalLabel,
  size = 116,
  thickness = 16,
  gapDeg = 2.2,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const sum = segments.reduce((a, s) => a + Math.max(0, s.value), 0);
  const active = segments.filter((s) => s.value > 1e-6);
  let cursor = 0;

  const arcs = active.map((seg) => {
    const sweep = sum > 0 ? (seg.value / sum) * 360 : 0;
    const gap = active.length > 1 ? gapDeg : 0;
    const start = cursor + gap / 2;
    const end = cursor + sweep - gap / 2;
    cursor += sweep;
    return { color: seg.color, d: arcPath(cx, cy, r, start, Math.max(start + 0.5, end)) };
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G>
          {arcs.map((a, i) => (
            <Path
              key={i}
              d={a.d}
              stroke={a.color}
              strokeWidth={thickness}
              strokeLinecap="butt"
              fill="none"
            />
          ))}
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.total}>{total.toFixed(1)}</Text>
        <Text style={styles.totalLabel}>{totalLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  total: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
    color: "#F8FAFC",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.4,
  },
  totalLabel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: "rgba(226,232,240,0.45)",
    textTransform: "uppercase",
  },
});
