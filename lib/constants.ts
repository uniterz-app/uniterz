/** 運用管理者（Firestore / Storage ルールと合わせる） */
export const ADMIN_UIDS = [
  /** MPJ @3pjvg4y9 */
  "ynh0i1lJklWra1393TNbnxcKo5f2",
  /** チキ @kwyu5615 */
  "Rb3vF67NTLeCxSvrR15brCbiQSD2",
] as const;

const ADMIN_UID_SET: ReadonlySet<string> = new Set(ADMIN_UIDS);

/** 公式アカウントのハンドル（大文字小文字は無視） */
const OFFICIAL_HANDLES = new Set(["3pjvg4y9", "kwyu5615"]);

export function isAdminUid(uid: string | null | undefined): boolean {
  return typeof uid === "string" && ADMIN_UID_SET.has(uid);
}

function normalizeHandle(handle: string | null | undefined): string {
  return (handle ?? "").trim().replace(/^@/, "").toLowerCase();
}

/** 公式ユーザー。現状は管理者と同じ2アカウント */
export function isOfficialAccount(
  uid?: string | null,
  handle?: string | null
): boolean {
  if (isAdminUid(uid)) return true;
  const h = normalizeHandle(handle);
  return h.length > 0 && OFFICIAL_HANDLES.has(h);
}
