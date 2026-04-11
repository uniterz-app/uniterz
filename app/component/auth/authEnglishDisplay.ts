/**
 * 認証カードの英語表記（UNITERZ 横長バナー写真参照）
 * Bebas Neue：コンデンス・大文字・トラッキング・オフホワイト #e6e4de
 */

const condensed = "font-[family-name:var(--font-auth-condensed)] uppercase not-italic";
const ink = "text-[#e6e4de]";

/** ロゴ UNITERZ */
export const authBrandWordmark = `${condensed} ${ink} text-[clamp(1.28rem,4vw,1.82rem)] tracking-[0.18em] sm:tracking-[0.2em] leading-none`;

/** LOGIN 見出し */
export const authDisplayHeading = `${condensed} ${ink} text-[clamp(2.45rem,7.5vw,3.25rem)] tracking-[0.1em] leading-[0.95]`;

/** CREATE ACCOUNT 見出し（横幅が長いので clamp 上限は LOGIN よりやや抑える） */
export const authDisplayHeadingLong = `${condensed} ${ink} text-[clamp(1.55rem,5.2vw,2.25rem)] tracking-[0.06em] leading-tight`;

/** LOG IN / SIGN UP 主ボタン */
export const authDisplayButton = `${condensed} ${ink} text-[1.05rem] tracking-[0.16em] sm:text-[1.15rem] sm:tracking-[0.2em]`;
