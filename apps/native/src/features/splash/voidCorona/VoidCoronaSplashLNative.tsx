/**
 * 案 L — Liquid Metal
 * 金属粒子が流れ寄る → 表面が張る → クローム U 完成。
 */
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  type AnimatedStyle,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import {
  UNITERZ_U_MARK_PATHS,
  UNITERZ_U_MARK_VIEWBOX,
} from "../../../../../../lib/units/uniterzUMark";
import VoidCoronaFieldNative from "./VoidCoronaFieldNative";
import { voidCoronaUMarkSize } from "./VoidCoronaMarkNative";

const CONCEPT = getVoidCoronaConcept("L");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

function ChromeUMark({
  size,
  style,
}: {
  size: number;
  style?: AnimatedStyle<ViewStyle>;
}) {
  const gid = "void-corona-chrome-u";
  return (
    <Animated.View
      style={[{ width: size, height: size }, style]}
      pointerEvents="none"
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${UNITERZ_U_MARK_VIEWBOX} ${UNITERZ_U_MARK_VIEWBOX}`}
      >
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#6E6E78" />
            <Stop offset="0.28" stopColor="#F2F2F6" />
            <Stop offset="0.48" stopColor="#A8A8B2" />
            <Stop offset="0.68" stopColor="#5A5A64" />
            <Stop offset="0.88" stopColor="#E6E6EC" />
            <Stop offset="1" stopColor="#8A8A94" />
          </LinearGradient>
        </Defs>
        <G fill={`url(#${gid})`}>
          {UNITERZ_U_MARK_PATHS.map((d, i) => (
            <Path key={i} d={d} />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

export default function VoidCoronaSplashLNative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const voidD = Math.min(width, height) * 0.336;
  const { markSize } = voidCoronaUMarkSize(width, voidD * 1.2);
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
      { duration: CONCEPT.totalMs, easing: Easing.bezier(0.2, 0.04, 0.12, 1) },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }
    );
  }, [playKey, staticPose, progress, onComplete]);

  const mercuryStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.32, 0.48, 0.62, 0.78],
        [0, 0.55, 0.35, 0],
        "clamp"
      ),
      transform: [
        {
          scale: interpolate(t, [0.32, 0.55, 0.72], [0.72, 1.08, 1], "clamp"),
        },
      ],
    };
  });

  const chromeStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.58, 0.72], [0, 1], "clamp"),
      transform: [
        {
          scale: interpolate(
            t,
            [0.58, 0.72, 0.8, 0.88, 0.96],
            [0.94, 1.02, 1, 1.04, 1],
            "clamp"
          ),
        },
      ],
    };
  });

  const sheenStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ translateX: 0 }] };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.72, 0.78, 0.86, 0.92],
        [0, 0.55, 0.35, 0],
        "clamp"
      ),
      transform: [
        {
          translateX: interpolate(
            t,
            [0.72, 0.92],
            [-markSize * 0.55, markSize * 0.55],
            "clamp"
          ),
        },
        { rotate: "-18deg" as const },
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
        palette="chrome"
      />

      <View style={styles.center}>
        <View style={{ width: markSize, height: markSize }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <ChromeUMark size={markSize} style={mercuryStyle} />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <ChromeUMark size={markSize} style={chromeStyle} />
          </View>
          <Animated.View
            style={[styles.sheenWrap, sheenStyle]}
            pointerEvents="none"
          >
            <View style={styles.sheen} />
          </Animated.View>
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
  sheenWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sheen: {
    width: 28,
    height: "120%",
    backgroundColor: "rgba(255,255,255,0.55)",
  },
});
