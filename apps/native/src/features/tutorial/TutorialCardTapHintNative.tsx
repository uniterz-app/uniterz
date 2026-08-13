/**
 * Web `TutorialPulseHint` 相当 — 試合カード上のタップ誘導（枠の淡いパルスのみ）
 */
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
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
  const pulse = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, {
        duration: TUTORIAL_PULSE_PERIOD_MS,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [reduceMotion, pulse]);

  /** shadow は毎フレーム更新しない（iOS で重い） */
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + pulse.value * 0.28,
  }));

  return (
    <View pointerEvents="none" style={styles.root} collapsable={false}>
      <Animated.View style={[styles.ring, ringStyle]} />
      {label ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /** MatchListCyberClip の elevation より手前・カード実寸に密着 */
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    elevation: 40,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: TUTORIAL_CYAN,
    borderRadius: 0,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 50,
    backgroundColor: TUTORIAL_CYAN,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    elevation: 50,
  },
  badgeText: {
    fontFamily: fonts.metricExtra,
    color: "#050508",
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
