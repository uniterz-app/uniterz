/**
 * 紹介者向け招待サマリー構築（Admin）
 * docs/referral-design.md §21–22
 */
import type { Firestore } from "firebase-admin/firestore";
import { resolveReferralDisplayHandle } from "./maskReferralHandle";
import {
  referralReferrerUnitsEarned,
  type ReferralInviteProgressRow,
  type ReferralInviteStatus,
  type ReferralInviteSummary,
} from "./referralRewards";
import { ensureUserInviteCodeAdmin } from "./ensureUserInviteCodeAdmin";
import { buildReferralInvitePath } from "./referralInviteCode";
import { settleReferralRelationWithRetries } from "./settleReferralRelation";

const STATUSES: ReadonlySet<string> = new Set([
  "registered",
  "in_progress",
  "under_review",
  "completed",
  "invalid",
  "fraud_rejected",
  "withdrawn",
]);

function asStatus(raw: unknown): ReferralInviteStatus {
  const s = String(raw ?? "");
  if (STATUSES.has(s)) return s as ReferralInviteStatus;
  return "registered";
}

export type ReferrerInviteSummaryPayload = ReferralInviteSummary & {
  invitePath: string;
};

export async function loadReferrerInviteSummary(
  db: Firestore,
  referrerUid: string
): Promise<ReferrerInviteSummaryPayload> {
  const inviteCode = await ensureUserInviteCodeAdmin(db, referrerUid);
  const invitePath = `/mobile${buildReferralInvitePath(inviteCode)}`;

  let relSnap = await db
    .collection("referralRelations")
    .where("referrerUid", "==", referrerUid)
    .get();

  // under_review の取り残しをセルフヒール（紹介者が画面を開いたタイミング）
  const pending = relSnap.docs.filter(
    (d) => String(d.data()?.status ?? "") === "under_review"
  );
  if (pending.length > 0) {
    const cap = Math.min(pending.length, 20);
    await Promise.all(
      pending.slice(0, cap).map((d) =>
        settleReferralRelationWithRetries(db, d.id, 2).catch(() => null)
      )
    );
    relSnap = await db
      .collection("referralRelations")
      .where("referrerUid", "==", referrerUid)
      .get();
  }

  const docs = relSnap.docs.slice().sort((a, b) => {
    const aMs =
      a.data()?.createdAt?.toMillis?.() ??
      a.data()?.updatedAt?.toMillis?.() ??
      0;
    const bMs =
      b.data()?.createdAt?.toMillis?.() ??
      b.data()?.updatedAt?.toMillis?.() ??
      0;
    return bMs - aMs;
  });

  const inviteeUids = docs.map((d) => d.id);
  const userById = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < inviteeUids.length; i += 100) {
    const chunk = inviteeUids.slice(i, i + 100);
    if (chunk.length === 0) continue;
    const userSnaps = await db.getAll(
      ...chunk.map((id) => db.collection("users").doc(id))
    );
    for (const s of userSnaps) {
      userById.set(
        s.id,
        s.exists ? ((s.data() as Record<string, unknown>) ?? {}) : {}
      );
    }
  }

  const rows: ReferralInviteProgressRow[] = docs.map((d) => {
    const data = d.data() ?? {};
    const status = asStatus(data.status);
    const daysRaw = Number(data.activePredictDays);
    const keysLen = Array.isArray(data.activePredictDayKeys)
      ? data.activePredictDayKeys.length
      : 0;
    const activePredictDays = Math.min(
      7,
      Math.max(
        0,
        Number.isFinite(daysRaw) ? Math.floor(daysRaw) : keysLen
      )
    );
    const user = userById.get(d.id) ?? {};
    return {
      id: d.id,
      label: resolveReferralDisplayHandle(user),
      status,
      activePredictDays,
    };
  });

  let completedCount = 0;
  let inProgressCount = 0;
  let underReviewCount = 0;
  for (const row of rows) {
    if (row.status === "completed") completedCount += 1;
    else if (row.status === "in_progress" || row.status === "registered") {
      inProgressCount += 1;
    } else if (row.status === "under_review") underReviewCount += 1;
  }

  // 台帳序数の正: referralStats.completedCount（表示は件数と max で安全側）
  const referrerSnap = await db.collection("users").doc(referrerUid).get();
  const statsCompleted = Math.max(
    0,
    Math.floor(
      Number(referrerSnap.data()?.referralStats?.completedCount ?? 0)
    )
  );
  const earnedFrom = Math.max(completedCount, statsCompleted);
  const earned = referralReferrerUnitsEarned(earnedFrom);

  return {
    inviteCode,
    inviteUrl: invitePath,
    invitePath,
    completedCount,
    inProgressCount,
    underReviewCount,
    unitsFromBase: earned.base,
    unitsFromMilestones: earned.milestones,
    rows,
  };
}
