import { useLayoutEffect } from "react";
import { Platform } from "react-native";
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { podiumEntranceStepForRank } from "../../../../../lib/rankings/podiumEntrance";
import {
  RANKINGS_PODIUM_CARD_DURATION_MS,
  rankingsPodiumCardDelayMs,
} from "./rankingsMotion";

/** 1位入場後にカード外周を軽く光らせる */
export function useRankingsPodiumFirstGlow(
  enabled: boolean,
  pageKey: string,
  reduceMotion: boolean
) {
  const glow = useSharedValue(reduceMotion || !enabled ? 0.5 : 0);

  useLayoutEffect(() => {
    if (!enabled || reduceMotion) {
      glow.value = enabled ? 0.5 : 0;
      return;
    }

    const delayMs =
      rankingsPodiumCardDelayMs(podiumEntranceStepForRank(1)) +
      Math.round(RANKINGS_PODIUM_CARD_DURATION_MS * 0.35);

    glow.value = 0;
    glow.value = withDelay(
      delayMs,
      withSequence(
        withTiming(1, { duration: 260 }),
        withTiming(0.52, { duration: 480 })
      )
    );

    return () => {
      cancelAnimation(glow);
    };
  }, [enabled, pageKey, reduceMotion, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: "#B8FF3C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glow.value * 0.62,
    shadowRadius: 16 + glow.value * 10,
    ...(Platform.OS === "android"
      ? { elevation: Math.round(glow.value * 10) }
      : null),
  }));

  return { glowStyle };
}
