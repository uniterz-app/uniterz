import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { normalizeLeague } from "@/lib/leagues";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { loadGameDayIndex } from "@/lib/games/server/gameDayIndexAdmin";

export const runtime = "nodejs";

/**
 * GET /api/games/days
 * 日付ストリップ用のシーズン全試合開始時刻（Firestore `gameDayIndex`）。認証不要・CDN 共有。
 *
 * Query:
 * - league: nba|bj|j1|pl|wc
 * - season: 省略時 GAME_SCHEDULE_SEASON
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const league = normalizeLeague(url.searchParams.get("league") ?? "nba");
    const season =
      (url.searchParams.get("season") ?? "").trim() || GAME_SCHEDULE_SEASON;

    const cached = unstable_cache(
      async () => loadGameDayIndex(getAdminDb(), { league, season }),
      ["game-day-index", league, season],
      {
        revalidate: 3600,
        tags: ["game-day-index", `game-day-index:${league}:${season}`],
      }
    );

    const payload = await cached();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e: unknown) {
    console.error("[api/games/days]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
