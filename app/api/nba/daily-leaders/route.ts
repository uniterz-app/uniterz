import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { loadDailyLeadersAdmin } from "@/lib/nba/dailyLeaders/loadDailyLeadersAdmin";
import type { DailyLeadersPayload } from "@/lib/nba/dailyLeaders/buildDailyLeaders";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";

export const runtime = "nodejs";

class DayNotCompleteError extends Error {
  constructor(readonly payload: DailyLeadersPayload) {
    super("day_not_complete");
  }
}

function loadLiveCached(dateKey: string, timeZone: string) {
  return unstable_cache(
    () => loadDailyLeadersAdmin(getAdminDb(), { dateKey, timeZone }),
    ["nba-daily-leaders", dateKey, timeZone],
    { revalidate: 60, tags: ["nba-daily-leaders"] }
  )();
}

/**
 * 全試合の box が final の日はスタッツが変わらないので無期限キャッシュ（以後 Firestore を読まない）。
 * 未完了の日は throw してキャッシュさせず、60 秒のライブキャッシュを返す。
 */
async function loadCached(
  dateKey: string,
  timeZone: string
): Promise<DailyLeadersPayload> {
  try {
    return await unstable_cache(
      async () => {
        const payload = await loadLiveCached(dateKey, timeZone);
        if (!payload.complete) throw new DayNotCompleteError(payload);
        return payload;
      },
      ["nba-daily-leaders-complete", dateKey, timeZone],
      { revalidate: false }
    )();
  } catch (e) {
    if (e instanceof DayNotCompleteError) return e.payload;
    throw e;
  }
}

/**
 * GET /api/nba/daily-leaders?date=YYYY-MM-DD&tz=Asia/Tokyo
 * その日の試合 box（Firestore games.liveStats）から主要スタッツ Top20。BDL は叩かない。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const dateKey = (url.searchParams.get("date") ?? "").trim();
    const timeZone = (url.searchParams.get("tz") ?? "Asia/Tokyo").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return NextResponse.json(
        { ok: false, error: "date must be YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const payload = await loadCached(dateKey, timeZone);

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": payload.complete
          ? "public, s-maxage=86400, stale-while-revalidate=86400"
          : payload.hasLive
            ? "public, s-maxage=30, stale-while-revalidate=30"
            : "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "invalid_date") {
      return NextResponse.json({ ok: false, error: "invalid_date" }, { status: 400 });
    }
    return clientErrorResponse(e, "GET /api/nba/daily-leaders");
  }
}
