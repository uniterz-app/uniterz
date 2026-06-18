import { Group, Line, LinearGradient, Rect, vec } from "@shopify/react-native-skia";

/** Web `.match-list-cyber-grid`（16px 方眼・シアン） */
export const MATCH_LIST_CYBER_GRID_STEP = 16;
const GRID_LINE_COLOR = "rgba(0, 245, 255, 0.04)";
const GRID_LAYER_OPACITY = 0.8;

type Props = {
  width: number;
  height: number;
};

/** 角切り clip 内に描く方眼＋下方向フェード */
export function MatchListCyberGridSkia({ width, height }: Props) {
  const vLines: number[] = [];
  for (let x = MATCH_LIST_CYBER_GRID_STEP; x < width; x += MATCH_LIST_CYBER_GRID_STEP) {
    vLines.push(x);
  }
  const hLines: number[] = [];
  for (let y = MATCH_LIST_CYBER_GRID_STEP; y < height; y += MATCH_LIST_CYBER_GRID_STEP) {
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
      {/** Web `mask-image: linear-gradient(180deg, ...)` 相当 */}
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(width * 0.5, 0)}
          end={vec(width * 0.5, height)}
          colors={["rgba(4,7,12,0)", "rgba(4,7,12,0.55)", "rgba(4,7,12,0.96)"]}
          positions={[0.72, 0.9, 0.98]}
        />
      </Rect>
    </Group>
  );
}
