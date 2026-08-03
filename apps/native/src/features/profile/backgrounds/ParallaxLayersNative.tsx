/**
 * Web `profile-plan-pro-bg__layer--far/mid/near` 相当。
 * CSS blur + radial-gradient を Skia で再現。
 */
import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  RadialGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { PROFILE_PLAN_PRO_BG_DEPTH_TIMING } from "../../../../../../lib/profile/profilePlanProBgVariants";

type Props = {
  width: number;
  height: number;
  shouldAnimate: boolean;
};

function ParallaxLayersNative({ width, height, shouldAnimate }: Props) {
  const phase = useSharedValue(shouldAnimate ? 0 : 0.5);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(phase);
      phase.value = 0.5;
      return;
    }
    phase.value = withRepeat(
      withTiming(1, {
        duration: PROFILE_PLAN_PRO_BG_DEPTH_TIMING.parallaxMs,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    return () => cancelAnimation(phase);
  }, [phase, shouldAnimate]);

  const farStyle = useAnimatedStyle(() => ({
    opacity: 0.62 + phase.value * 0.28,
    transform: [
      { translateX: phase.value * 8 },
      { translateY: phase.value * 4 },
      { scale: 1 + phase.value * 0.06 },
    ],
  }));
  const midStyle = useAnimatedStyle(() => ({
    opacity: 0.68 + (1 - phase.value) * 0.28,
    transform: [
      { translateX: (1 - phase.value) * -10 },
      { translateY: (1 - phase.value) * -6 },
      { scale: 1 + (1 - phase.value) * 0.08 },
    ],
  }));
  const nearStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + phase.value * 0.28,
    transform: [
      { translateX: phase.value * 14 },
      { translateY: -phase.value * 10 },
      { scale: 1 + phase.value * 0.12 },
    ],
  }));

  if (width <= 0 || height <= 0) return null;

  const farW = width * 0.95;
  const farH = height * 0.72;
  const midW = width * 0.72;
  const midH = height * 0.58;
  const nearW = width * 0.48;
  const nearH = height * 0.38;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFillObject}>
        <Rect x={0} y={0} width={width} height={height} color="#050c14" />
        <Rect x={0} y={0} width={width} height={height} color="#030508" opacity={0.7} />
      </Canvas>

      <Animated.View
        style={[
          styles.layer,
          {
            top: -height * 0.22,
            left: -width * 0.18,
            width: farW,
            height: farH,
          },
          farStyle,
        ]}
      >
        <Canvas style={{ width: farW, height: farH }}>
          <Group>
            <Circle cx={farW * 0.5} cy={farH * 0.5} r={Math.max(farW, farH) * 0.42}>
              <RadialGradient
                c={vec(farW * 0.5, farH * 0.5)}
                r={Math.max(farW, farH) * 0.42}
                colors={["rgba(34,211,238,0.28)", "transparent"]}
              />
              <BlurMask blur={28} style="normal" />
            </Circle>
          </Group>
        </Canvas>
      </Animated.View>

      <Animated.View
        style={[
          styles.layer,
          {
            top: height * 0.18,
            right: -width * 0.22,
            width: midW,
            height: midH,
          },
          midStyle,
        ]}
      >
        <Canvas style={{ width: midW, height: midH }}>
          <Circle cx={midW * 0.5} cy={midH * 0.5} r={Math.max(midW, midH) * 0.42}>
            <RadialGradient
              c={vec(midW * 0.5, midH * 0.5)}
              r={Math.max(midW, midH) * 0.42}
              colors={["rgba(124,92,255,0.32)", "transparent"]}
            />
            <BlurMask blur={16} style="normal" />
          </Circle>
        </Canvas>
      </Animated.View>

      <Animated.View
        style={[
          styles.layer,
          {
            bottom: -height * 0.08,
            left: width * 0.08,
            width: nearW,
            height: nearH,
          },
          nearStyle,
        ]}
      >
        <Canvas style={{ width: nearW, height: nearH }}>
          <Circle cx={nearW * 0.5} cy={nearH * 0.5} r={Math.max(nearW, nearH) * 0.42}>
            <RadialGradient
              c={vec(nearW * 0.5, nearH * 0.5)}
              r={Math.max(nearW, nearH) * 0.42}
              colors={["rgba(79,247,244,0.42)", "transparent"]}
            />
            <BlurMask blur={6} style="normal" />
          </Circle>
        </Canvas>
      </Animated.View>

      {/* vignette */}
      <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Circle cx={width * 0.5} cy={height * 0.42} r={Math.max(width, height) * 0.72}>
          <RadialGradient
            c={vec(width * 0.5, height * 0.42)}
            r={Math.max(width, height) * 0.72}
            colors={["transparent", "rgba(2,4,8,0.62)"]}
            positions={[0.35, 1]}
          />
        </Circle>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    overflow: "hidden",
  },
});

export default memo(ParallaxLayersNative);
