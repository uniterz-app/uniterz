/**
 * プロフィールヒーローなど大きな面用の格子背景。
 * `profileShellGridNative.ts` と同じ見え方で概要カード類と揃える。
 * Svg の `height: 100%` だけだと下端まで描画されない端末があるため、親の onLayout で幅・高さを渡す。
 */
import { type ReactNode, useId, useState } from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Defs, Pattern, Rect, Path } from "react-native-svg";
import {
  PROFILE_SHELL_GRID_NATIVE,
  profileShellGridPathD,
} from "./profileShellGridNative";

type Props = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export default function ProfileGridBackdrop({ children, style }: Props) {
  const sid = useId().replace(/[^a-zA-Z0-9_]/g, "_");
  const pid = `grid_bg_${sid}`;
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  const onWrapLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const w = Math.round(width);
    const h = Math.round(height);
    if (w <= 0 || h <= 0) return;
    setSvgSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  };

  return (
    <View style={[styles.wrap, style]} onLayout={onWrapLayout}>
      {svgSize.w > 0 && svgSize.h > 0 ? (
        <Svg
          width={svgSize.w}
          height={svgSize.h}
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: PROFILE_SHELL_GRID_NATIVE.layerOpacity },
          ]}
          pointerEvents="none"
        >
          <Defs>
            <Pattern
              id={pid}
              width={PROFILE_SHELL_GRID_NATIVE.cellPx}
              height={PROFILE_SHELL_GRID_NATIVE.cellPx}
              patternUnits="userSpaceOnUse"
            >
              <Path
                d={profileShellGridPathD(PROFILE_SHELL_GRID_NATIVE.cellPx)}
                fill="none"
                stroke={PROFILE_SHELL_GRID_NATIVE.stroke}
                strokeWidth={PROFILE_SHELL_GRID_NATIVE.strokeWidth}
              />
            </Pattern>
          </Defs>
          <Rect width={svgSize.w} height={svgSize.h} fill={`url(#${pid})`} />
        </Svg>
      ) : null}
      <View style={styles.fore}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    position: "relative",
  },
  fore: {
    position: "relative",
    zIndex: 1,
  },
});
