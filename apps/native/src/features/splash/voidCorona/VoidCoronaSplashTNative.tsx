/**
 * 案 T — Deep Sea
 * 漆黒に弱い光線と浮遊粒子。ロゴが深部から近づく。
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import VoidCoronaFieldNative from "./VoidCoronaFieldNative";
import { VoidCoronaUMarkNative } from "./VoidCoronaMarkNative";
import { useVoidCoronaSplashClock } from "./useVoidCoronaSplashClock";

const CONCEPT = getVoidCoronaConcept("T");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashTNative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const { width, height, markSize, progress, staticPose } =
    useVoidCoronaSplashClock(
      CONCEPT.totalMs,
      playKey,
      forceStatic,
      onComplete
    );

  const rays = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        rotate: -28 + i * 14,
        opacity: 0.04 + (i % 3) * 0.02,
      })),
    []
  );

  const markStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.28, 0.55, 0.8], [0, 0.55, 1], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.2, 0.85], [0.42, 1], "clamp"),
        },
        {
          translateY: interpolate(t, [0.2, 0.85], [48, 0], "clamp"),
        },
      ],
    };
  });

  const hazeStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.2 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0, 0.4, 1], [0.35, 0.25, 0.12], "clamp"),
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <VoidCoronaFieldNative
        width={width}
        height={height}
        progress={progress}
        mode="formU"
        formUExit="hold"
        markSize={markSize * 1.35}
        staticPose={staticPose}
        palette="obsidian"
      />
      <Animated.View style={[styles.haze, hazeStyle]} pointerEvents="none" />
      {rays.map((r) => (
        <View
          key={r.id}
          pointerEvents="none"
          style={[
            styles.ray,
            {
              opacity: r.opacity,
              transform: [{ rotate: `${r.rotate}deg` }],
              height: height * 0.9,
            },
          ]}
        />
      ))}
      <View style={styles.center}>
        <VoidCoronaUMarkNative
          size={markSize}
          fill="#D8DCE6"
          style={markStyle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  haze: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 14, 24, 0.55)",
  },
  ray: {
    position: "absolute",
    top: "5%",
    left: "50%",
    width: 2,
    marginLeft: -1,
    backgroundColor: "rgba(120, 150, 190, 0.25)",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
