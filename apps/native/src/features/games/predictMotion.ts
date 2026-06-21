import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
} from "react-native-reanimated";
import {
  GAMES_CYBER_EASE,
  GAMES_CYBER_EASE_SNAP,
  GAMES_DAY_SWITCH_ROW_FROM_Y,
  GAMES_DAY_SWITCH_ROW_STAGGER_CAP_MS,
  GAMES_DAY_SWITCH_ROW_STAGGER_MS,
  GAMES_DAY_SWITCH_ROW_TRANSLATE_MS,
} from "./gamesCyberMotion";
import { gamesDaySwitchEaseBezier } from "./gamesPageMotion";

/**
 * Web `lib/predict/predictPageMotion.ts` + `PredictionFormV2` overlay 相当
 */
const predictOverlayEaseOut = Easing.bezier(0, 0, 0.2, 1);
const predictOverlayEaseIn = Easing.bezier(0.4, 0, 1, 1);
const gamesCyberEase = Easing.bezier(
  GAMES_CYBER_EASE[0],
  GAMES_CYBER_EASE[1],
  GAMES_CYBER_EASE[2],
  GAMES_CYBER_EASE[3]
);
const gamesCyberEaseSnap = Easing.bezier(
  GAMES_CYBER_EASE_SNAP[0],
  GAMES_CYBER_EASE_SNAP[1],
  GAMES_CYBER_EASE_SNAP[2],
  GAMES_CYBER_EASE_SNAP[3]
);

/** Web `predictOverlayRoot` */
const PREDICT_OVERLAY_ROOT = {
  delayChildrenMs: 20,
  staggerMs: 60,
} as const;

/** Web `predictOverlayBackdrop` / panel / card / contentOrch */
const PREDICT_OVERLAY = {
  backdropEnterMs: 200,
  backdropExitMs: 160,
  /** root stagger 後 + panel 内 delay 0.04 */
  panelEnterDelayMs:
    PREDICT_OVERLAY_ROOT.delayChildrenMs + PREDICT_OVERLAY_ROOT.staggerMs + 40,
  panelEnterY: 20,
  panelEnterDurationMs: 280,
  panelExitY: 12,
  panelExitDurationMs: 200,
  /** Web `predictOverlayContentOrch.delayChildren` */
  contentOrchDelayChildrenMs: 180,
  cardEnterY: -12,
  cardEnterDurationMs: 260,
} as const;

/** Web `DayStrip` */
const DAY_STRIP_DELAY_CHILDREN_MS = 40;
const DAY_STRIP_STAGGER_MS = 28;
const DAY_STRIP_DURATION_MS = 280;

const STATS_COMPARE_ROW_STAGGER_MS = 90;
const STATS_COMPARE_ROW_DURATION_MS = 350;
const STATS_COMPARE_ROW_BASE_DELAY_MS = 48;

/** 単体予想ページ用（Web `pageContainer` + `fadeUp`） */
const PREDICT_PAGE = {
  fadeUpDurationMs: 240,
  delayChildrenMs: 30,
  staggerChildrenMs: 45,
  fadeUpTranslateY: 12,
} as const;

/** 縦積みブロック用（単体ページ / 非 overlay） */
export function predictBlockFadeUpEnter(staggerIndex: number) {
  return FadeInDown.duration(PREDICT_PAGE.fadeUpDurationMs)
    .delay(
      PREDICT_PAGE.delayChildrenMs + staggerIndex * PREDICT_PAGE.staggerChildrenMs
    )
    .easing(predictOverlayEaseOut)
    .withInitialValues({
      transform: [{ translateY: PREDICT_PAGE.fadeUpTranslateY }],
    });
}

/** タブで開くツールパネル */
export function predictPanelRevealEnter() {
  return FadeInDown.duration(PREDICT_PAGE.fadeUpDurationMs)
    .easing(predictOverlayEaseOut)
    .withInitialValues({
      transform: [{ translateY: PREDICT_PAGE.fadeUpTranslateY }],
    });
}

/** Web `predictOverlayBackdrop` */
export function predictModalBackdropEnter() {
  return FadeIn.duration(PREDICT_OVERLAY.backdropEnterMs)
    .delay(PREDICT_OVERLAY_ROOT.delayChildrenMs)
    .easing(predictOverlayEaseOut);
}

/** Web `predictOverlayPanel` */
export function predictModalSheetEnter() {
  return FadeInDown.duration(PREDICT_OVERLAY.panelEnterDurationMs)
    .delay(PREDICT_OVERLAY.panelEnterDelayMs)
    .easing(gamesCyberEase)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: PREDICT_OVERLAY.panelEnterY }],
    });
}

/** Web `predictOverlayCard`（上から -12px → 0） */
export function predictModalPreviewEnter() {
  return FadeInDown.duration(PREDICT_OVERLAY.cardEnterDurationMs)
    .delay(PREDICT_OVERLAY.contentOrchDelayChildrenMs)
    .easing(gamesCyberEase)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: PREDICT_OVERLAY.cardEnterY }],
    });
}

export const PREDICT_MODAL_EXIT_COMPLETION_MS =
  Math.max(PREDICT_OVERLAY.backdropExitMs, PREDICT_OVERLAY.panelExitDurationMs) +
  80;

/** Web `predictOverlayBackdrop` exit */
export function predictModalBackdropExit() {
  return FadeOut.duration(PREDICT_OVERLAY.backdropExitMs).easing(predictOverlayEaseIn);
}

/** Web `predictOverlayPanel` exit */
export function predictModalSheetExit() {
  return FadeOutDown.duration(PREDICT_OVERLAY.panelExitDurationMs)
    .easing(gamesCyberEaseSnap)
    .withInitialValues({
      transform: [{ translateY: 0 }],
    });
}

export function predictStatsCompareRowEnter(rowIndex: number) {
  return FadeInDown.duration(STATS_COMPARE_ROW_DURATION_MS)
    .delay(STATS_COMPARE_ROW_BASE_DELAY_MS + rowIndex * STATS_COMPARE_ROW_STAGGER_MS)
    .easing(predictOverlayEaseOut)
    .withInitialValues({
      transform: [{ translateY: PREDICT_PAGE.fadeUpTranslateY }],
    });
}

export function predictMarketInnerEnter(blockIndex: number) {
  return FadeInDown.duration(PREDICT_PAGE.fadeUpDurationMs)
    .delay(36 + blockIndex * 72)
    .easing(predictOverlayEaseOut)
    .withInitialValues({
      transform: [{ translateY: PREDICT_PAGE.fadeUpTranslateY }],
    });
}

export function gamesDayStripChipEnter(index: number) {
  const delayMs = DAY_STRIP_DELAY_CHILDREN_MS + index * DAY_STRIP_STAGGER_MS;
  return FadeInDown.duration(DAY_STRIP_DURATION_MS)
    .delay(delayMs)
    .easing(gamesCyberEase)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: 12 }, { scale: 0.93 }],
    });
}

export function gamesScheduleCardDaySwitchEnter(index: number) {
  const delayMs = Math.min(
    index * GAMES_DAY_SWITCH_ROW_STAGGER_MS,
    GAMES_DAY_SWITCH_ROW_STAGGER_CAP_MS
  );
  return FadeInDown.duration(GAMES_DAY_SWITCH_ROW_TRANSLATE_MS)
    .delay(delayMs)
    .easing(gamesDaySwitchEaseBezier)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: GAMES_DAY_SWITCH_ROW_FROM_Y }],
    });
}
