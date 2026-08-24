/**
 * 案 B — 粒子が U マークに
 * コロナから物質が集まり、ヘッダー左と同じ直立 U がシアン輪郭 → 白塗りでロック。
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
  VoidCoronaUMarkNative,
  voidCoronaUMarkSize,
} from "./VoidCoronaMarkNative";

const CONCEPT = getVoidCoronaConcept("B");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashBNative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const voidD = Math.min(width, height) * 0.336;
  const { markSize } = voidCoronaUMarkSize(width, voidD);
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
      { duration: CONCEPT.totalMs, easing: Easing.bezier(0.2, 0.05, 0.15, 1) },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }
    );
  }, [playKey, staticPose, progress, onComplete]);

  const ghostStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.18, 0.36, 0.58, 0.74], [0, 0.55, 0.35, 0], "clamp"),
      transform: [
        { scale: interpolate(t, [0.18, 0.42], [0.72, 1.04], "clamp") },
      ],
    };
  });

  const outlineStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.3, 0.44, 0.68, 0.82], [0, 0.95, 0.55, 0], "clamp"),
      transform: [
        { scale: interpolate(t, [0.3, 0.52], [0.9, 1.02], "clamp") },
      ],
    };
  });

  const fillStyle = useAnimatedStyle(() => {
    if (staticPose) {
      return { opacity: 1, transform: [{ scale: 1 }] };
    }
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.55, 0.72], [0, 1], "clamp"),
      transform: [
        { scale: interpolate(t, [0.55, 0.78], [0.94, 1], "clamp") },
      ],
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <VoidCoronaFieldNative
        width={width}
        height={height}
        progress={progress}
        mode="materialize"
        staticPose={staticPose}
      />
      <View style={styles.center}>
        <View style={{ width: markSize, height: markSize }}>
          {/* 粒子寄せのゴースト（シアンの淡い U） */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill={VOID_CORONA_COLORS.logoCyan}
              style={ghostStyle}
            />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill="transparent"
              stroke={VOID_CORONA_COLORS.logoCyan}
              strokeWidth={14}
              strokeOpacity={0.95}
              style={outlineStyle}
            />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill={VOID_CORONA_COLORS.logoWhite}
              style={fillStyle}
            />
          </View>
        </View>
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
});
