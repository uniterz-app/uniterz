import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  refreshGoogleSubscriptionByToken,
  revokeGoogleProIfCurrent,
} from "@/lib/billing/google/applyGooglePlayEntitlement";
import { googlePlayPackageName } from "@/lib/billing/google/googlePlayEnv";
import { resolveUidByGooglePurchaseToken } from "@/lib/billing/userBillingSecure";

/** Real-time developer notification（Pub/Sub message.data を base64 デコードした JSON） */
export type GooglePlayRtdnPayload = {
  packageName?: string;
  subscriptionNotification?: { notificationType?: number; purchaseToken?: string };
  voidedPurchaseNotification?: { purchaseToken?: string };
  oneTimeProductNotification?: { notificationType?: number; purchaseToken?: string };
  testNotification?: unknown;
};

/**
 * 通知の中身は信用せず、トークンで Play API を引き直して反映する。
 * 偽の通知が来ても「最新状態で再同期」になるだけ。
 */
export async function handleGooglePlayRtdn(
  payload: GooglePlayRtdnPayload,
  db: Firestore = getAdminDb()
): Promise<void> {
  if (payload.testNotification) return;
  if (payload.packageName && payload.packageName !== googlePlayPackageName()) return;

  const subToken = payload.subscriptionNotification?.purchaseToken?.trim();
  if (subToken) {
    await refreshGoogleSubscriptionByToken(db, subToken);
    return;
  }

  const voidedToken = payload.voidedPurchaseNotification?.purchaseToken?.trim();
  if (voidedToken) {
    const uid = await resolveUidByGooglePurchaseToken(db, voidedToken);
    if (uid) await revokeGoogleProIfCurrent(db, uid, voidedToken);
  }
}
