/**
 * 全画面フラッシュ — 白〜薄青。真っ白にはしない。
 * ロゴより上に重ねるため RN Overlay で描画。
 */
import { StyleSheet } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { LIGHTNING_SPLASH } from "./lightningTiming";

type Props = {
  intensity: SharedValue<number>;
};

export default function LightningFlashNative({ intensity }: Props) {
  const style = useAnimatedStyle(() => ({
    opacity: intensity.value * 0.15,
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.flash, style]} />
  );
}

const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: LIGHTNING_SPLASH.flashTint,
  },
});
