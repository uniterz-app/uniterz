import { Easing, FadeIn, FadeInDown, FadeOut, FadeOutDown } from "react-native-reanimated";

/**
 * モバイル Web `PredictionFormV2` の framer 設定に合わせる
 * - pageContainer: opacity 0→1, duration 0.16, easeOut, delayChildren 0.03, stagger 0.045
 * - fadeUp: y 12, duration 0.24, easeOut
 */
const easeOut = Easing.bezier(0, 0, 0.2, 1);

/** Web `teamStatsCompare` の `ROW_STAGGER`（秒）→ ms */
export const STATS_COMPARE_ROW_STAGGER_MS = 90;
/** Web `SymmetricalCompareRow` の transition duration（約 0.35s） */
export const STATS_COMPARE_ROW_DURATION_MS = 350;
/** ツールパネル表示直後から行が始まるまでの余裕 */
export const STATS_COMPARE_ROW_BASE_DELAY_MS = 48;

export const PREDICT_MOTION = {
  backdropFadeMs: 160,
  fadeUpDurationMs: 240,
  delayChildrenMs: 30,
  staggerChildrenMs: 45,
  fadeUpTranslateY: 12,
  /** 予想モーダル全体を下から持ち上げる量（measure 不使用） */
  modalSheetEnterTranslateY: 96,
  modalSheetEnterMs: 380,
  modalBackdropEnterMs: 240,
  modalPreviewEnterMs: 320,
  modalPreviewEnterDelayMs: 48,
  modalPreviewEnterTranslateY: 20,
  modalPreviewEnterScale: 0.94,
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

/**
 * タブで開くツールパネル（Web `PredictionFormV2` の `fadeUp` と同一 240ms）
 */
export function predictPanelRevealEnter() {
  return FadeInDown.duration(PREDICT_MOTION.fadeUpDurationMs)
    .easing(easeOut)
    .withInitialValues({
      transform: [{ translateY: PREDICT_MOTION.fadeUpTranslateY }],
    });
}

/** 予想モーダル背景（暗さ）。位置測定なし */
export function predictModalBackdropEnter() {
  return FadeIn.duration(PREDICT_MOTION.modalBackdropEnterMs).easing(easeOut);
}

/**
 * 予想モーダル本体（下からスライド＋フェード）。SlideIn 系は環境差があるため FadeInDown で近似。
 * measure 不使用。
 */
export function predictModalSheetEnter() {
  return FadeInDown.duration(PREDICT_MOTION.modalSheetEnterMs)
    .easing(easeOut)
    .withInitialValues({
      transform: [{ translateY: PREDICT_MOTION.modalSheetEnterTranslateY }],
    });
}

/** モーダル先頭プレビュー: fade + translateY + scale（位置測定なし） */
export function predictModalPreviewEnter() {
  return FadeInDown.duration(PREDICT_MOTION.modalPreviewEnterMs)
    .delay(PREDICT_MOTION.modalPreviewEnterDelayMs)
    .easing(easeOut)
    .withInitialValues({
      transform: [
        { translateY: PREDICT_MOTION.modalPreviewEnterTranslateY },
        { scale: PREDICT_MOTION.modalPreviewEnterScale },
      ],
    });
}

/** 閉じる時のレイアウトアニメ完了待ち（ entering と同系の長さ + 余裕） */
export const PREDICT_MODAL_EXIT_COMPLETION_MS =
  Math.max(PREDICT_MOTION.modalBackdropEnterMs, PREDICT_MOTION.modalSheetEnterMs) + 72;

/** 予想モーダル背景フェードアウト（開く時と対になる） */
export function predictModalBackdropExit() {
  return FadeOut.duration(PREDICT_MOTION.modalBackdropEnterMs).easing(easeOut);
}

/** 予想モーダルシート：下へスライド＋フェードアウト */
export function predictModalSheetExit() {
  return FadeOutDown.duration(PREDICT_MOTION.modalSheetEnterMs).easing(easeOut);
}

/**
 * 詳細スタッツの比較行（Web `SymmetricalCompareRow` の stagger / duration に合わせる）
 */
export function predictStatsCompareRowEnter(rowIndex: number) {
  return FadeInDown.duration(STATS_COMPARE_ROW_DURATION_MS)
    .delay(STATS_COMPARE_ROW_BASE_DELAY_MS + rowIndex * STATS_COMPARE_ROW_STAGGER_MS)
    .easing(easeOut)
    .withInitialValues({
      transform: [{ translateY: PREDICT_MOTION.fadeUpTranslateY }],
    });
}

/**
 * 市場タブ内のドーナツ・凡例など（Web `GamePredictionDistribution` パネル内の段階表示に近い）
 */
export function predictMarketInnerEnter(blockIndex: number) {
  return FadeInDown.duration(PREDICT_MOTION.fadeUpDurationMs)
    .delay(36 + blockIndex * 72)
    .easing(easeOut)
    .withInitialValues({
      transform: [{ translateY: PREDICT_MOTION.fadeUpTranslateY }],
    });
}
