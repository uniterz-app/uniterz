import { getAdminAuth } from "@/lib/firebaseAdmin";
import {
  hasAdminClaim,
  isAdminAllowlistedUid,
} from "@/lib/admin/adminAllowlist";
import { ensureAdminCustomClaims } from "@/lib/admin/ensureAdminCustomClaims";

export async function requireAdminUid(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) {
    const err = new Error("unauthorized");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token);
  const claims = decoded as unknown as Record<string, unknown>;

  if (hasAdminClaim(claims)) {
    return decoded.uid;
  }

  // 移行期: 許可リストなら claim を付与して通す（次回から claim のみで可）
  if (isAdminAllowlistedUid(decoded.uid)) {
    await ensureAdminCustomClaims(auth, decoded.uid);
    return decoded.uid;
  }

  const err = new Error("forbidden");
  (err as Error & { status?: number }).status = 403;
  throw err;
}
