/**
 * Web `GlowingRimFrame` 相当のシアン縁ガラスUI用ラッパー。
 * Native では Skia の多層 stroke で、回転グラデーションの発光を静的に近似する。
 */
import { useState, type ReactNode } from "react";
import {
  type LayoutChangeEvent,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Canvas, RoundedRect } from "@shopify/react-native-skia";
import { useAnimatedStyle } from "react-native-reanimated";

type GlowingRimFrameProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  glowColor?: string;
  borderColor?: string;
};

export function GlowingRimFrame({
  children,
  style,
  borderRadius = 16,
  glowColor = "rgba(56,189,248,0.42)",
  borderColor = "rgba(165,243,252,0.42)",
}: GlowingRimFrameProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const w = Math.round(width);
    const h = Math.round(height);
    if (w > 0 && h > 0 && (w !== size.w || h !== size.h)) {
      setSize({ w, h });
    }
  };

  const hasSize = size.w > 0 && size.h > 0;

  return (
    <View
      style={[
        styles.wrap,
        {
          borderRadius,
          shadowColor: glowColor,
        },
        style,
      ]}
      onLayout={onLayout}
    >
      {hasSize ? (
        <Canvas
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { width: size.w, height: size.h }]}
        >
          <RoundedRect
            x={1}
            y={1}
            width={size.w - 2}
            height={size.h - 2}
            r={borderRadius}
            color="rgba(56,189,248,0.09)"
            style="stroke"
            strokeWidth={6}
          />
          <RoundedRect
            x={2}
            y={2}
            width={size.w - 4}
            height={size.h - 4}
            r={Math.max(0, borderRadius - 1)}
            color={glowColor}
            style="stroke"
            strokeWidth={2}
          />
          <RoundedRect
            x={0.75}
            y={0.75}
            width={size.w - 1.5}
            height={size.h - 1.5}
            r={borderRadius}
            color={borderColor}
            style="stroke"
            strokeWidth={1}
          />
        </Canvas>
      ) : null}
      <View style={[styles.content, { borderRadius }]}>{children}</View>
    </View>
  );
}

/** 縁のスピン等が不要なときの空アニメ（Reanimated と整合） */
export function useGlowingRimSpin() {
  return useAnimatedStyle(() => ({}));
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
