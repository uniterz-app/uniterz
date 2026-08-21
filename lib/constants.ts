/** 公式アカウントのハンドル（大文字小文字は無視）。管理者 UID はクライアントに載せない */
const OFFICIAL_HANDLES = new Set(["3pjvg4y9", "kwyu5615"]);

function normalizeHandle(handle: string | null | undefined): string {
  return (handle ?? "").trim().replace(/^@/, "").toLowerCase();
}

/**
 * @deprecated クライアントでは `useIsAdmin` / token.claims.admin を使う。
 * サーバは `lib/admin/adminAllowlist` を使う。常に false（UID リスト非公開化）。
 */
export function isAdminUid(_uid: string | null | undefined): boolean {
  return false;
}

/** 公式ユーザー表示用（ハンドル判定のみ） */
export function isOfficialAccount(
  _uid?: string | null,
  handle?: string | null
): boolean {
  const h = normalizeHandle(handle);
  return h.length > 0 && OFFICIAL_HANDLES.has(h);
}
