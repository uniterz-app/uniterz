/**
 * 案 P — Black Chrome
 * 金属面に一本の光が走り、反射でロゴが見える。
 */
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import {
  UNITERZ_U_MARK_PATHS,
  UNITERZ_U_MARK_VIEWBOX,
} from "../../../../../../lib/units/uniterzUMark";
import { useVoidCoronaSplashClock } from "./useVoidCoronaSplashClock";

const CONCEPT = getVoidCoronaConcept("P");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashPNative({
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

  const plateStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.08, 0.22], [0, 1], "clamp"),
    };
  });

  const markStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.38, 0.55, 0.78, 0.9], [0, 1, 1, 1], "clamp"),
    };
  });

  const streakStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ translateX: 0 }] };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.32, 0.42, 0.58, 0.7],
        [0, 1, 0.7, 0],
        "clamp"
      ),
      transform: [
        {
          translateX: interpolate(
            t,
            [0.32, 0.7],
            [-markSize * 0.9, markSize * 0.9],
            "clamp"
          ),
        },
        { rotate: "-22deg" as const },
      ],
    };
  });

  const gid = "black-chrome-u";

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <Animated.View style={[styles.plate, plateStyle]} />
      <View style={styles.center}>
        <View style={{ width: markSize, height: markSize, overflow: "hidden" }}>
          <Animated.View style={[StyleSheet.absoluteFill, markStyle]}>
            <Svg
              width={markSize}
              height={markSize}
              viewBox={`0 0 ${UNITERZ_U_MARK_VIEWBOX} ${UNITERZ_U_MARK_VIEWBOX}`}
            >
              <Defs>
                <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#1A1A1E" />
                  <Stop offset="0.35" stopColor="#8A8A92" />
                  <Stop offset="0.5" stopColor="#F0F0F4" />
                  <Stop offset="0.68" stopColor="#3A3A42" />
                  <Stop offset="1" stopColor="#0C0C10" />
                </LinearGradient>
              </Defs>
              <G fill={`url(#${gid})`}>
                {UNITERZ_U_MARK_PATHS.map((d, i) => (
                  <Path key={i} d={d} />
                ))}
              </G>
            </Svg>
          </Animated.View>
          <Animated.View
            style={[styles.streakWrap, streakStyle]}
            pointerEvents="none"
          >
            <View style={styles.streak} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050506" },
  plate: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0A0A0C",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  streakWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  streak: {
    width: 18,
    height: "140%",
    backgroundColor: "rgba(255,255,255,0.65)",
  },
});
