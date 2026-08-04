/**
 * Games ページ用の共通試合窓ローダー（Admin SDK）。
 * 全ユーザー同一レスポンス → API + CDN で共有する。
 */

import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { normalizeLeague, type League } from "@/lib/leagues";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import {
  GAMES_WINDOW_PLUS_MINUS_DEFAULT,
  GAMES_WINDOW_QUERY_LIMIT,
} from "@/lib/games/gamesWindowConstants";
import {
  getPlusMinusDaysRangeInTimeZone,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { resolveGameStatus } from "@uniterz/shared";
import { serializeGameDoc } from "@/lib/games/gameDocJson";
import { mergePlayoffSeriesPeersForWindowGamesAdmin } from "@/lib/games/server/playoffSeriesPeersAdmin";

export {
  GAMES_WINDOW_PLUS_MINUS_DEFAULT,
  GAMES_WINDOW_QUERY_LIMIT,
} from "@/lib/games/gamesWindowConstants";

export type GamesWindowLoadParams = {
  league: League;
  /** YYYY-MM-DD（timeZone 基準） */
  anchorDateKey: string;
  timeZone: string;
  plusMinus?: number;
  season?: string;
  limit?: number;
};

export type GamesWindowPayload = {
  ok: true;
  league: League;
  season: string;
  timeZone: string;
  anchorDateKey: string;
  plusMinus: number;
  range: { startKey: string; endKey: string };
  rows: Record<string, unknown>[];
  peerRows: Record<string, unknown>[];
  hasLive: boolean;
};

export async function loadGamesWindow(
  db: Firestore,
  params: GamesWindowLoadParams
): Promise<GamesWindowPayload> {
  const league = normalizeLeague(params.league);
  const timeZone = params.timeZone || "Asia/Tokyo";
  const plusMinus = params.plusMinus ?? GAMES_WINDOW_PLUS_MINUS_DEFAULT;
  const season = params.season ?? GAME_SCHEDULE_SEASON;
  const limitN = params.limit ?? GAMES_WINDOW_QUERY_LIMIT;

  const anchor = parseDateKeyInTimeZone(params.anchorDateKey, timeZone);
  if (!anchor) {
    throw new Error("invalid_anchor");
  }

  const { start, end } = getPlusMinusDaysRangeInTimeZone(
    anchor,
    timeZone,
    plusMinus
  );
  const startKey = toDateKeyInTimeZone(start, timeZone);
  const endKey = toDateKeyInTimeZone(end, timeZone);

  const snap = await db
    .collection("games")
    .where("league", "==", league)
    .where("season", "==", season)
    .where("startAtJst", ">=", Timestamp.fromDate(start))
    .where("startAtJst", "<", Timestamp.fromDate(end))
    .orderBy("startAtJst", "asc")
    .limit(limitN)
    .get();

  const windowRows = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Record<string, unknown>),
  }));

  const peerRaw = await mergePlayoffSeriesPeersForWindowGamesAdmin(
    db,
    windowRows
  );

  const rows = windowRows.map((r) =>
    serializeGameDoc(String(r.id), r as Record<string, unknown>)
  );
  const peerRows = peerRaw.map((r) =>
    serializeGameDoc(String(r.id ?? ""), r as Record<string, unknown>)
  );

  const hasLive = windowRows.some(
    (r) => resolveGameStatus(r as Record<string, unknown>) === "live"
  );

  return {
    ok: true,
    league,
    season,
    timeZone,
    anchorDateKey: params.anchorDateKey,
    plusMinus,
    range: { startKey, endKey },
    rows,
    peerRows,
    hasLive,
  };
}

/** CDN / オリジン共有キャッシュ用 Cache-Control */
export function gamesWindowCacheControl(hasLive: boolean): string {
  if (hasLive) {
    return "public, s-maxage=15, stale-while-revalidate=30";
  }
  return "public, s-maxage=60, stale-while-revalidate=300";
}
