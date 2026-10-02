/**
 * 案 Q — Dark Glass
 * 黒いガラスの屈折・歪みの中からロゴが現れる。洗練寄り。
 */
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import { VoidCoronaUMarkNative } from "./VoidCoronaMarkNative";
import { useVoidCoronaSplashClock } from "./useVoidCoronaSplashClock";

const CONCEPT = getVoidCoronaConcept("Q");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashQNative({
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

  const glassStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.35 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.1, 0.3, 0.85, 1], [0, 0.45, 0.25, 0.12], "clamp"),
    };
  });

  const ghostA = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.28, 0.45, 0.62], [0, 0.35, 0], "clamp"),
      transform: [
        {
          translateX: interpolate(t, [0.28, 0.62], [-10, -2], "clamp"),
        },
        {
          scale: interpolate(t, [0.28, 0.62], [1.06, 1.01], "clamp"),
        },
      ],
    };
  });

  const ghostB = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.3, 0.48, 0.66], [0, 0.28, 0], "clamp"),
      transform: [
        {
          translateX: interpolate(t, [0.3, 0.66], [12, 3], "clamp"),
        },
        {
          scale: interpolate(t, [0.3, 0.66], [1.08, 1.02], "clamp"),
        },
      ],
    };
  });

  const markStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.48, 0.7], [0, 1], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.48, 0.78], [1.04, 1], "clamp"),
        },
      ],
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <Animated.View style={[styles.glass, glassStyle]} pointerEvents="none" />
      <View style={styles.center}>
        <View style={{ width: markSize, height: markSize }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill="rgba(180, 200, 220, 0.45)"
              style={ghostA}
            />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill="rgba(160, 170, 190, 0.35)"
              style={ghostB}
            />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill="#F5F5F8"
              style={markStyle}
            />
          </View>
        </View>
      </View>
      <Animated.View style={[styles.rim, glassStyle]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  glass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 22, 28, 0.55)",
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.06)",
    margin: 24,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
