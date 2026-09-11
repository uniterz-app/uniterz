/**
 * GET /api/users/search?q=
 * ログイン必須。表示名（ユーザー名）前方一致（2〜40文字）。
 */
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  consumeRateLimit,
  MINUTE_MS,
  rateLimitSubjectFromRequest,
} from "@/lib/security/rateLimit";
import {
  normalizeUserSearchQuery,
  searchUsersByDisplayNamePrefix,
} from "@/lib/users/searchUsersByHandle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEARCH_RATE = {
  scope: "user_search",
  limit: 60,
  windowMs: 10 * MINUTE_MS,
} as const;

export async function GET(req: Request) {
  try {
    let callerUid: string;
    try {
      callerUid = await requireUidFromRequest(req);
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();
    const limit = await consumeRateLimit(
      db,
      SEARCH_RATE,
      rateLimitSubjectFromRequest(req) || callerUid
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
    const q = normalizeUserSearchQuery(url.searchParams.get("q") ?? "");
    if (q.length < 2) {
      return NextResponse.json(
        { ok: true, q: "", users: [] as const, hint: "min_length" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    if (q.length > 40) {
      return NextResponse.json({ error: "query_too_long" }, { status: 400 });
    }

    const users = await searchUsersByDisplayNamePrefix(db, q, {
      limit: 20,
      excludeUid: callerUid,
    });

    return NextResponse.json(
      { ok: true, q, users },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/users/search]", err);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
