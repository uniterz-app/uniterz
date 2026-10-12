import { getFirestore } from "firebase-admin/firestore";
import { userDataPlan } from "./userPlanActive";

const BATCH = 300;

/**
 * users から proUntil 込みの現在 plan を読む。cumulative_stats の plan は
 * 書き込み時点のコピーで、更新・失効が反映されないため PRO 判定には使わない。
 */
export async function loadActiveUserPlans(
  uids: readonly string[]
): Promise<Map<string, "free" | "pro">> {
  const db = getFirestore();
  const unique = [...new Set(uids.filter(Boolean))];
  const out = new Map<string, "free" | "pro">();
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const snaps = await db.getAll(
      ...batch.map((uid) => db.collection("users").doc(uid))
    );
    snaps.forEach((snap, j) => {
      out.set(batch[j]!, userDataPlan(snap.exists ? snap.data() : undefined));
    });
  }
  return out;
}
