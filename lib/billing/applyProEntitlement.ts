import { Timestamp, type Firestore } from "firebase-admin/firestore";
import {
  writeUserBillingSecure,
  type UserBillingSecureFields,
} from "@/lib/billing/userBillingSecure";
import type { ProIapPlan } from "@/lib/pro/iapProductIds";
import { revalidateRankingUserFields } from "@/lib/rankings/rankingCommentCache";
import { userDataIsPro } from "@/lib/pro/userPlanActive";

export type ApplyProEntitlementInput = {
  planType: ProIapPlan | string;
  proUntil: Date;
  cancelAtPeriodEnd?: boolean;
  billing?: UserBillingSecureFields;
  trialEndAt?: Date | null;
};

/** 購入・更新後に users.plan を Pro へ（Stripe / IAP 共通） */
export async function applyProEntitlement(
  db: Firestore,
  uid: string,
  input: ApplyProEntitlementInput
): Promise<void> {
  const cancelAtPeriodEnd = input.cancelAtPeriodEnd ?? false;
  const userPatch: Record<string, unknown> = {
    plan: "pro",
    planType: input.planType,
    proUntil: Timestamp.fromDate(input.proUntil),
    cancelAtPeriodEnd,
    updatedAt: new Date(),
  };
  if (input.trialEndAt) {
    userPatch.trialEndAt = Timestamp.fromDate(input.trialEndAt);
  }

  if (input.billing) {
    await writeUserBillingSecure(db, uid, input.billing);
  }

  const userRef = db.doc(`users/${uid}`);
  const [before] = await db.getAll(userRef, { fieldMask: ["plan", "proUntil"] });
  const wasPro = userDataIsPro(before?.data());
  await userRef.set(userPatch, { merge: true });
  // 更新・復元のたびに全員共有のランキング用キャッシュを捨てない（表示が変わるのは Free → Pro だけ）
  if (!wasPro) revalidateRankingUserFields();

  try {
    const { ensureUserPlanStartDate } = await import(
      "@/lib/pro/ensureUserPlanStartDate"
    );
    await ensureUserPlanStartDate(db, uid);
  } catch (err) {
    console.warn("[applyProEntitlement] planStartDate ensure failed:", err);
  }

  try {
    const { applyProSkinUnlocksAfterProUpgrade } = await import(
      "@/lib/profile/applyProSkinUnlocksAfterProUpgrade"
    );
    await applyProSkinUnlocksAfterProUpgrade(db, uid);
  } catch (err) {
    console.warn("[applyProEntitlement] pro-skin upgrade merge failed:", err);
  }
}

/** 失効・返金・解約後に Free へ */
export async function revokeProEntitlement(
  db: Firestore,
  uid: string
): Promise<void> {
  await db.doc(`users/${uid}`).set(
    {
      plan: "free",
      planType: null,
      proUntil: null,
      cancelAtPeriodEnd: false,
      trialEndAt: null,
      updatedAt: new Date(),
    },
    { merge: true }
  );
  revalidateRankingUserFields();
}
