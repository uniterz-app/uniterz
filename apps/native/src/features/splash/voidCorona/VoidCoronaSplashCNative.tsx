/**
 * 案 C — ポータル通過
 * 円内にロゴ → 黒円が開き、空間へ入る（Games への橋）。
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
import {
  getVoidCoronaConcept,
  VOID_CORONA_COLORS,
} from "../../../../../../lib/splash/voidCoronaConcepts";
import VoidCoronaFieldNative from "./VoidCoronaFieldNative";
import {
  VoidCoronaMarkNative,
  voidCoronaLogoSize,
} from "./VoidCoronaMarkNative";

const CONCEPT = getVoidCoronaConcept("C");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashCNative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const voidD = Math.min(width, height) * 0.336;
  const { logoW, logoH } = voidCoronaLogoSize(width, voidD);
  const progress = useSharedValue(staticPose ? 0.35 : 0);

  useEffect(() => {
    if (staticPose) {
      progress.value = 0.35;
      onComplete?.();
      return;
    }
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: CONCEPT.totalMs, easing: Easing.bezier(0.35, 0.0, 0.12, 1) },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }
    );
  }, [playKey, staticPose, progress, onComplete]);

  const markStyle = useAnimatedStyle(() => {
    if (staticPose) {
      return {
        opacity: 1,
        transform: [{ scale: 1 }, { perspective: 900 }],
      };
    }
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.12, 0.28, 0.55, 0.72], [0, 1, 1, 0], "clamp"),
      transform: [
        { perspective: 1100 },
        {
          scale: interpolate(
            t,
            [0.12, 0.35, 0.55, 0.85],
            [0.7, 1, 1.08, 2.6],
            "clamp"
          ),
        },
      ],
    };
  });

  const veilStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    return {
      opacity: interpolate(
        progress.value,
        [0.62, 0.82, 1],
        [0, 0.55, 1],
        "clamp"
      ),
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <VoidCoronaFieldNative
        width={width}
        height={height}
        progress={progress}
        mode="portal"
        staticPose={staticPose}
      />
      <View style={styles.center}>
        <VoidCoronaMarkNative
          width={logoW}
          height={logoH}
          fill={VOID_CORONA_COLORS.logoWhite}
          style={markStyle}
        />
      </View>
      <Animated.View style={[styles.veil, veilStyle]} />
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
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
});
