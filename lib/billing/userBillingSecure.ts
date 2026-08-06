/**
 * 課金シークレットは users/{uid}/secure/billing に隔離（公開 users ドキュメントから外す）。
 * Admin SDK のみ書き込み。クライアントは本人 read のみ。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";

export const USER_BILLING_SECURE_DOC = "billing";

export type UserBillingSecureFields = {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  googlePurchaseToken?: string | null;
  appleOriginalTransactionId?: string | null;
};

export function userBillingSecureRef(db: Firestore, uid: string) {
  return db.collection("users").doc(uid).collection("secure").doc(USER_BILLING_SECURE_DOC);
}

export function stripeCustomerIndexRef(db: Firestore, customerId: string) {
  return db.collection("stripeCustomerIndex").doc(customerId);
}

export function stripeSubscriptionIndexRef(db: Firestore, subscriptionId: string) {
  return db.collection("stripeSubscriptionIndex").doc(subscriptionId);
}

/** Portal / 管理用: secure 優先、旧 users ルートフィールドにフォールバック */
export async function readUserStripeCustomerId(
  db: Firestore,
  uid: string,
  userData?: FirebaseFirestore.DocumentData | null
): Promise<string | null> {
  const secureSnap = await userBillingSecureRef(db, uid).get();
  const fromSecure = String(secureSnap.data()?.stripeCustomerId ?? "").trim();
  if (fromSecure) return fromSecure;
  const legacy = String(userData?.stripeCustomerId ?? "").trim();
  return legacy || null;
}

/** customerId → uid（Webhook）。index 優先、旧 users クエリにフォールバック */
export async function resolveUidByStripeCustomerId(
  db: Firestore,
  customerId: string
): Promise<string | null> {
  const id = String(customerId ?? "").trim();
  if (!id) return null;
  const idx = await stripeCustomerIndexRef(db, id).get();
  if (idx.exists) {
    const uid = String(idx.data()?.uid ?? "").trim();
    if (uid) return uid;
  }
  const legacy = await db
    .collection("users")
    .where("stripeCustomerId", "==", id)
    .limit(1)
    .get();
  if (legacy.empty) return null;
  return legacy.docs[0]!.id;
}

export async function resolveUidByStripeSubscriptionId(
  db: Firestore,
  subscriptionId: string
): Promise<string | null> {
  const id = String(subscriptionId ?? "").trim();
  if (!id) return null;
  const idx = await stripeSubscriptionIndexRef(db, id).get();
  if (idx.exists) {
    const uid = String(idx.data()?.uid ?? "").trim();
    if (uid) return uid;
  }
  const legacy = await db
    .collection("users")
    .where("stripeSubscriptionId", "==", id)
    .limit(1)
    .get();
  if (legacy.empty) return null;
  return legacy.docs[0]!.id;
}

/** secure に書き、公開 users からは課金フィールドを削除 */
export async function writeUserBillingSecure(
  db: Firestore,
  uid: string,
  fields: UserBillingSecureFields
): Promise<void> {
  const secureUpdate: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  const rootDelete: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if ("stripeCustomerId" in fields) {
    secureUpdate.stripeCustomerId = fields.stripeCustomerId ?? null;
    rootDelete.stripeCustomerId = FieldValue.delete();
    const cid = String(fields.stripeCustomerId ?? "").trim();
    if (cid) {
      await stripeCustomerIndexRef(db, cid).set(
        { uid, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
  }
  if ("stripeSubscriptionId" in fields) {
    secureUpdate.stripeSubscriptionId = fields.stripeSubscriptionId ?? null;
    rootDelete.stripeSubscriptionId = FieldValue.delete();
    const sid = String(fields.stripeSubscriptionId ?? "").trim();
    if (sid) {
      await stripeSubscriptionIndexRef(db, sid).set(
        { uid, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
  }
  if ("googlePurchaseToken" in fields) {
    secureUpdate.googlePurchaseToken = fields.googlePurchaseToken ?? null;
    rootDelete.googlePurchaseToken = FieldValue.delete();
  }
  if ("appleOriginalTransactionId" in fields) {
    secureUpdate.appleOriginalTransactionId =
      fields.appleOriginalTransactionId ?? null;
    rootDelete.appleOriginalTransactionId = FieldValue.delete();
  }

  await userBillingSecureRef(db, uid).set(secureUpdate, { merge: true });
  await db.collection("users").doc(uid).set(rootDelete, { merge: true });
}
