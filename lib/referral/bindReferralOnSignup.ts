/**
 * @deprecated クライアントからの users.inviteCode query は使わない。
 * 紐づけは `POST /api/me/referral/bind`（`bindReferralOnSignupAdmin`）を使うこと。
 */
export type { BindReferralOnSignupResult, ReferralRelationStatus } from "./bindReferralOnSignupAdmin";

/** @deprecated 使用禁止 — Admin API へ移行済み */
export async function bindReferralOnSignup(): Promise<never> {
  throw new Error(
    "bindReferralOnSignup is removed; use POST /api/me/referral/bind"
  );
}

/** @deprecated 使用禁止 */
export async function findReferrerUidByInviteCode(): Promise<never> {
  throw new Error(
    "findReferrerUidByInviteCode is removed; use findUidByInviteCodeAdmin"
  );
}
