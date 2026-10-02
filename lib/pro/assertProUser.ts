import { getAdminDb } from "@/lib/firebaseAdmin";
import { userDataIsPro } from "@/lib/profile/proSkinUnlock";

/** users.plan === "pro" かつ proUntil 未超過なら true */
export async function assertProUser(uid: string): Promise<boolean> {
  const snap = await getAdminDb().doc(`users/${uid}`).get();
  if (!snap.exists) return false;
  return userDataIsPro(snap.data() ?? {});
}
