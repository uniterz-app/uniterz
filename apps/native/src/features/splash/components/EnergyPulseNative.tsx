/**
 * 円形 Energy Pulse — 細いシアンリングを 1 回だけ広げる。
 */
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { UNITERZ_LOGO_SPLASH_SPACE } from "../../../../../../lib/units/uniterzLogoSplash";

/** 1.4s〜1.8s / 2300ms */
const T0 = 1.4 / 2.3;
const T1 = 1.8 / 2.3;

type Props = {
  progress: SharedValue<number>;
  size: number;
  staticPose: boolean;
};

export default function EnergyPulseNative({
  progress,
  size,
  staticPose,
}: Props) {
  const base = Math.max(size * 0.55, 120);

  const style = useAnimatedStyle(() => {
    if (staticPose) {
      return { opacity: 0, transform: [{ scale: 0.5 }] };
    }
    const t = progress.value;
    const scale = interpolate(t, [T0, T1], [0.5, 2.5], "clamp");
    const opacity = interpolate(t, [T0, T0 + 0.02, T1], [0, 0.6, 0], "clamp");
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[{ width: base, height: base }, style]}>
        <Svg width={base} height={base}>
          <Circle
            cx={base / 2}
            cy={base / 2}
            r={base / 2 - 1}
            stroke={UNITERZ_LOGO_SPLASH_SPACE.accentBright}
            strokeWidth={1.5}
            fill="none"
            opacity={0.9}
          />
          <Circle
            cx={base / 2}
            cy={base / 2}
            r={base / 2 - 4}
            stroke={UNITERZ_LOGO_SPLASH_SPACE.accent}
            strokeWidth={4}
            fill="none"
            opacity={0.25}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
