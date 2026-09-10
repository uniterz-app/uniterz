/**
 * 招待コード bind 成功時に被招待者へ 30 Unit を即時付与（冪等）。
 * 紹介者報酬は 7 日予想達成後の settle のまま。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { REFERRAL_INVITEE_UNITS } from "./referralRewards";
import { referralInviteeRewardLedgerKey } from "./settleReferralRelation";

const LEDGER = "unit_ledger";

export type GrantReferralInviteeOnBindResult =
  | { ok: true; granted: number; alreadyGranted: boolean }
  | { ok: false; error: string };

export async function grantReferralInviteeUnitsOnBind(
  db: Firestore,
  inviteeUidRaw: string,
  referrerUidRaw: string
): Promise<GrantReferralInviteeOnBindResult> {
  const inviteeUid = String(inviteeUidRaw ?? "").trim();
  const referrerUid = String(referrerUidRaw ?? "").trim();
  if (!inviteeUid || !referrerUid) {
    return { ok: false, error: "uid required" };
  }

  const ledgerRef = db
    .collection(LEDGER)
    .doc(referralInviteeRewardLedgerKey(inviteeUid));
  const inviteeRef = db.collection("users").doc(inviteeUid);
  const relRef = db.collection("referralRelations").doc(inviteeUid);

  try {
    const result = await db.runTransaction(async (tx) => {
      const ledgerSnap = await tx.get(ledgerRef);
      if (ledgerSnap.exists) {
        return { granted: 0, alreadyGranted: true as const };
      }

      tx.set(ledgerRef, {
        uid: inviteeUid,
        amount: REFERRAL_INVITEE_UNITS,
        reason: "referral_invitee",
        idempotencyKey: referralInviteeRewardLedgerKey(inviteeUid),
        inviteeUid,
        referrerUid,
        grantedOn: "bind",
        createdAt: FieldValue.serverTimestamp(),
      });

      tx.set(
        inviteeRef,
        {
          unitBalance: FieldValue.increment(REFERRAL_INVITEE_UNITS),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        relRef,
        {
          inviteeUnitsGranted: REFERRAL_INVITEE_UNITS,
          inviteeUnitsGrantedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        granted: REFERRAL_INVITEE_UNITS,
        alreadyGranted: false as const,
      };
    });

    return { ok: true, ...result };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[grantReferralInviteeUnitsOnBind]", inviteeUid, msg);
    return { ok: false, error: msg };
  }
}
