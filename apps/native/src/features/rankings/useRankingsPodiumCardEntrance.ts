import { useLayoutEffect, useRef } from "react";
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { rankingsEntranceShouldPlay } from "../../../../../lib/rankings/rankingsEntranceOnce";
import {
  RANKINGS_PODIUM_CARD_DURATION_MS,
  RANKINGS_PODIUM_CARD_FROM_Y,
  rankingsPodiumCardDelayMs,
  rankingsPodiumEase,
} from "./rankingsMotion";

/**
 * Web `TopPodium` cardVariants 相当。
 * `active` が false のあいだは隠したまま待ち、true になった時点で入場するか決める。
 */
export function useRankingsPodiumCardEntrance(
  stepIndex: number,
  pageKey: string,
  reduceMotion: boolean,
  active = true
) {
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : RANKINGS_PODIUM_CARD_FROM_Y);
  /** pageKey ごとの判断。play=false になったら以後は流さない */
  const decisionRef = useRef<{ key: string; play: boolean } | null>(null);

  useLayoutEffect(() => {
    if (decisionRef.current?.key !== pageKey) decisionRef.current = null;
    if (!active) {
      if (decisionRef.current == null && !reduceMotion) {
        opacity.value = 0;
        translateY.value = RANKINGS_PODIUM_CARD_FROM_Y;
      }
      return;
    }
    if (decisionRef.current == null) {
      decisionRef.current = {
        key: pageKey,
        play: !reduceMotion && rankingsEntranceShouldPlay(pageKey),
      };
    }
    if (!decisionRef.current.play) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    decisionRef.current.play = false;

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
      opacity.value = 1;
      translateY.value = 0;
    };
  }, [active, stepIndex, pageKey, reduceMotion, opacity, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { cardStyle };
}
