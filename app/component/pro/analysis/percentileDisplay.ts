import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

/** レーダー 0–10 スコアからパーセンタイル概算（10% 刻み・チャートと整合） */
export function approxPercentileFromRadar10(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score * 10)));
}

export type PercentileTier = "elite" | "top" | "low";

export function formatPercentileDisplay(
  now: number,
  language: string | null | undefined
): { text: string; tier: PercentileTier } {
  const lang = resolveLocalizedLang(language);
  if (now >= 90) {
    return {
      text: L(lang, {
        ja: `上位 ${100 - now}%`,
        en: `Top ${100 - now}%`,
        ko: `상위 ${100 - now}%`,
        zh: `前 ${100 - now}%`,
        es: `Top ${100 - now}%`,
        pt: `Top ${100 - now}%`,
        fr: `Top ${100 - now}%`,
      }),
      tier: "elite",
    };
  }
  if (now >= 50) {
    return {
      text: L(lang, {
        ja: `上位 ${100 - now}%`,
        en: `Top ${100 - now}%`,
        ko: `상위 ${100 - now}%`,
        zh: `前 ${100 - now}%`,
        es: `Top ${100 - now}%`,
        pt: `Top ${100 - now}%`,
        fr: `Top ${100 - now}%`,
      }),
      tier: "top",
    };
  }
  return {
    text: L(lang, {
      ja: `下位 ${now}%`,
      en: `Bottom ${now}%`,
      ko: `하위 ${now}%`,
      zh: `后 ${now}%`,
      es: `Bottom ${now}%`,
      pt: `Bottom ${now}%`,
      fr: `Bottom ${now}%`,
    }),
    tier: "low",
  };
}

export function percentileTierTextClass(tier: PercentileTier): string {
  switch (tier) {
    case "elite":
      return "text-amber-400";
    case "top":
      return "text-orange-400";
    default:
      return "text-sky-400";
  }
}
