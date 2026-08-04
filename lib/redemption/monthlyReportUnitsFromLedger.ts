/**
 * 月次レポート unitsEarned / breakdown を ledger から埋める（弁護士後フラグ）
 */

import type { Firestore } from "firebase-admin/firestore";
import { isMonthlyReportUnitsFromLedger } from "@/lib/redemption/redemptionLiveFlags";
import { normalizeUnitLedgerReason } from "@/lib/units/formatUnitLedgerEntry";

export type MonthlyUnitsFromLedger = {
  unitsEarned: number;
  breakdown: Array<{ reason: string; amount: number }>;
};

/**
 * 指定月（JST YYYY-MM）の付与分を合算。
 * フラグ OFF のときは stub（0 / 空）。
 */
export async function loadMonthlyUnitsFromLedger(
  db: Firestore,
  uid: string,
  monthKey: string
): Promise<MonthlyUnitsFromLedger> {
  if (!isMonthlyReportUnitsFromLedger()) {
    return { unitsEarned: 0, breakdown: [] };
  }

  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return { unitsEarned: 0, breakdown: [] };
  const start = new Date(Date.UTC(y, m - 1, 1, -9, 0, 0)); // JST 月初 ≈ UTC-9h
  const endExclusive = new Date(Date.UTC(y, m, 1, -9, 0, 0));

  const snap = await db.collection("unit_ledger").where("uid", "==", uid).get();
  const byReason = new Map<string, number>();
  let total = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const amount =
      typeof data.amount === "number" && Number.isFinite(data.amount)
        ? data.amount
        : 0;
    if (amount <= 0) continue;

    const ts = data.createdAt as
      | { toMillis?: () => number; seconds?: number }
      | null
      | undefined;
    let ms = 0;
    if (ts && typeof ts.toMillis === "function") ms = ts.toMillis();
    else if (ts && typeof ts.seconds === "number") ms = ts.seconds * 1000;
    if (ms < start.getTime() || ms >= endExclusive.getTime()) continue;

    const reason = normalizeUnitLedgerReason(data.reason);
    byReason.set(reason, (byReason.get(reason) ?? 0) + amount);
    total += amount;
  }

  return {
    unitsEarned: total,
    breakdown: [...byReason.entries()].map(([reason, amount]) => ({
      reason,
      amount,
    })),
  };
}
