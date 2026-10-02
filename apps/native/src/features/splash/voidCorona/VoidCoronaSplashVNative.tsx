/**
 * 案 V — Dark Cyber II
 * 極細グリッド＋走査線。最後だけロゴに光が走る。
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import { VoidCoronaUMarkNative } from "./VoidCoronaMarkNative";
import { useVoidCoronaSplashClock } from "./useVoidCoronaSplashClock";

const CONCEPT = getVoidCoronaConcept("V");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashVNative({
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

  const hLines = useMemo(() => {
    const gap = 22;
    const n = Math.ceil(height / gap);
    return Array.from({ length: n }, (_, i) => i * gap);
  }, [height]);

  const vLines = useMemo(() => {
    const gap = 22;
    const n = Math.ceil(width / gap);
    return Array.from({ length: n }, (_, i) => i * gap);
  }, [width]);

  const gridStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.12 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.05, 0.2, 0.85, 0.98], [0, 0.18, 0.14, 0.05], "clamp"),
    };
  });

  const scanStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ translateY: 0 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.15, 0.3, 0.7, 0.85], [0, 0.55, 0.35, 0], "clamp"),
      transform: [
        {
          translateY: interpolate(t, [0.15, 0.85], [0, height], "clamp"),
        },
      ],
    };
  });

  const markStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.35, 0.55], [0, 1], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.35, 0.6], [0.98, 1], "clamp"),
        },
      ],
    };
  });

  const sheenStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ translateX: 0 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.72, 0.8, 0.9, 0.96], [0, 0.7, 0.4, 0], "clamp"),
      transform: [
        {
          translateX: interpolate(
            t,
            [0.72, 0.96],
            [-markSize * 0.6, markSize * 0.6],
            "clamp"
          ),
        },
        { rotate: "-16deg" as const },
      ],
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <Animated.View
        style={[StyleSheet.absoluteFill, gridStyle]}
        pointerEvents="none"
      >
        {hLines.map((y) => (
          <View key={`h-${y}`} style={[styles.hLine, { top: y }]} />
        ))}
        {vLines.map((x) => (
          <View key={`v-${x}`} style={[styles.vLine, { left: x }]} />
        ))}
      </Animated.View>

      <Animated.View
        style={[styles.scan, { width }, scanStyle]}
        pointerEvents="none"
      />

      <View style={styles.center}>
        <View style={{ width: markSize, height: markSize, overflow: "hidden" }}>
          <VoidCoronaUMarkNative
            size={markSize}
            fill="#EAEAF0"
            style={markStyle}
          />
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
  root: { flex: 1, backgroundColor: "#000" },
  hLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(140, 150, 165, 0.35)",
  },
  vLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(140, 150, 165, 0.28)",
  },
  scan: {
    position: "absolute",
    left: 0,
    height: 2,
    backgroundColor: "rgba(180, 200, 220, 0.35)",
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
  },
  sheen: {
    width: 22,
    height: "130%",
    backgroundColor: "rgba(200, 230, 255, 0.55)",
  },
});
