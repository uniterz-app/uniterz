import { normalizeWinStreak } from "@/lib/ui/normalizeWinStreak";

export type StreakTagTone = {
  accent: string;
  ink: string;
  wash: string;
  glow: string;
  nameJa: string;
  nameEn: string;
};

/**
 * リザルトカード左上 IMPACT 連勝タグの色。
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
      nameJa: "紅",
      nameEn: "HOT",
    };
  }
  if (n >= 7) {
    return {
      accent: "#FCD34D",
      ink: "#1A1200",
      wash: "rgba(252,211,77,0.16)",
      glow: "rgba(252,211,77,0.48)",
      nameJa: "金",
      nameEn: "GOLD",
    };
  }
  if (n >= 5) {
    return {
      accent: "#00F5FF",
      ink: "#031418",
      wash: "rgba(0,245,255,0.16)",
      glow: "rgba(0,245,255,0.42)",
      nameJa: "電",
      nameEn: "CYBER",
    };
  }
  return {
    accent: "#94A3B8",
    ink: "#0B1018",
    wash: "rgba(148,163,184,0.14)",
    glow: "rgba(148,163,184,0.3)",
    nameJa: "鋼",
    nameEn: "STEEL",
  };
}

export function streakTagLabel(n: number) {
  return `W${n}`;
}
