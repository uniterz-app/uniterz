/**
 * 試合ライブ中の「LIVE」ピル。軽いスケールパルスで視認性を上げる（アクセシビリティの reduce-motion 時は静止）。
 */
import { useEffect } from "react";
import { Text, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
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
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }
    cancelAnimation(scale);
    scale.value = 1;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.045, { duration: 720, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 720, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(scale);
  }, [reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[pillStyle, animatedStyle]}>
      <Text style={textStyle}>LIVE</Text>
    </Animated.View>
  );
}
