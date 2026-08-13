import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Pro 加入開始日。未設定のときだけ書き込む（再加入で上書きしない）。
 */
export async function ensureUserPlanStartDate(
  db: Firestore,
  uid: string
): Promise<void> {
  const ref = db.doc(`users/${uid}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.data()?.planStartDate;
    if (existing) return;
    tx.set(
      ref,
      {
        planStartDate: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}
