import { useId, type ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Defs, Pattern, Rect, Path as SvgPath } from "react-native-svg";
import MatchListLineFrameNative from "../games/MatchListLineFrameNative";
import { PROFILE_OVERVIEW_LINE_FRAME_PAINT } from "@/lib/games/matchListLineFrame";
import {
  PROFILE_OVERVIEW_CHART_GRID_OPACITY,
  profileOverviewChartShellStyle,
} from "./profileOverviewChartShell";
import {
  PROFILE_SHELL_GRID_NATIVE,
  profileShellGridPathD,
} from "./profileShellGridNative";

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  minHeight?: number;
  /** 指定時はマッチカードと同じ途切れパス＋左寄せラウンドラベル */
  topLabel?: string;
};

/** Daily Combo と同系の Kinetik 枠 + 内側格子 */
export default function ProfileOverviewChartCardNative({
  children,
  style,
  minHeight,
  topLabel,
}: Props) {
  const sid = useId().replace(/[^a-zA-Z0-9_]/g, "_");
  const gridPatternId = `profile_overview_chart_grid_${sid}`;

  const inner = (
    <View
      style={[
        styles.card,
        topLabel ? styles.cardInLineFrame : null,
        style,
        minHeight != null ? { minHeight } : null,
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: PROFILE_OVERVIEW_CHART_GRID_OPACITY },
        ]}
        pointerEvents="none"
      >
        <Defs>
          <Pattern
            id={gridPatternId}
            width={PROFILE_SHELL_GRID_NATIVE.cellPx}
            height={PROFILE_SHELL_GRID_NATIVE.cellPx}
            patternUnits="userSpaceOnUse"
          >
            <SvgPath
              d={profileShellGridPathD(PROFILE_SHELL_GRID_NATIVE.cellPx)}
              fill="none"
              stroke={PROFILE_SHELL_GRID_NATIVE.stroke}
              strokeWidth={PROFILE_SHELL_GRID_NATIVE.strokeWidth}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
      </Svg>
      {children}
    </View>
  );

  if (!topLabel) return inner;

  return (
    <MatchListLineFrameNative
      topLabel={topLabel}
      topLabelAlign="start"
      paint={PROFILE_OVERVIEW_LINE_FRAME_PAINT}
    >
      {inner}
    </MatchListLineFrameNative>
  );
}

const styles = StyleSheet.create({
  card: {
    ...profileOverviewChartShellStyle,
    alignSelf: "stretch",
    width: "100%",
    position: "relative",
  },
  cardInLineFrame: {
    borderWidth: 0,
    borderRadius: 0,
    overflow: "hidden",
  },
});
