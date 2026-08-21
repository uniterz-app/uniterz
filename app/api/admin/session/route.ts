import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { ensureAdminCustomClaims } from "@/lib/admin/ensureAdminCustomClaims";
import { hasAdminClaim } from "@/lib/admin/adminClaim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 管理者セッション確認 + Custom Claim 同期。
 * クライアントは UID リストを持たず、この API と token.claims.admin を使う。
 */
export async function GET(req: Request) {
  try {
    const authz =
      req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    if (hasAdminClaim(decoded as unknown as Record<string, unknown>)) {
      return NextResponse.json({ ok: true, admin: true, claimSynced: false });
    }
    const synced = await ensureAdminCustomClaims(auth, decoded.uid);
    if (!synced.admin) {
      return NextResponse.json(
        { ok: false, admin: false, error: "forbidden" },
        { status: 403 }
      );
    }
    return NextResponse.json({
      ok: true,
      admin: true,
      claimSynced: synced.refreshed,
    });
  } catch (e) {
    console.error("GET /api/admin/session:", e);
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }
}
