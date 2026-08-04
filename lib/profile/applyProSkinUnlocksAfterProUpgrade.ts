/**
 * Free→Pro 直後に進捗・順位権利を unlocked へ合流（notice なし）。
 * Stripe / IAP 課金成功後に呼ぶ。失敗しても課金自体は阻害しない。
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  ensurePersistedProSkinUnlocks,
  progressFromUserDocOnly,
} from "@/lib/profile/proSkinUnlockServer";
import { userDataIsPro } from "@/lib/profile/proSkinUnlock";

export async function applyProSkinUnlocksAfterProUpgrade(
  db: Firestore,
  uid: string
): Promise<void> {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) return;
  const userData = (snap.data() ?? {}) as Record<string, unknown>;
  if (!userDataIsPro(userData)) return;
  const progress = progressFromUserDocOnly(userData);
  await ensurePersistedProSkinUnlocks(db, uid, userData, progress);
}
