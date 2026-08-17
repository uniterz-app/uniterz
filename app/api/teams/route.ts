import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { normalizeLeague } from "@/lib/leagues";
import {
  loadTeamsByLeague,
  teamsByLeagueCacheControl,
} from "@/lib/games/server/loadTeamsByLeague";

export const runtime = "nodejs";

/**
 * GET /api/teams?league=nba
 * 認証不要・全ユーザー共通。CDN 共有。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const league = normalizeLeague(url.searchParams.get("league") ?? "nba");

    const cached = unstable_cache(
      async () => loadTeamsByLeague(getAdminDb(), league),
      ["teams-by-league", league],
      { revalidate: 120, tags: ["teams", `teams:${league}`] }
    );

    const payload = await cached();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": teamsByLeagueCacheControl() },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    console.error("[api/teams]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
