/**
 * 案 M — Black Liquid
 * 黒い液体がゆっくり流れ、ロゴを形成。高級感強め。
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

const CONCEPT = getVoidCoronaConcept("M");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashMNative({
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

  const poolStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.18, 0.38, 0.58, 0.78],
        [0, 0.7, 0.45, 0],
        "clamp"
      ),
      transform: [
        {
          scale: interpolate(t, [0.18, 0.55, 0.75], [0.55, 1.15, 1], "clamp"),
        },
      ],
    };
  });

  const glossStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.35, 0.5, 0.68, 0.82],
        [0, 0.35, 0.2, 0],
        "clamp"
      ),
      transform: [
        {
          translateY: interpolate(t, [0.35, 0.82], [-8, 10], "clamp"),
        },
      ],
    };
  });

  const markStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.52, 0.72], [0, 1], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.52, 0.78, 0.9], [0.92, 1.02, 1], "clamp"),
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
        <View style={{ width: markSize, height: markSize }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill="#141418"
              style={poolStyle}
            />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill="rgba(255,255,255,0.12)"
              style={glossStyle}
            />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill="#EDEDF2"
              style={markStyle}
            />
          </View>
        </View>
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
