/**
 * 紹介者向け招待サマリー構築（Admin）
 * docs/referral-design.md §21–22
 *
 * コスト方針:
 * - relation 一覧は 1 クエリ（件数カウント用）
 * - 画面 rows は優先度付きで上限（user getAll を抑制）
 * - under_review セルフヒールは軽量（posts 再走査なし）・1 回あたり少数
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

/** 招待画面に並べる進捗行の上限（新しい進行中を優先） */
export const REFERRAL_SUMMARY_ROW_LIMIT = 40;

/** 画面オープン時に軽量 settle する under_review の上限 */
export const REFERRAL_SUMMARY_HEAL_LIMIT = 3;

function asStatus(raw: unknown): ReferralInviteStatus {
  const s = String(raw ?? "");
  if (STATUSES.has(s)) return s as ReferralInviteStatus;
  return "registered";
}

function createdMs(data: Record<string, unknown>): number {
  const a = data.createdAt as { toMillis?: () => number } | undefined;
  const b = data.updatedAt as { toMillis?: () => number } | undefined;
  return a?.toMillis?.() ?? b?.toMillis?.() ?? 0;
}

function rowFromDoc(
  id: string,
  data: Record<string, unknown>,
  user: Record<string, unknown>
): ReferralInviteProgressRow {
  const status = asStatus(data.status);
  const daysRaw = Number(data.activePredictDays);
  const keysLen = Array.isArray(data.activePredictDayKeys)
    ? data.activePredictDayKeys.length
    : 0;
  const activePredictDays = Math.min(
    7,
    Math.max(0, Number.isFinite(daysRaw) ? Math.floor(daysRaw) : keysLen)
  );
  return {
    id,
    label: resolveReferralDisplayHandle(user),
    status,
    activePredictDays,
  };
}

/** under_review → 進行中 → 完了 → その他。同 rank は新しい順 */
function rowPriority(status: ReferralInviteStatus): number {
  switch (status) {
    case "under_review":
      return 0;
    case "in_progress":
    case "registered":
      return 1;
    case "completed":
      return 2;
    default:
      return 3;
  }
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

  const relSnap = await db
    .collection("referralRelations")
    .where("referrerUid", "==", referrerUid)
    .get();

  type RelDoc = {
    id: string;
    data: Record<string, unknown>;
    ms: number;
  };
  const docs: RelDoc[] = relSnap.docs.map((d) => {
    const data = (d.data() ?? {}) as Record<string, unknown>;
    return { id: d.id, data, ms: createdMs(data) };
  });

  // under_review の取り残しを軽量セルフヒール（posts 再走査なし・少数）
  const pendingHeal = docs
    .filter((d) => {
      if (String(d.data.status ?? "") !== "under_review") return false;
      const days = Math.max(
        0,
        Math.floor(Number(d.data.activePredictDays ?? 0))
      );
      return days >= 7;
    })
    .sort((a, b) => a.ms - b.ms)
    .slice(0, REFERRAL_SUMMARY_HEAL_LIMIT);

  if (pendingHeal.length > 0) {
    const healed = await Promise.all(
      pendingHeal.map(async (d) => {
        const result = await settleReferralRelationWithRetries(db, d.id, 2, {
          recomputeDays: false,
        }).catch(() => null);
        return { id: d.id, result };
      })
    );
    for (const h of healed) {
      if (!h.result || !h.result.ok || h.result.skipped) continue;
      const target = docs.find((d) => d.id === h.id);
      if (!target) continue;
      // 再クエリせずメモリ上で completed に寄せる（表示用）
      target.data = {
        ...target.data,
        status: "completed",
        activePredictDays: 7,
      };
    }
  }

  let completedCount = 0;
  let inProgressCount = 0;
  let underReviewCount = 0;
  for (const d of docs) {
    const status = asStatus(d.data.status);
    if (status === "completed") completedCount += 1;
    else if (status === "in_progress" || status === "registered") {
      inProgressCount += 1;
    } else if (status === "under_review") underReviewCount += 1;
  }

  const ranked = docs.slice().sort((a, b) => {
    const pa = rowPriority(asStatus(a.data.status));
    const pb = rowPriority(asStatus(b.data.status));
    if (pa !== pb) return pa - pb;
    return b.ms - a.ms;
  });
  const displayDocs = ranked.slice(0, REFERRAL_SUMMARY_ROW_LIMIT);

  const userById = new Map<string, Record<string, unknown>>();
  const inviteeUids = displayDocs.map((d) => d.id);
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

  const rows: ReferralInviteProgressRow[] = displayDocs.map((d) =>
    rowFromDoc(d.id, d.data, userById.get(d.id) ?? {})
  );

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
