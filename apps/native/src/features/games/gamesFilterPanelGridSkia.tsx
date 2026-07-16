import { Group, Line, LinearGradient, Rect, vec } from "@shopify/react-native-skia";

/** Web `.games-filter-panel-grid`（14px 方眼・中央帯マスク） */
export const GAMES_FILTER_PANEL_GRID_STEP = 14;
const GRID_LINE_COLOR = "rgba(0, 245, 255, 0.05)";

type Props = {
  width: number;
  height: number;
};

export function GamesFilterPanelGridSkia({ width, height }: Props) {
  const vLines: number[] = [];
  for (let x = GAMES_FILTER_PANEL_GRID_STEP; x < width; x += GAMES_FILTER_PANEL_GRID_STEP) {
    vLines.push(x);
  }
  const hLines: number[] = [];
  for (let y = GAMES_FILTER_PANEL_GRID_STEP; y < height; y += GAMES_FILTER_PANEL_GRID_STEP) {
    hLines.push(y);
  }

  return (
    <Group opacity={0.72}>
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
          colors={[
            "rgba(4,7,12,0.98)",
            "rgba(4,7,12,0.45)",
            "rgba(4,7,12,0.22)",
            "rgba(4,7,12,0.45)",
            "rgba(4,7,12,0.98)",
          ]}
          positions={[0, 0.18, 0.42, 0.62, 0.78]}
        />
      </Rect>
    </Group>
  );
}
