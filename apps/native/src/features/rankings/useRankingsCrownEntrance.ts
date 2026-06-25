import { useLayoutEffect } from "react";
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  RANKINGS_CROWN_DURATION_MS,
  RANKINGS_CROWN_FROM_SCALE,
  RANKINGS_CROWN_FROM_Y,
  rankingsCrownDelayMs,
  rankingsCrownEase,
} from "./rankingsMotion";

/** Web TopPodium 1位 Crown motion 相当 */
export function useRankingsCrownEntrance(
  enabled: boolean,
  pageKey: string,
  reduceMotion: boolean
) {
  const opacity = useSharedValue(reduceMotion || !enabled ? 1 : 0);
  const translateY = useSharedValue(reduceMotion || !enabled ? 0 : RANKINGS_CROWN_FROM_Y);
  const scale = useSharedValue(reduceMotion || !enabled ? 1 : RANKINGS_CROWN_FROM_SCALE);

  useLayoutEffect(() => {
    if (!enabled || reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      return;
    }

    opacity.value = 0;
    translateY.value = RANKINGS_CROWN_FROM_Y;
    scale.value = RANKINGS_CROWN_FROM_SCALE;
    const crownDelayMs = rankingsCrownDelayMs();
    opacity.value = withDelay(
      crownDelayMs,
      withTiming(1, {
        duration: RANKINGS_CROWN_DURATION_MS,
        easing: rankingsCrownEase,
      })
    );
    translateY.value = withDelay(
      crownDelayMs,
      withTiming(0, {
        duration: RANKINGS_CROWN_DURATION_MS,
        easing: rankingsCrownEase,
      })
    );
    scale.value = withDelay(
      crownDelayMs,
      withTiming(1, {
        duration: RANKINGS_CROWN_DURATION_MS,
        easing: rankingsCrownEase,
      })
    );

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      cancelAnimation(scale);
    };
  }, [enabled, pageKey, reduceMotion, opacity, translateY, scale]);

  const crownStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return { crownStyle };
}
