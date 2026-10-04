/**
 * 試合ライブ中の「LIVE」ピル。赤く発光するパルス（reduce-motion 時は静止）。
 * タブ裏・App 非アクティブではループを止める（見た目は最終フレーム維持）。
 * `clock` を渡すとピル内に「LIVE｜Q2 9:40」と試合時間を並べる。
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
import { useScreenActiveNative } from "../../hooks/useScreenActiveNative";

type LiveMarkPillProps = {
  pillStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  clock?: string | null;
};

const LIVE_MATCH_MARK_GLOW_HALF_MS = 925;

export function LiveMarkPill({ pillStyle, textStyle, clock }: LiveMarkPillProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const screenActive = useScreenActiveNative();
  const glow = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || !screenActive) {
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
  }, [reduceMotion, screenActive, glow]);

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

  const clockText = clock?.trim() || null;

  return (
    <Animated.View
      style={[pillStyle, clockText ? styles.withClock : null, animatedStyle]}
    >
      <Animated.Text style={[textStyle, animatedTextStyle]}>LIVE</Animated.Text>
      {clockText ? (
        <>
          <View style={styles.divider} />
          <Animated.Text
            style={[textStyle, styles.clock, animatedTextStyle]}
            numberOfLines={1}
          >
            {clockText}
          </Animated.Text>
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  withClock: {
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    width: StyleSheet.hairlineWidth * 2,
    height: 9,
    marginHorizontal: 6,
    backgroundColor: "rgba(254,242,242,0.55)",
  },
  clock: {
    letterSpacing: 0.6,
    fontVariant: ["tabular-nums"],
  },
});
