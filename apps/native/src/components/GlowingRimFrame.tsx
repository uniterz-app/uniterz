/** Web `GlowingRimFrame` 相当 */
import { useState, type ReactNode } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useAnimatedStyle } from "react-native-reanimated";
import {
  Canvas,
  LinearGradient as SkiaLinearGradient,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";

type GlowingRimFrameProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
};

export function GlowingRimFrame({
  children,
  style,
  radius = 18,
}: GlowingRimFrameProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout;
    setSize((prev) =>
      Math.abs(prev.width - next.width) < 0.5 &&
      Math.abs(prev.height - next.height) < 0.5
        ? prev
        : { width: next.width, height: next.height }
    );
  };

  const canDraw = size.width > 2 && size.height > 2;

  return (
    <View style={[styles.wrap, style]} onLayout={onLayout}>
      {canDraw ? (
        <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
          <RoundedRect
            x={3}
            y={3}
            width={Math.max(0, size.width - 6)}
            height={Math.max(0, size.height - 6)}
            r={Math.max(0, radius - 3)}
            style="stroke"
            strokeWidth={6}
            opacity={0.24}
          >
            <SkiaLinearGradient
              start={vec(0, 0)}
              end={vec(size.width, size.height)}
              colors={[
                "rgba(34,211,238,0.02)",
                "rgba(34,211,238,0.72)",
                "rgba(147,197,253,0.38)",
                "rgba(34,211,238,0.02)",
              ]}
              positions={[0, 0.38, 0.68, 1]}
            />
          </RoundedRect>
          <RoundedRect
            x={0.75}
            y={0.75}
            width={Math.max(0, size.width - 1.5)}
            height={Math.max(0, size.height - 1.5)}
            r={radius}
            style="stroke"
            strokeWidth={1.5}
          >
            <SkiaLinearGradient
              start={vec(size.width * 0.12, 0)}
              end={vec(size.width * 0.88, size.height)}
              colors={[
                "rgba(255,255,255,0.22)",
                "rgba(103,232,249,0.82)",
                "rgba(59,130,246,0.52)",
                "rgba(255,255,255,0.18)",
              ]}
              positions={[0, 0.32, 0.72, 1]}
            />
          </RoundedRect>
        </Canvas>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

/** Web の回転リム API と合わせるための空アニメ */
export function useGlowingRimSpin() {
  return useAnimatedStyle(() => ({}));
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    overflow: "visible",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
