/**
 * スクワッドバトル初回イントロ — モーション秒数の正。
 * Web framer-motion 用。Native は ms 換算を使う。
 */

/** 暗転オーバーレイのフェードイン */
export const SQUAD_INTRO_BG_FADE_S = 0.35;

/** タイトルグリッチ出現の所要 */
export const SQUAD_INTRO_TITLE_DURATION_S = 0.42;

/** タイトル出現開始までの待機 */
export const SQUAD_INTRO_TITLE_DELAY_S = 0.18;

/** キッカー（SEASON CYCLE 等）の出現ディレイ */
export const SQUAD_INTRO_KICKER_DELAY_S = 0.48;

/** ルール1行の出現ディレイ */
export const SQUAD_INTRO_RULE_DELAY_S = 0.62;

/** フェーズカード先頭の出現ディレイ */
export const SQUAD_INTRO_PHASE_BASE_DELAY_S = 0.78;

/** フェーズカード間スタッガー */
export const SQUAD_INTRO_PHASE_STAGGER_S = 0.16;

/** フェーズカードのスライドイン所要 */
export const SQUAD_INTRO_PHASE_DURATION_S = 0.32;

/** 循環矢印の出現ディレイ（最終フェーズ後） */
export const SQUAD_INTRO_LOOP_DELAY_S =
  SQUAD_INTRO_PHASE_BASE_DELAY_S + SQUAD_INTRO_PHASE_STAGGER_S * 3 + 0.08;

/** ENTER ボタン出現ディレイ */
export const SQUAD_INTRO_ENTER_DELAY_S = SQUAD_INTRO_LOOP_DELAY_S + 0.22;

/** ENTER ボタンのフェード所要 */
export const SQUAD_INTRO_ENTER_DURATION_S = 0.28;

/** 走査線1周の周期（秒） */
export const SQUAD_INTRO_SCAN_PERIOD_S = 2.8;

/** 退出フェード */
export const SQUAD_INTRO_EXIT_S = 0.28;

export function squadIntroPhaseDelayS(index: number): number {
  return SQUAD_INTRO_PHASE_BASE_DELAY_S + index * SQUAD_INTRO_PHASE_STAGGER_S;
}

export function squadIntroPhaseDelayMs(index: number): number {
  return Math.round(squadIntroPhaseDelayS(index) * 1000);
}

export const SQUAD_INTRO_BG_FADE_MS = Math.round(SQUAD_INTRO_BG_FADE_S * 1000);
export const SQUAD_INTRO_TITLE_DURATION_MS = Math.round(
  SQUAD_INTRO_TITLE_DURATION_S * 1000
);
export const SQUAD_INTRO_TITLE_DELAY_MS = Math.round(
  SQUAD_INTRO_TITLE_DELAY_S * 1000
);
export const SQUAD_INTRO_KICKER_DELAY_MS = Math.round(
  SQUAD_INTRO_KICKER_DELAY_S * 1000
);
export const SQUAD_INTRO_RULE_DELAY_MS = Math.round(
  SQUAD_INTRO_RULE_DELAY_S * 1000
);
export const SQUAD_INTRO_PHASE_DURATION_MS = Math.round(
  SQUAD_INTRO_PHASE_DURATION_S * 1000
);
export const SQUAD_INTRO_LOOP_DELAY_MS = Math.round(
  SQUAD_INTRO_LOOP_DELAY_S * 1000
);
export const SQUAD_INTRO_ENTER_DELAY_MS = Math.round(
  SQUAD_INTRO_ENTER_DELAY_S * 1000
);
export const SQUAD_INTRO_ENTER_DURATION_MS = Math.round(
  SQUAD_INTRO_ENTER_DURATION_S * 1000
);
export const SQUAD_INTRO_SCAN_PERIOD_MS = Math.round(
  SQUAD_INTRO_SCAN_PERIOD_S * 1000
);
export const SQUAD_INTRO_EXIT_MS = Math.round(SQUAD_INTRO_EXIT_S * 1000);
