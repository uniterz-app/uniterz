/**
 * Web `.match-list-cyber-card` — `clip-path: polygon(...)` を Skia clip で再現。
 * 塗り・方眼・枠線を角切り内に収め、角にページ色のマスクは置かない。
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
  chamferedRectPathD,
  MATCH_LIST_CYBER_CUT_DENSE,
} from "./matchListCyberClipPath";
import { MatchListCyberGridSkia } from "./matchListCyberGridSkia";

const SHELL_GRADIENT = {
  colors: ["rgba(9,13,20,0.95)", "rgba(6,9,15,0.93)", "rgba(4,7,12,0.91)"],
  locations: [0, 0.52, 1],
} as const;

type Props = {
  children: ReactNode;
  cut?: number;
  predicted?: boolean;
  style?: StyleProp<ViewStyle>;
  shellStyle?: StyleProp<ViewStyle>;
  strokeOpacityStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  /** 入場アニメ用の方眼レイヤー opacity */
  gridOpacityStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
};

function makeSkiaPath(width: number, height: number, cut: number) {
  const d = chamferedRectPathD(width, height, cut);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

export default function MatchListCyberClipNative({
  children,
  cut = MATCH_LIST_CYBER_CUT_DENSE,
  predicted = false,
  style,
  shellStyle,
  strokeOpacityStyle,
  gridOpacityStyle,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const borderColor = predicted
    ? "rgba(148,163,184,0.46)"
    : "rgba(0,245,255,0.16)";

  const skiaPath = useMemo(
    () => (size.w > 0 && size.h > 0 ? makeSkiaPath(size.w, size.h, cut) : null),
    [size.w, size.h, cut]
  );

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  const hasSize = size.w > 0 && size.h > 0;

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <View
        style={[
          styles.frame,
          predicted && styles.framePredicted,
          shellStyle,
          hasSize ? { width: size.w, height: size.h } : styles.frameMeasuring,
        ]}
      >
        {hasSize && skiaPath ? (
          <>
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
                <Rect x={0} y={0} width={size.w} height={size.h}>
                  <SkiaLinearGradient
                    start={vec(size.w * 0.15, 0)}
                    end={vec(size.w * 0.85, size.h)}
                    colors={[...SHELL_GRADIENT.colors]}
                    positions={[...SHELL_GRADIENT.locations]}
                  />
                </Rect>
              </Group>
            </Canvas>
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
                gridOpacityStyle,
              ]}
            >
              <Canvas style={{ width: size.w, height: size.h }} pointerEvents="none">
                <Group clip={skiaPath}>
                  <MatchListCyberGridSkia width={size.w} height={size.h} />
                </Group>
              </Canvas>
            </Animated.View>
          </>
        ) : (
          <LinearGradient
            pointerEvents="none"
            colors={[...SHELL_GRADIENT.colors]}
            locations={[...SHELL_GRADIENT.locations]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {hasSize ? (
          <View
            pointerEvents="none"
            style={[styles.insetTopHighlight, { width: size.w - cut * 2, left: cut }]}
          />
        ) : null}

        <View style={styles.content}>{children}</View>
      </View>

      {hasSize && skiaPath ? (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: "absolute", left: 0, top: 0, width: size.w, height: size.h },
            strokeOpacityStyle,
          ]}
        >
          <Canvas style={{ width: size.w, height: size.h }} pointerEvents="none">
            <Path path={skiaPath} style="stroke" strokeWidth={1} color={borderColor} />
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
  },
  frame: {
    position: "relative",
    minHeight: 148,
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 22,
    elevation: 7,
  },
  frameMeasuring: {
    minHeight: 148,
    width: "100%",
  },
  framePredicted: {
    shadowColor: "rgba(148,163,184,0.35)",
    shadowOpacity: 0.06,
  },
  content: {
    position: "relative",
    zIndex: 1,
    flex: 1,
    minHeight: 0,
  },
  insetTopHighlight: {
    position: "absolute",
    top: 0,
    height: 1,
    backgroundColor: "rgba(0,245,255,0.12)",
    zIndex: 2,
  },
});
