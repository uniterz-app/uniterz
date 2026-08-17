/**
 * @deprecated クライアントから inviteCode を書かない（rules で禁止）。
 * `GET /api/me/referral` / `ensureUserInviteCodeAdmin` を使うこと。
 */
export async function ensureUserInviteCode(): Promise<never> {
  throw new Error(
    "ensureUserInviteCode is removed; use GET /api/me/referral (Admin)"
  );
}
