/**
 * 試合ライブ中の「LIVE」ピル。赤く発光するパルス（reduce-motion 時は静止）。
 */
import { useEffect } from "react";
import { Text, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
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

const LIVE_MATCH_MARK_GLOW_HALF_MS = 925;

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
        withTiming(1, {
          duration: LIVE_MATCH_MARK_GLOW_HALF_MS,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: LIVE_MATCH_MARK_GLOW_HALF_MS,
          easing: Easing.inOut(Easing.ease),
        })
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
      shadowOpacity: interpolate(t, [0, 1], [0.42, 0.78]),
      shadowRadius: interpolate(t, [0, 1], [10, 22]),
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => ({
    textShadowRadius: interpolate(glow.value, [0, 1], [6, 14]),
  }));

  return (
    <Animated.View style={[pillStyle, animatedStyle]}>
      <Animated.Text style={[textStyle, animatedTextStyle]}>LIVE</Animated.Text>
    </Animated.View>
  );
}
