/**
 * スプラッシュ共通: progress 時計 + マークサイズ。
 */
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import {
  Easing,
  runOnJS,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { voidCoronaUMarkSize } from "./VoidCoronaMarkNative";

export function useVoidCoronaSplashClock(
  totalMs: number,
  playKey: number,
  forceStatic: boolean,
  onComplete?: () => void
) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const voidD = Math.min(width, height) * 0.336;
  const { markSize } = voidCoronaUMarkSize(width, voidD * 1.2);
  const progress = useSharedValue(staticPose ? 1 : 0);

  useEffect(() => {
    if (staticPose) {
      progress.value = 1;
      onComplete?.();
      return;
    }
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: totalMs, easing: Easing.bezier(0.22, 0.04, 0.12, 1) },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }
    );
  }, [playKey, staticPose, progress, totalMs, onComplete]);

  return { width, height, markSize, progress, staticPose };
}
