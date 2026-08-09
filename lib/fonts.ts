// app/lib/fonts.ts

import {
  Alfa_Slab_One,
  Michroma,
  Montserrat,
  Noto_Sans_JP,
  Oxanium,
  Rajdhani,
  Space_Grotesk,
  Bebas_Neue,
  Zen_Kaku_Gothic_New,
  M_PLUS_1p,
} from "next/font/google";

/* =========================
   Display / Name Fonts
========================= */

export const nameOxanium = Oxanium({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const nameRajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/** 試合カード中央の VS（Black Italic Sans Serif） */
const matchVsMontserrat = Montserrat({
  subsets: ["latin"],
  weight: "900",
  style: "italic",
  display: "swap",
});

export const matchVsLabelClass = matchVsMontserrat.className;

/** PRO バッジ — Eurostile（未インストール時は Michroma で Web フォールバック） */
const proBadgeEurostileFallback = Michroma({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const proBadgeWordClass = proBadgeEurostileFallback.className;

/** Unit 獲得オーバーレイ等 — サイバー系ラテン（Michroma） */
export const nameMichroma = proBadgeEurostileFallback;

export const proBadgeWordFamily = [
  '"Eurostile"',
  '"Eurostile Extended"',
  '"Eurostile Next"',
  '"Eurostile Next LT Pro"',
  proBadgeEurostileFallback.style.fontFamily,
  "sans-serif",
].join(", ");

/** 試合カード・リザルトのスコア（VS と同じ Montserrat Black Italic） */
export const matchScoreClass = [
  matchVsMontserrat.className,
  "tabular-nums",
].join(" ");

export const nameSpace = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const nameBebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/* =========================
   JP / Utility Fonts
========================= */

export const nameZen = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});

export const nameMplus = M_PLUS_1p({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

/* =========================
   Accent Fonts
========================= */

export const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/** サマリーカード・ランキングの数値（Alfa Slab One）— サマリーを基準に両方で共通 */
export const summaryMetricNumClass = [
  alfa.className,
  "font-bold tabular-nums tracking-wide",
].join(" ");

/** CyberNumber 用（ランキング得点と同じ Alfa Slab One） */
export const cyberNumberDisplay = alfa;

/** アプリ日本語の基準フォント（モーダル・ランキング等と共通） */
export const jp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

/** リザルト Performance Stats・カード下部の数値（nameOxanium とは別インスタンス／太めウェイト込み） */
const resultStatsOxanium = Oxanium({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const resultStatsMetricNumClass = [
  resultStatsOxanium.className,
  "tabular-nums tracking-tight font-bold",
].join(" ");

/** ネイティブ `ResultLeagueLabelSkia`（Oxanium 800）に合わせたリザルト NBA ラベル用 */
const resultLeagueLabelOxanium = Oxanium({
  subsets: ["latin"],
  weight: "800",
  display: "swap",
});

export const resultLeagueNbaLabelFontClass = resultLeagueLabelOxanium.className;