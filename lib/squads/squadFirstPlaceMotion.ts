/**
 * 1位カード入場 — フェードインのみ（溜めなし）。
 * スキャン通過に合わせて ACE→LEAD→EST UNIT / アバターはフェードのみ。
 * Web framer-motion 秒数の正。Native はここから ms に換算。
 */

/** 1位カード本体のフェードイン所要秒 */
export const SQUAD_FIRST_FADE_IN_S = 0.42;

/** cubic-bezier(.18,.8,.2,1) — Depth Float demo と同じ緩急 */
export const SQUAD_FIRST_FADE_IN_EASE = [0.18, 0.8, 0.2, 1] as const;

/** フッター横断スキャンの所要秒（短め） */
export const SQUAD_FIRST_SCAN_DURATION_S = 0.48;

/**
 * スキャン進行率（0〜1）に対する各列の出現タイミング。
 * ビーム先頭が列中心付近に来る頃。
 */
export const SQUAD_FIRST_FOOTER_REVEAL_AT = [0.12, 0.4, 0.68] as const;

/** アバター間スタッガー（秒） */
export const SQUAD_FIRST_AVATAR_STAGGER_S = 0.03;

/** アバターのフェード所要（秒）— スプリングなし */
export const SQUAD_FIRST_AVATAR_FADE_S = 0.14;

/** フッターセルのフェード所要（秒）— 縦移動なし */
export const SQUAD_FIRST_FOOTER_FADE_S = 0.12;

/** スキャン帯の不透明度（モバイル向けに弱め） */
export const SQUAD_FIRST_SCAN_OPACITY = 0.16;

export function squadFirstFooterDelayS(index: 0 | 1 | 2): number {
  return SQUAD_FIRST_FOOTER_REVEAL_AT[index] * SQUAD_FIRST_SCAN_DURATION_S;
}

export function squadFirstAvatarDelayS(index: number): number {
  return (
    SQUAD_FIRST_FOOTER_REVEAL_AT[0] * SQUAD_FIRST_SCAN_DURATION_S +
    index * SQUAD_FIRST_AVATAR_STAGGER_S
  );
}

export function squadFirstFooterDelayMs(index: 0 | 1 | 2): number {
  return Math.round(squadFirstFooterDelayS(index) * 1000);
}

export function squadFirstAvatarDelayMs(index: number): number {
  return Math.round(squadFirstAvatarDelayS(index) * 1000);
}

export const SQUAD_FIRST_FADE_IN_MS = Math.round(SQUAD_FIRST_FADE_IN_S * 1000);

export const SQUAD_FIRST_SCAN_DURATION_MS = Math.round(
  SQUAD_FIRST_SCAN_DURATION_S * 1000
);

export const SQUAD_FIRST_FOOTER_FADE_MS = Math.round(
  SQUAD_FIRST_FOOTER_FADE_S * 1000
);

export const SQUAD_FIRST_AVATAR_FADE_MS = Math.round(
  SQUAD_FIRST_AVATAR_FADE_S * 1000
);
