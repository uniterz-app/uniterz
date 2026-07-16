import { useMemo, useRef } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

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
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  onSwipeLeftRef.current = onSwipeLeft;
  onSwipeRightRef.current = onSwipeRight;

  const triggerSwipeLeft = useMemo(
    () => () => {
      onSwipeLeftRef.current?.();
    },
    []
  );
  const triggerSwipeRight = useMemo(
    () => () => {
      onSwipeRightRef.current?.();
    },
    []
  );

  return useMemo(() => {
    if (!enabled) return Gesture.Pan().enabled(false);
    return Gesture.Pan()
      .activeOffsetX([-threshold, threshold])
      .failOffsetY([-20, 20])
      .onEnd((e) => {
        "worklet";
        if (e.translationX <= -threshold) {
          runOnJS(triggerSwipeLeft)();
        } else if (e.translationX >= threshold) {
          runOnJS(triggerSwipeRight)();
        }
      });
  }, [enabled, threshold, triggerSwipeLeft, triggerSwipeRight]);
}
