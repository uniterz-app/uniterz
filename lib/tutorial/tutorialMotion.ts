/**
 * アプリ初回チュートリアル — モーション秒数の正。
 * Web framer-motion 用。Native は *_MS 換算を使う。
 */

/** オーバーレイのフェードイン */
export const TUTORIAL_BG_FADE_S = 0.32;

/** コーチ背景のぼかし量（px）— 強すぎると背後のUIが読めない */
export const TUTORIAL_BG_BLUR_PX = 5;

/** コーチ暗幕の不透明度（0–1） */
export const TUTORIAL_SCRIM_OPACITY = 0.34;

/** スライド本文の出現所要 */
export const TUTORIAL_SLIDE_DURATION_S = 0.28;

/** スライド切替のスライド距離(px) */
export const TUTORIAL_SLIDE_OFFSET_PX = 28;

/** 図解イラストの出現ディレイ */
export const TUTORIAL_ILLUST_DELAY_S = 0.06;

/** ドットインジケーターの出現ディレイ */
export const TUTORIAL_DOTS_DELAY_S = 0.12;

/** CTA ボタン出現ディレイ */
export const TUTORIAL_CTA_DELAY_S = 0.18;

/** スポットライトの穴くり抜きアニメ所要 */
export const TUTORIAL_SPOTLIGHT_DURATION_S = 0.35;

/** 吹き出し出現所要 */
export const TUTORIAL_CALLOUT_DURATION_S = 0.28;

/** コーチモーダルの浮遊（上下ゆらぎ）周期 */
export const TUTORIAL_FLOAT_PERIOD_S = 3.4;

/** 浮遊の上下幅（px）。上方向がマイナス */
export const TUTORIAL_FLOAT_Y_PX = 7;

/** @deprecated 呼吸は廃止。浮遊周期にフォールバック */
export const TUTORIAL_BREATH_PERIOD_S = TUTORIAL_FLOAT_PERIOD_S;
/** @deprecated 呼吸は廃止 */
export const TUTORIAL_BREATH_SCALE = 1;

/** ハイブリッド: 試合カードパルス周期 */
export const TUTORIAL_PULSE_PERIOD_S = 1.6;

/** 退出フェード */
export const TUTORIAL_EXIT_S = 0.24;

export const TUTORIAL_BG_FADE_MS = Math.round(TUTORIAL_BG_FADE_S * 1000);
export const TUTORIAL_BG_BLUR_PX_NATIVE = TUTORIAL_BG_BLUR_PX;
export const TUTORIAL_SLIDE_DURATION_MS = Math.round(
  TUTORIAL_SLIDE_DURATION_S * 1000
);
export const TUTORIAL_ILLUST_DELAY_MS = Math.round(
  TUTORIAL_ILLUST_DELAY_S * 1000
);
export const TUTORIAL_DOTS_DELAY_MS = Math.round(TUTORIAL_DOTS_DELAY_S * 1000);
export const TUTORIAL_CTA_DELAY_MS = Math.round(TUTORIAL_CTA_DELAY_S * 1000);
export const TUTORIAL_SPOTLIGHT_DURATION_MS = Math.round(
  TUTORIAL_SPOTLIGHT_DURATION_S * 1000
);
export const TUTORIAL_CALLOUT_DURATION_MS = Math.round(
  TUTORIAL_CALLOUT_DURATION_S * 1000
);
export const TUTORIAL_BREATH_PERIOD_MS = Math.round(
  TUTORIAL_BREATH_PERIOD_S * 1000
);
export const TUTORIAL_FLOAT_PERIOD_MS = Math.round(
  TUTORIAL_FLOAT_PERIOD_S * 1000
);
export const TUTORIAL_PULSE_PERIOD_MS = Math.round(
  TUTORIAL_PULSE_PERIOD_S * 1000
);
export const TUTORIAL_EXIT_MS = Math.round(TUTORIAL_EXIT_S * 1000);

/** サイバーアクセント（選択タブと同系統） */
export const TUTORIAL_CYAN = "#00F5FF";

/** 説明モーダル（吹き出し）のガラス背景 */
export const TUTORIAL_CALLOUT_GLASS_BG = "rgba(8, 18, 28, 0.42)";
export const TUTORIAL_CALLOUT_GLASS_BLUR_PX = 18;
export const TUTORIAL_CALLOUT_GLASS_SATURATE = 1.55;
/** Native BlurView intensity（おおよそ blur px × 2.2） */
export const TUTORIAL_CALLOUT_GLASS_BLUR_INTENSITY = 40;

/**
 * 予想オーバーレイ入場後に注釈を出す遅延。
 * シートが落ち着いてから、暗幕→枠→吹き出しの順で出す。
 */
export const TUTORIAL_PREDICT_ANNOT_REVEAL_DELAY_MS = 720;

/** 注釈の暗幕フェード */
export const TUTORIAL_PREDICT_ANNOT_SCRIM_MS = 360;
export const TUTORIAL_PREDICT_ANNOT_SCRIM_S =
  TUTORIAL_PREDICT_ANNOT_SCRIM_MS / 1000;

/** 吹き出し・誘導線の開始ディレイ（暗幕のあと） */
export const TUTORIAL_PREDICT_ANNOT_CALLOUT_DELAY_MS = 340;
export const TUTORIAL_PREDICT_ANNOT_CALLOUT_DELAY_S =
  TUTORIAL_PREDICT_ANNOT_CALLOUT_DELAY_MS / 1000;

/** 吹き出し・誘導線のフェード */
export const TUTORIAL_PREDICT_ANNOT_CALLOUT_MS = 580;
export const TUTORIAL_PREDICT_ANNOT_CALLOUT_S =
  TUTORIAL_PREDICT_ANNOT_CALLOUT_MS / 1000;

/** コーチ（LiveCoach）暗幕 */
export const TUTORIAL_COACH_SCRIM_MS = 420;
export const TUTORIAL_COACH_SCRIM_S = TUTORIAL_COACH_SCRIM_MS / 1000;

/** コーチ吹き出しの開始ディレイ */
export const TUTORIAL_COACH_CALLOUT_DELAY_MS = 260;
export const TUTORIAL_COACH_CALLOUT_DELAY_S =
  TUTORIAL_COACH_CALLOUT_DELAY_MS / 1000;

/** コーチ吹き出しフェード */
export const TUTORIAL_COACH_CALLOUT_MS = 560;
export const TUTORIAL_COACH_CALLOUT_S = TUTORIAL_COACH_CALLOUT_MS / 1000;

/** 予想注釈の z-index（ScheduleList overlay=100000 / LiveCoach=1000060 より上） */
export const TUTORIAL_PREDICT_ANNOT_Z_INDEX = 1000200;
