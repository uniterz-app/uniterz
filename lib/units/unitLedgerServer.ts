/**
 * Admin — 自分の Unit 台帳を新しい順で取得
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  formatUnitLedgerAmount,
  normalizeUnitLedgerReason,
  unitLedgerReasonDetail,
  unitLedgerReasonTitle,
} from "@/lib/units/formatUnitLedgerEntry";
import type { UnitLedgerEntry } from "@/lib/units/unitLedgerTypes";

function createdAtMsFromDoc(data: Record<string, unknown>): number {
  const ts = data.createdAt as
    | { toMillis?: () => number; seconds?: number; _seconds?: number }
    | null
    | undefined;
  if (ts && typeof ts.toMillis === "function") {
    const ms = ts.toMillis();
    if (Number.isFinite(ms)) return ms;
  }
  if (ts && typeof ts.seconds === "number") return ts.seconds * 1000;
  if (ts && typeof ts._seconds === "number") return ts._seconds * 1000;
  const raw = data.createdAtMs;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return 0;
}

export async function loadUnitLedgerForUid(
  db: Firestore,
  uid: string,
  opts?: { limit?: number; language?: "ja" | "en" }
): Promise<{ balance: number; entries: UnitLedgerEntry[] }> {
  const language = opts?.language === "en" ? "en" : "ja";
  const limit = Math.min(100, Math.max(1, opts?.limit ?? 50));

  const userSnap = await db.collection("users").doc(uid).get();
  const balanceRaw = userSnap.data()?.unitBalance;
  const balance =
    typeof balanceRaw === "number" && Number.isFinite(balanceRaw)
      ? Math.max(0, Math.floor(balanceRaw))
      : 0;

  const snap = await db
    .collection("unit_ledger")
    .where("uid", "==", uid)
    .limit(limit * 2)
    .get();

  const rows: UnitLedgerEntry[] = snap.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const amount =
      typeof data.amount === "number" && Number.isFinite(data.amount)
        ? data.amount
        : 0;
    const reason = normalizeUnitLedgerReason(data.reason);
    const milestoneAt =
      typeof data.milestoneAt === "number" ? data.milestoneAt : undefined;
    const rank = typeof data.rank === "number" ? data.rank : undefined;
    const battleId =
      typeof data.battleId === "string" ? data.battleId : undefined;
    const period = typeof data.period === "string" ? data.period : undefined;
    const label = typeof data.label === "string" ? data.label : undefined;
    const metric = typeof data.metric === "string" ? data.metric : undefined;
    const meta = { milestoneAt, rank, battleId, period, label, metric };
    return {
      id: doc.id,
      amount,
      reason,
      title: unitLedgerReasonTitle(reason, language, meta),
      detail: unitLedgerReasonDetail(reason, language, meta),
      createdAtMs: createdAtMsFromDoc(data),
      meta,
    };
  });

  rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return { balance, entries: rows.slice(0, limit) };
}

/** デバッグ用 — format helpers 再エクスポート */
export { formatUnitLedgerAmount };
