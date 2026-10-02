/**
 * チュートリアル本文の簡易マークアップ。
 * `**強調**` とブランド語（Pick Up / PRO LEAGUE）に対応。
 */

export type TutorialRichSegment = {
  text: string;
  bold?: boolean;
  /** ランキングタブと同系の Oxanium 表示 */
  brand?: boolean;
};

const BOLD_RE = /\*\*([^*]+)\*\*/g;
/** タブ表記と一致させる（大文字小文字固定） */
const BRAND_RE = /(Pick Up|PRO LEAGUE)/g;

function splitBrandMarks(
  text: string,
  bold?: boolean
): TutorialRichSegment[] {
  if (!text) return [];
  const out: TutorialRichSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  BRAND_RE.lastIndex = 0;
  while ((m = BRAND_RE.exec(text)) != null) {
    if (m.index > last) {
      out.push({ text: text.slice(last, m.index), bold });
    }
    out.push({ text: m[1] ?? m[0], bold, brand: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push({ text: text.slice(last), bold });
  }
  return out.length > 0 ? out : [{ text, bold }];
}

export function parseTutorialRichText(input: string): TutorialRichSegment[] {
  if (!input) return [];
  const boldParts: TutorialRichSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  BOLD_RE.lastIndex = 0;
  while ((m = BOLD_RE.exec(input)) != null) {
    if (m.index > last) {
      boldParts.push({ text: input.slice(last, m.index) });
    }
    boldParts.push({ text: m[1] ?? "", bold: true });
    last = m.index + m[0].length;
  }
  if (last < input.length) {
    boldParts.push({ text: input.slice(last) });
  }
  const base = boldParts.length > 0 ? boldParts : [{ text: input }];
  return base.flatMap((p) => splitBrandMarks(p.text, p.bold));
}
