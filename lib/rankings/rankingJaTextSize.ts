/** ひらがな・カタカナ・漢字（CJK）を含むか */
const JA_SCRIPT_RE =
  /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uff65-\uff9f]/;

export function hasJaScript(text: string): boolean {
  return JA_SCRIPT_RE.test(text);
}

/** 英字は base のまま、日本語文字だけほんの少し小さく（約91%） */
export function rankingFontSizePx(basePx: number, text: string): number {
  if (!hasJaScript(text)) return basePx;
  return Math.round(basePx * 0.91 * 10) / 10;
}
