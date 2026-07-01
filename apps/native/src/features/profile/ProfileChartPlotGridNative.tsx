import { useId } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";
import { PROFILE_CHART_CYBER } from "./profileOverviewChartCyberTheme";

/** Web `StreakTrackerCard` CHART_GRID_STYLE — 18px 方眼 */
export const PROFILE_CHART_PLOT_GRID_CELL_PX = 18;

type Props = {
  style?: ViewStyle;
  opacity?: number;
};

/** チャートプロット内の方眼グリッド */
export default function ProfileChartPlotGridNative({
  style,
  opacity = 1,
}: Props) {
  const sid = useId().replace(/[^a-zA-Z0-9_]/g, "_");
  const patternId = `profile_chart_plot_grid_${sid}`;
  const cell = PROFILE_CHART_PLOT_GRID_CELL_PX;
  const stroke = PROFILE_CHART_CYBER.cyanGridStrong;

  return (
    <View style={[styles.wrap, style, { opacity }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id={patternId}
            width={cell}
            height={cell}
            patternUnits="userSpaceOnUse"
          >
            <Line x1={0} y1={0} x2={cell} y2={0} stroke={stroke} strokeWidth={1} />
            <Line x1={0} y1={0} x2={0} y2={cell} stroke={stroke} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
