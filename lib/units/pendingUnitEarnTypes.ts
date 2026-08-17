/**
 * users/{uid}/pending_unit_earns — 未再生の Unit 獲得演出
 */

import type { PendingUnitEarn } from "@/lib/units/pendingUnitEarn";

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
  language: "ja" | "en"
): PendingUnitEarn {
  const title = language === "en" ? doc.titleEn : doc.titleJa;
  const subtitle = language === "en" ? doc.subtitleEn : doc.subtitleJa;
  const rank =
    typeof doc.rank === "number" && Number.isFinite(doc.rank)
      ? Math.max(1, Math.floor(doc.rank))
      : null;
  return {
    amount: Math.max(0, Math.floor(doc.amount)),
    title,
    subtitle,
    rank,
    label: title,
  };
}
