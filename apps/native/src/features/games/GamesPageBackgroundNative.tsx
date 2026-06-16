import { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  Line,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import {
  GAMES_PAGE_BG_BOTTOM,
  GAMES_PAGE_BG_MID,
  GAMES_PAGE_BG_TOP,
} from "./gamesPageBackgroundTokens";
import RisingMotesLayerNative from "./RisingMotesLayerNative";

const AnimatedView = Animated.createAnimatedComponent(View);

/** Web `GamesPageBackground` / モバイル `AppPageBackground` 相当 */
export default function GamesPageBackgroundNative() {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion() ?? false;
  const fieldDrift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    fieldDrift.value = withRepeat(
      withTiming(32, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, [fieldDrift, reduceMotion]);

  const fieldStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fieldDrift.value }],
  }));

  return (
    <View pointerEvents="none" style={styles.root}>
      <LinearGradient
        colors={[GAMES_PAGE_BG_TOP, GAMES_PAGE_BG_MID, GAMES_PAGE_BG_BOTTOM]}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="auroraA" cx="14%" cy="4%" rx="68%" ry="50%">
            <Stop offset="0%" stopColor="rgba(52,211,153,0.27)" />
            <Stop offset="66%" stopColor="rgba(52,211,153,0)" />
          </RadialGradient>
          <RadialGradient id="auroraB" cx="88%" cy="18%" rx="58%" ry="46%">
            <Stop offset="0%" stopColor="rgba(132,204,22,0.17)" />
            <Stop offset="68%" stopColor="rgba(132,204,22,0)" />
          </RadialGradient>
          <RadialGradient id="auroraC" cx="50%" cy="108%" rx="80%" ry="44%">
            <Stop offset="0%" stopColor="rgba(45,212,191,0.2)" />
            <Stop offset="70%" stopColor="rgba(45,212,191,0)" />
          </RadialGradient>
          <Pattern
            id="dotField"
            width={18}
            height={18}
            patternUnits="userSpaceOnUse"
          >
            <Rect width={18} height={18} fill="transparent" />
            <Rect x={8.45} y={8.45} width={1.1} height={1.1} rx={0.55} fill="rgba(134,210,180,0.18)" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#auroraA)" opacity={0.55} />
        <Rect width="100%" height="100%" fill="url(#auroraB)" opacity={0.55} />
        <Rect width="100%" height="100%" fill="url(#auroraC)" opacity={0.55} />
        <Rect width="100%" height="100%" fill="url(#dotField)" opacity={0.55} />
      </Svg>

      <AnimatedView
        style={[
          styles.fieldGridWrap,
          { width: width * 1.24, height: height * 1.24, left: -width * 0.12, top: -height * 0.12 },
          reduceMotion ? null : fieldStyle,
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="fieldGrid" width={64} height={64} patternUnits="userSpaceOnUse">
              <Line x1={0} y1={0} x2={0} y2={64} stroke="rgba(100,150,130,0.11)" strokeWidth={1} />
              <Line x1={0} y1={0} x2={64} y2={0} stroke="rgba(100,150,130,0.08)" strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#fieldGrid)" opacity={0.22} />
        </Svg>
      </AnimatedView>

      <LinearGradient
        pointerEvents="none"
        colors={["rgba(187,247,208,0.06)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
        style={styles.topHighlight}
      />

      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="vignette" cx="50%" cy="44%" rx="95%" ry="88%">
            <Stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <Stop offset="68%" stopColor="rgba(0,0,0,0.22)" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0.48)" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#vignette)" />
      </Svg>

      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,0,0,0.28)", "transparent", "transparent", "rgba(0,0,0,0.38)"]}
        locations={[0, 0.24, 0.72, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <RisingMotesLayerNative lite />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: "hidden",
  },
  fieldGridWrap: {
    position: "absolute",
    opacity: 1,
  },
  topHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "55%",
  },
});
