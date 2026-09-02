import type { JWSTransactionDecodedPayload } from "@apple/app-store-server-library";
import { OfferDiscountType } from "@apple/app-store-server-library";
import {
  planForProductId,
  stubProUntilForPlan,
  type ProIapPlan,
} from "@/lib/pro/iapProductIds";
import { ensureProUntilCoversFirstWeeklyReport } from "@/lib/reports/weeklyReportTrialGuarantee";
import { appleIapBundleId } from "@/lib/billing/apple/appleIapEnv";

export function proPlanTypeFromAppleProductId(
  productId: string | undefined
): ProIapPlan | null {
  if (!productId) return null;
  return planForProductId(productId);
}

export function proUntilFromAppleTransaction(
  tx: JWSTransactionDecodedPayload,
  planType: ProIapPlan,
  now = new Date()
): Date {
  if (typeof tx.expiresDate === "number" && tx.expiresDate > 0) {
    const d = new Date(tx.expiresDate);
    if (planType === "weekly" || planType === "monthly") {
      return ensureProUntilCoversFirstWeeklyReport(d, now);
    }
    return d;
  }
  return stubProUntilForPlan(planType, now);
}

export function trialEndAtFromAppleTransaction(
  tx: JWSTransactionDecodedPayload
): Date | null {
  if (tx.offerDiscountType !== OfferDiscountType.FREE_TRIAL) return null;
  if (typeof tx.expiresDate === "number" && tx.expiresDate > 0) {
    return new Date(tx.expiresDate);
  }
  return null;
}

export function isAppleTransactionRevoked(
  tx: JWSTransactionDecodedPayload
): boolean {
  return typeof tx.revocationDate === "number" && tx.revocationDate > 0;
}

export function appleBundleMatches(tx: JWSTransactionDecodedPayload): boolean {
  const expected = appleIapBundleId();
  const actual = String(tx.bundleId ?? "").trim();
  return !actual || actual === expected;
}
