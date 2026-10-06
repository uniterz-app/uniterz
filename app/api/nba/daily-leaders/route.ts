import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { loadDailyLeadersAdmin } from "@/lib/nba/dailyLeaders/loadDailyLeadersAdmin";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";

export const runtime = "nodejs";

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

    const payload = await unstable_cache(
      () => loadDailyLeadersAdmin(getAdminDb(), { dateKey, timeZone }),
      ["nba-daily-leaders", dateKey, timeZone],
      { revalidate: 60, tags: ["nba-daily-leaders"] }
    )();

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": payload.hasLive
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
