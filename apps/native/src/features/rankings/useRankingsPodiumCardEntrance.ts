import { useLayoutEffect } from "react";
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  RANKINGS_PODIUM_CARD_DURATION_MS,
  RANKINGS_PODIUM_CARD_FROM_Y,
  rankingsPodiumCardDelayMs,
  rankingsPodiumEase,
} from "./rankingsMotion";

/** Web `TopPodium` cardVariants 相当 */
export function useRankingsPodiumCardEntrance(
  stepIndex: number,
  pageKey: string,
  reduceMotion: boolean
) {
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : RANKINGS_PODIUM_CARD_FROM_Y);

  useLayoutEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    const delayMs = rankingsPodiumCardDelayMs(stepIndex);
    opacity.value = 0;
    translateY.value = RANKINGS_PODIUM_CARD_FROM_Y;
    opacity.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: RANKINGS_PODIUM_CARD_DURATION_MS,
        easing: rankingsPodiumEase,
      })
    );
    translateY.value = withDelay(
      delayMs,
      withTiming(0, {
        duration: RANKINGS_PODIUM_CARD_DURATION_MS,
        easing: rankingsPodiumEase,
      })
    );

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, [stepIndex, pageKey, reduceMotion, opacity, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { cardStyle };
}
