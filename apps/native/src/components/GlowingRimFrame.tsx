/**
 * シアン縁のガラスUI用ラッパー（未実装時は静かな枠のみ）。
 * CyberGlassToastModal 等から参照される場合の解決用。
 */
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useAnimatedStyle } from "react-native-reanimated";

type GlowingRimFrameProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GlowingRimFrame({ children, style }: GlowingRimFrameProps) {
  return <View style={[styles.wrap, style]}>{children}</View>;
}

/** 縁のスピン等が不要なときの空アニメ（Reanimated と整合） */
export function useGlowingRimSpin() {
  return useAnimatedStyle(() => ({}));
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
  },
});
