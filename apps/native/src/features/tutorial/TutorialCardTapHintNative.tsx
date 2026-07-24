/**
 * Web `TutorialPulseHint` 相当 — 試合カード上のタップ誘導（パルス枠 + リップル）
 */
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { fonts } from "../../theme/tokens";
import {
  TUTORIAL_CYAN,
  TUTORIAL_PULSE_PERIOD_MS,
} from "../../../../../lib/tutorial/tutorialMotion";

type Props = {
  label?: string;
};

export default function TutorialCardTapHintNative({ label }: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const pulse = useSharedValue(0);
  const ripple = useSharedValue(0);
  const badgeY = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(
      withTiming(1, {
        duration: TUTORIAL_PULSE_PERIOD_MS,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    ripple.value = withRepeat(
      withTiming(1, {
        duration: TUTORIAL_PULSE_PERIOD_MS,
        easing: Easing.out(Easing.cubic),
      }),
      -1,
      false
    );
    // 上方向へ浮かせるとカード穴／リスト端で見切れるので下方向のみ
    badgeY.value = withRepeat(
      withSequence(
        withTiming(3, {
          duration: TUTORIAL_PULSE_PERIOD_MS / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: TUTORIAL_PULSE_PERIOD_MS / 2,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, [reduceMotion, pulse, ripple, badgeY]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
    shadowOpacity: 0.35 + pulse.value * 0.4,
    shadowRadius: 8 + pulse.value * 14,
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - ripple.value),
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: badgeY.value }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.ripple, rippleStyle]} />
      {label ? (
        <Animated.View style={[styles.badge, badgeStyle]}>
          <Text style={styles.badgeText}>{label}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: TUTORIAL_CYAN,
    borderRadius: 2,
    shadowColor: TUTORIAL_CYAN,
    shadowOffset: { width: 0, height: 0 },
  },
  ripple: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderWidth: 2,
    borderColor: TUTORIAL_CYAN,
    borderRadius: 2,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 20,
    backgroundColor: TUTORIAL_CYAN,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    // Web PulseHint の box-shadow 相当（穴内でも光が切れにくい）
    shadowColor: TUTORIAL_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 7,
    elevation: 4,
  },
  badgeText: {
    fontFamily: fonts.metricExtra,
    color: "#050508",
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
