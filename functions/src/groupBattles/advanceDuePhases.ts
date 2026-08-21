/**
 * スケジュール到達の大会フェーズを進める（Cloud Functions）。
 * Next `lib/groupBattles/server/advanceDuePhases.ts` と同方針。
 */

import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import { admin } from "../firebase";

const COLLECTION = "group_battles";

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
    } else if (status === "forming" || status === "entered") {
      batch.update(doc.ref, {
        status: "disbanded",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
  await batch.commit();
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
      }
    } catch (err) {
      console.warn("[advanceDueGroupBattlePhases]", doc.id, err);
    }
  }

  return { advanced };
}
