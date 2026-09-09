/**
 * リザルトカード面（一覧・詳細・予想オーバーレイ）の共通ラベル。
 */
import type { Language } from "@/lib/i18n/language";
import { normalizeLanguage } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

export function resultCardFaceCopy(
  language: Language | "ja" | "en" | null | undefined
) {
  const lang = normalizeLanguage(language) ?? "en";
  const r = t(lang).results;
  return {
    pendingCall: r.pendingCallLabel,
    marketBias: r.marketBiasTitle,
    upset: r.upsetPointsLabel,
    score: r.totalPointsLabel,
    totalPredictions: r.totalPredictionsCount,
  };
}
