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

/** welcome: 散らばった文字が集合する */
export const TUTORIAL_WELCOME_GATHER_S = 0.95;
export const TUTORIAL_WELCOME_GATHER_MS = Math.round(
  TUTORIAL_WELCOME_GATHER_S * 1000
);
/** welcome: 見出し・本文・ボタンの入場 */
export const TUTORIAL_WELCOME_PART_S = 0.55;
export const TUTORIAL_WELCOME_PART_MS = Math.round(
  TUTORIAL_WELCOME_PART_S * 1000
);
export const TUTORIAL_WELCOME_GATHER_EASE = [0.16, 1, 0.3, 1] as const;
/** 文字が揃ったあとの発光 */
export const TUTORIAL_WELCOME_GLOW_DELAY_S = TUTORIAL_WELCOME_GATHER_S + 0.22;
export const TUTORIAL_WELCOME_GLOW_DELAY_MS = Math.round(
  TUTORIAL_WELCOME_GLOW_DELAY_S * 1000
);
export const TUTORIAL_WELCOME_GLOW_S = 0.58;
export const TUTORIAL_WELCOME_GLOW_MS = Math.round(TUTORIAL_WELCOME_GLOW_S * 1000);
/** welcome「画面を案内」: 1本のカメラが世界へ前進し、モーダル面を通過する */
export const TUTORIAL_WELCOME_FLY_S = 0.96;
export const TUTORIAL_WELCOME_FLY_MS = Math.round(TUTORIAL_WELCOME_FLY_S * 1000);
export const TUTORIAL_WELCOME_FLY_EASE = [0.42, 0, 0.18, 1] as const;
/** カメラ前進量（px）。世界の初期 Z と打ち消し合って等倍に着地 */
export const TUTORIAL_WELCOME_CAMERA_Z_PX = 520;
export const TUTORIAL_WELCOME_WORLD_Z_PX = -520;
/** Native 視差用。世界は小さく始まり、モーダルは通過で拡大 */
export const TUTORIAL_WELCOME_WORLD_REST_SCALE = 0.8;
export const TUTORIAL_WELCOME_WORLD_REST_RX_DEG = 6;
export const TUTORIAL_WELCOME_MODAL_PASS_SCALE = 2.15;
/** 通過の後半でモーダルを消す */
export const TUTORIAL_WELCOME_PASS_FADE_AT = 0.52;
/**
 * プロフィール引き渡し後の自動前進。
 * ロゴ集合＋輪郭発光が終わってから動かす（120ms だと発光前に切れる）
 */
export const TUTORIAL_WELCOME_AUTO_FLY_DELAY_S =
  TUTORIAL_WELCOME_GATHER_S + TUTORIAL_WELCOME_GLOW_S + 0.55;
export const TUTORIAL_WELCOME_AUTO_FLY_DELAY_MS = Math.round(
  TUTORIAL_WELCOME_AUTO_FLY_DELAY_S * 1000
);
/** 着地を見せてから horizon へ移る */
export const TUTORIAL_WELCOME_LAND_HOLD_S = 0.48;
export const TUTORIAL_WELCOME_LAND_HOLD_MS = Math.round(
  TUTORIAL_WELCOME_LAND_HOLD_S * 1000
);
/** 遠景（試合ページ）の被写界深度。fly で 0 に戻す。文字は読めずカードの形だけ残す */
export const TUTORIAL_WELCOME_WORLD_BLUR_PX = 48;
export const TUTORIAL_WELCOME_WORLD_BLUR_NATIVE = 90;
/** STATS 端タブ：試合ページ着地後のフェード（急に出さない） */
export const TUTORIAL_STATS_EDGE_FADE_S = 1.45;
export const TUTORIAL_STATS_EDGE_FADE_MS = Math.round(
  TUTORIAL_STATS_EDGE_FADE_S * 1000
);
/** welcome で隠したヘッダー／下部ナビの復帰 */
export const TUTORIAL_WELCOME_CHROME_FADE_S = 0.64;
export const TUTORIAL_WELCOME_CHROME_FADE_MS = Math.round(
  TUTORIAL_WELCOME_CHROME_FADE_S * 1000
);
/** welcome ステップ線：光が走り、菱形が 1→2→3→消灯でループ */
export const TUTORIAL_WELCOME_PATH_LOOP_S = 3.4;
export const TUTORIAL_WELCOME_PATH_LOOP_MS = Math.round(
  TUTORIAL_WELCOME_PATH_LOOP_S * 1000
);
/** 集合入場のあとから走らせる */
export const TUTORIAL_WELCOME_PATH_DELAY_S = 0.72;
export const TUTORIAL_WELCOME_PATH_DELAY_MS = Math.round(
  TUTORIAL_WELCOME_PATH_DELAY_S * 1000
);
/** ループ内の点灯開始（0–1）。線上の 01 / 02 / 03 */
export const TUTORIAL_WELCOME_PATH_NODE_AT = [0.08, 0.38, 0.68] as const;
/** 全消灯 */
export const TUTORIAL_WELCOME_PATH_CLEAR_AT = 0.86;
export const TUTORIAL_PULSE_PERIOD_MS = Math.round(
  TUTORIAL_PULSE_PERIOD_S * 1000
);
export const TUTORIAL_EXIT_MS = Math.round(TUTORIAL_EXIT_S * 1000);

/** サイバーアクセント（選択タブと同系統） */
export const TUTORIAL_CYAN = "#00F5FF";
/** welcome ステップ線の帯電（シアンの菱形と差をつける） */
export const TUTORIAL_WELCOME_PATH_CHARGE = "#DFFE00";

/**
 * 新機能（horizon）用アクセント。
 * 通常チュートリアルのシアンと差別化し、「NEW」感をはっきり出す。
 */
export const TUTORIAL_FEATURE_ACCENT = "#FF4EC8";
export const TUTORIAL_FEATURE_ACCENT_SOFT = "#FF8AD9";
export const TUTORIAL_FEATURE_ACCENT_DEEP = "#C2188A";

/**
 * welcome CTA の面照明・押し出し。
 * Web は `globals.css` の `.tutorial-welcome-cta` と揃える。
 */
export const TUTORIAL_WELCOME_CTA_CYAN_FACE = [
  "#B8FFFF",
  TUTORIAL_CYAN,
  "#00B4C4",
] as const;
export const TUTORIAL_WELCOME_CTA_CYAN_EXTRUDE = ["#00A8B8", "#003844"] as const;
export const TUTORIAL_WELCOME_CTA_MAGENTA_FACE = [
  "rgba(58,12,44,0.96)",
  "rgba(10,4,14,0.9)",
] as const;
export const TUTORIAL_WELCOME_CTA_MAGENTA_EXTRUDE = [
  TUTORIAL_FEATURE_ACCENT_DEEP,
  "#2A041E",
] as const;

/** 説明モーダル（吹き出し）のガラス背景 */
export const TUTORIAL_CALLOUT_GLASS_BG = "rgba(8, 18, 28, 0.42)";
/** 新機能コーチ用ガラス（マゼンタ寄り） */
export const TUTORIAL_FEATURE_CALLOUT_GLASS_BG = "rgba(28, 8, 22, 0.52)";
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
export const TUTORIAL_COACH_CALLOUT_DELAY_MS = 0;
export const TUTORIAL_COACH_CALLOUT_DELAY_S =
  TUTORIAL_COACH_CALLOUT_DELAY_MS / 1000;

/** コーチ吹き出しフェード */
export const TUTORIAL_COACH_CALLOUT_MS = 220;
export const TUTORIAL_COACH_CALLOUT_S = TUTORIAL_COACH_CALLOUT_MS / 1000;

/** 予想注釈の z-index（ScheduleList overlay=100000 / LiveCoach=1000060 より上） */
export const TUTORIAL_PREDICT_ANNOT_Z_INDEX = 1000200;
