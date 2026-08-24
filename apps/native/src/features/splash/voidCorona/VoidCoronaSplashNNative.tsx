/**
 * 案 N — Particle Gather
 * 暗闇の微細粒子が中央に集まりロゴになる。
 */
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import VoidCoronaFieldNative from "./VoidCoronaFieldNative";
import { VoidCoronaUMarkNative } from "./VoidCoronaMarkNative";
import { useVoidCoronaSplashClock } from "./useVoidCoronaSplashClock";

const CONCEPT = getVoidCoronaConcept("N");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashNNative({
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

  const markStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.62, 0.8], [0, 1], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.62, 0.88], [0.96, 1], "clamp"),
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
        palette="obsidian"
      />
      <View style={styles.center}>
        <VoidCoronaUMarkNative
          size={markSize}
          fill="#F4F4F7"
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
});
