/**
 * Web `TutorialWelcomeWorldCamera` 相当 —
 * 試合ページ（遠）と welcome（近）を同じ progress で動かす。
 *
 * Native に translateZ はない。奥行きは
 * perspective + scale(0.8) + rotateX(6deg) で Web の Z -520 を近似する。
 * transform は worldCage の中だけに閉じ、CTA はケージの外に置く。
 *
 * 注意: 暗幕に BlurView を載せない。
 * 親タブ scene の RN Animated（translateX）と重なると iOS で真っ黒になる。
 */
import { useEffect, useRef, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  TUTORIAL_WELCOME_MODAL_PASS_SCALE,
  TUTORIAL_WELCOME_PASS_FADE_AT,
  TUTORIAL_WELCOME_WORLD_REST_RX_DEG,
  TUTORIAL_WELCOME_WORLD_REST_SCALE,
} from "../../../../../lib/tutorial/tutorialMotion";

type Props = {
  active: boolean;
  flying: boolean;
  overlay?: ReactNode;
  onFlyComplete?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const FLY_EASE = Easing.bezier(0.42, 0, 0.18, 1);

export default function TutorialWelcomeWorldCameraNative({
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

  const finishFly = () => {
    onFlyCompleteRef.current?.();
  };

  useEffect(() => {
    cancelAnimation(p);
    if (reduceMotion) {
      p.value = flying || !active ? 1 : 0;
      return;
    }
    if (flying) {
      /** 通常時（welcome 外）の flying=true では着地コールバックを呼ばない */
      const shouldNotifyFlyComplete = Boolean(onFlyCompleteRef.current);
      p.value = withTiming(
        1,
        { duration: TUTORIAL_WELCOME_FLY_MS, easing: FLY_EASE },
        (done) => {
          if (done && shouldNotifyFlyComplete) runOnJS(finishFly)();
        }
      );
      return;
    }
    /**
     * 遠景へはスナップ。プロフィールタブは裏で p=1 のまま居ることがあり、
     * withTiming(0) すると一旦ズームアウトしてから前進して崩れる。
     */
    p.value = active ? 0 : 1;
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
    opacity: interpolate(p.value, [0, 0.38], [1, 0]),
  }));

  const hud = overlay ? (
    <>
      <Animated.View
        pointerEvents={flying ? "none" : "auto"}
        style={[styles.scrimSlot, reduceMotion ? null : scrimStyle]}
      >
        {/**
         * BlurView 禁止（タブ scene の Animated と合成すると iOS 黒画面）。
         * グラデ＋ベタで DOF 相当の暗さを出す。
         */}
        <View pointerEvents="none" style={styles.dofFill} />
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(2, 6, 12, 0.42)",
            "rgba(2, 6, 12, 0.58)",
            "rgba(2, 6, 12, 0.72)",
          ]}
          locations={[0, 0.38, 1]}
          style={styles.scrim}
        />
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
  /**
   * transform された試合面をこのケージ内に閉じる。
   * CTA はケージの兄弟なので、カードの GPU レイヤーが前面に抜けない。
   */
  worldCage: {
    flex: 1,
    overflow: "hidden",
    zIndex: 0,
  },
  world: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  dofFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 12, 0.55)",
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
