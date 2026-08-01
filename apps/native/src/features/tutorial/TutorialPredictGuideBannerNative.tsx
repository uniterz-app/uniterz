/**
 * Web `TutorialPredictGuideBanner` 相当
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
  title: string;
  body: string;
  ctaHint?: string;
};

export default function TutorialPredictGuideBannerNative({
  title,
  body,
  ctaHint,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const hintOp = useSharedValue(1);
  const markOp = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    hintOp.value = withRepeat(
      withSequence(
        withTiming(0.55, {
          duration: TUTORIAL_PULSE_PERIOD_MS / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: TUTORIAL_PULSE_PERIOD_MS / 2,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
    markOp.value = withRepeat(
      withSequence(
        withTiming(0.4, {
          duration: TUTORIAL_PULSE_PERIOD_MS / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: TUTORIAL_PULSE_PERIOD_MS / 2,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, [reduceMotion, hintOp, markOp]);

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOp.value,
  }));

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOp.value,
  }));

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text style={styles.kicker}>Tutorial</Text>
        <Animated.View style={[styles.mark, markStyle]} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {ctaHint ? (
        <Animated.Text style={[styles.cta, hintStyle]}>{ctaHint}</Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(0,245,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  kicker: {
    fontFamily: fonts.metricExtra,
    fontSize: 9,
    letterSpacing: 2,
    color: TUTORIAL_CYAN,
    textTransform: "uppercase",
  },
  mark: {
    width: 8,
    height: 8,
    backgroundColor: TUTORIAL_CYAN,
    transform: [{ rotate: "45deg" }],
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  body: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    lineHeight: 18,
  },
  cta: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    letterSpacing: 1.2,
    color: TUTORIAL_CYAN,
    textTransform: "uppercase",
  },
});
