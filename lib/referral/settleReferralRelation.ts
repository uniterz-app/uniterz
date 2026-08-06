/**
 * under_review → completed + Unit 付与（Admin・単一 transaction・冪等）
 * docs/referral-design.md §2 / §6 / §22
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { PRO_SKIN_REFERRAL_MILESTONES } from "@/lib/profile/proSkinMilestoneCatalog";
import { PRO_SKIN_UNLOCK_FROM_SEASON_KEY } from "@/lib/profile/proSkinUnlock";
import { incrementProSkinHolderCounts } from "@/lib/profile/proSkinUnlockServer";
import {
  REFERRAL_INVITEE_UNITS,
  REFERRAL_MILESTONES,
  REFERRAL_REFERRER_MAX_COMPLETED,
  REFERRAL_REFERRER_UNITS_PER_COMPLETED,
} from "./referralRewards";
import { recomputeReferralActivePredictDays } from "./recomputeReferralActivePredictDays";

const LEDGER = "unit_ledger";

function isProUser(user: Record<string, unknown> | undefined): boolean {
  if (!user || user.plan !== "pro") return false;
  const until = user.proUntil as
    | { toMillis?: () => number; seconds?: number; _seconds?: number }
    | Date
    | number
    | string
    | null
    | undefined;
  if (until == null || until === "") return true;
  let ms = 0;
  if (until instanceof Date) ms = until.getTime();
  else if (typeof until === "number") ms = until < 1e12 ? until * 1000 : until;
  else if (typeof until === "string") {
    const parsed = Date.parse(until);
    ms = Number.isFinite(parsed) ? parsed : 0;
  } else if (typeof until?.toMillis === "function") ms = until.toMillis();
  else if (typeof until?.seconds === "number") ms = until.seconds * 1000;
  else if (typeof until?._seconds === "number") ms = until._seconds * 1000;
  if (!Number.isFinite(ms) || ms <= 0) return true;
  return ms > Date.now();
}

export function referralInviteeRewardLedgerKey(inviteeUid: string): string {
  return `referral:invitee:${inviteeUid}:reward`;
}

export function referralReferrerBaseLedgerKey(inviteeUid: string): string {
  return `referral:invitee:${inviteeUid}:referrer`;
}

export function referralMilestoneLedgerKey(
  referrerUid: string,
  completedCount: number
): string {
  return `referral:referrer:${referrerUid}:milestone:${completedCount}`;
}

export type SettleReferralResult =
  | { ok: true; skipped: true; reason: string }
  | {
      ok: true;
      skipped: false;
      inviteeGranted: number;
      referrerBaseGranted: number;
      referrerMilestoneGranted: number;
      completedOrdinal: number;
      /** Pro 紹介者へ新規解放した Wave 招待スキン */
      newlyUnlockedSkinIds?: string[];
    }
  | { ok: false; error: string };

/**
 * 1 招待関係を精算。成功時 invitee に referralSettledAt を付け、以降の touch を省略可能にする。
 */
export async function settleReferralRelation(
  db: Firestore,
  inviteeUidRaw: string
): Promise<SettleReferralResult> {
  const inviteeUid = String(inviteeUidRaw ?? "").trim();
  if (!inviteeUid) return { ok: false, error: "uid required" };

  // 付与前に削除済み posts を日数から除外（§5）
  const recomputed = await recomputeReferralActivePredictDays(db, inviteeUid);
  if (
    recomputed.ok &&
    !recomputed.skipped &&
    recomputed.activePredictDays < 7 &&
    recomputed.status !== "under_review"
  ) {
    return {
      ok: true,
      skipped: true,
      reason: "insufficient_active_days",
    };
  }

  const relRef = db.collection("referralRelations").doc(inviteeUid);

  try {
    const result = await db.runTransaction(async (tx) => {
      const relSnap = await tx.get(relRef);
      if (!relSnap.exists) {
        return {
          ok: true as const,
          skipped: true as const,
          reason: "no_relation",
        };
      }

      const data = relSnap.data() ?? {};
      const status = String(data.status ?? "");
      const referrerUid = String(data.referrerUid ?? "").trim();
      if (!referrerUid) {
        return {
          ok: true as const,
          skipped: true as const,
          reason: "no_referrer",
        };
      }

      const alreadyCompleted = status === "completed";
      const hasGrantMeta =
        data.unitsGranted != null && typeof data.unitsGranted === "object";

      if (alreadyCompleted && hasGrantMeta) {
        // セルフヒール: settled フラグだけ欠ける場合
        const inviteeRef = db.collection("users").doc(inviteeUid);
        tx.set(
          inviteeRef,
          {
            referralSettledAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return {
          ok: true as const,
          skipped: true as const,
          reason: "already_completed",
        };
      }

      if (status !== "under_review" && !alreadyCompleted) {
        return {
          ok: true as const,
          skipped: true as const,
          reason: `status_${status || "unknown"}`,
        };
      }

      const liveDays = Math.max(
        0,
        Math.floor(Number(data.activePredictDays ?? 0))
      );
      if (!alreadyCompleted && liveDays < 7) {
        return {
          ok: true as const,
          skipped: true as const,
          reason: "insufficient_active_days",
        };
      }

      const referrerRef = db.collection("users").doc(referrerUid);
      const inviteeRef = db.collection("users").doc(inviteeUid);
      const [referrerSnap, inviteeSnap] = await Promise.all([
        tx.get(referrerRef),
        tx.get(inviteeRef),
      ]);

      if (inviteeSnap.data()?.deletedAt != null) {
        tx.set(
          relRef,
          {
            status: "withdrawn",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return {
          ok: true as const,
          skipped: true as const,
          reason: "invitee_deleted",
        };
      }

      const priorCompleted = Math.max(
        0,
        Math.floor(
          Number(referrerSnap.data()?.referralStats?.completedCount ?? 0)
        )
      );

      const completedOrdinal = alreadyCompleted
        ? Math.max(
            1,
            Math.floor(
              Number(
                (data.unitsGranted as { completedOrdinal?: unknown } | null)
                  ?.completedOrdinal ?? priorCompleted
              )
            ) ||
              priorCompleted ||
              1
          )
        : priorCompleted + 1;

      const inviteeLedgerRef = db
        .collection(LEDGER)
        .doc(referralInviteeRewardLedgerKey(inviteeUid));
      const referrerBaseLedgerRef = db
        .collection(LEDGER)
        .doc(referralReferrerBaseLedgerKey(inviteeUid));

      const inviteeLedgerSnap = await tx.get(inviteeLedgerRef);
      const referrerBaseLedgerSnap = await tx.get(referrerBaseLedgerRef);

      let inviteeGranted = 0;
      let referrerBaseGranted = 0;
      let referrerMilestoneGranted = 0;
      let referrerIncrement = 0;
      let inviteeIncrement = 0;

      if (!inviteeLedgerSnap.exists) {
        tx.set(inviteeLedgerRef, {
          uid: inviteeUid,
          amount: REFERRAL_INVITEE_UNITS,
          reason: "referral_invitee",
          idempotencyKey: referralInviteeRewardLedgerKey(inviteeUid),
          inviteeUid,
          referrerUid,
          createdAt: FieldValue.serverTimestamp(),
        });
        inviteeIncrement = REFERRAL_INVITEE_UNITS;
        inviteeGranted = REFERRAL_INVITEE_UNITS;
      }

      const withinCap = completedOrdinal <= REFERRAL_REFERRER_MAX_COMPLETED;

      if (withinCap && !referrerBaseLedgerSnap.exists) {
        tx.set(referrerBaseLedgerRef, {
          uid: referrerUid,
          amount: REFERRAL_REFERRER_UNITS_PER_COMPLETED,
          reason: "referral_referrer",
          idempotencyKey: referralReferrerBaseLedgerKey(inviteeUid),
          inviteeUid,
          referrerUid,
          completedOrdinal,
          createdAt: FieldValue.serverTimestamp(),
        });
        referrerIncrement += REFERRAL_REFERRER_UNITS_PER_COMPLETED;
        referrerBaseGranted = REFERRAL_REFERRER_UNITS_PER_COMPLETED;
      }

      let milestoneBonus = 0;
      if (withinCap) {
        for (const m of REFERRAL_MILESTONES) {
          if (completedOrdinal !== m.completedCount) continue;
          milestoneBonus = m.bonusUnits;
          const milestoneRef = db
            .collection(LEDGER)
            .doc(referralMilestoneLedgerKey(referrerUid, m.completedCount));
          const milestoneSnap = await tx.get(milestoneRef);
          if (!milestoneSnap.exists) {
            tx.set(milestoneRef, {
              uid: referrerUid,
              amount: m.bonusUnits,
              reason: "referral_milestone",
              idempotencyKey: referralMilestoneLedgerKey(
                referrerUid,
                m.completedCount
              ),
              inviteeUid,
              referrerUid,
              milestoneAt: m.completedCount,
              createdAt: FieldValue.serverTimestamp(),
            });
            referrerIncrement += m.bonusUnits;
            referrerMilestoneGranted = m.bonusUnits;
          }
        }
      }

      const referrerPatch: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (referrerIncrement > 0) {
        referrerPatch.unitBalance = FieldValue.increment(referrerIncrement);
      }
      if (!alreadyCompleted) {
        referrerPatch.referralStats = {
          completedCount: completedOrdinal,
        };
      }

      const newlyUnlockedSkinIds: string[] = [];
      if (!alreadyCompleted && isProUser(referrerSnap.data())) {
        const unlocked = new Set<string>(
          Array.isArray(referrerSnap.data()?.proSkinUnlockedIds)
            ? (referrerSnap.data()?.proSkinUnlockedIds as unknown[]).filter(
                (x): x is string => typeof x === "string"
              )
            : []
        );
        for (const skin of PRO_SKIN_REFERRAL_MILESTONES) {
          if (completedOrdinal !== skin.completedCount) continue;
          if (unlocked.has(skin.id)) continue;
          unlocked.add(skin.id);
          newlyUnlockedSkinIds.push(skin.id);
        }
        if (newlyUnlockedSkinIds.length > 0) {
          referrerPatch.proSkinUnlockedIds = [...unlocked];
          referrerPatch.proSkinUnlockSeason = PRO_SKIN_UNLOCK_FROM_SEASON_KEY;
          referrerPatch.proSkinUnlockNoticeIds = FieldValue.arrayUnion(
            ...newlyUnlockedSkinIds
          );
        }
      }

      if (
        referrerIncrement > 0 ||
        !alreadyCompleted ||
        newlyUnlockedSkinIds.length > 0
      ) {
        tx.set(referrerRef, referrerPatch, { merge: true });
      }

      const inviteePatch: Record<string, unknown> = {
        referralSettledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (inviteeIncrement > 0) {
        inviteePatch.unitBalance = FieldValue.increment(inviteeIncrement);
      }
      tx.set(inviteeRef, inviteePatch, { merge: true });

      tx.set(
        relRef,
        {
          status: "completed",
          completedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          unitsGranted: {
            invitee: REFERRAL_INVITEE_UNITS,
            referrerBase: withinCap
              ? REFERRAL_REFERRER_UNITS_PER_COMPLETED
              : 0,
            referrerMilestone: milestoneBonus,
            completedOrdinal,
          },
        },
        { merge: true }
      );

      return {
        ok: true as const,
        skipped: false as const,
        inviteeGranted,
        referrerBaseGranted,
        referrerMilestoneGranted,
        completedOrdinal,
        newlyUnlockedSkinIds,
      };
    });

    if (
      result.ok &&
      !result.skipped &&
      result.newlyUnlockedSkinIds &&
      result.newlyUnlockedSkinIds.length > 0
    ) {
      try {
        await incrementProSkinHolderCounts(db, result.newlyUnlockedSkinIds);
      } catch (err) {
        console.warn("referral pro-skin holder count update failed:", err);
      }
    }

    return result;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** 同一リクエスト内で数回再試行（一時障害対策） */
export async function settleReferralRelationWithRetries(
  db: Firestore,
  inviteeUid: string,
  attempts = 3
): Promise<SettleReferralResult> {
  let last: SettleReferralResult = { ok: false, error: "no_attempt" };
  const n = Math.max(1, Math.min(5, Math.floor(attempts)));
  for (let i = 0; i < n; i++) {
    last = await settleReferralRelation(db, inviteeUid);
    if (last.ok) return last;
    if (i < n - 1) {
      await new Promise((r) => setTimeout(r, 40 * (i + 1)));
    }
  }
  return last;
}
