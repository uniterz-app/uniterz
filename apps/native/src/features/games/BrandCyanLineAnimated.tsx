import { useEffect, useState } from "react";
import { type LayoutChangeEvent, Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  type SharedValue,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/** 画面幅いっぱいでも両端が自然に消えるよう肩を長めに */
const BASE_STOPS: [string, string, string, string, string] = [
  "rgba(34,211,246,0)",
  "rgba(34,211,246,0.18)",
  "rgba(34,211,246,0.9)",
  "rgba(34,211,246,0.18)",
  "rgba(34,211,246,0)",
];
const BASE_LOCATIONS: [number, number, number, number, number] = [
  0, 0.12, 0.5, 0.88, 1,
];

const SHEEN_STOPS: [string, string, string, string, string] = [
  "rgba(34,211,246,0)",
  "rgba(200,255,255,0.4)",
  "rgba(255,255,255,0.7)",
  "rgba(200,255,255,0.4)",
  "rgba(34,211,246,0)",
];

/**
 * AuthFormBranding の via-cyan ラインに、横方向の光の走査と穏やかな脈打ちを重ねる
 */
export default function BrandCyanLineAnimated() {
  const reduced = useReducedMotion();
  const sweep = useSharedValue(0);
  const glow = useSharedValue(0.85);
  const [lineW, setLineW] = useState(0);

  useEffect(() => {
    if (reduced) {
      cancelAnimation(sweep);
      cancelAnimation(glow);
      return;
    }
    sweep.value = 0;
    sweep.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      false
    );
    glow.value = 0.72;
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(sweep);
      cancelAnimation(glow);
    };
  }, [reduced, sweep, glow]);

  const onLineLayout = (e: LayoutChangeEvent) => {
    setLineW(e.nativeEvent.layout.width);
  };

  const sheenW = Math.max(56, lineW * 0.5);

  const sheenStyle = useAnimatedStyle(() => {
    const w = lineW > 0 ? lineW : 1;
    const sw = sheenW;
    const from = -sw;
    const to = w;
    return {
      width: sw,
      transform: [
        {
          translateX: interpolate(sweep.value, [0, 1], [from, to]),
        },
      ],
    };
  }, [lineW, sheenW]);

  return (
    <View style={styles.shadowWrap} pointerEvents="none">
      {reduced ? null : <SoftBloom glow={glow} />}
      <View style={styles.lineTrack} onLayout={onLineLayout}>
        <LinearGradient
          colors={BASE_STOPS}
          locations={BASE_LOCATIONS}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
        {reduced ? null : (
          <Animated.View style={[styles.sheenBase, sheenStyle]}>
            <LinearGradient
              colors={SHEEN_STOPS}
              locations={[0, 0.2, 0.5, 0.8, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.sheenGradient}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function SoftBloom({ glow }: { glow: SharedValue<number> }) {
  const a = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.2, 0.48]),
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          zIndex: 0,
          top: -4,
          left: 0,
          right: 0,
          height: 8,
        },
        a,
      ]}
    >
      <LinearGradient
        colors={[
          "rgba(34,211,238,0)",
          "rgba(100,250,255,0.08)",
          "rgba(100,250,255,0.22)",
          "rgba(100,250,255,0.08)",
          "rgba(34,211,238,0)",
        ]}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    alignSelf: "stretch",
    width: "100%",
    height: 2,
    /** ロゴ直下（Web Header gap-0.5 相当） */
    marginTop: 2,
    borderRadius: 0,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(34,211,238,0.55)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  lineTrack: {
    zIndex: 1,
    width: "100%",
    height: 2,
    borderRadius: 0,
    overflow: "hidden",
  },
  sheenBase: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 4,
    marginTop: -1,
  },
  sheenGradient: {
    width: "100%",
    height: "100%",
  },
});
