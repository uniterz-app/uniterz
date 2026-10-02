/**
 * 許可リスト UID に Custom Claim `admin: true` を付与（冪等）
 */
import type { Auth } from "firebase-admin/auth";
import {
  ADMIN_CLAIM,
  hasAdminClaim,
  isAdminAllowlistedUid,
} from "@/lib/admin/adminAllowlist";

export async function ensureAdminCustomClaims(
  auth: Auth,
  uid: string
): Promise<{ admin: boolean; refreshed: boolean }> {
  if (!isAdminAllowlistedUid(uid)) {
    return { admin: false, refreshed: false };
  }
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;
  if (hasAdminClaim(existing)) {
    return { admin: true, refreshed: false };
  }
  await auth.setCustomUserClaims(uid, {
    ...existing,
    [ADMIN_CLAIM]: true,
  });
  return { admin: true, refreshed: true };
}
