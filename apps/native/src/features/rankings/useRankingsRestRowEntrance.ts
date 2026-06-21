import { useLayoutEffect } from "react";
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  RANKINGS_REST_CONTAINER_DIM_OPACITY,
  RANKINGS_REST_ROW_DURATION_MS,
  RANKINGS_REST_ROW_FROM_Y,
  rankingsRestEase,
  rankingsRestRowDelayMs,
} from "./rankingsMotion";

/** Web `anim.ts` restContainer 相当 */
export function useRankingsRestContainerEntrance(
  pageKey: string,
  topDone: boolean,
  reduceMotion: boolean
) {
  const opacity = useSharedValue(
    reduceMotion || topDone ? 1 : RANKINGS_REST_CONTAINER_DIM_OPACITY
  );

  useLayoutEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      return;
    }

    if (!topDone) {
      opacity.value = RANKINGS_REST_CONTAINER_DIM_OPACITY;
      return;
    }

    opacity.value = withTiming(1, {
      duration: RANKINGS_REST_ROW_DURATION_MS,
      easing: rankingsRestEase,
    });

    return () => cancelAnimation(opacity);
  }, [pageKey, topDone, reduceMotion, opacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { containerStyle };
}

/** Web `anim.ts` restItem 相当 */
export function useRankingsRestRowEntrance(
  rowIndex: number,
  pageKey: string,
  topDone: boolean,
  reduceMotion: boolean
) {
  const opacity = useSharedValue(reduceMotion || topDone ? 1 : 0);
  const translateY = useSharedValue(reduceMotion || topDone ? 0 : RANKINGS_REST_ROW_FROM_Y);

  useLayoutEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    if (!topDone) {
      opacity.value = 0;
      translateY.value = RANKINGS_REST_ROW_FROM_Y;
      return;
    }

    const delayMs = rankingsRestRowDelayMs(rowIndex);
    opacity.value = 0;
    translateY.value = RANKINGS_REST_ROW_FROM_Y;
    opacity.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: RANKINGS_REST_ROW_DURATION_MS,
        easing: rankingsRestEase,
      })
    );
    translateY.value = withDelay(
      delayMs,
      withTiming(0, {
        duration: RANKINGS_REST_ROW_DURATION_MS,
        easing: rankingsRestEase,
      })
    );

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, [rowIndex, pageKey, topDone, reduceMotion, opacity, translateY]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { rowStyle };
}
