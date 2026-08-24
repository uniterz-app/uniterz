/**
 * Void Corona 上の UNITERZ マーク（確定 path）。案ごとの出現カーブは親が持つ。
 */
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import {
  UNITERZ_LOGO_LETTERS,
  UNITERZ_LOGO_SPLASH_PATHS,
  UNITERZ_LOGO_SPLASH_VIEWBOX,
  type UniterzLogoLetter,
} from "../../../../../../lib/units/uniterzLogoSplash";
import {
  UNITERZ_U_MARK_PATHS,
  UNITERZ_U_MARK_VIEWBOX,
} from "../../../../../../lib/units/uniterzUMark";
import { VOID_CORONA_COLORS } from "../../../../../../lib/splash/voidCoronaConcepts";

type MarkProps = {
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  style?: AnimatedStyle<ViewStyle>;
};

export function VoidCoronaMarkNative({
  width,
  height,
  fill = VOID_CORONA_COLORS.logoWhite,
  stroke,
  strokeWidth = 0,
  strokeOpacity = 1,
  style,
}: MarkProps) {
  return (
    <Animated.View style={[{ width, height }, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
        <G
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeOpacity={strokeOpacity}
        >
          {UNITERZ_LOGO_SPLASH_PATHS.map((d, i) => (
            <Path key={i} d={d} />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

type LetterMarkProps = {
  letter: UniterzLogoLetter;
  width: number;
  height: number;
  fill?: string;
  style?: AnimatedStyle<ViewStyle>;
};

export function VoidCoronaLetterNative({
  letter,
  width,
  height,
  fill = VOID_CORONA_COLORS.logoWhite,
  style,
}: LetterMarkProps) {
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { width, height }, style]}
      pointerEvents="none"
    >
      <Svg width={width} height={height} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
        <G fill={fill}>
          {letter.paths.map((d, i) => (
            <Path key={`${letter.id}-${i}`} d={d} />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

export { UNITERZ_LOGO_LETTERS };

/** ワードマークを黒円内に収める推奨サイズ */
export function voidCoronaLogoSize(screenW: number, voidDiameter: number) {
  const byVoid = voidDiameter * 0.78;
  const byScreen = Math.min(screenW * 0.72, 320);
  const logoW = Math.min(byVoid, byScreen);
  const logoH = logoW * (313.66 / 1248.9);
  return { logoW, logoH };
}

/** ヘッダー左の U マークを黒円内に収める推奨サイズ（正方形） */
export function voidCoronaUMarkSize(screenW: number, voidDiameter: number) {
  const byVoid = voidDiameter * 0.62;
  const byScreen = Math.min(screenW * 0.42, 220);
  const size = Math.min(byVoid, byScreen);
  return { markSize: size };
}

/** ヘッダー左と同じ直立 U マーク */
export function VoidCoronaUMarkNative({
  size,
  fill = VOID_CORONA_COLORS.logoWhite,
  stroke,
  strokeWidth = 0,
  strokeOpacity = 1,
  style,
}: {
  size: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  style?: AnimatedStyle<ViewStyle>;
}) {
  return (
    <Animated.View style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${UNITERZ_U_MARK_VIEWBOX} ${UNITERZ_U_MARK_VIEWBOX}`}
      >
        <G
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeOpacity={strokeOpacity}
        >
          {UNITERZ_U_MARK_PATHS.map((d, i) => (
            <Path key={i} d={d} />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

export function VoidCoronaMarkStack({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <View style={[styles.stack, { width, height }]} pointerEvents="none">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    alignItems: "center",
    justifyContent: "center",
  },
});
