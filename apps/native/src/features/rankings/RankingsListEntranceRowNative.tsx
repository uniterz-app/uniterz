import { type ReactNode, useEffect } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type Props = {
  index: number;
  entranceKey: string | number;
  children: ReactNode;
  staggerMs?: number;
  durationMs?: number;
};

/** ランキング行：上方向からフェードイン（Web TopPodium / restItem に近い） */
export default function RankingsListEntranceRowNative({
  index,
  entranceKey,
  children,
  staggerMs = 130,
  durationMs = 540,
}: Props) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : 0);
  const translateY = useSharedValue(reduced ? 0 : -10);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      opacity.value = 0;
      translateY.value = -10;
      const delay = index * staggerMs;
      opacity.value = withDelay(delay, withTiming(1, { duration: durationMs }));
      translateY.value = withDelay(delay, withTiming(0, { duration: durationMs }));
    });

    return () => {
      cancelled = true;
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, [durationMs, entranceKey, index, reduced, staggerMs]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
