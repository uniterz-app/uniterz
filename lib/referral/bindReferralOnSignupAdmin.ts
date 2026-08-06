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
        | "already_bound"
        | "bind_window_expired"
        | "mutual_invite"
        | "referrer_unavailable"
        | "referrer_rate_limited";
      inviteCode: string | null;
    };

/** 新規登録からこの時間内のみ bind 可（ミリ秒） */
export const REFERRAL_BIND_WINDOW_MS = 24 * 60 * 60 * 1000;

/** 同一紹介者への bind 作成上限（直近 24h）— マルチ垢ファーム緩和 */
export const REFERRAL_REFERRER_BIND_RATE_LIMIT = 20;
export const REFERRAL_REFERRER_BIND_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

function createdAtMillis(data: Record<string, unknown>): number | null {
  const v = data.createdAt as
    | { toMillis?: () => number; seconds?: number }
    | Date
    | number
    | null
    | undefined;
  if (v == null) return null;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  if (v instanceof Date) return v.getTime();
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v.seconds === "number") return v.seconds * 1000;
  return null;
}

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

  const createdMs = createdAtMillis(existing as Record<string, unknown>);
  // createdAt が無い古いドキュメントは拒否（新規サインアップ経路のみ許可）
  if (
    createdMs == null ||
    Date.now() - createdMs > REFERRAL_BIND_WINDOW_MS
  ) {
    return { ok: false, error: "bind_window_expired", inviteCode: code };
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

  const referrerSnap = await db.collection("users").doc(referrerUid).get();
  const referrerData = referrerSnap.data() ?? {};
  if (!referrerSnap.exists || referrerData.deletedAt != null) {
    return { ok: false, error: "referrer_unavailable", inviteCode: code };
  }
  // 相互招待（A→B と B→A）を拒否
  if (String(referrerData.referredByUid ?? "").trim() === inviteeUid) {
    return { ok: false, error: "mutual_invite", inviteCode: code };
  }

  const rateSince = new Date(Date.now() - REFERRAL_REFERRER_BIND_RATE_WINDOW_MS);
  try {
    const recentBinds = await db
      .collection("referralRelations")
      .where("referrerUid", "==", referrerUid)
      .where("createdAt", ">=", rateSince)
      .limit(REFERRAL_REFERRER_BIND_RATE_LIMIT + 1)
      .get();
    if (recentBinds.size > REFERRAL_REFERRER_BIND_RATE_LIMIT) {
      return { ok: false, error: "referrer_rate_limited", inviteCode: code };
    }
  } catch {
    // index 未整備時はスキップ（他の antifraud は有効）
  }

  await inviteeRef.set(
    {
      referralInviteCode: code,
      referredByUid: referrerUid,
      referralBoundAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // create のみ（並行 bind の二重作成を抑止）
  try {
    await relRef.create({
      inviteeUid,
      referrerUid,
      inviteCode: code,
      status: "registered" satisfies ReferralRelationStatus,
      activePredictDayKeys: [],
      activePredictDays: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e: unknown) {
    const codeNum =
      e && typeof e === "object" && "code" in e
        ? Number((e as { code?: number }).code)
        : null;
    if (codeNum === 6) {
      return { ok: false, error: "already_bound", inviteCode: code };
    }
    throw e;
  }

  return {
    ok: true,
    inviteCode: code,
    referrerUid,
    relationCreated: true,
    alreadyBound: false,
  };
}
