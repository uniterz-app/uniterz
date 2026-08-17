import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import { toDateKeyInTimeZone } from "@/lib/time/zonedTime";
import { fetchGamesWindowShared } from "@/lib/games/fetchGamesWindowShared";

export async function fetchGamesForDay(params: {
  league: League;
  dateJst: Date;
  season: string;
  apiBaseUrl?: string | null;
}) {
  const league = normalizeLeague(params.league);
  const dayKey = toDateKeyInTimeZone(params.dateJst, "Asia/Tokyo");
  const payload = await fetchGamesWindowShared({
    league,
    timeZone: "Asia/Tokyo",
    anchorDateKey: dayKey,
    plusMinus: 0,
    apiBaseUrl: params.apiBaseUrl,
    includePeers: false,
  });
  return payload.rows;
}
