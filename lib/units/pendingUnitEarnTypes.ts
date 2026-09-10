/**
 * users/{uid}/pending_unit_earns — 未再生の Unit 獲得演出
 */

import type { PendingUnitEarn } from "@/lib/units/pendingUnitEarn";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import {
  formatPeriodRankingUnitEarnLabel,
  formatPeriodRankingUnitEarnTitle,
} from "@/lib/units/formatPeriodRankingUnitEarn";

export type PendingUnitEarnDoc = {
  id: string;
  amount: number;
  reason: string;
  period?: string;
  label?: string;
  metric?: string;
  rank?: number | null;
  titleJa: string;
  titleEn: string;
  subtitleJa: string | null;
  subtitleEn: string | null;
  createdAtMs: number;
};

export type PendingUnitEarnListPayload = {
  ok: boolean;
  entries: PendingUnitEarnDoc[];
  error?: string;
};

export type PendingUnitEarnClaimPayload = {
  ok: boolean;
  claimed?: number;
  error?: string;
};

export function pendingUnitEarnDocToPlayEntry(
  doc: PendingUnitEarnDoc,
  language: string | null | undefined
): PendingUnitEarn {
  const lang = resolveLocalizedLang(language);
  const rank =
    typeof doc.rank === "number" && Number.isFinite(doc.rank)
      ? Math.max(1, Math.floor(doc.rank))
      : null;
  // 保存されているのは ja/en のみ。period / rank が揃っていれば 7 言語で作り直す。
  const period =
    doc.period === "weekly" || doc.period === "monthly" ? doc.period : null;
  const title =
    period && rank != null
      ? formatPeriodRankingUnitEarnTitle(period, doc.metric, rank, lang)
      : lang === "ja"
        ? doc.titleJa
        : doc.titleEn;
  const subtitle =
    period && doc.label
      ? formatPeriodRankingUnitEarnLabel(period, doc.label, lang)
      : lang === "ja"
        ? doc.subtitleJa
        : doc.subtitleEn;
  return {
    amount: Math.max(0, Math.floor(doc.amount)),
    title,
    subtitle,
    rank,
    label: title,
  };
}
