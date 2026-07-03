import { StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Line } from "react-native-svg";
import { PROFILE_CHART_CYBER } from "./profileOverviewChartCyberTheme";

function valueToPlotY(value: number, plotH: number, maxAbs: number): number {
  const half = plotH / 2;
  return half * (1 - value / maxAbs);
}

type Props = {
  width: number;
  height: number;
  ticks: number[];
  maxAbs: number;
  columnCount: number;
  colW: number;
  colGap: number;
  style?: ViewStyle;
};

/** Last20 — Y 目盛・各列に揃えた方眼（Web 実機見た目準拠） */
export default function ProfileStreakPlotGridNative({
  width,
  height,
  ticks,
  maxAbs,
  columnCount,
  colW,
  colGap,
  style,
}: Props) {
  if (width <= 0 || height <= 0 || columnCount <= 0) return null;

  const gridStroke = PROFILE_CHART_CYBER.cyanGridStrong;
  const zeroStroke = PROFILE_CHART_CYBER.cyan;
  const chartTotalW = columnCount * colW + Math.max(0, columnCount - 1) * colGap;

  const horizontalLines = ticks.map((tick) => ({
    y: valueToPlotY(tick, height, maxAbs),
    isZero: tick === 0,
  }));

  const verticalXs: number[] = [];
  for (let i = 0; i < columnCount; i++) {
    verticalXs.push(i * (colW + colGap));
  }
  verticalXs.push(chartTotalW);

  return (
    <View style={[styles.wrap, { width, height }, style]} pointerEvents="none">
      <Svg width={width} height={height}>
        {horizontalLines.map(({ y, isZero }) => (
          <Line
            key={`h-${y}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke={isZero ? zeroStroke : gridStroke}
            strokeWidth={isZero ? 1.5 : 1}
            opacity={isZero ? 0.72 : 0.5}
          />
        ))}
        {verticalXs.map((x, idx) => (
          <Line
            key={`v-${idx}-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke={gridStroke}
            strokeWidth={1}
            opacity={0.42}
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
