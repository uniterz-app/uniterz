/**
 * Unit 獲得モーダル用 UNITERZ ワードマーク。
 * 文字高さはすべて同一。弧は「持ち上げ量」だけ。
 */
export const UNIT_EARN_BRAND_WORD = "UNITERZ";

export type UnitEarnBrandArcLetter = {
  char: string;
  /** ベースラインからの持ち上げ（中央ほど大きい） */
  rise: number;
};

export type UnitEarnBrandArcLayout = {
  width: number;
  /** fontSize + arch */
  height: number;
  fontSize: number;
  letterWidth: number;
  arch: number;
  letters: UnitEarnBrandArcLetter[];
};

type LayoutOpts = {
  fontSize?: number;
  /** 端と中央の高低差（px） */
  arch?: number;
  letterGap?: number;
  /** 字体に応じた字幅係数（Bebas≈0.52 / Alfa≈0.72） */
  letterWidthRatio?: number;
};

/** 字形サイズは固定、rise のみ変化（アーチ用） */
export function unitEarnBrandArcLetters(
  opts: LayoutOpts = {}
): UnitEarnBrandArcLayout {
  const fontSize = opts.fontSize ?? 40;
  const arch = opts.arch ?? 14;
  const letterGap = opts.letterGap ?? 1;
  const chars = Array.from(UNIT_EARN_BRAND_WORD);
  const n = chars.length;
  const letterWidth = fontSize * (opts.letterWidthRatio ?? 0.52);
  const padX = 8;
  const totalW = n * letterWidth + Math.max(0, n - 1) * letterGap;
  const width = totalW + padX * 2;
  const height = fontSize + arch;

  const letters = chars.map((char, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const rise = arch * Math.sin(Math.PI * t);
    return { char, rise };
  });

  return { width, height, fontSize, letterWidth, arch, letters };
}
