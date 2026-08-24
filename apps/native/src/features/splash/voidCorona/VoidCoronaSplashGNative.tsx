/**
 * 案 G — 収縮 → 粒子 U → 粒子消える → 白 U がドクン 1 回 → 遷移
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

const CONCEPT = getVoidCoronaConcept("G");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashGNative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const voidD = Math.min(width, height) * 0.336;
  const { markSize } = voidCoronaUMarkSize(width, voidD * 1.15);
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
      { duration: CONCEPT.totalMs, easing: Easing.bezier(0.18, 0.04, 0.12, 1) },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }
    );
  }, [playKey, staticPose, progress, onComplete]);

  /** ソリッド U: 出現 → ドクン 1 回 → わずかにホールド */
  const fillStyle = useAnimatedStyle(() => {
    if (staticPose) {
      return { opacity: 1, transform: [{ scale: 1 }] };
    }
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.5, 0.62], [0, 1], "clamp"),
      transform: [
        {
          scale: interpolate(
            t,
            [0.5, 0.62, 0.7, 0.76, 0.84, 0.92],
            [0.94, 1, 1, 1.16, 0.97, 1],
            "clamp"
          ),
        },
      ],
    };
  });

  /** ドクンに合わせた一瞬のシアン心拍グロー */
  const beatGlowStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.7, 0.76, 0.84], [0, 0.55, 0], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.7, 0.76, 0.84], [1, 1.22, 1.05], "clamp"),
        },
      ],
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <VoidCoronaFieldNative
        width={width}
        height={height}
        progress={progress}
        mode="formU"
        formUExit="lock"
        markSize={markSize}
        staticPose={staticPose}
      />
      <View style={styles.center}>
        <View style={{ width: markSize, height: markSize }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill={VOID_CORONA_COLORS.logoCyan}
              style={beatGlowStyle}
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
