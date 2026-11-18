import { getAdminDb } from "@/lib/firebaseAdmin";
import { userDataIsPro } from "@/lib/profile/proSkinUnlock";

/** users.plan === "pro" かつ proUntil 未超過なら true */
export async function assertProUser(uid: string): Promise<boolean> {
  const db = getAdminDb();
  // 判定に使うのは plan / proUntil だけ。users doc 全体を受け取らない（Firestore 転送量）
  const [snap] = await db.getAll(db.doc(`users/${uid}`), {
    fieldMask: ["plan", "proUntil"],
  });
  if (!snap.exists) return false;
  return userDataIsPro(snap.data() ?? {});
}
