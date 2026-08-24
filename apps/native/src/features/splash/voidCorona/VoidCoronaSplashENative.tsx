/**
 * 案 E — 通過
 * 黒円をトンネル入口に、ロゴが手前からくぐって通過する。
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

const CONCEPT = getVoidCoronaConcept("E");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashENative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const voidD = Math.min(width, height) * 0.336;
  const { logoW, logoH } = voidCoronaLogoSize(width, voidD * 1.15);
  const progress = useSharedValue(staticPose ? 0.48 : 0);

  useEffect(() => {
    if (staticPose) {
      progress.value = 0.48;
      onComplete?.();
      return;
    }
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: CONCEPT.totalMs, easing: Easing.bezier(0.45, 0.0, 0.12, 1) },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }
    );
  }, [playKey, staticPose, progress, onComplete]);

  const hazeStyle = useAnimatedStyle(() => {
    if (staticPose) {
      return {
        opacity: 0.22,
        transform: [
          { perspective: 1200 },
          { translateY: 14 },
          { rotateX: "5deg" },
          { scale: 0.72 },
        ],
      };
    }
    const t = progress.value;
    const cam = interpolate(t, [0, 0.25, 0.52, 0.6, 1], [0.08, 0.22, 0.4, 0.46, 1.2]);
    const worldZ = 0.68;
    const rel = Math.max(0.02, worldZ - cam);
    const s = Math.min(0.28 / rel, 10);
    return {
      opacity: interpolate(rel, [0.04, 0.18, 0.4, 0.65], [0, 0.2, 0.26, 0.06]),
      transform: [
        { perspective: 1200 },
        { translateY: interpolate(t, [0, 0.55], [28, 10]) },
        { rotateX: `${interpolate(t, [0, 0.55], [9, 4])}deg` },
        { scale: s },
      ],
    };
  });

  const mainStyle = useAnimatedStyle(() => {
    if (staticPose) {
      return {
        opacity: 1,
        transform: [
          { perspective: 1200 },
          { translateY: 0 },
          { rotateX: "1.5deg" },
          { scale: 1 },
        ],
      };
    }
    const t = progress.value;
    const cam = interpolate(
      t,
      [0, 0.25, 0.52, 0.6, 1],
      [0.08, 0.22, 0.4, 0.46, 1.2]
    );
    const worldZ = 0.55;
    const rel = Math.max(0.016, worldZ - cam);
    const s = Math.min(0.4 / rel, 28);
    const appear = interpolate(t, [0.04, 0.14], [0, 1]);
    const past = interpolate(rel, [0.016, 0.08], [0, 1]);
    return {
      opacity: cam >= worldZ ? past : appear,
      transform: [
        { perspective: 1200 },
        { translateY: interpolate(t, [0, 0.55, 0.9], [18, 0, -6]) },
        { rotateX: `${interpolate(t, [0, 0.55, 0.9], [6, 1.5, -1])}deg` },
        { scale: s },
      ],
    };
  });

  // DEV プレビューでは終端を真っ黒のままにしない（下部ドックが消えて見えるため）
  const veilStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    return {
      opacity: interpolate(
        progress.value,
        [0.72, 0.86, 0.94, 1],
        [0, 1, 0.55, 0],
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
        mode="pass"
        staticPose={staticPose}
      />
      <View style={styles.center}>
        <VoidCoronaMarkNative
          width={logoW}
          height={logoH}
          fill={VOID_CORONA_COLORS.logoSoft}
          style={hazeStyle}
        />
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.centerInner}>
            <VoidCoronaMarkNative
              width={logoW}
              height={logoH}
              fill={VOID_CORONA_COLORS.logoWhite}
              style={mainStyle}
            />
          </View>
        </View>
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
  centerInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
});
