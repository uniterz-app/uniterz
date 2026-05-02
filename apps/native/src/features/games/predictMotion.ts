import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/**
 * モバイル Web `PredictionFormV2` の framer 設定に合わせる
 * - pageContainer: opacity 0→1, duration 0.16, easeOut, delayChildren 0.03, stagger 0.045
 * - fadeUp: y 12, duration 0.24, easeOut
 */
const easeOut = Easing.bezier(0, 0, 0.2, 1);
/** Web `DayStrip` の DAY_STRIP_EASE（`cyberMotion` の `GAMES_CYBER_EASE`） */
const gamesCyberEase = Easing.bezier(0.16, 0.82, 0.22, 1);

/** Web `app/component/games/DayStrip.tsx` の container/item と同一（秒→ms） */
const DAY_STRIP_DELAY_CHILDREN_MS = 40;
const DAY_STRIP_STAGGER_MS = 28;
const DAY_STRIP_DURATION_MS = 280;
/** Web `ScheduleList` daySwitch カード（`GAMES_DAY_SWITCH_EASE`） */
const gamesDaySwitchEase = Easing.bezier(0.22, 1, 0.36, 1);

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
  /** 先頭試合カード「3D pop」入場（custom entering で使用） */
  modalPreviewEnterDelayMs: 40,
  modalPreview3dPopDurationMs: 440,
  modalPreview3dPopPerspective: 1100,
  modalPreview3dPopRotateXDeg: 14,
  modalPreview3dPopTranslateY: 36,
  modalPreview3dPopScaleFrom: 0.82,
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

/**
 * モーダル先頭の試合カード: 「3D pop」— 手前に倒した状態から perspective + rotateX 復帰、
 * scale はスプリングで少し弾む（一覧の FadeInDown より立体的）。
 */
export function predictModalPreviewEnter() {
  const delayMs = PREDICT_MOTION.modalPreviewEnterDelayMs;
  const duration = PREDICT_MOTION.modalPreview3dPopDurationMs;
  const easing = Easing.out(Easing.cubic);
  const p = PREDICT_MOTION.modalPreview3dPopPerspective;
  const rotateFrom = `${PREDICT_MOTION.modalPreview3dPopRotateXDeg}deg`;
  const y0 = PREDICT_MOTION.modalPreview3dPopTranslateY;
  const s0 = PREDICT_MOTION.modalPreview3dPopScaleFrom;
  return () => {
    "worklet";
    const timing = { duration, easing };
    const spring = { damping: 16, stiffness: 320, mass: 0.78 };
    return {
      initialValues: {
        opacity: 0,
        transform: [
          { perspective: p },
          { rotateX: rotateFrom },
          { translateY: y0 },
          { scale: s0 },
        ],
      },
      animations: {
        opacity: withDelay(delayMs, withTiming(1, { duration: 280, easing })),
        transform: [
          { perspective: p },
          {
            rotateX: withDelay(delayMs, withTiming("0deg", timing)),
          },
          { translateY: withDelay(delayMs, withTiming(0, timing)) },
          { scale: withDelay(delayMs, withSpring(1, spring)) },
        ],
      },
    };
  };
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

/**
 * Web `DayStrip`（framer `motion.div` variants）と同等：
 * - delayChildren 40ms + staggerChildren 28ms×index
 * - duration 280ms、ease `GAMES_CYBER_EASE`
 * - hidden → show: opacity 0→1、translateY 12→0、scale 0.93→1
 *
 * 注意: Reanimated の `FadeIn` は opacity のみ補間するため、`withInitialValues` の transform は動かない。
 * `withDelay` + `withTiming` で3プロパティを同じ尺・イージングで動かす。
 */
export function gamesDayStripChipEnter(index: number) {
  const delayMs = DAY_STRIP_DELAY_CHILDREN_MS + index * DAY_STRIP_STAGGER_MS;
  const duration = DAY_STRIP_DURATION_MS;
  const easing = gamesCyberEase;
  return () => {
    "worklet";
    const timing = { duration, easing };
    return {
      initialValues: {
        opacity: 0,
        transform: [{ translateY: 12 }, { scale: 0.93 }],
      },
      animations: {
        opacity: withDelay(delayMs, withTiming(1, timing)),
        transform: [
          { translateY: withDelay(delayMs, withTiming(0, timing)) },
          { scale: withDelay(delayMs, withTiming(1, timing)) },
        ],
      },
    };
  };
}

/** Web `ScheduleList` daySwitch カード（ms）— `FadeIn` は opacity のみのため translateY は別途補間する */
const SCHEDULE_CARD_STAGGER_MS = 38;
const SCHEDULE_CARD_STAGGER_CAP_MS = 280;
const SCHEDULE_CARD_ENTER_MS = 520;

/**
 * Web `ScheduleList` daySwitch：hidden y=-11・delay min(i×38ms, 280ms)・520ms・`GAMES_DAY_SWITCH_EASE`
 * （一覧・ページ初回マウント共通）
 */
export function gamesScheduleCardDaySwitchEnter(index: number) {
  const delayMs = Math.min(index * SCHEDULE_CARD_STAGGER_MS, SCHEDULE_CARD_STAGGER_CAP_MS);
  const duration = SCHEDULE_CARD_ENTER_MS;
  const easing = gamesDaySwitchEase;
  return () => {
    "worklet";
    const timing = { duration, easing };
    return {
      initialValues: {
        opacity: 0,
        transform: [{ translateY: -11 }],
      },
      animations: {
        opacity: withDelay(delayMs, withTiming(1, timing)),
        transform: [
          { translateY: withDelay(delayMs, withTiming(0, timing)) },
        ],
      },
    };
  };
}

/**
 * 試合一覧カード入場：`predictModalPreviewEnter` と同じ 3D pop（perspective + rotateX + scale スプリング）。
 * スタッガーは従来 daySwitch と同一（index×38ms・上限 280ms）。
 */
export function gamesScheduleCard3dPopEnter(index: number) {
  const delayMs = Math.min(index * SCHEDULE_CARD_STAGGER_MS, SCHEDULE_CARD_STAGGER_CAP_MS);
  const duration = PREDICT_MOTION.modalPreview3dPopDurationMs;
  const easing = Easing.out(Easing.cubic);
  const p = PREDICT_MOTION.modalPreview3dPopPerspective;
  const rotateFrom = `${PREDICT_MOTION.modalPreview3dPopRotateXDeg}deg`;
  const y0 = PREDICT_MOTION.modalPreview3dPopTranslateY;
  const s0 = PREDICT_MOTION.modalPreview3dPopScaleFrom;
  return () => {
    "worklet";
    const timing = { duration, easing };
    const spring = { damping: 16, stiffness: 320, mass: 0.78 };
    return {
      initialValues: {
        opacity: 0,
        transform: [
          { perspective: p },
          { rotateX: rotateFrom },
          { translateY: y0 },
          { scale: s0 },
        ],
      },
      animations: {
        opacity: withDelay(delayMs, withTiming(1, { duration: 280, easing })),
        transform: [
          { perspective: p },
          {
            rotateX: withDelay(delayMs, withTiming("0deg", timing)),
          },
          { translateY: withDelay(delayMs, withTiming(0, timing)) },
          { scale: withDelay(delayMs, withSpring(1, spring)) },
        ],
      },
    };
  };
}
