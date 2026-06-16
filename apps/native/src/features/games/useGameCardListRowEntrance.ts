import { useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  GAMES_CARD_LIST_STAGGER_CAP_MS,
  GAMES_CARD_LIST_STAGGER_MS,
  GAMES_CYBER_ENTRY_DURATION_MS,
  GAMES_CYBER_GROUP_GAP_MS,
  GAMES_DAY_SWITCH_ROW_FROM_Y,
  GAMES_DAY_SWITCH_ROW_OPACITY_MS,
  GAMES_DAY_SWITCH_ROW_STAGGER_CAP_MS,
  GAMES_DAY_SWITCH_ROW_STAGGER_MS,
  GAMES_DAY_SWITCH_ROW_TRANSLATE_MS,
  GAMES_LIST_CARDS_LEAD_IN_MS,
  GAMES_LIST_REST_CARDS_DELAY_MS,
  GAMES_PAGE_REST_CARD_DURATION_MS,
  GAMES_PAGE_REST_CARD_FROM_Y,
  PAGE_REST_CARD_STAGGER_MS,
} from "./gamesCyberMotion";
import {
  gamesCyberEaseBezier,
  gamesCyberEaseSnapBezier,
  gamesDaySwitchEaseBezier,
  runLockOnOpacity,
} from "./gamesPageMotion";

const ENTRY_GROUP_SHELL = 0;
const ENTRY_GROUP_HEADER = 1;
const ENTRY_GROUP_TEAMS = 2;
const ENTRY_GROUP_FOOTER = 3;

export type GameCardEntranceVariant = "full" | "light";

export type GameCardListRowEntranceParams = {
  rowIndex: number;
  enteringAnimationEnabled: boolean;
  reduceMotion: boolean;
  /** `light` = daySwitch、`full` = page */
  entranceVariant?: GameCardEntranceVariant;
  isPredicted: boolean;
  showPredictPrimaryGlow: boolean;
};

function groupDelayMs(rowIndex: number, group: number) {
  const listStagger = Math.min(
    rowIndex * GAMES_CARD_LIST_STAGGER_MS,
    GAMES_CARD_LIST_STAGGER_CAP_MS
  );
  return listStagger + GAMES_LIST_CARDS_LEAD_IN_MS + group * GAMES_CYBER_GROUP_GAP_MS;
}

function runGroupEnter(
  opacity: { value: number },
  translateY: { value: number },
  delayMs: number,
  dy: number
) {
  const yDur = GAMES_CYBER_ENTRY_DURATION_MS;
  const opDur = Math.round(GAMES_CYBER_ENTRY_DURATION_MS * 1.25);
  opacity.value = 0;
  translateY.value = dy;
  opacity.value = runLockOnOpacity(delayMs, opDur);
  translateY.value = withDelay(
    delayMs,
    withTiming(0, { duration: yDur, easing: gamesCyberEaseBezier })
  );
}

/**
 * Web `MatchCard` entryGroupProps + `ScheduleList.scheduleItem` に合わせた試合カード入場。
 * - page: 先頭3枚は4グループのロックオン、4枚目以降は遅延フェード
 * - daySwitch: 上から順にフェード＋わずかな下降
 */
export function useGameCardListRowEntrance({
  rowIndex,
  enteringAnimationEnabled,
  reduceMotion,
  entranceVariant = "full",
  isPredicted,
  showPredictPrimaryGlow,
}: GameCardListRowEntranceParams) {
  const isDaySwitch = entranceVariant === "light";
  const isPageRich = entranceVariant === "full" && rowIndex < 3;
  const isPageRest = entranceVariant === "full" && rowIndex >= 3;
  const skip = !enteringAnimationEnabled || reduceMotion;

  const shellOpacity = useSharedValue(1);
  const shellTranslateY = useSharedValue(0);

  const gridOpacity = useSharedValue(1);
  const borderReveal = useSharedValue(1);

  const headerOpacity = useSharedValue(1);
  const headerTranslateY = useSharedValue(0);

  const teamsOpacity = useSharedValue(1);
  const teamsTranslateY = useSharedValue(0);

  const homeJerseyTx = useSharedValue(0);
  const homeJerseyOpacity = useSharedValue(1);
  const homeJerseyScale = useSharedValue(1);

  const awayJerseyTx = useSharedValue(0);
  const awayJerseyOpacity = useSharedValue(1);
  const awayJerseyScale = useSharedValue(1);

  const centerOpacity = useSharedValue(1);
  const centerScale = useSharedValue(1);

  const dividerScaleX = useSharedValue(1);

  const footerOpacity = useSharedValue(1);
  const footerTranslateY = useSharedValue(0);
  const footerGlow = useSharedValue(showPredictPrimaryGlow ? 1 : 0);

  /** Web `MatchCard` 入場スキャン光（上→下） */
  const scanTranslateY = useSharedValue(0);
  const scanOpacity = useSharedValue(0);

  const pressed = useSharedValue(0);

  useEffect(() => {
    const resetAll = () => {
      shellOpacity.value = 1;
      shellTranslateY.value = 0;
      gridOpacity.value = 1;
      borderReveal.value = 1;
      headerOpacity.value = 1;
      headerTranslateY.value = 0;
      teamsOpacity.value = 1;
      teamsTranslateY.value = 0;
      homeJerseyTx.value = 0;
      homeJerseyOpacity.value = 1;
      homeJerseyScale.value = 1;
      awayJerseyTx.value = 0;
      awayJerseyOpacity.value = 1;
      awayJerseyScale.value = 1;
      centerOpacity.value = 1;
      centerScale.value = 1;
      dividerScaleX.value = 1;
      footerOpacity.value = 1;
      footerTranslateY.value = 0;
      footerGlow.value = showPredictPrimaryGlow ? 1 : 0;
      scanTranslateY.value = 0;
      scanOpacity.value = 0;
    };

    if (skip) {
      resetAll();
      return;
    }

    if (isDaySwitch) {
      scanOpacity.value = 0;
      scanTranslateY.value = 0;
      const delayMs = Math.min(
        rowIndex * GAMES_DAY_SWITCH_ROW_STAGGER_MS,
        GAMES_DAY_SWITCH_ROW_STAGGER_CAP_MS
      );
      shellOpacity.value = 0;
      shellTranslateY.value = GAMES_DAY_SWITCH_ROW_FROM_Y;
      shellOpacity.value = withDelay(
        delayMs,
        withTiming(1, {
          duration: GAMES_DAY_SWITCH_ROW_OPACITY_MS,
          easing: gamesDaySwitchEaseBezier,
        })
      );
      shellTranslateY.value = withDelay(
        delayMs,
        withTiming(0, {
          duration: GAMES_DAY_SWITCH_ROW_TRANSLATE_MS,
          easing: gamesDaySwitchEaseBezier,
        })
      );
      if (showPredictPrimaryGlow) {
        footerGlow.value = withDelay(
          delayMs + 80,
          withTiming(1, { duration: 200, easing: gamesDaySwitchEaseBezier })
        );
      }
      return () => {
        cancelAnimation(shellOpacity);
        cancelAnimation(shellTranslateY);
        cancelAnimation(footerGlow);
      };
    }

    if (isPageRest) {
      scanOpacity.value = 0;
      scanTranslateY.value = 0;
      const delayMs =
        GAMES_LIST_REST_CARDS_DELAY_MS +
        (rowIndex - 3) * PAGE_REST_CARD_STAGGER_MS;
      shellOpacity.value = 0;
      shellTranslateY.value = GAMES_PAGE_REST_CARD_FROM_Y;
      shellOpacity.value = withDelay(
        delayMs,
        withTiming(1, {
          duration: GAMES_PAGE_REST_CARD_DURATION_MS,
          easing: gamesCyberEaseSnapBezier,
        })
      );
      shellTranslateY.value = withDelay(
        delayMs,
        withTiming(0, {
          duration: GAMES_PAGE_REST_CARD_DURATION_MS,
          easing: gamesCyberEaseSnapBezier,
        })
      );
      return () => {
        cancelAnimation(shellOpacity);
        cancelAnimation(shellTranslateY);
      };
    }

    if (isPageRich) {
      runGroupEnter(shellOpacity, shellTranslateY, groupDelayMs(rowIndex, ENTRY_GROUP_SHELL), 10);
      runGroupEnter(
        headerOpacity,
        headerTranslateY,
        groupDelayMs(rowIndex, ENTRY_GROUP_HEADER),
        8
      );
      runGroupEnter(
        teamsOpacity,
        teamsTranslateY,
        groupDelayMs(rowIndex, ENTRY_GROUP_TEAMS),
        12
      );
      runGroupEnter(
        footerOpacity,
        footerTranslateY,
        groupDelayMs(rowIndex, ENTRY_GROUP_FOOTER),
        10
      );

      const teamsDelay = groupDelayMs(rowIndex, ENTRY_GROUP_TEAMS);
      const jerseyDelay =
        teamsDelay +
        Math.round(GAMES_CYBER_ENTRY_DURATION_MS * 0.32) +
        28;
      const jerseyDur = GAMES_CYBER_ENTRY_DURATION_MS;

      homeJerseyTx.value = -12;
      homeJerseyOpacity.value = 0;
      homeJerseyScale.value = 0.92;
      awayJerseyTx.value = 12;
      awayJerseyOpacity.value = 0;
      awayJerseyScale.value = 0.92;

      homeJerseyTx.value = withDelay(
        jerseyDelay,
        withTiming(0, { duration: jerseyDur, easing: gamesCyberEaseBezier })
      );
      homeJerseyOpacity.value = withDelay(
        jerseyDelay,
        withTiming(1, {
          duration: Math.round(jerseyDur * 0.72),
          easing: gamesCyberEaseBezier,
        })
      );
      homeJerseyScale.value = withDelay(
        jerseyDelay,
        withTiming(1, { duration: jerseyDur, easing: gamesCyberEaseBezier })
      );
      awayJerseyTx.value = withDelay(
        jerseyDelay,
        withTiming(0, { duration: jerseyDur, easing: gamesCyberEaseBezier })
      );
      awayJerseyOpacity.value = withDelay(
        jerseyDelay,
        withTiming(1, {
          duration: Math.round(jerseyDur * 0.72),
          easing: gamesCyberEaseBezier,
        })
      );
      awayJerseyScale.value = withDelay(
        jerseyDelay,
        withTiming(1, { duration: jerseyDur, easing: gamesCyberEaseBezier })
      );

      centerOpacity.value = 0;
      centerScale.value = 0.9;
      centerOpacity.value = withDelay(
        teamsDelay,
        withTiming(1, {
          duration: GAMES_CYBER_ENTRY_DURATION_MS,
          easing: gamesCyberEaseBezier,
        })
      );
      centerScale.value = withDelay(
        teamsDelay,
        withTiming(1, {
          duration: GAMES_CYBER_ENTRY_DURATION_MS,
          easing: gamesCyberEaseBezier,
        })
      );

      gridOpacity.value = 0;
      borderReveal.value = 0;
      gridOpacity.value = withDelay(
        groupDelayMs(rowIndex, ENTRY_GROUP_SHELL),
        withTiming(1, {
          duration: Math.round(GAMES_CYBER_ENTRY_DURATION_MS * 0.85),
          easing: gamesCyberEaseBezier,
        })
      );
      borderReveal.value = withDelay(
        groupDelayMs(rowIndex, ENTRY_GROUP_SHELL) + 40,
        withTiming(1, {
          duration: GAMES_CYBER_ENTRY_DURATION_MS,
          easing: gamesCyberEaseBezier,
        })
      );

      dividerScaleX.value = 0;
      dividerScaleX.value = withDelay(
        groupDelayMs(rowIndex, ENTRY_GROUP_FOOTER),
        withTiming(1, {
          duration: GAMES_CYBER_ENTRY_DURATION_MS,
          easing: gamesCyberEaseBezier,
        })
      );

      if (showPredictPrimaryGlow) {
        footerGlow.value = withDelay(
          groupDelayMs(rowIndex, ENTRY_GROUP_FOOTER),
          withTiming(1, { duration: 480, easing: gamesCyberEaseBezier })
        );
      }

      const scanDelay = groupDelayMs(rowIndex, ENTRY_GROUP_SHELL) + 50;
      scanTranslateY.value = -88;
      scanOpacity.value = 0;
      scanTranslateY.value = withDelay(
        scanDelay,
        withTiming(300, {
          duration: 620,
          easing: Easing.bezier(0.3, 0, 0.55, 1),
        })
      );
      scanOpacity.value = withDelay(
        scanDelay,
        withSequence(
          withTiming(1, { duration: 80, easing: Easing.linear }),
          withTiming(1, { duration: 460, easing: Easing.linear }),
          withTiming(0, { duration: 80, easing: Easing.linear })
        )
      );

      return () => {
        cancelAnimation(shellOpacity);
        cancelAnimation(shellTranslateY);
        cancelAnimation(gridOpacity);
        cancelAnimation(borderReveal);
        cancelAnimation(headerOpacity);
        cancelAnimation(headerTranslateY);
        cancelAnimation(teamsOpacity);
        cancelAnimation(teamsTranslateY);
        cancelAnimation(homeJerseyTx);
        cancelAnimation(homeJerseyOpacity);
        cancelAnimation(homeJerseyScale);
        cancelAnimation(awayJerseyTx);
        cancelAnimation(awayJerseyOpacity);
        cancelAnimation(awayJerseyScale);
        cancelAnimation(centerOpacity);
        cancelAnimation(centerScale);
        cancelAnimation(dividerScaleX);
        cancelAnimation(footerOpacity);
        cancelAnimation(footerTranslateY);
        cancelAnimation(footerGlow);
        cancelAnimation(scanTranslateY);
        cancelAnimation(scanOpacity);
      };
    }

    resetAll();
    return undefined;
  }, [
    skip,
    isDaySwitch,
    isPageRich,
    isPageRest,
    rowIndex,
    showPredictPrimaryGlow,
  ]);

  const shellTransformStyle = useAnimatedStyle(() => {
    const pressS = interpolate(pressed.value, [0, 1], [1, 0.985]);
    return {
      transform: [{ translateY: shellTranslateY.value }, { scale: pressS }],
    };
  });

  const shellOpacityStyle = useAnimatedStyle(() => ({
    opacity: shellOpacity.value,
  }));

  const borderStrokeStyle = useAnimatedStyle(() => ({
    opacity: borderReveal.value,
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    opacity: scanOpacity.value,
    transform: [{ translateY: scanTranslateY.value }],
  }));

  const gridLayerStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
  }));

  const headerGroupStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const teamsGroupStyle = useAnimatedStyle(() => ({
    opacity: teamsOpacity.value,
    transform: [{ translateY: teamsTranslateY.value }],
  }));

  const homeJerseyStyle = useAnimatedStyle(() => ({
    opacity: homeJerseyOpacity.value,
    transform: [
      { translateX: homeJerseyTx.value },
      { scale: homeJerseyScale.value },
    ],
  }));

  const awayJerseyStyle = useAnimatedStyle(() => ({
    opacity: awayJerseyOpacity.value,
    transform: [
      { translateX: awayJerseyTx.value },
      { scale: awayJerseyScale.value },
    ],
  }));

  const centerBlockStyle = useAnimatedStyle(() => ({
    opacity: centerOpacity.value,
    transform: [{ scale: centerScale.value }],
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: dividerScaleX.value }],
    transformOrigin: ["0%", "50%", 0],
  }));

  const footerStyle = useAnimatedStyle(() => {
    const glow = showPredictPrimaryGlow
      ? {
          shadowColor: "rgba(56,189,248,0.95)",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: footerGlow.value * 0.24,
          shadowRadius: footerGlow.value * 10,
          elevation: footerGlow.value * 4,
        }
      : {};
    return {
      opacity: footerOpacity.value,
      transform: [{ translateY: footerTranslateY.value }],
      ...glow,
    };
  });

  return {
    pressed,
    shellTransformStyle,
    shellOpacityStyle,
    borderStrokeStyle,
    scanLineStyle,
    gridLayerStyle,
    headerGroupStyle,
    teamsGroupStyle,
    homeJerseyStyle,
    awayJerseyStyle,
    centerBlockStyle,
    dividerStyle,
    footerStyle,
  };
}
