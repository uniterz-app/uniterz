/**
 * サインアップ時の招待コード紐づけ（Admin）
 * - 紹介者が解決できたときだけ永続化（打ち間違いでロックしない）
 * - referredByUid 未設定なら再試行可
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { findUidByInviteCodeAdmin } from "./ensureUserInviteCodeAdmin";
import {
  isValidReferralInviteCodeFormat,
  normalizeReferralInviteCode,
} from "./referralInviteCode";

export type ReferralRelationStatus =
  | "registered"
  | "in_progress"
  | "under_review"
  | "completed"
  | "invalid"
  | "fraud_rejected"
  | "withdrawn";

export type BindReferralOnSignupResult =
  | {
      ok: true;
      inviteCode: string;
      referrerUid: string;
      relationCreated: boolean;
      alreadyBound: boolean;
    }
  | {
      ok: false;
      error:
        | "invalid_code"
        | "invite_code_not_found"
        | "self_invite"
        | "already_bound";
      inviteCode: string | null;
    };

export async function bindReferralOnSignupAdmin(
  db: Firestore,
  inviteeUid: string,
  inviteCodeRaw: string
): Promise<BindReferralOnSignupResult> {
  const code = normalizeReferralInviteCode(inviteCodeRaw);
  if (!code || !isValidReferralInviteCodeFormat(code)) {
    return { ok: false, error: "invalid_code", inviteCode: null };
  }

  const inviteeRef = db.collection("users").doc(inviteeUid);
  const inviteeSnap = await inviteeRef.get();
  const existing = inviteeSnap.data() ?? {};

  const alreadyReferrer = String(existing.referredByUid ?? "").trim();
  if (alreadyReferrer) {
    return {
      ok: false,
      error: "already_bound",
      inviteCode: String(existing.referralInviteCode ?? code),
    };
  }

  const relRef = db.collection("referralRelations").doc(inviteeUid);
  const relSnap = await relRef.get();
  if (relSnap.exists) {
    const rel = relSnap.data() ?? {};
    const relReferrer = String(rel.referrerUid ?? "").trim();
    if (relReferrer) {
      // relation があるのに users 側が欠けるケースを修復
      await inviteeRef.set(
        {
          referralInviteCode: String(rel.inviteCode ?? code),
          referredByUid: relReferrer,
          referralBoundAt:
            existing.referralBoundAt ?? FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return {
        ok: true,
        inviteCode: String(rel.inviteCode ?? code),
        referrerUid: relReferrer,
        relationCreated: false,
        alreadyBound: true,
      };
    }
  }

  const referrerUid = await findUidByInviteCodeAdmin(db, code);
  if (!referrerUid) {
    // 永続化しない → 打ち間違いでロックしない
    return { ok: false, error: "invite_code_not_found", inviteCode: code };
  }
  if (referrerUid === inviteeUid) {
    return { ok: false, error: "self_invite", inviteCode: code };
  }

  await inviteeRef.set(
    {
      referralInviteCode: code,
      referredByUid: referrerUid,
      referralBoundAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await relRef.set(
    {
      inviteeUid,
      referrerUid,
      inviteCode: code,
      status: "registered" satisfies ReferralRelationStatus,
      activePredictDayKeys: [],
      activePredictDays: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ok: true,
    inviteCode: code,
    referrerUid,
    relationCreated: true,
    alreadyBound: false,
  };
}
