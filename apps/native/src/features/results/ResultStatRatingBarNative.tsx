import { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Canvas, Group, RoundedRect } from "@shopify/react-native-skia";
import { rankingMetricAccent } from "../../../../../lib/rankings/rankingMetricAccent";

const SEGMENTS = 10;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function segmentFill(overallRatio: number, index: number, segmentCount: number) {
  const pos = overallRatio * segmentCount;
  return clamp01(pos - index);
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

type BarPalette = { core: string; edge: string };

function paletteForMetric(metricKey?: "scorePrecision" | "upsetPoints" | "pointsV3"): BarPalette {
  const accent = rankingMetricAccent(resultMetricToRankingKey(metricKey));
  return {
    core: accent.bar.hi,
    edge: accent.bar.lo,
  };
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
  const r = clamp01(ratio);
  const pal = paletteForMetric(metricKey);
  const h = size === "sm" ? 9 : 11;
  const [rowW, setRowW] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - rowW) > 0.5) setRowW(w);
  };

  const layout = useMemo(() => {
    if (rowW <= 0) return null;
    const gap = 4;
    const inner = rowW - gap * (SEGMENTS - 1);
    const segW = inner / SEGMENTS;
    return { segW, gap, h };
  }, [rowW, h]);

  return (
    <View style={[styles.skewWrap, { transform: [{ skewX: "-14deg" }] }]}>
      <View style={styles.rowInner} onLayout={onLayout}>
        {layout ? (
          <Canvas style={{ width: rowW, height: layout.h }} pointerEvents="none">
            {Array.from({ length: SEGMENTS }, (_, i) => {
              const x = i * (layout.segW + layout.gap);
              const target = segmentFill(r, i, SEGMENTS);
              const fillW = layout.segW * target;
              return (
                <Group key={i}>
                  <RoundedRect
                    x={x}
                    y={0}
                    width={layout.segW}
                    height={layout.h}
                    r={2}
                    color="rgba(255,255,255,0.06)"
                  />
                  {fillW > 0.5 ? (
                    <Group>
                      <RoundedRect
                        x={x}
                        y={0}
                        width={fillW}
                        height={layout.h}
                        r={2}
                        color={pal.edge}
                      />
                      <RoundedRect
                        x={x}
                        y={layout.h * 0.22}
                        width={fillW}
                        height={Math.max(1, layout.h * 0.56)}
                        r={1.5}
                        color={pal.core}
                      />
                    </Group>
                  ) : null}
                </Group>
              );
            })}
          </Canvas>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skewWrap: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  rowInner: {
    flexDirection: "row",
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
});
