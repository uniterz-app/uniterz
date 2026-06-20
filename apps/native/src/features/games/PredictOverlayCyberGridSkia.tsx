import { Group, Line, LinearGradient, Rect, vec } from "@shopify/react-native-skia";

/** Web `.predict-overlay-cyber-grid`（18px 方眼・シアン） */
export const PREDICT_OVERLAY_CYBER_GRID_STEP = 18;
const GRID_LINE_COLOR = "rgba(0, 245, 255, 0.045)";
const GRID_LAYER_OPACITY = 0.7;

type Props = {
  width: number;
  height: number;
};

/** 角切り clip 内 — 下方向にフェード（Web `mask-image` 92% 相当） */
export function PredictOverlayCyberGridSkia({ width, height }: Props) {
  const vLines: number[] = [];
  for (let x = PREDICT_OVERLAY_CYBER_GRID_STEP; x < width; x += PREDICT_OVERLAY_CYBER_GRID_STEP) {
    vLines.push(x);
  }
  const hLines: number[] = [];
  for (let y = PREDICT_OVERLAY_CYBER_GRID_STEP; y < height; y += PREDICT_OVERLAY_CYBER_GRID_STEP) {
    hLines.push(y);
  }

  return (
    <Group opacity={GRID_LAYER_OPACITY}>
      {vLines.map((x) => (
        <Line
          key={`gv-${x}`}
          p1={vec(x, 0)}
          p2={vec(x, height)}
          color={GRID_LINE_COLOR}
          strokeWidth={1}
        />
      ))}
      {hLines.map((y) => (
        <Line
          key={`gh-${y}`}
          p1={vec(0, y)}
          p2={vec(width, y)}
          color={GRID_LINE_COLOR}
          strokeWidth={1}
        />
      ))}
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(width * 0.5, 0)}
          end={vec(width * 0.5, height)}
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(4,6,11,0.92)"]}
          positions={[0, 0.72, 0.98]}
        />
      </Rect>
    </Group>
  );
}
