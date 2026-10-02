/**
 * 参加申請の取り下げ（申請者本人のみ）。
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  assertRecruitingOrThrow,
  getBattle,
  joinRequestsCol,
  parseJoinRequest,
} from "@/lib/groupBattles/server/firestore";

export async function cancelJoinRequest(
  db: Firestore,
  battleId: string,
  requestId: string,
  uid: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const battle = await getBattle(db, battleId);
  if (!battle) return { ok: false, error: "not_found", status: 404 };
  try {
    assertRecruitingOrThrow(battle.phase);
  } catch {
    return { ok: false, error: "phase_locked", status: 409 };
  }

  const ref = joinRequestsCol(db, battleId).doc(requestId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: "not_found", status: 404 };
  const row = parseJoinRequest(
    snap.id,
    snap.data() as Record<string, unknown>
  );
  if (row.applicantUid !== uid) {
    return { ok: false, error: "forbidden", status: 403 };
  }
  if (row.status !== "pending") {
    return { ok: false, error: "not_pending", status: 409 };
  }

  await ref.update({
    status: "cancelled",
    resolvedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true };
}
