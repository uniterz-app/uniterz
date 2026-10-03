import type { Firestore } from "firebase-admin/firestore";
import {
  applyProEntitlement,
  revokeProEntitlement,
} from "@/lib/billing/applyProEntitlement";
import {
  fetchGoogleProductPurchase,
  fetchGoogleSubscriptionV2,
  type GoogleSubscriptionPurchaseV2,
} from "@/lib/billing/google/googlePlayApi";
import {
  resolveUidByGooglePurchaseToken,
  userBillingSecureRef,
} from "@/lib/billing/userBillingSecure";
import {
  isSubscriptionPlan,
  planForProductId,
  stubProUntilForPlan,
  type ProIapPlan,
} from "@/lib/pro/iapProductIds";
import { ensureProUntilCoversFirstWeeklyReport } from "@/lib/reports/weeklyReportTrialGuarantee";

export type ApplyGooglePlayResult =
  | { ok: true; planType: ProIapPlan; proUntil: Date }
  | {
      ok: false;
      reason:
        | "unknown_product"
        | "product_mismatch"
        | "token_owned_by_other_user"
        | "pending"
        | "not_active"
        | "revoked";
    };

function subscriptionProductId(sub: GoogleSubscriptionPurchaseV2): string {
  return String(sub.lineItems?.[0]?.productId ?? "").trim();
}

function subscriptionExpiry(sub: GoogleSubscriptionPurchaseV2): Date | null {
  const times = (sub.lineItems ?? [])
    .map((li) => (li.expiryTime ? Date.parse(li.expiryTime) : NaN))
    .filter((t) => Number.isFinite(t));
  if (times.length === 0) return null;
  return new Date(Math.max(...times));
}

/** 別ユーザーに紐付いたトークンの使い回しを拒否（linkedPurchaseToken の旧持ち主は同一人物として許可） */
async function tokenOwnerConflict(
  db: Firestore,
  uid: string,
  purchaseToken: string
): Promise<boolean> {
  const owner = await resolveUidByGooglePurchaseToken(db, purchaseToken);
  return owner != null && owner !== uid;
}

async function grantGooglePro(
  db: Firestore,
  uid: string,
  planType: ProIapPlan,
  proUntil: Date,
  purchaseToken: string,
  cancelAtPeriodEnd: boolean
): Promise<void> {
  await applyProEntitlement(db, uid, {
    planType,
    proUntil,
    cancelAtPeriodEnd,
    billing: {
      billingProvider: "google",
      googlePurchaseToken: purchaseToken,
      nextPlanType: null,
    },
  });
}

/** 今の課金元がこのトークンのときだけ Free に落とす（Stripe / Apple / 別トークンの Pro を巻き込まない） */
export async function revokeGoogleProIfCurrent(
  db: Firestore,
  uid: string,
  purchaseToken: string
): Promise<boolean> {
  const secure = (await userBillingSecureRef(db, uid).get()).data() ?? {};
  if (secure.billingProvider !== "google") return false;
  if (String(secure.googlePurchaseToken ?? "") !== purchaseToken) return false;
  await revokeProEntitlement(db, uid);
  return true;
}

async function applySubscription(
  db: Firestore,
  uid: string,
  purchaseToken: string,
  expectedProductId: string | null
): Promise<ApplyGooglePlayResult> {
  const sub = await fetchGoogleSubscriptionV2(purchaseToken);
  const productId = subscriptionProductId(sub);
  if (expectedProductId && productId && productId !== expectedProductId) {
    return { ok: false, reason: "product_mismatch" };
  }
  const planType = planForProductId(productId || expectedProductId || "");
  if (!planType) return { ok: false, reason: "unknown_product" };

  const state = sub.subscriptionState;
  const expiry = subscriptionExpiry(sub);
  const now = new Date();

  if (state === "SUBSCRIPTION_STATE_PENDING") {
    return { ok: false, reason: "pending" };
  }

  const stillEntitled =
    state === "SUBSCRIPTION_STATE_ACTIVE" ||
    state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
    (state === "SUBSCRIPTION_STATE_CANCELED" && expiry != null && expiry > now);

  if (!stillEntitled || !expiry) {
    await revokeGoogleProIfCurrent(db, uid, purchaseToken);
    return { ok: false, reason: "not_active" };
  }

  const autoRenew = sub.lineItems?.[0]?.autoRenewingPlan?.autoRenewEnabled;
  const cancelAtPeriodEnd =
    state === "SUBSCRIPTION_STATE_CANCELED" || autoRenew === false;
  const proUntil = ensureProUntilCoversFirstWeeklyReport(expiry, now);

  await grantGooglePro(db, uid, planType, proUntil, purchaseToken, cancelAtPeriodEnd);
  return { ok: true, planType, proUntil };
}

async function applyOneTime(
  db: Firestore,
  uid: string,
  productId: string,
  purchaseToken: string
): Promise<ApplyGooglePlayResult> {
  const planType = planForProductId(productId);
  if (!planType) return { ok: false, reason: "unknown_product" };

  const purchase = await fetchGoogleProductPurchase(productId, purchaseToken);
  if (purchase.purchaseState === 2) return { ok: false, reason: "pending" };
  if (purchase.purchaseState !== 0) {
    await revokeGoogleProIfCurrent(db, uid, purchaseToken);
    return { ok: false, reason: "revoked" };
  }

  const purchasedAt = purchase.purchaseTimeMillis
    ? new Date(Number(purchase.purchaseTimeMillis))
    : new Date();
  const proUntil = stubProUntilForPlan(planType, purchasedAt);

  await grantGooglePro(db, uid, planType, proUntil, purchaseToken, false);
  return { ok: true, planType, proUntil };
}

/** アプリからの購入確認：Google Play に照会してから users.plan を更新 */
export async function verifyAndApplyGooglePurchase(
  db: Firestore,
  uid: string,
  productId: string,
  purchaseToken: string
): Promise<ApplyGooglePlayResult> {
  const planType = planForProductId(productId);
  if (!planType) return { ok: false, reason: "unknown_product" };
  if (await tokenOwnerConflict(db, uid, purchaseToken)) {
    return { ok: false, reason: "token_owned_by_other_user" };
  }
  return isSubscriptionPlan(planType)
    ? applySubscription(db, uid, purchaseToken, productId)
    : applyOneTime(db, uid, productId, purchaseToken);
}

/** RTDN から：トークンの持ち主を引いて定期購入の最新状態を反映 */
export async function refreshGoogleSubscriptionByToken(
  db: Firestore,
  purchaseToken: string
): Promise<ApplyGooglePlayResult | { ok: false; reason: "uid_not_found" }> {
  let uid = await resolveUidByGooglePurchaseToken(db, purchaseToken);
  if (!uid) {
    // 再登録・プラン変更では新トークンが linkedPurchaseToken で旧トークンを指す
    const sub = await fetchGoogleSubscriptionV2(purchaseToken);
    const linked = String(sub.linkedPurchaseToken ?? "").trim();
    if (linked) uid = await resolveUidByGooglePurchaseToken(db, linked);
  }
  if (!uid) return { ok: false, reason: "uid_not_found" };
  return applySubscription(db, uid, purchaseToken, null);
}
