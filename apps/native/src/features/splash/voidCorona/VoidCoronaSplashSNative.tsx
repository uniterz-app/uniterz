/**
 * 案 S — Dark Energy Wave
 * 中央から低輝度の波紋。その瞬間だけロゴが露出。
 */
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import { VoidCoronaUMarkNative } from "./VoidCoronaMarkNative";
import { useVoidCoronaSplashClock } from "./useVoidCoronaSplashClock";

const CONCEPT = getVoidCoronaConcept("S");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

function WaveRing({
  progress,
  staticPose,
  size,
  delay,
}: {
  progress: { value: number };
  staticPose: boolean;
  size: number;
  delay: number;
}) {
  const style = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ scale: 1 }] };
    const t = progress.value;
    const local = Math.min(1, Math.max(0, (t - delay) / 0.55));
    return {
      opacity: interpolate(local, [0, 0.15, 0.55, 1], [0, 0.45, 0.2, 0], "clamp"),
      transform: [
        { scale: interpolate(local, [0, 1], [0.2, 2.6], "clamp") },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

export default function VoidCoronaSplashSNative({
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

  const markStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1 };
    const t = progress.value;
    // 波が通過する瞬間だけ明るく、その後は淡く残す
    return {
      opacity: interpolate(
        t,
        [0.28, 0.4, 0.52, 0.68, 0.85],
        [0, 0.15, 1, 0.55, 0.85],
        "clamp"
      ),
      transform: [
        {
          scale: interpolate(t, [0.35, 0.52, 0.7], [0.97, 1.03, 1], "clamp"),
        },
      ],
    };
  });

  const ringSize = markSize * 1.15;

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <View style={styles.center}>
        <WaveRing
          progress={progress}
          staticPose={staticPose}
          size={ringSize}
          delay={0.22}
        />
        <WaveRing
          progress={progress}
          staticPose={staticPose}
          size={ringSize}
          delay={0.34}
        />
        <WaveRing
          progress={progress}
          staticPose={staticPose}
          size={ringSize}
          delay={0.46}
        />
        <VoidCoronaUMarkNative
          size={markSize}
          fill="#EFEFF3"
          style={markStyle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(160, 170, 185, 0.35)",
  },
});
