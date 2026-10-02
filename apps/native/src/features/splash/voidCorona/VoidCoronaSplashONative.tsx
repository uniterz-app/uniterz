/**
 * 案 O — Smoke
 * 黒い煙の中からロゴだけが浮かび上がる。重厚。
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import { VoidCoronaUMarkNative } from "./VoidCoronaMarkNative";
import { useVoidCoronaSplashClock } from "./useVoidCoronaSplashClock";

const CONCEPT = getVoidCoronaConcept("O");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashONative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const { markSize, progress, staticPose } = useVoidCoronaSplashClock(
    CONCEPT.totalMs,
    playKey,
    forceStatic,
    onComplete
  );

  const plumes = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        w: markSize * (0.9 + (i % 3) * 0.35),
        h: markSize * (1.1 + (i % 4) * 0.25),
        x: ((i * 37) % 60) - 30,
        y: ((i * 23) % 50) - 10,
        delay: i * 0.03,
      })),
    [markSize]
  );

  const markStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.42, 0.68], [0, 1], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.42, 0.75], [0.94, 1], "clamp"),
        },
      ],
    };
  });

  const veilStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.15 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.55, 0.85], [0.85, 0.12], "clamp"),
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <View style={styles.center}>
        {plumes.map((p) => (
          <SmokePlume
            key={p.id}
            progress={progress}
            staticPose={staticPose}
            w={p.w}
            h={p.h}
            x={p.x}
            y={p.y}
            delay={p.delay}
          />
        ))}
        <VoidCoronaUMarkNative
          size={markSize}
          fill="#E8E8EC"
          style={markStyle}
        />
        <Animated.View style={[styles.veil, veilStyle]} pointerEvents="none" />
      </View>
    </View>
  );
}

function SmokePlume({
  progress,
  staticPose,
  w,
  h,
  x,
  y,
  delay,
}: {
  progress: SharedValue<number>;
  staticPose: boolean;
  w: number;
  h: number;
  x: number;
  y: number;
  delay: number;
}) {
  const style = useAnimatedStyle(() => {
    if (staticPose) {
      return {
        opacity: 0.2,
        transform: [{ translateX: x }, { translateY: y - 20 }, { scale: 1.1 }],
      };
    }
    const t = progress.value;
    const local = Math.min(1, Math.max(0, (t - delay) / 0.85));
    return {
      opacity: interpolate(
        local,
        [0, 0.2, 0.55, 1],
        [0, 0.55, 0.35, 0.08],
        "clamp"
      ),
      transform: [
        { translateX: x + interpolate(local, [0, 1], [0, x * 0.3], "clamp") },
        {
          translateY: y + interpolate(local, [0, 1], [40, -70], "clamp"),
        },
        { scale: interpolate(local, [0, 1], [0.7, 1.45], "clamp") },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.plume,
        { width: w, height: h, borderRadius: w * 0.5 },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  plume: {
    position: "absolute",
    backgroundColor: "rgba(28, 28, 32, 0.85)",
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
});
