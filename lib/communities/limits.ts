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

/** 作成上限: アーカイブ済み・削除済みは含めない（groups.ownerUid を正とする） */
export async function countActiveOwnedGroups(
  db: Firestore,
  uid: string
): Promise<number> {
  const snap = await db
    .collection("groups")
    .where("ownerUid", "==", uid)
    .get();
  return snap.docs.filter((d) => !d.data()?.archivedAt).length;
}

/**
 * ミラーだけ残っている owner 行を掃除（上限カウントの取りこぼし防止）
 */
export async function pruneStaleGroupMirrors(
  db: Firestore,
  uid: string
): Promise<number> {
  const mirrors = await db.collection(`users/${uid}/groups`).get();
  if (mirrors.empty) return 0;

  const groupIds = [
    ...new Set(
      mirrors.docs.map((m) => String(m.data()?.groupId ?? m.id).trim()).filter(Boolean)
    ),
  ];
  const groupSnaps = await Promise.all(
    groupIds.map((id) => db.doc(`groups/${id}`).get())
  );
  const groupById = new Map(groupIds.map((id, i) => [id, groupSnaps[i]]));

  const batch = db.batch();
  let removed = 0;

  for (const m of mirrors.docs) {
    const gid = String(m.data()?.groupId ?? m.id).trim();
    const g = groupById.get(gid);
    const archived = g?.exists && g.data()?.archivedAt;
    const missing = !g?.exists;
    if (missing || archived) {
      batch.delete(m.ref);
      removed++;
    }
  }

  if (removed > 0) {
    await batch.commit();
  }
  return removed;
}
