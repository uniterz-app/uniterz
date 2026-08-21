/**
 * GET /api/profile/career?uid=
 * user_career 1 read。無ければ cumulative + users から ensure して返す。
 */

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { ensureUserCareerDoc } from "@/lib/profile/server/loadUserCareer";
import { checkJobSecret } from "@/lib/security/assertJobSecret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const uid = url.searchParams.get("uid")?.trim() ?? "";
    if (!uid || uid.length > 128) {
      return NextResponse.json({ error: "uid required" }, { status: 400 });
    }
    const force = url.searchParams.get("force") === "1";
    if (force && !checkJobSecret(req)) {
      let caller: string;
      try {
        caller = await requireUidFromRequest(req);
      } catch {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      if (caller !== uid) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
    const db = getAdminDb();
    const career = await ensureUserCareerDoc(db, uid, {
      forceRebuild: force,
    });
    return NextResponse.json(
      { ok: true, career },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[api/profile/career]", err);
    return NextResponse.json(
      { error: "career_load_failed" },
      { status: 500 }
    );
  }
}
