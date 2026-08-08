import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  getCalendarMonthRangeInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { fetchGamesWindowShared } from "@/lib/games/fetchGamesWindowShared";

/** 指定暦月に1試合でも存在するか（月送りの可否判定） */
export async function fetchMonthHasGames(params: {
  league: League;
  monthAnchor: Date;
  timeZone: string;
  apiBaseUrl?: string | null;
  signal?: AbortSignal;
}): Promise<boolean> {
  const league = normalizeLeague(params.league);
  const { start, end } = getCalendarMonthRangeInTimeZone(
    params.monthAnchor,
    params.timeZone
  );
  const payload = await fetchGamesWindowShared({
    league,
    timeZone: params.timeZone,
    fromDateKey: toDateKeyInTimeZone(start, params.timeZone),
    toDateKey: toDateKeyInTimeZone(end, params.timeZone),
    apiBaseUrl: params.apiBaseUrl,
    signal: params.signal,
    limit: 1,
    includePeers: false,
  });
  return payload.rows.length > 0;
}
