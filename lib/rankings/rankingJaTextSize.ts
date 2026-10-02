/** ひらがな・カタカナ・漢字（CJK）を含むか */
const JA_SCRIPT_RE =
  /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uff65-\uff9f]/;

/** ハングル（タイトル・ラベルの Noto / JP フォント切替用） */
const HANGUL_RE = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/;

export function hasJaScript(text: string): boolean {
  return JA_SCRIPT_RE.test(text);
}

/** CJK またはハングル — Rankings タイトル等の非ラテン字形判定 */
export function hasCjkOrHangulScript(text: string): boolean {
  return JA_SCRIPT_RE.test(text) || HANGUL_RE.test(text);
}

/** 英字は base のまま、日本語文字だけほんの少し小さく（約91%） */
export function rankingFontSizePx(basePx: number, text: string): number {
  if (!hasJaScript(text)) return basePx;
  return Math.round(basePx * 0.91 * 10) / 10;
}
