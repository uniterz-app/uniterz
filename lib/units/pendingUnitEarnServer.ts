/**
 * Admin — pending Unit 獲得演出の読取・既読
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { PendingUnitEarnDoc } from "@/lib/units/pendingUnitEarnTypes";

export const PENDING_UNIT_EARNS_SUBCOLLECTION = "pending_unit_earns";

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

export function pendingUnitEarnRef(
  db: Firestore,
  uid: string,
  id: string
) {
  return db
    .collection("users")
    .doc(uid)
    .collection(PENDING_UNIT_EARNS_SUBCOLLECTION)
    .doc(id);
}

export async function loadUnclaimedPendingUnitEarns(
  db: Firestore,
  uid: string,
  opts?: { limit?: number }
): Promise<PendingUnitEarnDoc[]> {
  const limit = Math.min(40, Math.max(1, opts?.limit ?? 20));
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection(PENDING_UNIT_EARNS_SUBCOLLECTION)
    .orderBy("createdAt", "asc")
    .limit(Math.min(80, limit * 3))
    .get();

  const rows: PendingUnitEarnDoc[] = [];
  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    if (data.claimedAt != null) continue;
    const amount =
      typeof data.amount === "number" && Number.isFinite(data.amount)
        ? Math.max(0, Math.floor(data.amount))
        : 0;
    if (amount <= 0) continue;
    const titleJa =
      typeof data.titleJa === "string" && data.titleJa.trim()
        ? data.titleJa.trim()
        : "Unit";
    const titleEn =
      typeof data.titleEn === "string" && data.titleEn.trim()
        ? data.titleEn.trim()
        : "Units";
    rows.push({
      id: doc.id,
      amount,
      reason: typeof data.reason === "string" ? data.reason : "unknown",
      period: typeof data.period === "string" ? data.period : undefined,
      label: typeof data.label === "string" ? data.label : undefined,
      metric: typeof data.metric === "string" ? data.metric : undefined,
      rank: typeof data.rank === "number" ? data.rank : null,
      titleJa,
      titleEn,
      subtitleJa:
        typeof data.subtitleJa === "string" ? data.subtitleJa : null,
      subtitleEn:
        typeof data.subtitleEn === "string" ? data.subtitleEn : null,
      createdAtMs: createdAtMsFromDoc(data),
    });
  }

  rows.sort((a, b) => a.createdAtMs - b.createdAtMs);
  return rows.slice(0, limit);
}

export async function claimPendingUnitEarns(
  db: Firestore,
  uid: string,
  ids: string[]
): Promise<number> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return 0;

  let claimed = 0;
  for (const id of unique) {
    const ref = pendingUnitEarnRef(db, uid, id);
    const did = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return false;
      const data = snap.data() as Record<string, unknown>;
      if (data.claimedAt != null) return false;
      tx.set(
        ref,
        { claimedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      return true;
    });
    if (did) claimed += 1;
  }
  return claimed;
}
