import { fetchGamesForDay } from "@/lib/games/queries";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";

/** 同一日・同一リーグの試合を kickoff 順で見て、直後の未決着（予想可能）試合の ID */
export async function getNextScheduledGameIdOnSameDay(opts: {
  currentGameId: string;
  league: string;
  dayAnchor: Date;
}): Promise<string | null> {
  const league = normalizeLeague(opts.league) as League;
  const games = await fetchGamesForDay({
    league,
    dateJst: opts.dayAnchor,
    season: GAME_SCHEDULE_SEASON,
  });
  const cur = String(opts.currentGameId);
  const idx = games.findIndex((g: { id?: string }) => String(g.id) === cur);
  if (idx === -1) return null;
  for (let i = idx + 1; i < games.length; i++) {
    const g = games[i] as { id?: string; status?: string };
    if (g.status === "scheduled") return String(g.id);
  }
  return null;
}
