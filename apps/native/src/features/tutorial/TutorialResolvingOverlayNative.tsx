/**
 * Web `TutorialResolvingOverlay` 相当 — 試合終了シミュレーション中
 */
import { useEffect } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../../theme/tokens";
import {
  TUTORIAL_CYAN,
  TUTORIAL_PULSE_PERIOD_MS,
} from "../../../../../lib/tutorial/tutorialMotion";

type Props = {
  open: boolean;
  title: string;
  body: string;
  spinLabel: string;
};

export default function TutorialResolvingOverlayNative({
  open,
  title,
  body,
  spinLabel,
}: Props) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion() ?? false;
  const cardOp = useSharedValue(reduceMotion ? 1 : 0);
  const cardScale = useSharedValue(reduceMotion ? 1 : 0.96);
  /** 0→1 で opacity 0.45↔1 に写像 */
  const spinPulse = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!open) {
      cardOp.value = reduceMotion ? 1 : 0;
      cardScale.value = reduceMotion ? 1 : 0.96;
      spinPulse.value = reduceMotion ? 1 : 0;
      return;
    }
    if (reduceMotion) {
      cardOp.value = 1;
      cardScale.value = 1;
      spinPulse.value = 1;
      return;
    }
    cardOp.value = 0;
    cardScale.value = 0.96;
    cardOp.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    cardScale.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    spinPulse.value = 0;
    spinPulse.value = withRepeat(
      withTiming(1, {
        duration: TUTORIAL_PULSE_PERIOD_MS,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [open, reduceMotion, cardOp, cardScale, spinPulse]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOp.value,
    transform: [{ scale: cardScale.value }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + spinPulse.value * 0.55,
  }));

  if (!open) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View
        style={[
          styles.root,
          {
            paddingTop: Math.max(24, insets.top),
            paddingBottom: Math.max(24, insets.bottom),
          },
        ]}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          <Animated.Text style={[styles.spin, spinStyle]}>
            {spinLabel}
          </Animated.Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.27)",
    backgroundColor: "rgba(7,16,24,0.96)",
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: "center",
  },
  spin: {
    fontFamily: fonts.metricExtra,
    fontSize: 13,
    letterSpacing: 3.5,
    color: TUTORIAL_CYAN,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
