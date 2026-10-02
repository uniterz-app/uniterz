/**
 * スケジュール到達の大会フェーズを進める（Cloud Functions）。
 * Next `lib/groupBattles/server/advanceDuePhases.ts` と同方針。
 */

import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import { admin } from "../firebase";

const COLLECTION = "group_battles";
/** Next `GROUP_BATTLE_FINALIZE_GRACE_DAYS` と揃える */
const FINALIZE_GRACE_DAYS = 2;
/** Next `GROUP_BATTLE_CLOSE_AFTER_FINAL_DAYS` と揃える */
const CLOSE_AFTER_FINAL_DAYS = 1;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type Phase =
  | "announced"
  | "recruiting"
  | "locking"
  | "battle"
  | "settling"
  | "final"
  | "closed";

function tsMs(v: unknown): number {
  if (
    v &&
    typeof v === "object" &&
    "toMillis" in v &&
    typeof (v as { toMillis: () => number }).toMillis === "function"
  ) {
    return (v as { toMillis: () => number }).toMillis();
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function settlingToFinalAtMs(battleEndAtMs: number): number {
  return battleEndAtMs + FINALIZE_GRACE_DAYS * MS_PER_DAY;
}

function finalToClosedAtMs(battleEndAtMs: number): number {
  return (
    battleEndAtMs + (FINALIZE_GRACE_DAYS + CLOSE_AFTER_FINAL_DAYS) * MS_PER_DAY
  );
}

async function lockEligible(db: Firestore, battleId: string): Promise<void> {
  const snap = await db
    .collection(COLLECTION)
    .doc(battleId)
    .collection("squads")
    .get();
  const batch = db.batch();
  for (const doc of snap.docs) {
    const d = doc.data();
    const status = String(d.status ?? "");
    const count = Number(d.memberCount ?? 0) || 0;
    if (status === "entered" && count >= 3 && count <= 5) {
      batch.update(doc.ref, {
        status: "locked",
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (status !== "disqualified") {
      batch.update(doc.ref, {
        status: "disbanded",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
  await batch.commit();
  await cancelPendingJoinActivity(db, battleId);
}

async function cancelPendingJoinActivity(
  db: Firestore,
  battleId: string
): Promise<void> {
  const battleRef = db.collection(COLLECTION).doc(battleId);
  const [reqSnap, invSnap] = await Promise.all([
    battleRef.collection("join_requests").where("status", "==", "pending").get(),
    battleRef.collection("squad_invites").where("status", "==", "pending").get(),
  ]);
  const CHUNK = 400;
  const docs = [...reqSnap.docs, ...invSnap.docs];
  for (let i = 0; i < docs.length; i += CHUNK) {
    const slice = docs.slice(i, i + CHUNK);
    const b = db.batch();
    for (const d of slice) {
      b.update(d.ref, {
        status: "cancelled",
        resolvedAt: FieldValue.serverTimestamp(),
      });
    }
    await b.commit();
  }
}

export async function advanceDueGroupBattlePhases(): Promise<{
  advanced: number;
}> {
  const db = getFirestore(admin.app());
  const now = Date.now();
  const snap = await db.collection(COLLECTION).limit(80).get();
  let advanced = 0;

  for (const doc of snap.docs) {
    const d = doc.data();
    const phase = String(d.phase ?? "") as Phase;
    const recruitStartAtMs = tsMs(d.recruitStartAt);
    const recruitEndAtMs = tsMs(d.recruitEndAt);
    const battleEndAtMs = tsMs(d.battleEndAt);

    try {
      if (
        phase === "announced" &&
        recruitStartAtMs > 0 &&
        now >= recruitStartAtMs
      ) {
        await doc.ref.update({
          phase: "recruiting",
          updatedAt: FieldValue.serverTimestamp(),
        });
        advanced += 1;
        continue;
      }

      if (
        phase === "recruiting" &&
        recruitEndAtMs > 0 &&
        now >= recruitEndAtMs
      ) {
        await doc.ref.update({
          phase: "locking",
          updatedAt: FieldValue.serverTimestamp(),
        });
        await lockEligible(db, doc.id);
        await doc.ref.update({
          phase: "battle",
          updatedAt: FieldValue.serverTimestamp(),
        });
        advanced += 1;
        continue;
      }

      if (phase === "battle" && battleEndAtMs > 0 && now >= battleEndAtMs) {
        await doc.ref.update({
          phase: "settling",
          updatedAt: FieldValue.serverTimestamp(),
        });
        advanced += 1;
        continue;
      }

      if (
        phase === "settling" &&
        battleEndAtMs > 0 &&
        now >= settlingToFinalAtMs(battleEndAtMs)
      ) {
        await doc.ref.update({
          phase: "final",
          updatedAt: FieldValue.serverTimestamp(),
        });
        advanced += 1;
        continue;
      }

      if (
        phase === "final" &&
        battleEndAtMs > 0 &&
        now >= finalToClosedAtMs(battleEndAtMs)
      ) {
        await doc.ref.update({
          phase: "closed",
          updatedAt: FieldValue.serverTimestamp(),
        });
        advanced += 1;
      }
    } catch (err) {
      console.warn("[advanceDueGroupBattlePhases]", doc.id, err);
    }
  }

  return { advanced };
}
