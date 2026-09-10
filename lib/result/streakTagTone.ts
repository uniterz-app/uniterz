import { normalizeWinStreak } from "@/lib/ui/normalizeWinStreak";
import type { UiStrings } from "@/lib/i18n/ui";

export type StreakTagTone = {
  accent: string;
  ink: string;
  wash: string;
  glow: string;
  nameJa: string;
  nameEn: string;
  /** 7言語のティア名 */
  name: UiStrings;
};

const TIER_NAMES = {
  hot: {
    ja: "紅",
    en: "HOT",
    ko: "홍",
    zh: "红",
    es: "HOT",
    pt: "HOT",
    fr: "HOT",
  },
  gold: {
    ja: "金",
    en: "GOLD",
    ko: "금",
    zh: "金",
    es: "GOLD",
    pt: "GOLD",
    fr: "GOLD",
  },
  cyber: {
    ja: "電",
    en: "CYBER",
    ko: "전",
    zh: "电",
    es: "CYBER",
    pt: "CYBER",
    fr: "CYBER",
  },
  steel: {
    ja: "鋼",
    en: "STEEL",
    ko: "강",
    zh: "钢",
    es: "STEEL",
    pt: "STEEL",
    fr: "STEEL",
  },
} satisfies Record<string, UiStrings>;

/**
 * リザルトカード左上 IMPACT 連勝タグの色。
 * 本番見た目は 03 塗りピル（全塗り + インク文字 + skew）。
 * 3–4 鋼 / 5–6 シアン / 7–9 金 / 10+ 紅
 */
export function streakTagTone(activeWinStreak: unknown): StreakTagTone {
  const n = normalizeWinStreak(activeWinStreak);
  if (n >= 10) {
    return {
      accent: "#FF3B5C",
      ink: "#140308",
      wash: "rgba(255,59,92,0.18)",
      glow: "rgba(255,59,92,0.5)",
      nameJa: TIER_NAMES.hot.ja,
      nameEn: TIER_NAMES.hot.en,
      name: TIER_NAMES.hot,
    };
  }
  if (n >= 7) {
    return {
      accent: "#FCD34D",
      ink: "#1A1200",
      wash: "rgba(252,211,77,0.16)",
      glow: "rgba(252,211,77,0.48)",
      nameJa: TIER_NAMES.gold.ja,
      nameEn: TIER_NAMES.gold.en,
      name: TIER_NAMES.gold,
    };
  }
  if (n >= 5) {
    return {
      accent: "#00F5FF",
      ink: "#031418",
      wash: "rgba(0,245,255,0.16)",
      glow: "rgba(0,245,255,0.42)",
      nameJa: TIER_NAMES.cyber.ja,
      nameEn: TIER_NAMES.cyber.en,
      name: TIER_NAMES.cyber,
    };
  }
  return {
    accent: "#94A3B8",
    ink: "#0B1018",
    wash: "rgba(148,163,184,0.14)",
    glow: "rgba(148,163,184,0.3)",
    nameJa: TIER_NAMES.steel.ja,
    nameEn: TIER_NAMES.steel.en,
    name: TIER_NAMES.steel,
  };
}

export function streakTagLabel(n: number) {
  return `W${n}`;
}
