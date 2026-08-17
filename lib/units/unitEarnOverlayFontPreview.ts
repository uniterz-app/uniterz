/**
 * Unit 獲得オーバーレイ — フォント案（プレビュー用メタ）。
 * Web は全案、Native はロード済みフォントのみ。
 */

export type UnitEarnOverlayFontId =
  | "noto-michroma"
  | "current"
  | "noto-orbitron"
  | "noto-audiowide"
  | "noto-chakra"
  | "noto-exo2"
  | "noto-quantico"
  | "noto-electrolize"
  | "noto-sharetech"
  | "noto-russo"
  | "zen-orbitron"
  | "noto-rajdhani"
  | "noto-bebas"
  | "noto-alfa"
  | "noto-montserrat"
  | "noto-space"
  | "zen-oxanium"
  | "zen-bebas"
  | "zen-alfa"
  | "mplus-oxanium"
  | "mplus-rajdhani";

export type UnitEarnOverlayFontVariant = {
  id: UnitEarnOverlayFontId;
  nameJa: string;
  nameEn: string;
  noteJa: string;
  noteEn: string;
  /** 題名・補足の日本語側 */
  titleStack: string;
  /** 順位・金額・ボタンのラテン側 */
  metricStack: string;
  /** 現行採用 */
  current?: boolean;
  /** 角張り系（幾何・スクエア） */
  angular?: boolean;
  /** Native にフォントが入っている案だけ true */
  native?: boolean;
};

export const UNIT_EARN_OVERLAY_FONT_VARIANTS: readonly UnitEarnOverlayFontVariant[] =
  [
    {
      id: "current",
      nameJa: "Noto × Oxanium",
      nameEn: "Noto × Oxanium",
      noteJa: "本番採用。題名 Noto + 数値 Oxanium。",
      noteEn: "Production: Noto titles + Oxanium metrics.",
      titleStack: "Noto Sans JP",
      metricStack: "Oxanium",
      current: true,
      native: true,
    },
    {
      id: "noto-michroma",
      nameJa: "Noto × Michroma",
      nameEn: "Noto × Michroma",
      noteJa: "PRO バッジ系のサイバーラテン。",
      noteEn: "PRO-badge cyber Michroma.",
      titleStack: "Noto Sans JP",
      metricStack: "Michroma",
      native: true,
    },
    {
      id: "noto-orbitron",
      nameJa: "Noto × Orbitron",
      nameEn: "Noto × Orbitron",
      noteJa: "角張り。幾何スクエアの SF / HUD 定番。",
      noteEn: "Angular geometric SF / HUD classic.",
      titleStack: "Noto Sans JP",
      metricStack: "Orbitron",
      angular: true,
      native: true,
    },
    {
      id: "noto-audiowide",
      nameJa: "Noto × Audiowide",
      nameEn: "Noto × Audiowide",
      noteJa: "角張り。ゲームタイトルっぽい太い角。",
      noteEn: "Angular — chunky game-title edges.",
      titleStack: "Noto Sans JP",
      metricStack: "Audiowide",
      angular: true,
      native: true,
    },
    {
      id: "noto-chakra",
      nameJa: "Noto × Chakra",
      nameEn: "Noto × Chakra Petch",
      noteJa: "角張り。テック寄りゴシック。",
      noteEn: "Angular tech gothic.",
      titleStack: "Noto Sans JP",
      metricStack: "Chakra Petch",
      angular: true,
      native: true,
    },
    {
      id: "noto-exo2",
      nameJa: "Noto × Exo 2",
      nameEn: "Noto × Exo 2",
      noteJa: "角張り。シャープな未来系サンセリフ。",
      noteEn: "Angular futuristic sans.",
      titleStack: "Noto Sans JP",
      metricStack: "Exo 2",
      angular: true,
      native: true,
    },
    {
      id: "noto-quantico",
      nameJa: "Noto × Quantico",
      nameEn: "Noto × Quantico",
      noteJa: "角張り。軍用スクエア感。",
      noteEn: "Angular military-square feel.",
      titleStack: "Noto Sans JP",
      metricStack: "Quantico",
      angular: true,
    },
    {
      id: "noto-electrolize",
      nameJa: "Noto × Electrolize",
      nameEn: "Noto × Electrolize",
      noteJa: "角張り。細い電子機器ラベル風。",
      noteEn: "Angular thin electronics-label vibe.",
      titleStack: "Noto Sans JP",
      metricStack: "Electrolize",
      angular: true,
    },
    {
      id: "noto-sharetech",
      nameJa: "Noto × Share Tech",
      nameEn: "Noto × Share Tech Mono",
      noteJa: "角張り。等幅ターミナル。",
      noteEn: "Angular monospace terminal.",
      titleStack: "Noto Sans JP",
      metricStack: "Share Tech Mono",
      angular: true,
    },
    {
      id: "noto-russo",
      nameJa: "Noto × Russo One",
      nameEn: "Noto × Russo One",
      noteJa: "角張り。太い角ディスプレイ。",
      noteEn: "Angular bold display block.",
      titleStack: "Noto Sans JP",
      metricStack: "Russo One",
      angular: true,
    },
    {
      id: "zen-orbitron",
      nameJa: "Zen × Orbitron",
      nameEn: "Zen × Orbitron",
      noteJa: "角張り和文 + 幾何ラテン。（Web）",
      noteEn: "Angular JP Zen + Orbitron. (Web)",
      titleStack: "Zen Kaku Gothic New",
      metricStack: "Orbitron",
      angular: true,
    },
    {
      id: "current",
      nameJa: "Noto × Oxanium",
      nameEn: "Noto × Oxanium",
      noteJa: "以前の本番。比較用。",
      noteEn: "Previous production — for compare.",
      titleStack: "Noto Sans JP",
      metricStack: "Oxanium",
      native: true,
    },
    {
      id: "noto-rajdhani",
      nameJa: "Noto × Rajdhani",
      nameEn: "Noto × Rajdhani",
      noteJa: "競技 HUD 寄り。数字がややタイト。",
      noteEn: "HUD-like; tighter numerals.",
      titleStack: "Noto Sans JP",
      metricStack: "Rajdhani",
      native: true,
    },
    {
      id: "noto-bebas",
      nameJa: "Noto × Bebas",
      nameEn: "Noto × Bebas",
      noteJa: "金額・順位が横に伸びるディスプレイ感。",
      noteEn: "Wide display numerals (Bebas).",
      titleStack: "Noto Sans JP",
      metricStack: "Bebas Neue",
      native: true,
    },
    {
      id: "noto-alfa",
      nameJa: "Noto × Alfa",
      nameEn: "Noto × Alfa",
      noteJa: "ランキング数値と同じスラブ。重厚。",
      noteEn: "Same slab as ranking metrics.",
      titleStack: "Noto Sans JP",
      metricStack: "Alfa Slab One",
      native: true,
    },
    {
      id: "noto-montserrat",
      nameJa: "Noto × Montserrat",
      nameEn: "Noto × Montserrat",
      noteJa: "試合スコアと同じ Black Italic。",
      noteEn: "Match-score Montserrat Black Italic.",
      titleStack: "Noto Sans JP",
      metricStack: "Montserrat Black Italic",
      native: true,
    },
    {
      id: "noto-space",
      nameJa: "Noto × Space",
      nameEn: "Noto × Space",
      noteJa: "Space Grotesk。幾何的で近代的。（Web）",
      noteEn: "Geometric Space Grotesk. (Web)",
      titleStack: "Noto Sans JP",
      metricStack: "Space Grotesk",
    },
    {
      id: "zen-oxanium",
      nameJa: "Zen × Oxanium",
      nameEn: "Zen × Oxanium",
      noteJa: "題名を Zen Kaku に。角ばった和文。（Web）",
      noteEn: "Zen Kaku titles + Oxanium. (Web)",
      titleStack: "Zen Kaku Gothic New",
      metricStack: "Oxanium",
      angular: true,
    },
    {
      id: "zen-bebas",
      nameJa: "Zen × Bebas",
      nameEn: "Zen × Bebas",
      noteJa: "和文ゴシック × 横長ディスプレイ。（Web）",
      noteEn: "Zen titles + Bebas metrics. (Web)",
      titleStack: "Zen Kaku Gothic New",
      metricStack: "Bebas Neue",
    },
    {
      id: "zen-alfa",
      nameJa: "Zen × Alfa",
      nameEn: "Zen × Alfa",
      noteJa: "重い和文 + スラブ数値。（Web）",
      noteEn: "Heavy Zen + Alfa slab. (Web)",
      titleStack: "Zen Kaku Gothic New",
      metricStack: "Alfa Slab One",
    },
    {
      id: "mplus-oxanium",
      nameJa: "M+ × Oxanium",
      nameEn: "M+ × Oxanium",
      noteJa: "M PLUS 1p の丸みのある和文。（Web）",
      noteEn: "Rounded M PLUS titles. (Web)",
      titleStack: "M PLUS 1p",
      metricStack: "Oxanium",
    },
    {
      id: "mplus-rajdhani",
      nameJa: "M+ × Rajdhani",
      nameEn: "M+ × Rajdhani",
      noteJa: "柔らかい和文 + タイトな数字。（Web）",
      noteEn: "Soft JP + tight Rajdhani. (Web)",
      titleStack: "M PLUS 1p",
      metricStack: "Rajdhani",
    },
  ] as const;

export const UNIT_EARN_OVERLAY_FONT_SAMPLE = {
  titleJa: "招待が成立",
  titleEn: "Invite confirmed",
  subtitleJa: "友達招待ボーナス",
  subtitleEn: "Referral bonus",
  rank: 8,
  amount: 10,
  claimJa: "獲得する",
  claimEn: "Claim",
} as const;
