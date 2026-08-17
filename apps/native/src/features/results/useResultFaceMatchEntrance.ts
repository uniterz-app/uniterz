/**
 * リザルトカード中身：試合カードと同じ header → teams/jersey → footer。
 * 枠パス描画のあとから開始する。
 */
import { useLayoutEffect } from "react";
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type AnimatedStyle,
} from "react-native-reanimated";
import {
  GAMES_CYBER_ENTRY_DURATION_MS,
  GAMES_CYBER_GROUP_GAP_MS,
  GAMES_LINE_FRAME_DRAW_MS,
} from "../games/gamesCyberMotion";
import {
  gamesCyberEaseBezier,
  runLockOnOpacity,
} from "../games/gamesPageMotion";

const ENTRY_GROUP_HEADER = 0;
const ENTRY_GROUP_TEAMS = 1;
const ENTRY_GROUP_FOOTER = 2;

/** 枠描画 + Canvas 初回フレーム回避のあと */
export const RESULT_FACE_AFTER_FRAME_PAD_MS = 80;

export function resultFaceGroupDelayMs(drawDelayMs: number, group: 0 | 1 | 2) {
  return (
    Math.max(0, drawDelayMs) +
    GAMES_LINE_FRAME_DRAW_MS +
    RESULT_FACE_AFTER_FRAME_PAD_MS +
    group * GAMES_CYBER_GROUP_GAP_MS
  );
}

export type ResultFaceMatchEntranceStyles = {
  headerGroupStyle: AnimatedStyle;
  teamsGroupStyle: AnimatedStyle;
  homeJerseyStyle: AnimatedStyle;
  awayJerseyStyle: AnimatedStyle;
  centerBlockStyle: AnimatedStyle;
  dividerStyle: AnimatedStyle;
  footerGroupStyle: AnimatedStyle;
};

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

export function useResultFaceMatchEntrance({
  enabled,
  drawDelayMs,
}: {
  enabled: boolean;
  drawDelayMs: number;
}): ResultFaceMatchEntranceStyles {
  const skip = !enabled;
  const headerOp = useSharedValue(skip ? 1 : 0);
  const headerTy = useSharedValue(0);
  const teamsOp = useSharedValue(skip ? 1 : 0);
  const teamsTy = useSharedValue(0);
  const homeTx = useSharedValue(0);
  const homeOp = useSharedValue(skip ? 1 : 0);
  const homeSc = useSharedValue(1);
  const awayTx = useSharedValue(0);
  const awayOp = useSharedValue(skip ? 1 : 0);
  const awaySc = useSharedValue(1);
  const centerOp = useSharedValue(skip ? 1 : 0);
  const centerSc = useSharedValue(1);
  const dividerOp = useSharedValue(skip ? 1 : 0);
  const dividerSx = useSharedValue(1);
  const footerOp = useSharedValue(skip ? 1 : 0);
  const footerTy = useSharedValue(0);

  useLayoutEffect(() => {
    if (skip) {
      headerOp.value = 1;
      headerTy.value = 0;
      teamsOp.value = 1;
      teamsTy.value = 0;
      homeTx.value = 0;
      homeOp.value = 1;
      homeSc.value = 1;
      awayTx.value = 0;
      awayOp.value = 1;
      awaySc.value = 1;
      centerOp.value = 1;
      centerSc.value = 1;
      dividerOp.value = 1;
      dividerSx.value = 1;
      footerOp.value = 1;
      footerTy.value = 0;
      return;
    }

    const afterFrame = resultFaceGroupDelayMs(drawDelayMs, ENTRY_GROUP_HEADER);
    const headerDelay = afterFrame;
    const teamsDelay = resultFaceGroupDelayMs(drawDelayMs, ENTRY_GROUP_TEAMS);
    const footerDelay = resultFaceGroupDelayMs(drawDelayMs, ENTRY_GROUP_FOOTER);
    const jerseyDelay =
      teamsDelay + Math.round(GAMES_CYBER_ENTRY_DURATION_MS * 0.32) + 28;
    const jerseyDur = GAMES_CYBER_ENTRY_DURATION_MS;

    runGroupEnter(headerOp, headerTy, headerDelay, 8);
    runGroupEnter(teamsOp, teamsTy, teamsDelay, 12);
    runGroupEnter(footerOp, footerTy, footerDelay, 10);

    homeTx.value = -12;
    homeOp.value = 0;
    homeSc.value = 0.92;
    awayTx.value = 12;
    awayOp.value = 0;
    awaySc.value = 0.92;
    homeTx.value = withDelay(
      jerseyDelay,
      withTiming(0, { duration: jerseyDur, easing: gamesCyberEaseBezier })
    );
    homeOp.value = withDelay(
      jerseyDelay,
      withTiming(1, {
        duration: Math.round(jerseyDur * 0.72),
        easing: gamesCyberEaseBezier,
      })
    );
    homeSc.value = withDelay(
      jerseyDelay,
      withTiming(1, { duration: jerseyDur, easing: gamesCyberEaseBezier })
    );
    awayTx.value = withDelay(
      jerseyDelay,
      withTiming(0, { duration: jerseyDur, easing: gamesCyberEaseBezier })
    );
    awayOp.value = withDelay(
      jerseyDelay,
      withTiming(1, {
        duration: Math.round(jerseyDur * 0.72),
        easing: gamesCyberEaseBezier,
      })
    );
    awaySc.value = withDelay(
      jerseyDelay,
      withTiming(1, { duration: jerseyDur, easing: gamesCyberEaseBezier })
    );

    centerOp.value = 0;
    centerSc.value = 0.9;
    centerOp.value = withDelay(
      teamsDelay,
      withTiming(1, {
        duration: GAMES_CYBER_ENTRY_DURATION_MS,
        easing: gamesCyberEaseBezier,
      })
    );
    centerSc.value = withDelay(
      teamsDelay,
      withTiming(1, {
        duration: GAMES_CYBER_ENTRY_DURATION_MS,
        easing: gamesCyberEaseBezier,
      })
    );

    dividerSx.value = 0.06;
    dividerOp.value = 0;
    dividerSx.value = withDelay(
      footerDelay,
      withTiming(1, {
        duration: GAMES_CYBER_ENTRY_DURATION_MS,
        easing: gamesCyberEaseBezier,
      })
    );
    dividerOp.value = withDelay(
      footerDelay,
      withTiming(1, {
        duration: GAMES_CYBER_ENTRY_DURATION_MS,
        easing: gamesCyberEaseBezier,
      })
    );

    return () => {
      cancelAnimation(headerOp);
      cancelAnimation(headerTy);
      cancelAnimation(teamsOp);
      cancelAnimation(teamsTy);
      cancelAnimation(homeTx);
      cancelAnimation(homeOp);
      cancelAnimation(homeSc);
      cancelAnimation(awayTx);
      cancelAnimation(awayOp);
      cancelAnimation(awaySc);
      cancelAnimation(centerOp);
      cancelAnimation(centerSc);
      cancelAnimation(dividerOp);
      cancelAnimation(dividerSx);
      cancelAnimation(footerOp);
      cancelAnimation(footerTy);
    };
  }, [skip, drawDelayMs]);

  const headerGroupStyle = useAnimatedStyle(() => ({
    opacity: headerOp.value,
    transform: [{ translateY: headerTy.value }],
  }));
  const teamsGroupStyle = useAnimatedStyle(() => ({
    opacity: teamsOp.value,
    transform: [{ translateY: teamsTy.value }],
  }));
  const homeJerseyStyle = useAnimatedStyle(() => ({
    opacity: homeOp.value,
    transform: [{ translateX: homeTx.value }, { scale: homeSc.value }],
  }));
  const awayJerseyStyle = useAnimatedStyle(() => ({
    opacity: awayOp.value,
    transform: [{ translateX: awayTx.value }, { scale: awaySc.value }],
  }));
  const centerBlockStyle = useAnimatedStyle(() => ({
    opacity: centerOp.value,
    transform: [{ scale: centerSc.value }],
  }));
  const dividerStyle = useAnimatedStyle(() => ({
    opacity: dividerOp.value,
    transform: [{ scaleX: dividerSx.value }],
  }));
  const footerGroupStyle = useAnimatedStyle(() => ({
    opacity: footerOp.value,
    transform: [{ translateY: footerTy.value }],
  }));

  return {
    headerGroupStyle,
    teamsGroupStyle,
    homeJerseyStyle,
    awayJerseyStyle,
    centerBlockStyle,
    dividerStyle,
    footerGroupStyle,
  };
}
