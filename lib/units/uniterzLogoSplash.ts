/**
 * サイバーロゴスプラッシュ — 確定 SVG path（文字グループ付き）。
 * 正アセット: public/brand/uniterz-logo.svg / logo-fill.svg
 * プレビュー案は「雰囲気が被らない」ことを優先して差別化。
 */

export const UNITERZ_LOGO_SPLASH_VIEWBOX = "0 0 1248.9 313.66" as const;
export const UNITERZ_LOGO_SPLASH_VB_W = 1248.9;
export const UNITERZ_LOGO_SPLASH_VB_H = 313.66;

/** 文字 ID（左→右） */
export type UniterzLogoLetterId =
  | "U"
  | "N"
  | "I"
  | "T"
  | "E"
  | "R"
  | "Z";

export type UniterzLogoLetter = {
  id: UniterzLogoLetterId;
  /** SVG の id（letter-U など） */
  svgId: `letter-${UniterzLogoLetterId}`;
  /** その文字を構成する path d（見た目は変えない） */
  paths: readonly string[];
};

/**
 * 文字単位の確定 path。
 * イラレで letter-* に分割した logo-fill と同一。
 */
export const UNITERZ_LOGO_LETTERS: readonly UniterzLogoLetter[] = [
  {
    id: "U",
    svgId: "letter-U",
    paths: [
      "M30.35,281.99v-106.71s59.86,30.57,59.86,30.57l.17,30.35,44.04-20.3.06-166.6c0-1.31,3.66-3.26,4.66-3.54l18.24-3.73,33.07,18.23.03,173.36-30.85,24.38-19.58,14.61-77.03,23.78-13.63-5.6-19.05-8.8Z",
      "M30.62,132.23l-.48-30.66L0,83.02c-.14-2.46,2.45-5.28,4.79-5.83l40.26-9.51,44.43-10.01.61,9.67.22,92.97-59.69-28.08Z",
      "M90.16,175.48L90.26,197.06L66.7,175.79Z",
      "M47.57,155.51L30.29,156.1L30.41,139.66Z",
    ],
  },
  {
    id: "N",
    svgId: "letter-N",
    paths: [
      "M209.36,235.05l.11-176.44-33.4-20.22,11.13-1.74,21.39-3.58,14.63-2.49,19.81-3.37,17.05-2.9,12.69-2.16,29.23,48.03,34.99,55.66.36-86.05-16.51-11.4-8.61-6.28c-.66-.48-2.46-2.17-1.89-2.61l2.73-2.12,44.23-5.69c12.09-1.49,23.75-3.02,36.05-2.84v224.7s-11.2,1.05-11.2,1.05l-14.77,1.86-15.68,1.36-13.37,1.99-1.28-25.93-77.9-113.72v128.05s10.58,10.25,10.58,10.25l.52,2.58c.12.58-1.23,1.32-2.02,1.78l-57.76,13.33-16.39,3.01c.79-3.5,1.28-4.78,2.75-6.82l12.5-17.31Z",
    ],
  },
  {
    id: "I",
    svgId: "letter-I",
    paths: [
      "M418.82,231.03l-8.51.79.02-224.74,15.02-.77,23.97-1.85,21.04-1.71.05,206.61-22.63,19.02c-3.72,1.33-10.26,1.28-14.3,1.57l-14.65,1.07Z",
    ],
  },
  {
    id: "T",
    svgId: "letter-T",
    paths: [
      "M616.38,206.32l-23.76,19.3-33.34-.03V44.86s-32.92,1.68-32.92,1.68l-24.97.29,24.17-26.96.68-14.94c.06-1.31-.09-3.33.61-3.78S529.67,0,530.62,0l134.1.39,29.42.7.08,16.46-14.8,12.39-17.32,15.08-45.76-.18.05,161.48Z",
      "M513.06,23.96l-17.08,20.96-11.79.19.02-43.98,34.91-.03-.4,14.56c-.07,2.4-3.81,6.02-5.66,8.3Z",
    ],
  },
  {
    id: "E",
    svgId: "letter-E",
    paths: [
      "M833.49,123.42l-18.12,15.45-22-.46-24.77-2.04-17.36-1.07.06,55.15,22.02,1.15,66.69,6.28,20.61,1.58c2.81,3.2-1.18,6.16-3.5,8l-34.28,27.19-19.51-.58-32-2.01-15.03-1.15-12-.84-17.95-1.05-18.99-1.11-13.12-.66V64.97s-14.82-14.81-14.82-14.81l31.97-26.45-.91-19.28c-.04-.86,1.15-3.24,1.93-3.18l4.3.33,36.68,2.72,26.94,2.04,12.87,1.07,19.67,2.03,20.36,2.19,40.24,3.92,2.66,1c.66.25.78,1.89.66,2.66l-46.61,38.43-58.84-4.81-20.15-1.83.05,42.83,22.03,1.87,14.05.95,13.96.94,15.05.99,14.55.82,18.53,1.55c.99.08,2.94,1,3.48,1.75s-.06,3.34-.75,3.95l-18.66,16.77Z",
    ],
  },
  {
    id: "R",
    svgId: "letter-R",
    paths: [
      "M1030.24,262.43l-17.54-4.37-34.59-62.11-38.11-69.21,63.25-28.07-.07-22.35-20.88-2.32-48.83-6.52-.06,159.3,14.04,17.81c.47.6,1.08,2.81.48,3.23l-2.78,1.93-43.68-6.07-18.23-2.09c-2.44-.28-5.11-1.12-6.83-3.27l.02-164.63-25.23-12.91,48.78-41.24,21.06,1.75,22.26,3.57,20.12,2.94,69.88,10.74,14.56,16.86,9.51,10.6-.06,46.45-42.82,19.53-20.22,9.48,28.11,44.29,40.45,62.45,13.29,20.71,1.19,2.26c.35.66-2.18,1.49-3.09,1.28l-30.42-7.02-13.57-3.02Z",
    ],
  },
  {
    id: "Z",
    svgId: "letter-Z",
    paths: [
      "M1206.67,285.92l42.23,27.75-39.9-9.74-79.36-20.46-37.5-9.55-33.05-49.52,86.25-120.14-15.65-3.98-58.47-11.98-.13-23.9-8.69-9.65c-3.32-3.68-6.65-7.06-8.48-12.24l92.36,22.18,28.96,7.13,29,7.23,17.97,5.06-15.89,22.81-37.3,54.59-47.64,69.44,59.49,17.1,19.25,5.14,6.56,32.73Z",
    ],
  },
] as const;

/** フラット path（後方互換）。左→右・文字内順 */
export const UNITERZ_LOGO_SPLASH_PATHS = UNITERZ_LOGO_LETTERS.flatMap(
  (letter) => letter.paths
) as readonly string[];

/**
 * 左→右の視覚順（フラット path インデックス）。
 * LETTERS 順に並べたため恒等写像。
 */
export const UNITERZ_LOGO_SPLASH_LTR_ORDER = UNITERZ_LOGO_SPLASH_PATHS.map(
  (_, i) => i
) as readonly number[];

/** 文字インデックス → その文字の先頭フラット path インデックス */
export const UNITERZ_LOGO_LETTER_PATH_OFFSETS: readonly number[] = (() => {
  const offsets: number[] = [];
  let acc = 0;
  for (const letter of UNITERZ_LOGO_LETTERS) {
    offsets.push(acc);
    acc += letter.paths.length;
  }
  return offsets;
})();

export const UNITERZ_LOGO_SPLASH_STROKE_LEN = 4200;
export const UNITERZ_LOGO_SPLASH_ACCENT = "#00F5FF";
export const UNITERZ_LOGO_SPLASH_MAGENTA = "#FF2BD6";
export const UNITERZ_LOGO_SPLASH_PHOSPHOR = "#39FF14";

/** Space スプラッシュ — 暗いサイバー空間パレット */
export const UNITERZ_LOGO_SPLASH_SPACE = {
  bgDeep: "#030609",
  bgMid: "#05090D",
  accent: "#00D9FF",
  accentBright: "#3DEBFF",
  accentBlue: "#008CFF",
  logoWhite: "#FFFFFF",
  totalMs: 2300,
} as const;

export type UniterzLogoSplashVariantId =
  | "letters"
  | "form"
  | "space"
  | "pass"
  | "flash"
  | "glitch"
  | "rise"
  | "boot"
  | "warp"
  | "slice"
  | "lightning";

export type UniterzLogoSplashVariant = {
  id: UniterzLogoSplashVariantId;
  nameJa: string;
  nameEn: string;
  noteJa: string;
  noteEn: string;
  totalMs: number;
};

export const UNITERZ_LOGO_SPLASH_VARIANTS: readonly UniterzLogoSplashVariant[] = [
  {
    id: "letters",
    nameJa: "Letters",
    nameEn: "Letters",
    noteJa: "文字単位で左からスタガー出現。分割ロゴの基本デモ。",
    noteEn: "Letter-by-letter stagger — baseline for split logo.",
    totalMs: 2200,
  },
  {
    id: "form",
    nameJa: "Form",
    nameEn: "Form",
    noteJa: "ロゴ path に沿って線が走り、輪郭を形成して白塗りで確定。",
    noteEn: "Lines run along logo paths, form the outline, then white fill.",
    totalMs: 2400,
  },
  {
    id: "space",
    nameJa: "Space",
    nameEn: "Space",
    noteJa: "暗いサイバー空間。粒子・スキャン・パルスで起動し、白ロゴが静定。",
    noteEn: "Dark cyber space — particles, scan, pulse; white mark settles.",
    totalMs: 2300,
  },
  {
    id: "pass",
    nameJa: "Pass",
    nameEn: "Pass",
    noteJa: "透視スケールで寄る。白ロゴだけ、くぐって通過。",
    noteEn: "True perspective approach — white mark only, then through.",
    totalMs: 3600,
  },
  {
    id: "flash",
    nameJa: "Flash",
    nameEn: "Flash",
    noteJa: "画面が白飛びしてから、露光が落ちてロゴが焼き付く。",
    noteEn: "Full-frame whiteout, then exposure settles into the mark.",
    totalMs: 2200,
  },
  {
    id: "glitch",
    nameJa: "Glitch",
    nameEn: "Glitch",
    noteJa: "帯ずれ・RGB 破綻・チラつきのあと、急にロック。",
    noteEn: "Band offsets, RGB break, stutter — then hard lock.",
    totalMs: 2600,
  },
  {
    id: "rise",
    nameJa: "Rise",
    nameEn: "Rise",
    noteJa: "下からリキッドメタルが満ちてロゴが立ち上がる。",
    noteEn: "Liquid-metal fill rises from the bottom.",
    totalMs: 2500,
  },
  {
    id: "boot",
    nameJa: "Boot",
    nameEn: "Boot",
    noteJa: "CRT 電源オン。緑蛍光 → ロール → 白ロゴ確定。",
    noteEn: "CRT power-on: phosphor green, roll, then white lock.",
    totalMs: 2800,
  },
  {
    id: "warp",
    nameJa: "Warp",
    nameEn: "Warp",
    noteJa: "点から回転ズームイン。オーバーシュートして着地。",
    noteEn: "Spin-zoom from a point, overshoot, land.",
    totalMs: 2300,
  },
  {
    id: "slice",
    nameJa: "Slice",
    nameEn: "Slice",
    noteJa: "横帯が交互に左右から飛び込んで一枚絵になる。",
    noteEn: "Horizontal bands slam in from alternating sides.",
    totalMs: 2400,
  },
  {
    id: "lightning",
    nameJa: "Lightning",
    nameEn: "Lightning",
    noteJa: "暗闇に落雷。周辺照明とフラッシュでロゴが浮かび上がる。",
    noteEn: "Strike in darkness — ambient flash reveals the white mark.",
    totalMs: 2400,
  },
] as const;

/** 後方互換（デフォルト尺） */
export const UNITERZ_LOGO_SPLASH_TIMING = {
  strokeMs: 1100,
  fillMs: 700,
  bloomMs: 400,
  holdMs: 400,
  totalMs: 2600,
} as const;
