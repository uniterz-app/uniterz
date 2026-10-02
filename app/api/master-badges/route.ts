import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  loadMasterBadges,
  masterBadgesCacheControl,
} from "@/lib/badges/server/loadMasterBadges";

export const runtime = "nodejs";

/**
 * GET /api/master-badges
 * 認証不要・カタログ共通。CDN 共有。
 */
export async function GET() {
  try {
    const cached = unstable_cache(
      async () => loadMasterBadges(getAdminDb()),
      ["master-badges"],
      { revalidate: 3600, tags: ["master-badges"] }
    );
    const payload = await cached();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": masterBadgesCacheControl() },
    });
  } catch (e: unknown) {
    console.error("[api/master-badges]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
