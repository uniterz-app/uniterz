/**
 * Unit 獲得 Phase B — 金貨チップが Vault へ流れる
 */
import { useEffect } from "react";
import { Modal, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { UNIT_EARN_CELEBRATE_MOTION_MS as M } from "../../../../../../lib/units/unitEarnCelebrate";
import { UnitEarnFlyChipNative } from "./UnitEarnCelebrateVisualNative";

export type UnitEarnFlyPayloadNative = {
  label: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

type Props = {
  fly: UnitEarnFlyPayloadNative | null;
  onComplete: () => void;
};

export default function UnitEarnVaultSettleFlyNative({
  fly,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!fly) return;
    if (reduceMotion) {
      onComplete();
      return;
    }
    x.value = fly.fromX;
    y.value = fly.fromY;
    scale.value = 1;
    opacity.value = 1;

    x.value = withTiming(fly.toX, {
      duration: M.flyDurationMs,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    y.value = withTiming(fly.toY, {
      duration: M.flyDurationMs,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    scale.value = withTiming(0.42, { duration: M.flyDurationMs });
    opacity.value = withTiming(0.88, { duration: M.flyDurationMs });

    const t = setTimeout(onComplete, M.flyDurationMs + 40);
    return () => clearTimeout(t);
  }, [fly, onComplete, reduceMotion, opacity, scale, x, y]);

  const style = useAnimatedStyle(() => ({
    position: "absolute",
    left: x.value,
    top: y.value,
    transform: [{ translateX: -60 }, { translateY: -18 }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!fly) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={styles.root} pointerEvents="none">
        <Animated.View style={style}>
          <UnitEarnFlyChipNative label={fly.label} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
