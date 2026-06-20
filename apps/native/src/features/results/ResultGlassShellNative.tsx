/**
 * Web `ResultGlassShell` + `.result-hit-cyber-clip` 相当。
 * 角切りは Skia clip（ページ色の角マスクは使わない）。
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import {
  Canvas,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import {
  RESULT_HIT_CYBER_CLIP_CUT,
  resultHitCyberClipPathD,
} from "./resultHitCyberClipPath";
import { MatchListCyberGridSkia } from "../games/matchListCyberGridSkia";

const GLASS_BASE = {
  colors: ["rgba(18,22,32,0.78)", "rgba(10,13,22,0.72)", "rgba(8,11,18,0.76)"],
  locations: [0, 0.5, 1],
} as const;

const GLASS_SHEEN = {
  colors: [
    "rgba(255,255,255,0.08)",
    "rgba(255,255,255,0.035)",
    "rgba(255,255,255,0.015)",
  ],
  locations: [0, 0.45, 1],
} as const;

type Props = {
  children: ReactNode;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  shellStyle?: StyleProp<ViewStyle>;
  overflowVisible?: boolean;
  /** 入場時の枠線フェード */
  strokeOpacityStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
};

function makeSkiaPath(width: number, height: number) {
  const d = resultHitCyberClipPathD(width, height);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

function GlassFillFallback() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[...GLASS_BASE.colors]}
      locations={[...GLASS_BASE.locations]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
  );
}

export default function ResultGlassShellNative({
  children,
  borderColor = "rgba(255,255,255,0.10)",
  style,
  shellStyle,
  overflowVisible = false,
  strokeOpacityStyle,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const skiaPath = useMemo(
    () => (size.w > 0 && size.h > 0 ? makeSkiaPath(size.w, size.h) : null),
    [size.w, size.h]
  );

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  const hasSize = size.w > 0 && size.h > 0;

  return (
    <View
      style={[
        styles.root,
        overflowVisible && styles.rootOverflowVisible,
        style,
        shellStyle,
      ]}
      onLayout={onLayout}
    >
      <View
        style={[
          styles.shell,
          overflowVisible && styles.shellOverflowVisible,
          hasSize ? { width: size.w, height: size.h } : styles.shellMeasuring,
        ]}
      >
        {hasSize && skiaPath ? (
          <Canvas
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: size.w,
              height: size.h,
            }}
            pointerEvents="none"
          >
            <Group clip={skiaPath}>
              <MatchListCyberGridSkia width={size.w} height={size.h} />
              <Rect x={0} y={0} width={size.w} height={size.h}>
                <SkiaLinearGradient
                  start={vec(size.w * 0.15, 0)}
                  end={vec(size.w * 0.85, size.h)}
                  colors={[...GLASS_BASE.colors]}
                  positions={[...GLASS_BASE.locations]}
                />
              </Rect>
              <Rect x={0} y={0} width={size.w} height={size.h}>
                <SkiaLinearGradient
                  start={vec(size.w * 0.1, 0)}
                  end={vec(size.w * 0.9, size.h)}
                  colors={[...GLASS_SHEEN.colors]}
                  positions={[...GLASS_SHEEN.locations]}
                />
              </Rect>
            </Group>
          </Canvas>
        ) : (
          <GlassFillFallback />
        )}

        {hasSize ? (
          <View
            pointerEvents="none"
            style={[
              styles.insetTopHighlight,
              {
                width: size.w - RESULT_HIT_CYBER_CLIP_CUT,
                left: 0,
              },
            ]}
          />
        ) : (
          <View pointerEvents="none" style={styles.insetTopHighlight} />
        )}
        <View pointerEvents="none" style={styles.insetBottomShade} />
        <View style={styles.content}>{children}</View>
      </View>

      {hasSize && skiaPath ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              width: size.w,
              height: size.h,
            },
            strokeOpacityStyle,
          ]}
        >
          <Canvas style={{ width: size.w, height: size.h }} pointerEvents="none">
            <Path
              path={skiaPath}
              style="stroke"
              strokeWidth={1}
              color={borderColor}
            />
          </Canvas>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    width: "100%",
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.58,
    shadowRadius: 32,
    elevation: 7,
  },
  rootOverflowVisible: {
    overflow: "visible",
  },
  shell: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 0,
  },
  shellMeasuring: {
    width: "100%",
  },
  shellOverflowVisible: {
    overflow: "visible",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
  insetTopHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    zIndex: 2,
  },
  insetBottomShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    zIndex: 2,
  },
});
