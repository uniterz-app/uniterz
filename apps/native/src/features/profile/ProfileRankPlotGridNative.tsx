import { StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { PROFILE_CHART_CYBER } from "./profileOverviewChartCyberTheme";

const DOT_GRID_STEP = 18;
const DOT_GRID_R = 0.9;
const COLUMN_DOT_STEP = 14;
const COLUMN_DOT_R = 1.15;

type Props = {
  width: number;
  height: number;
  horizontalYs: number[];
  verticalXs: number[];
  plotTop: number;
  plotBottom: number;
  style?: ViewStyle;
};

/** Ranking Progress — 点方眼 + 破線横グリッド + 各日付列の縦ドット */
export default function ProfileRankPlotGridNative({
  width,
  height,
  horizontalYs,
  verticalXs,
  plotTop,
  plotBottom,
  style,
}: Props) {
  if (width <= 0 || height <= 0) return null;

  const dotGrid: Array<{ x: number; y: number }> = [];
  for (let x = DOT_GRID_STEP / 2; x < width; x += DOT_GRID_STEP) {
    for (let y = DOT_GRID_STEP / 2; y < height; y += DOT_GRID_STEP) {
      dotGrid.push({ x, y });
    }
  }

  const columnDots: Array<{ x: number; y: number }> = [];
  const colTop = Math.max(0, plotTop);
  const colBottom = Math.min(height, plotBottom);
  for (const x of verticalXs) {
    for (let y = colTop; y <= colBottom; y += COLUMN_DOT_STEP) {
      columnDots.push({ x, y });
    }
  }

  return (
    <View style={[styles.wrap, { width, height }, style]} pointerEvents="none">
      <Svg width={width} height={height}>
        {dotGrid.map((d, i) => (
          <Circle
            key={`dg-${i}`}
            cx={d.x}
            cy={d.y}
            r={DOT_GRID_R}
            fill={PROFILE_CHART_CYBER.rankDotGrid}
          />
        ))}
        {horizontalYs.map((y) => (
          <Line
            key={`h-${y}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke={PROFILE_CHART_CYBER.rankGridDash}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.85}
          />
        ))}
        {columnDots.map((d, i) => (
          <Circle
            key={`vc-${i}`}
            cx={d.x}
            cy={d.y}
            r={COLUMN_DOT_R}
            fill={PROFILE_CHART_CYBER.rankDotColumn}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 1,
  },
});
