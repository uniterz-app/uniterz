/**
 * 案 R — Shadow Reveal
 * ほぼ真っ黒 → 輪郭 → 徐々にロゴ全体。ミニマル。
 */
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import { VoidCoronaUMarkNative } from "./VoidCoronaMarkNative";
import { useVoidCoronaSplashClock } from "./useVoidCoronaSplashClock";

const CONCEPT = getVoidCoronaConcept("R");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashRNative({
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

  const outlineStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.22, 0.38, 0.58, 0.72],
        [0, 0.85, 0.4, 0],
        "clamp"
      ),
    };
  });

  const fillStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.52, 0.82], [0, 1], "clamp"),
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <View style={styles.center}>
        <View style={{ width: markSize, height: markSize }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill="transparent"
              stroke="rgba(220,220,226,0.7)"
              strokeWidth={10}
              strokeOpacity={1}
              style={outlineStyle}
            />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill="#F2F2F5"
              style={fillStyle}
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
