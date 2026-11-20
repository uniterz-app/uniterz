import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadSeasonStandingsDoc } from "@/lib/predict/seasonStandingsServer";
import {
  optionalUidFromRequest,
  seasonPredictHiddenFromViewer,
} from "@/lib/predict/seasonPredictVisibility";
import {
  consumeRateLimit,
  RATE_LIMIT_RULES,
  rateLimitSubjectFromRequest,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidUid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 128 &&
    !value.includes("/")
  );
}

/**
 * 提出済み順位予想。公開範囲は season-awards と同じ（`lib/predict/seasonPredictVisibility.ts`）。
 */
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
    if (!isValidUid(uid)) {
      return NextResponse.json({ error: "invalid_uid" }, { status: 400 });
    }
    const season =
      url.searchParams.get("season")?.trim() || CURRENT_NBA_SEASON_KEY;

    const viewerUid = await optionalUidFromRequest(req);
    const hidden = await seasonPredictHiddenFromViewer({
      db,
      ownerUid: uid,
      season,
      viewerUid,
    });
    if (hidden) {
      return NextResponse.json({
        ok: true,
        uid,
        season,
        prediction: null,
        hidden,
      });
    }

    const prediction = await loadSeasonStandingsDoc(db, uid, season);
    return NextResponse.json({
      ok: true,
      uid,
      season,
      prediction,
      hidden: null,
    });
  } catch (e: unknown) {
    console.error("GET /api/profile/season-standings:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
