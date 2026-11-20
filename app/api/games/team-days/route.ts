import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { normalizeLeague } from "@/lib/leagues";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { loadTeamGameStartMs } from "@/lib/games/server/gameDayIndexAdmin";

export const runtime = "nodejs";

const TEAM_ID_RE = /^[a-z0-9-]{2,40}$/;

/**
 * GET /api/games/team-days
 * 1 チームのシーズン全試合の開始時刻（Firestore `gameDayIndex` の `teamStartMs.{team}`）。
 * 日付ストリップ・カレンダーでお気に入りチームの試合日に印を付ける。認証不要・CDN 共有。
 *
 * Query:
 * - league: nba|bj|j1|pl|wc
 * - team: アプリのチーム ID（例 nba-lakers）
 * - season: 省略時 GAME_SCHEDULE_SEASON
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const league = normalizeLeague(url.searchParams.get("league") ?? "nba");
    const season =
      (url.searchParams.get("season") ?? "").trim() || GAME_SCHEDULE_SEASON;
    const team = (url.searchParams.get("team") ?? "").trim();
    if (!TEAM_ID_RE.test(team)) {
      return NextResponse.json({ ok: false, error: "bad_team" }, { status: 400 });
    }

    const startMs = await unstable_cache(
      async () => loadTeamGameStartMs(getAdminDb(), { league, season, teamId: team }),
      ["game-team-days-v1", league, season, team],
      {
        revalidate: 3600,
        tags: ["game-day-index", `game-day-index:${league}:${season}`],
      }
    )();

    return NextResponse.json(
      { ok: true, league, season, team, startMs },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (e: unknown) {
    console.error("[api/games/team-days]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
