/**
 * 起動 Landing 専用背景 — Web `WireframeBg` 相当（パース地形 + グロー + モート）。
 * 3D ロゴは使わない。
 */
import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Canvas, Line } from "@shopify/react-native-skia";
import RisingMotesLayerNative from "../background/RisingMotesLayerNative";

const GRID_STEP = 52;
const GRID_H = "rgba(80,220,220,0.22)";
const GRID_V = "rgba(80,220,220,0.13)";

function usePerspectiveWireframe(width: number, height: number) {
  return useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    const gridW = width * 2.4;
    const gridH = height * 1.6;
    const nodes = [];
    let i = 0;
    for (let x = 0; x <= gridW; x += GRID_STEP) {
      nodes.push(
        <Line
          key={`v${i}`}
          p1={{ x, y: 0 }}
          p2={{ x, y: gridH }}
          color={GRID_V}
          strokeWidth={1}
        />
      );
      i += 1;
    }
    for (let y = 0; y <= gridH; y += GRID_STEP) {
      nodes.push(
        <Line
          key={`h${i}`}
          p1={{ x: 0, y }}
          p2={{ x: gridW, y }}
          color={GRID_H}
          strokeWidth={1}
        />
      );
      i += 1;
    }
    return { nodes, gridW, gridH };
  }, [width, height]);
}

function GlowOverlays() {
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(0,220,255,0.18)",
          "rgba(0,0,0,0)",
          "rgba(140,80,255,0.12)",
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.12, y: 0.08 }}
        end={{ x: 0.92, y: 0.45 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["#061f26", "#041418", "#020a0e"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.55)"]}
        locations={[0, 0.65, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </>
  );
}

export default function AuthLandingBackgroundNative() {
  const { width, height } = useWindowDimensions();
  const wireframe = usePerspectiveWireframe(width, height);
  const drift = useSharedValue(0);
  const reveal = useSharedValue(0);

  useEffect(() => {
    reveal.value = withTiming(1, {
      duration: 720,
      easing: Easing.out(Easing.cubic),
    });
    drift.value = withRepeat(
      withTiming(GRID_STEP, { duration: 14000, easing: Easing.linear }),
      -1,
      false
    );
  }, [drift, reveal]);

  const wireframeStyle = useAnimatedStyle(() => ({
    opacity: reveal.value * 0.92,
    transform: [
      { perspective: 820 },
      { rotateX: "68deg" },
      { translateY: -height * 0.22 + drift.value + (1 - reveal.value) * 28 },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
  }));

  if (width <= 0 || height <= 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[StyleSheet.absoluteFillObject, glowStyle]}>
        <GlowOverlays />
      </Animated.View>

      {wireframe ? (
        <Animated.View
          style={[
            styles.wireframeWrap,
            {
              width: wireframe.gridW,
              height: wireframe.gridH,
              left: -width * 0.7,
              top: height * 0.28,
            },
            wireframeStyle,
          ]}
        >
          <Canvas style={{ width: wireframe.gridW, height: wireframe.gridH }}>
            {wireframe.nodes}
          </Canvas>
        </Animated.View>
      ) : null}

      <RisingMotesLayerNative lite />
    </View>
  );
}

const styles = StyleSheet.create({
  wireframeWrap: {
    position: "absolute",
  },
});
