/**
 * 管理者 UID 許可リスト（サーバ専用。クライアントから import しない）
 * firestore.rules / storage.rules の isAdmin フォールバックと一致させる。
 */
import { ADMIN_CLAIM, hasAdminClaim } from "@/lib/admin/adminClaim";

export { ADMIN_CLAIM, hasAdminClaim };

export const ADMIN_UID_ALLOWLIST = [
  /** MPJ @3pjvg4y9 */
  "ynh0i1lJklWra1393TNbnxcKo5f2",
  /** チキ @kwyu5615 */
  "Rb3vF67NTLeCxSvrR15brCbiQSD2",
] as const;

const ADMIN_UID_SET: ReadonlySet<string> = new Set(ADMIN_UID_ALLOWLIST);

export function isAdminAllowlistedUid(
  uid: string | null | undefined
): boolean {
  return typeof uid === "string" && ADMIN_UID_SET.has(uid);
}
