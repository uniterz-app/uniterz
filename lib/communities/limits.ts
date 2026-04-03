import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";

export const MAX_MEMBERS_PER_GROUP = 100;
export const FREE_MAX_MEMBERSHIPS = 10;
export const PRO_MAX_MEMBERSHIPS = 20;
export const FREE_MAX_OWNED_GROUPS = 2;
export const PRO_MAX_OWNED_GROUPS = 8;

export type PlanTier = "free" | "pro";

export async function getEffectivePlan(
  db: Firestore,
  uid: string
): Promise<PlanTier> {
  const snap = await db.doc(`users/${uid}`).get();
  const data = snap.data();
  if (data?.plan !== "pro") return "free";
  const pu = data.proUntil;
  if (pu instanceof Timestamp) {
    return pu.toMillis() > Date.now() ? "pro" : "free";
  }
  return "free";
}

export function maxMembershipsForPlan(plan: PlanTier): number {
  return plan === "pro" ? PRO_MAX_MEMBERSHIPS : FREE_MAX_MEMBERSHIPS;
}

export function maxOwnedGroupsForPlan(plan: PlanTier): number {
  return plan === "pro" ? PRO_MAX_OWNED_GROUPS : FREE_MAX_OWNED_GROUPS;
}
