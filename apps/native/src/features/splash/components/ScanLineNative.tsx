/**
 * ロゴ横断スキャン — core line + blur 風 glow（幅広半透明 Rect）。
 */
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { UNITERZ_LOGO_SPLASH_SPACE } from "../../../../../../lib/units/uniterzLogoSplash";

/** 0.9s〜1.4s / 2300ms */
const T0 = 0.9 / 2.3;
const T1 = 1.4 / 2.3;

type Props = {
  progress: SharedValue<number>;
  logoW: number;
  logoH: number;
  staticPose: boolean;
};

export default function ScanLineNative({
  progress,
  logoW,
  logoH,
  staticPose,
}: Props) {
  const travel = logoW + 40;

  const style = useAnimatedStyle(() => {
    if (staticPose) {
      return { opacity: 0, transform: [{ translateX: -20 }] };
    }
    const t = progress.value;
    const x = interpolate(t, [T0, T1], [-20, travel], "clamp");
    const opacity = interpolate(
      t,
      [T0, T0 + 0.02, T1 - 0.02, T1],
      [0, 1, 1, 0],
      "clamp"
    );
    return {
      opacity,
      transform: [{ translateX: x }],
    };
  });

  const beamH = logoH * 1.15;

  return (
    <View
      style={[styles.clip, { width: logoW, height: logoH }]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.beam,
          { height: beamH, top: (logoH - beamH) / 2 },
          style,
        ]}
      >
        <View style={[styles.glow, { height: beamH }]} />
        <View style={[styles.core, { height: beamH }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
    position: "absolute",
    left: 0,
    top: 0,
  },
  beam: {
    position: "absolute",
    left: 0,
    width: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 14,
    backgroundColor: UNITERZ_LOGO_SPLASH_SPACE.accent,
    opacity: 0.28,
  },
  core: {
    width: 2,
    backgroundColor: UNITERZ_LOGO_SPLASH_SPACE.accentBright,
    opacity: 0.95,
  },
});