/**
 * チュートリアル本文の簡易マークアップ。
 * `**強調**` だけ対応（ネストなし）。
 */

export type TutorialRichSegment = {
  text: string;
  bold?: boolean;
};

const BOLD_RE = /\*\*([^*]+)\*\*/g;

export function parseTutorialRichText(input: string): TutorialRichSegment[] {
  if (!input) return [];
  const out: TutorialRichSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  BOLD_RE.lastIndex = 0;
  while ((m = BOLD_RE.exec(input)) != null) {
    if (m.index > last) {
      out.push({ text: input.slice(last, m.index) });
    }
    out.push({ text: m[1] ?? "", bold: true });
    last = m.index + m[0].length;
  }
  if (last < input.length) {
    out.push({ text: input.slice(last) });
  }
  return out.length > 0 ? out : [{ text: input }];
}
