import type { Firestore } from "firebase-admin/firestore";
import type { JWSTransactionDecodedPayload } from "@apple/app-store-server-library";
import {
  applyProEntitlement,
  revokeProEntitlement,
} from "@/lib/billing/applyProEntitlement";
import {
  appleBundleMatches,
  isAppleTransactionRevoked,
  proPlanTypeFromAppleProductId,
  proUntilFromAppleTransaction,
  trialEndAtFromAppleTransaction,
} from "@/lib/billing/apple/proUntilFromAppleTransaction";

export type ApplyAppleTransactionResult =
  | { ok: true; planType: string; proUntil: Date }
  | { ok: false; reason: string };

/** 検証済み Apple transaction から entitlement を反映 */
export async function applyAppleTransactionEntitlement(
  db: Firestore,
  uid: string,
  tx: JWSTransactionDecodedPayload,
  opts?: { cancelAtPeriodEnd?: boolean }
): Promise<ApplyAppleTransactionResult> {
  if (!appleBundleMatches(tx)) {
    return { ok: false, reason: "bundle_mismatch" };
  }

  const productId = String(tx.productId ?? "").trim();
  const planType = proPlanTypeFromAppleProductId(productId);
  if (!planType) {
    return { ok: false, reason: "unknown_product" };
  }

  if (isAppleTransactionRevoked(tx)) {
    await revokeProEntitlement(db, uid);
    return { ok: false, reason: "revoked" };
  }

  const proUntil = proUntilFromAppleTransaction(tx, planType);
  const trialEndAt = trialEndAtFromAppleTransaction(tx);
  const originalTransactionId = String(tx.originalTransactionId ?? "").trim();

  await applyProEntitlement(db, uid, {
    planType,
    proUntil,
    cancelAtPeriodEnd: opts?.cancelAtPeriodEnd ?? false,
    trialEndAt,
    billing: {
      billingProvider: "apple",
      appleOriginalTransactionId: originalTransactionId || null,
      nextPlanType: null,
    },
  });

  return { ok: true, planType, proUntil };
}

export async function applyAppleTransactionEntitlementByOriginalTxId(
  db: Firestore,
  originalTransactionId: string,
  tx: JWSTransactionDecodedPayload,
  opts?: { cancelAtPeriodEnd?: boolean }
): Promise<ApplyAppleTransactionResult | { ok: false; reason: "uid_not_found" }> {
  const { resolveUidByAppleOriginalTransactionId } = await import(
    "@/lib/billing/userBillingSecure"
  );
  const uid = await resolveUidByAppleOriginalTransactionId(
    db,
    originalTransactionId
  );
  if (!uid) return { ok: false, reason: "uid_not_found" };
  return applyAppleTransactionEntitlement(db, uid, tx, opts);
}
