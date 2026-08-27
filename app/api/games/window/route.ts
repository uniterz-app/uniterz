import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { normalizeLeague } from "@/lib/leagues";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import {
  GAMES_WINDOW_PLUS_MINUS_DEFAULT,
  gamesWindowCacheControl,
  loadGamesWindow,
} from "@/lib/games/server/loadGamesWindow";

export const runtime = "nodejs";

/**
 * GET /api/games/window
 * 全ユーザー共通の試合窓（カード一覧）。認証不要・CDN 共有。
 *
 * Query:
 * - league: nba|bj|j1|pl|wc
 * - anchor + pm: アンカー±日（既定 pm=5）
 * - from + to: 半開区間 [from, to)（端延長用）
 * - tz: IANA TZ（省略時 Asia/Tokyo）
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const league = normalizeLeague(url.searchParams.get("league") ?? "nba");
    const timeZone = (url.searchParams.get("tz") ?? "Asia/Tokyo").trim();
    const fromDateKey = (url.searchParams.get("from") ?? "").trim();
    const toDateKey = (url.searchParams.get("to") ?? "").trim();
    const anchorDateKey = (url.searchParams.get("anchor") ?? "").trim();
    const pmRaw = url.searchParams.get("pm");
    const plusMinus = pmRaw
      ? Math.max(0, Math.min(31, Number(pmRaw) || GAMES_WINDOW_PLUS_MINUS_DEFAULT))
      : GAMES_WINDOW_PLUS_MINUS_DEFAULT;
    const limitRaw = url.searchParams.get("limit");
    const limitN = limitRaw
      ? Math.max(1, Math.min(500, Number(limitRaw) || 0))
      : undefined;
    const includePeers = url.searchParams.get("peers") !== "0";
    const season =
      (url.searchParams.get("season") ?? "").trim() || GAME_SCHEDULE_SEASON;

    const useRange = Boolean(fromDateKey && toDateKey);
    if (useRange) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(fromDateKey) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(toDateKey)
      ) {
        return NextResponse.json(
          { ok: false, error: "from/to must be YYYY-MM-DD" },
          { status: 400 }
        );
      }
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(anchorDateKey)) {
      return NextResponse.json(
        { ok: false, error: "anchor required (YYYY-MM-DD), or from+to" },
        { status: 400 }
      );
    }

    // season をキーに含めないと、シーズン切替後も空レスポンスがキャッシュに残る
    const cacheKey = useRange
      ? [
          "games-window-range",
          league,
          season,
          fromDateKey,
          toDateKey,
          timeZone,
          String(limitN ?? ""),
          includePeers ? "peers" : "nopeers",
        ]
      : [
          "games-window",
          league,
          season,
          anchorDateKey,
          timeZone,
          String(plusMinus),
          String(limitN ?? ""),
          includePeers ? "peers" : "nopeers",
        ];

    const cached = unstable_cache(
      async () =>
        loadGamesWindow(
          getAdminDb(),
          useRange
            ? {
                league,
                timeZone,
                fromDateKey,
                toDateKey,
                season,
                limit: limitN,
                includePeers,
              }
            : {
                league,
                timeZone,
                anchorDateKey,
                plusMinus,
                season,
                limit: limitN,
                includePeers,
              }
        ),
      cacheKey,
      {
        revalidate: 20,
        tags: [
          "games-window",
          `games-window:${league}`,
          `games-window:${league}:${season}`,
        ],
      }
    );

    const payload = await cached();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": gamesWindowCacheControl(payload.hasLive),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "invalid_anchor" || msg === "invalid_range") {
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
    console.error("[api/games/window]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
