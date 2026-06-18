import { useEffect, useRef, useState } from "react";
import {
  Easing,
  FadeIn,
  FadeInDown,
  Keyframe,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  GAMES_CYBER_EASE,
  GAMES_DAY_SWITCH_EASE,
  GAMES_LIST_AFTER_DAY_STRIP_MS,
  GAMES_SCHEDULE_SHELL_DURATION_MS,
} from "./gamesCyberMotion";

export const gamesCyberEaseBezier = Easing.bezier(
  GAMES_CYBER_EASE[0],
  GAMES_CYBER_EASE[1],
  GAMES_CYBER_EASE[2],
  GAMES_CYBER_EASE[3]
);

export const gamesDaySwitchEaseBezier = Easing.bezier(
  GAMES_DAY_SWITCH_EASE[0],
  GAMES_DAY_SWITCH_EASE[1],
  GAMES_DAY_SWITCH_EASE[2],
  GAMES_DAY_SWITCH_EASE[3]
);

export const gamesCyberEaseSnapBezier = Easing.bezier(0.32, 0, 0.18, 1);

/** Web `topBarEntry` / `entryGroupProps` のロックオン明滅 */
export function runLockOnOpacity(delayMs: number, durationMs = 400) {
  "worklet";
  return withDelay(
    delayMs,
    withSequence(
      withTiming(1, { duration: durationMs * 0.5, easing: Easing.linear }),
      withTiming(0.45, { duration: durationMs * 0.16, easing: Easing.linear }),
      withTiming(1, { duration: durationMs * 0.34, easing: Easing.linear })
    )
  );
}

function lockOnSlideKeyframe(
  delayMs: number,
  fromX: number,
  fromY: number,
  yDurationMs = 300,
  opacityDurationMs = 400,
  flickerMid = 0.5
) {
  const yMid = Math.round((yDurationMs / (yDurationMs + opacityDurationMs)) * 100);
  return new Keyframe({
    0: {
      opacity: 0,
      transform: [{ translateX: fromX }, { translateY: fromY }],
    },
    [Math.min(50, yMid)]: {
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }],
    },
    66: { opacity: flickerMid },
    100: {
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }],
    },
  })
    .duration(Math.max(yDurationMs, opacityDurationMs))
    .delay(delayMs);
}

/** Web `GamesPage` topBarEntry(0, -10) */
export const gamesTopBarMenuEntering = lockOnSlideKeyframe(0, -10, 0);

/** Web `GamesPage` topBarEntry(0.18, 14) */
export const gamesTopBarFilterEntering = lockOnSlideKeyframe(180, 14, 0);

/** Web `GamesPage` topBarEntry(0.27, 18) */
export const gamesTopBarBracketEntering = lockOnSlideKeyframe(270, 18, 0);

/** Web `GamesPage` renderLeagueTitle（letterSpacing は scaleX で近似） */
export const gamesLeagueTitleEntering = new Keyframe({
  0: { opacity: 0, transform: [{ scaleX: 1.18 }] },
  50: { opacity: 1, transform: [{ scaleX: 1.02 }] },
  66: { opacity: 0.55 },
  100: { opacity: 1, transform: [{ scaleX: 1 }] },
})
  .duration(460)
  .delay(90);

/** Web `GamesPage` monthHeaderMotion */
export const gamesMonthHeaderEntering = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -10 }] },
  50: { opacity: 1, transform: [{ translateY: 0 }] },
  66: { opacity: 0.5 },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
})
  .duration(440)
  .delay(380);

/** Web 日付ストリップラッパー motion.div */
export const gamesDayStripWrapperEntering = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: -12 }] },
  50: { opacity: 1, transform: [{ translateX: 0 }] },
  66: { opacity: 0.55 },
  100: { opacity: 1, transform: [{ translateX: 0 }] },
})
  .duration(400)
  .delay(240);

/** Web 一覧ラッパー（rich / page 初回） */
export function gamesScheduleShellPageEntering() {
  return FadeInDown.duration(GAMES_SCHEDULE_SHELL_DURATION_MS)
    .delay(GAMES_LIST_AFTER_DAY_STRIP_MS)
    .easing(gamesCyberEaseBezier)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: 10 }],
    });
}

/** Web 一覧ラッパー（daySwitch） */
export function gamesScheduleShellDaySwitchEntering() {
  return FadeIn.duration(460)
    .delay(60)
    .easing(gamesDaySwitchEaseBezier)
    .withInitialValues({ opacity: 0 });
}

export type GamesListShellIntro = "page" | "daySwitch";

type UseGamesListShellIntroParams = {
  reduceMotion: boolean;
  league: string;
  selectedDayKey: string;
  filterKey: string;
  isLoading: boolean;
};

/**
 * Web `GamesPage` の `playRichScheduleIntro` + `listShellIntroLocked` 相当。
 * scheduleBlockKey 変更フレームで intro モードを同期的に確定する。
 */
export function useGamesListShellIntro({
  reduceMotion,
  league,
  selectedDayKey,
  filterKey,
  isLoading,
}: UseGamesListShellIntroParams) {
  const [playRichScheduleIntro, setPlayRichScheduleIntro] = useState(true);
  const lastScheduleDayKeyRef = useRef<string | null>(null);

  const scheduleBlockKey = `${league}|${selectedDayKey}|${filterKey}`;
  const prevScheduleBlockKeyRef = useRef<string | null>(null);
  const lockedIntroRef = useRef<GamesListShellIntro>(
    reduceMotion ? "daySwitch" : "page"
  );

  if (prevScheduleBlockKeyRef.current !== scheduleBlockKey) {
    const prev = prevScheduleBlockKeyRef.current;
    prevScheduleBlockKeyRef.current = scheduleBlockKey;

    const splitKey = (k: string) => k.split("|");
    const prevLeague = prev == null ? null : splitKey(prev)[0];
    const nextLeague = splitKey(scheduleBlockKey)[0];
    const prevDay = prev == null ? null : splitKey(prev)[1] ?? "";
    const nextDay = splitKey(scheduleBlockKey)[1] ?? "";

    if (prev !== null && prevLeague !== nextLeague) {
      lockedIntroRef.current = reduceMotion ? "daySwitch" : "page";
    } else if (prev !== null && prevDay !== "" && prevDay !== nextDay) {
      lockedIntroRef.current = "daySwitch";
    } else {
      lockedIntroRef.current =
        playRichScheduleIntro && !reduceMotion ? "page" : "daySwitch";
    }
  }

  const listShellIntro = lockedIntroRef.current;
  const richScheduleMotion = playRichScheduleIntro && !reduceMotion;

  useEffect(() => {
    setPlayRichScheduleIntro(true);
    lastScheduleDayKeyRef.current = null;
  }, [league]);

  useEffect(() => {
    if (isLoading) {
      setPlayRichScheduleIntro(true);
    }
  }, [league, filterKey, isLoading]);

  useEffect(() => {
    if (!selectedDayKey || isLoading) return;
    const prev = lastScheduleDayKeyRef.current;
    lastScheduleDayKeyRef.current = selectedDayKey;
    if (prev !== null && prev !== selectedDayKey) {
      setPlayRichScheduleIntro(false);
    }
  }, [selectedDayKey, isLoading]);

  useEffect(() => {
    if (isLoading || !selectedDayKey || !playRichScheduleIntro) return;
    const id = setTimeout(() => setPlayRichScheduleIntro(false), 900);
    return () => clearTimeout(id);
  }, [isLoading, selectedDayKey, playRichScheduleIntro]);

  return {
    scheduleBlockKey,
    listShellIntro,
    richScheduleMotion,
    playRichScheduleIntro,
  };
}
