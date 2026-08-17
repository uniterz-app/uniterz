/**
 * 認証 Landing → フォームの 3D プッシュイン。
 * チュートリアル World Camera と同じ progress 1本。
 * 戻りはスナップせず逆飛行する。
 */
import { useEffect, useRef, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
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
  TUTORIAL_WELCOME_SCRIM_CLEAR_AT,
  TUTORIAL_WELCOME_WORLD_REST_RX_DEG,
  TUTORIAL_WELCOME_WORLD_REST_SCALE,
} from "../../../../../lib/tutorial/tutorialMotion";
import { AUTH_LANDING } from "./authLandingPalette";

type Props = {
  active: boolean;
  flying: boolean;
  overlay?: ReactNode;
  onFlyComplete?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const FLY_EASE = Easing.bezier(0.42, 0, 0.18, 1);

export default function AuthLandingWorldCameraNative({
  active,
  flying,
  overlay,
  onFlyComplete,
  children,
  style,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const p = useSharedValue(active && !flying ? 0 : 1);
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

  useEffect(() => {
    return () => clearLandTimer();
  }, []);

  useEffect(() => {
    cancelAnimation(p);
    if (!flying) didNotifyRef.current = false;
    if (reduceMotion) {
      p.value = flying || !active ? 1 : 0;
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
    p.value = withTiming(active ? 0 : 1, {
      duration: TUTORIAL_WELCOME_FLY_MS,
      easing: FLY_EASE,
    });
  }, [active, flying, p, reduceMotion]);

  const worldStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      {
        rotateX: `${interpolate(
          p.value,
          [0, 1],
          [TUTORIAL_WELCOME_WORLD_REST_RX_DEG, 0]
        )}deg`,
      },
      {
        scale: interpolate(
          p.value,
          [0, 1],
          [TUTORIAL_WELCOME_WORLD_REST_SCALE, 1]
        ),
      },
    ],
  }));

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

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      p.value,
      [0, TUTORIAL_WELCOME_SCRIM_CLEAR_AT],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const hud = overlay ? (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.scrimSlot, reduceMotion ? null : scrimStyle]}
      >
        <View pointerEvents="none" style={styles.scrimFill} />
      </Animated.View>
      <Animated.View
        pointerEvents={flying ? "none" : "box-none"}
        style={[styles.modalSlot, reduceMotion ? null : modalStyle]}
      >
        {overlay}
      </Animated.View>
    </>
  ) : null;

  return (
    <View style={[styles.root, style]}>
      <View
        pointerEvents={active && overlay && !flying ? "none" : "auto"}
        style={styles.worldCage}
      >
        <Animated.View style={[styles.world, reduceMotion ? null : worldStyle]}>
          {children}
        </Animated.View>
      </View>
      {active ? hud : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  worldCage: {
    flex: 1,
    overflow: "hidden",
    zIndex: 0,
  },
  world: {
    flex: 1,
  },
  scrimFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AUTH_LANDING.void,
  },
  scrimSlot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    elevation: 80,
  },
  modalSlot: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
    zIndex: 81,
    elevation: 81,
  },
});
