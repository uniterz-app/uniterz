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
import { serializeGameDoc } from "@/lib/games/gameDocJson";
import { mergePlayoffSeriesPeersForWindowGamesAdmin } from "@/lib/games/server/playoffSeriesPeersAdmin";

export {
  GAMES_WINDOW_PLUS_MINUS_DEFAULT,
  GAMES_WINDOW_QUERY_LIMIT,
} from "@/lib/games/gamesWindowConstants";

function isLiveGameRow(raw: Record<string, unknown>): boolean {
  if (raw.final === true || raw.final === 1) return false;
  const t = String(raw.status ?? "").toLowerCase();
  return t === "live" || t === "inprogress";
}

export type GamesWindowLoadParams = {
  league: League;
  timeZone: string;
  /** YYYY-MM-DD。from/to 未指定時に必須 */
  anchorDateKey?: string;
  plusMinus?: number;
  /** 半開区間 [from, to) — 端延長用 */
  fromDateKey?: string;
  toDateKey?: string;
  season?: string;
  limit?: number;
  /** false のときシリーズ peer を取らない（存在チェック用） */
  includePeers?: boolean;
};

export type GamesWindowPayload = {
  ok: true;
  league: League;
  season: string;
  timeZone: string;
  anchorDateKey: string | null;
  plusMinus: number | null;
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
  const season = params.season ?? GAME_SCHEDULE_SEASON;
  const limitN = params.limit ?? GAMES_WINDOW_QUERY_LIMIT;

  let start: Date;
  let end: Date;
  let startKey: string;
  let endKey: string;
  let anchorDateKey: string | null = params.anchorDateKey ?? null;
  let plusMinus: number | null = null;

  if (params.fromDateKey && params.toDateKey) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(params.fromDateKey) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(params.toDateKey)
    ) {
      throw new Error("invalid_range");
    }
    if (params.fromDateKey >= params.toDateKey) {
      throw new Error("invalid_range");
    }
    const s = parseDateKeyInTimeZone(params.fromDateKey, timeZone);
    const e = parseDateKeyInTimeZone(params.toDateKey, timeZone);
    if (!s || !e) throw new Error("invalid_range");
    start = s;
    end = e;
    startKey = params.fromDateKey;
    endKey = params.toDateKey;
  } else {
    const anchorKey = params.anchorDateKey ?? "";
    const anchor = parseDateKeyInTimeZone(anchorKey, timeZone);
    if (!anchor) throw new Error("invalid_anchor");
    plusMinus = params.plusMinus ?? GAMES_WINDOW_PLUS_MINUS_DEFAULT;
    const range = getPlusMinusDaysRangeInTimeZone(
      anchor,
      timeZone,
      plusMinus
    );
    start = range.start;
    end = range.end;
    startKey = toDateKeyInTimeZone(start, timeZone);
    endKey = toDateKeyInTimeZone(end, timeZone);
    anchorDateKey = anchorKey;
  }

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

  const peerRaw =
    params.includePeers === false
      ? windowRows
      : await mergePlayoffSeriesPeersForWindowGamesAdmin(db, windowRows);

  const rows = windowRows.map((r) =>
    serializeGameDoc(String(r.id), r as Record<string, unknown>)
  );
  const peerRows = peerRaw.map((r) =>
    serializeGameDoc(String(r.id ?? ""), r as Record<string, unknown>)
  );

  const hasLive = windowRows.some((r) =>
    isLiveGameRow(r as Record<string, unknown>)
  );

  return {
    ok: true,
    league,
    season,
    timeZone,
    anchorDateKey,
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
