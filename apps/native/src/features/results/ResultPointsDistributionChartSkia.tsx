/**
 * Web `ResultPointsDistributionCard` の SVG 散布図と同ロジック（`lib/results/resultPointsDistributionChartModel`）を Skia で描画。
 */
import { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import {
  Canvas,
  Circle,
  Group,
  Line,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import type { GamePointsDistributionV1 } from "../../../../../lib/results/gamePointsDistribution";
import {
  buildDotsFromDistribution,
  CHART_H,
  CHART_W,
  clampChartScore,
  GRID_YS,
  MEAN_LINE_STROKE,
  MEDIAN_LINE_STROKE,
  PAD_B,
  PAD_L,
  PAD_R,
  PAD_T,
  PEER_DOT_FILL,
  PLOT_BOTTOM,
  PLOT_H,
  PLOT_W,
  scoreToY,
  YOU_CORE_FILL,
  YOU_HALO_FILL,
} from "../../../../../lib/results/resultPointsDistributionChartModel";

const COMPACT_MAX_DOTS = 220;
const OVERLAY_MAX_DOTS = 120;

type Props = {
  distribution: GamePointsDistributionV1;
  myScore: number | null;
  /** オーバーレイ内はドット数を抑えて GPU 負荷を下げる */
  compact?: boolean;
};

export default function ResultPointsDistributionChartSkia({
  distribution,
  myScore,
  compact = false,
}: Props) {
  const [rowW, setRowW] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - rowW) > 0.5) setRowW(w);
  };

  const sx = rowW > 0 ? rowW / CHART_W : 1;
  const canvasH = CHART_H * sx;

  const maxDots = compact ? OVERLAY_MAX_DOTS : COMPACT_MAX_DOTS;
  const dots = useMemo(
    () => buildDotsFromDistribution(distribution, myScore, maxDots),
    [distribution, myScore, maxDots]
  );
  const peerDots = useMemo(() => dots.filter((d) => d.kind === "peer"), [dots]);
  const youDot = useMemo(() => dots.find((d) => d.kind === "you") ?? null, [dots]);

  const medianY =
    distribution.median != null && Number.isFinite(distribution.median)
      ? scoreToY(clampChartScore(distribution.median))
      : null;
  const meanY =
    distribution.mean != null && Number.isFinite(distribution.mean)
      ? scoreToY(clampChartScore(distribution.mean))
      : null;

  const safeCanvasH =
    Number.isFinite(canvasH) && canvasH > 0 ? canvasH : CHART_H;
  const safeSx = Number.isFinite(sx) && sx > 0 ? sx : 1;

  if (rowW <= 0) {
    return <View style={styles.placeholder} onLayout={onLayout} />;
  }

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <Canvas
        style={{ width: rowW, height: safeCanvasH }}
        pointerEvents="none"
      >
        <Group transform={[{ scale: safeSx }]}>
          <Line
            p1={vec(PAD_L, PLOT_BOTTOM)}
            p2={vec(PAD_L, PAD_T)}
            color="rgba(255,255,255,0.22)"
            strokeWidth={1}
          />
          <Line
            p1={vec(PAD_L, PLOT_BOTTOM)}
            p2={vec(CHART_W - PAD_R, PLOT_BOTTOM)}
            color="rgba(255,255,255,0.22)"
            strokeWidth={1}
          />

          <RoundedRect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            r={6}
            color="rgba(255,255,255,0.02)"
          />

          {GRID_YS.map((g) => {
            const ny = scoreToY(g);
            return (
              <Line
                key={`g-${g}`}
                p1={vec(PAD_L, ny)}
                p2={vec(CHART_W - PAD_R, ny)}
                color="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}

          {medianY != null ? (
            <Line
              p1={vec(PAD_L, medianY)}
              p2={vec(CHART_W - PAD_R, medianY)}
              color={MEDIAN_LINE_STROKE}
              strokeWidth={1}
            />
          ) : null}
          {meanY != null ? (
            <Line
              p1={vec(PAD_L, meanY)}
              p2={vec(CHART_W - PAD_R, meanY)}
              color={MEAN_LINE_STROKE}
              strokeWidth={1}
            />
          ) : null}

          {peerDots.map((d, i) =>
            Number.isFinite(d.x) && Number.isFinite(d.y) ? (
              <Circle
                key={`p-${i}`}
                cx={d.x}
                cy={d.y}
                r={2.1}
                color={PEER_DOT_FILL}
              />
            ) : null
          )}

          {youDot &&
          Number.isFinite(youDot.x) &&
          Number.isFinite(youDot.y) ? (
            <Group>
              <Circle cx={youDot.x} cy={youDot.y} r={7} color={YOU_HALO_FILL} />
              <Circle
                cx={youDot.x}
                cy={youDot.y}
                r={4.2}
                color={YOU_CORE_FILL}
              />
            </Group>
          ) : null}
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", alignItems: "center" },
  /** 初回レイアウトまでの占位（Web の min-h に近い） */
  placeholder: { width: "100%", minHeight: 120 },
});
