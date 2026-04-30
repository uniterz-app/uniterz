import { Easing, FadeIn, FadeInDown } from "react-native-reanimated";

/**
 * モバイル Web `PredictionFormV2` の framer 設定に合わせる
 * - pageContainer: opacity 0→1, duration 0.16, easeOut, delayChildren 0.03, stagger 0.045
 * - fadeUp: y 12, duration 0.24, easeOut
 */
const easeOut = Easing.bezier(0, 0, 0.2, 1);

export const PREDICT_MOTION = {
  backdropFadeMs: 160,
  fadeUpDurationMs: 240,
  delayChildrenMs: 30,
  staggerChildrenMs: 45,
  fadeUpTranslateY: 12,
} as const;

/** オーバーレイ全体（backdrop）用。Web モバイル `ScheduleList` の dim は無アニメのため未使用 */
export function predictBackdropEnter() {
  return FadeIn.duration(PREDICT_MOTION.backdropFadeMs).easing(easeOut);
}

/** 縦積みブロック用（staggerIndex: 0 起算） */
export function predictBlockFadeUpEnter(staggerIndex: number) {
  return FadeInDown.duration(PREDICT_MOTION.fadeUpDurationMs)
    .delay(
      PREDICT_MOTION.delayChildrenMs + staggerIndex * PREDICT_MOTION.staggerChildrenMs
    )
    .easing(easeOut)
    .withInitialValues({
      transform: [{ translateY: PREDICT_MOTION.fadeUpTranslateY }],
    });
}

/** 表示途中で差し込まれるパネル（タブ展開）用。急に出さず軽いフェードアップ */
export function predictPanelRevealEnter() {
  return FadeInDown.duration(200)
    .easing(easeOut)
    .withInitialValues({
      transform: [{ translateY: PREDICT_MOTION.fadeUpTranslateY }],
    });
}
