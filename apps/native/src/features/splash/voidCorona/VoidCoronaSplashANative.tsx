/**
 * 案 A — 収束 → 刻印
 * 粒子が吸い寄せられ、黒円内側に白ロゴが静かに定着する。
 */
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import VoidCoronaFieldNative from "./VoidCoronaFieldNative";
import {
  VoidCoronaMarkNative,
  voidCoronaLogoSize,
} from "./VoidCoronaMarkNative";
import { VOID_CORONA_COLORS } from "../../../../../../lib/splash/voidCoronaConcepts";

const CONCEPT = getVoidCoronaConcept("A");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashANative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const voidD = Math.min(width, height) * 0.336;
  const { logoW, logoH } = voidCoronaLogoSize(width, voidD);
  const progress = useSharedValue(staticPose ? 1 : 0);

  useEffect(() => {
    if (staticPose) {
      progress.value = 1;
      onComplete?.();
      return;
    }
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: CONCEPT.totalMs, easing: Easing.bezier(0.22, 0.1, 0.18, 1) },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }
    );
  }, [playKey, staticPose, progress, onComplete]);

  const markStyle = useAnimatedStyle(() => {
    if (staticPose) {
      return { opacity: 1, transform: [{ scale: 1 }] };
    }
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.42, 0.58, 0.72], [0, 1, 1], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.42, 0.62, 0.78], [0.82, 1.04, 1], "clamp"),
        },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.4, 0.55, 0.7], [0, 0.55, 0], "clamp"),
      transform: [
        { scale: interpolate(t, [0.4, 0.65], [0.9, 1.08], "clamp") },
      ],
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <VoidCoronaFieldNative
        width={width}
        height={height}
        progress={progress}
        mode="converge"
        staticPose={staticPose}
      />
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.glow,
            { width: logoW * 1.2, height: Math.max(36, logoH * 1.6) },
            glowStyle,
          ]}
        />
        <VoidCoronaMarkNative
          width={logoW}
          height={logoH}
          fill={VOID_CORONA_COLORS.logoWhite}
          style={markStyle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    borderRadius: 40,
    backgroundColor: "rgba(180, 255, 250, 0.16)",
  },
});
