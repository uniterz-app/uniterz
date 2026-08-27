/**
 * GET /api/profile/career?uid=
 *
 * 公開 GET は user_career を 1 read するだけ（書き込みなし）。
 * doc が無い場合は cumulative + users から組み立てた値を返すが永続化しない。
 * 永続化（ensure / 再構築）は `force=1` + job secret または本人のみ。
 */

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  ensureUserCareerDoc,
  loadOrBuildUserCareer,
} from "@/lib/profile/server/loadUserCareer";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import {
  consumeRateLimit,
  RATE_LIMIT_RULES,
  rateLimitSubjectFromRequest,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const db = getAdminDb();
    const limit = await consumeRateLimit(
      db,
      RATE_LIMIT_RULES.profilePublicRead,
      rateLimitSubjectFromRequest(req)
    );
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSec) },
        }
      );
    }
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
    const career = force
      ? await ensureUserCareerDoc(db, uid, { forceRebuild: true })
      : await loadOrBuildUserCareer(db, uid);
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
