/**
 * 案 W — Lens Warp / 空間歪曲
 * ロゴ周辺だけ重力レンズのように歪み、形が出現する。
 */
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import { VoidCoronaUMarkNative } from "./VoidCoronaMarkNative";
import { useVoidCoronaSplashClock } from "./useVoidCoronaSplashClock";

const CONCEPT = getVoidCoronaConcept("W");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashWNative({
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

  const warpA = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.08, transform: [{ scale: 1.2 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.12, 0.35, 0.7, 0.9], [0, 0.35, 0.15, 0.05], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.12, 0.55, 0.9], [0.4, 1.55, 1.9], "clamp"),
        },
      ],
    };
  });

  const warpB = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.06, transform: [{ scale: 1.45 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.18, 0.4, 0.75, 0.95], [0, 0.28, 0.12, 0.04], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.18, 0.6, 0.95], [0.55, 1.75, 2.15], "clamp"),
        },
      ],
    };
  });

  const ghostStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.3, 0.48, 0.65], [0, 0.4, 0], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.3, 0.65], [1.18, 1.04], "clamp"),
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
          scale: interpolate(t, [0.48, 0.78], [1.12, 1], "clamp"),
        },
      ],
    };
  });

  const lens = markSize * 1.6;

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <View style={styles.center}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.warp,
            { width: lens, height: lens, borderRadius: lens / 2 },
            warpA,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.warp,
            {
              width: lens * 0.72,
              height: lens * 0.72,
              borderRadius: (lens * 0.72) / 2,
            },
            warpB,
          ]}
        />
        <View style={{ width: markSize, height: markSize }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill="rgba(200,210,230,0.35)"
              style={ghostStyle}
            />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill="#F3F3F7"
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
  warp: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(160, 175, 200, 0.22)",
    backgroundColor: "rgba(20, 28, 40, 0.18)",
  },
});
