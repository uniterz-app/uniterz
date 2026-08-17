/** Web レポート共通 DATA SLAB 語彙（WeeklyReportView / MonthlyReportView）
 *
 * RN では fontFamily にウェイト込み名を使い、fontWeight は付けない
 *（`Oxanium_700Bold` + `fontWeight: "800"` は iOS でシステムフォントにフォールバックする）。
 * Web `nameOxanium` は 600/700/800、`nameBebas` は 400、本文 JP は Noto Sans JP。
 */
import { Platform, type TextStyle } from "react-native";

const pick = (name: string) =>
  Platform.select({ ios: name, android: name, default: name });

/** Web `font-semibold` / Oxanium 600 */
export const OXANIUM_600: TextStyle["fontFamily"] = pick("Oxanium_600SemiBold");
/** Web `font-bold` / Oxanium 700 — ラベル既定 */
export const OXANIUM_700: TextStyle["fontFamily"] = pick("Oxanium_700Bold");
/** Web `font-extrabold` / `font-black`（900 は未ロード → 800） */
export const OXANIUM_800: TextStyle["fontFamily"] = pick("Oxanium_800ExtraBold");

/** @deprecated 互換。既定は 700 */
export const OXANIUM = OXANIUM_700;
/** @deprecated 互換 */
export const OXANIUM_SEMI = OXANIUM_600;

/** Web `nameBebas` — ウェイトは 400 のみ。fontWeight を付けない */
export const BEBAS: TextStyle["fontFamily"] = pick("BebasNeue_400Regular");

/** Web `jp` 通常本文（font-normal / leading-relaxed） */
export const JP_400: TextStyle["fontFamily"] = pick("NotoSansJP_400Regular");
/** Web `jp` + font-semibold */
export const JP_600: TextStyle["fontFamily"] = pick("NotoSansJP_600SemiBold");
/** Web `jp` + font-bold — 短い強調 */
export const JP_700: TextStyle["fontFamily"] = pick("NotoSansJP_700Bold");
/** @deprecated 互換 → 700 */
export const JP = JP_700;

/** Web `nameRajdhani` — 英字の短い本文寄り */
export const RAJDHANI: TextStyle["fontFamily"] = pick("Rajdhani_700Bold");

/** Web `nameMichroma` — サイバー系ラテン（ウェイト 400 のみ。fontWeight を付けない） */
export const MICHROMA: TextStyle["fontFamily"] = pick("Michroma_400Regular");

/** 角張り系 — Unit 獲得フォントプレビュー等 */
export const ORBITRON_700: TextStyle["fontFamily"] = pick("Orbitron_700Bold");
export const ORBITRON_800: TextStyle["fontFamily"] = pick("Orbitron_800ExtraBold");
export const AUDIOWIDE: TextStyle["fontFamily"] = pick("Audiowide_400Regular");
export const CHAKRA_700: TextStyle["fontFamily"] = pick("ChakraPetch_700Bold");
export const EXO2_800: TextStyle["fontFamily"] = pick("Exo2_800ExtraBold");

export const PANEL_BG = "rgba(5,5,8,0.98)";

/** 週間＝シアン / 月間＝バイオレット。枠・グリッドの基調色 */
export const REPORT_FRAME = {
  weekly: {
    main: "#22d3ee",
    border: "rgba(34,211,238,0.40)",
    grid: "rgba(34,211,238,0.28)",
  },
  monthly: {
    main: "#a78bfa",
    border: "rgba(167,139,250,0.40)",
    grid: "rgba(167,139,250,0.28)",
  },
} as const;

export type ReportAccent = {
  main: string;
  border: string;
  tint: string;
  glow: string;
};

export const REPORT_ACCENT = {
  cyan: {
    main: "#22d3ee",
    border: "rgba(34,211,238,0.42)",
    tint: "rgba(34,211,238,0.08)",
    glow: "rgba(34,211,238,0.35)",
  },
  emerald: {
    main: "#34d399",
    border: "rgba(52,211,153,0.42)",
    tint: "rgba(52,211,153,0.08)",
    glow: "rgba(52,211,153,0.32)",
  },
  gold: {
    main: "#facc15",
    border: "rgba(250,204,21,0.4)",
    tint: "rgba(250,204,21,0.07)",
    glow: "rgba(250,204,21,0.3)",
  },
  orange: {
    main: "#fb923c",
    border: "rgba(251,146,60,0.42)",
    tint: "rgba(251,146,60,0.08)",
    glow: "rgba(251,146,60,0.32)",
  },
  rose: {
    main: "#fb7185",
    border: "rgba(251,113,133,0.42)",
    tint: "rgba(251,113,133,0.08)",
    glow: "rgba(251,113,133,0.3)",
  },
} as const satisfies Record<string, ReportAccent>;

export const MARK_YOU = "#fb923c";
export const MARK_MEDIAN = "rgba(255,255,255,0.55)";
export const MARK_TOP10 = "#fcd34d";

export function reportSlabStyle(accent: ReportAccent) {
  return {
    borderWidth: 1,
    borderColor: accent.border,
    backgroundColor: accent.tint,
    borderRadius: 2,
    overflow: "hidden" as const,
  };
}

export function fmtReportPt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function fmtReportRange(startKey: string, endKey: string): string {
  const md = (k: string) => {
    const [, m, d] = k.split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  return `${md(startKey)} – ${md(endKey)}`;
}

export function fmtReportMonth(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  return `${y}.${m}`;
}

/** 通常本文: ja → Noto 400, en → Rajdhani */
export function reportBodyFont(lang: "ja" | "en"): TextStyle["fontFamily"] {
  return lang === "ja" ? JP_400 : RAJDHANI;
}

/** セミボールド本文（バトル要約・名前など） */
export function reportBodyFontSemibold(lang: "ja" | "en"): TextStyle["fontFamily"] {
  return lang === "ja" ? JP_600 : RAJDHANI;
}
