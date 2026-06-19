/**
 * 試合ライブ中の「LIVE」ピル。赤く発光するパルス（reduce-motion 時は静止）。
 */
import { useEffect } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type LiveMarkPillProps = {
  pillStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

export function LiveMarkPill({ pillStyle, textStyle }: LiveMarkPillProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const glow = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(glow);
      glow.value = 0;
      return;
    }
    cancelAnimation(glow);
    glow.value = 0;
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 920, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 920, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(glow);
  }, [reduceMotion, glow]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = glow.value;
    return {
      transform: [{ scale: 1 + t * 0.035 }],
      shadowOpacity: interpolate(t, [0, 1], [0.32, 0.78]),
      shadowRadius: interpolate(t, [0, 1], [8, 22]),
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => ({
    textShadowRadius: interpolate(glow.value, [0, 1], [4, 14]),
  }));

  return (
    <Animated.View style={[pillStyle, animatedStyle]}>
      {/* Web の LIVE バッジにある左エッジと上辺ハイライトを RN レイヤーで近似 */}
      <View pointerEvents="none" style={s.leftEdge} />
      <View pointerEvents="none" style={s.topHighlight} />
      <Animated.Text style={[textStyle, animatedTextStyle]}>LIVE</Animated.Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  leftEdge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "rgba(254,202,202,0.62)",
  },
  topHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
});
