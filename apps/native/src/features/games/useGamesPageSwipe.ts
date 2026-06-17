import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";

type Opts = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
};

/** Web `usePageSwipe` 相当（横スワイプで日付変更） */
export function useGamesPageSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 24,
  enabled = true,
}: Opts) {
  return useMemo(() => {
    if (!enabled) return Gesture.Pan().enabled(false);
    return Gesture.Pan()
      .activeOffsetX([-threshold, threshold])
      .failOffsetY([-20, 20])
      .onEnd((e) => {
        if (e.translationX <= -threshold) onSwipeLeft?.();
        else if (e.translationX >= threshold) onSwipeRight?.();
      });
  }, [enabled, onSwipeLeft, onSwipeRight, threshold]);
}
