/**
 * GL 成功時の HUD 通過レイヤ。
 * 疑似ワールド transform は使わず、オーバーレイの通過だけ行う。
 */
import { useEffect, useRef, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  TUTORIAL_WELCOME_FLY_MS,
  TUTORIAL_WELCOME_LAND_HOLD_MS,
  TUTORIAL_WELCOME_MODAL_PASS_SCALE,
  TUTORIAL_WELCOME_PASS_FADE_AT,
} from "../../../../../lib/tutorial/tutorialMotion";

type Props = {
  flying: boolean;
  overlay: ReactNode;
  onFlyComplete?: () => void;
};

const FLY_EASE = Easing.bezier(0.42, 0, 0.18, 1);

export default function AuthLandingHudPassNative({
  flying,
  overlay,
  onFlyComplete,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const p = useSharedValue(flying ? 1 : 0);
  const onFlyCompleteRef = useRef(onFlyComplete);
  onFlyCompleteRef.current = onFlyComplete;
  const didNotifyRef = useRef(false);
  const landTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLandTimer = () => {
    if (landTimerRef.current) {
      clearTimeout(landTimerRef.current);
      landTimerRef.current = null;
    }
  };

  const finishFly = () => {
    if (didNotifyRef.current) return;
    didNotifyRef.current = true;
    clearLandTimer();
    landTimerRef.current = setTimeout(() => {
      onFlyCompleteRef.current?.();
    }, TUTORIAL_WELCOME_LAND_HOLD_MS);
  };

  useEffect(() => () => clearLandTimer(), []);

  useEffect(() => {
    cancelAnimation(p);
    if (!flying) didNotifyRef.current = false;
    if (reduceMotion) {
      p.value = flying ? 1 : 0;
      if (flying) finishFly();
      return;
    }
    if (flying) {
      p.value = withTiming(
        1,
        { duration: TUTORIAL_WELCOME_FLY_MS, easing: FLY_EASE },
        (done) => {
          if (done) runOnJS(finishFly)();
        }
      );
      return;
    }
    p.value = withTiming(0, {
      duration: TUTORIAL_WELCOME_FLY_MS,
      easing: FLY_EASE,
    });
  }, [flying, p, reduceMotion]);

  const modalStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      p.value,
      [0, TUTORIAL_WELCOME_PASS_FADE_AT, 1],
      [1, 1, 0]
    ),
    transform: [
      {
        scale: interpolate(p.value, [0, 1], [1, TUTORIAL_WELCOME_MODAL_PASS_SCALE]),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={flying ? "none" : "box-none"}
      style={[
        styles.slot,
        reduceMotion ? (flying ? styles.hidden : null) : modalStyle,
      ]}
    >
      <View style={styles.fill} pointerEvents="box-none">
        {overlay}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  fill: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
});
