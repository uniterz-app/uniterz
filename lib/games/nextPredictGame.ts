import { fetchGamesForDay } from "@/lib/games/queries";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";

function toSkipSet(ids?: Iterable<string>): Set<string> {
  const s = new Set<string>();
  if (!ids) return s;
  for (const id of ids) s.add(String(id));
  return s;
}

/**
 * 一覧（kickoff 昇順想定）で current の後ろから、同一リーグ・scheduled・未スキップの最初の試合 ID。
 * Games オーバーレイの `propsList` にそのまま渡す。
 */
export function findNextUnpredictedScheduledGameInList(
  games: { id?: string; status?: string; league?: string }[],
  currentGameId: string,
  league: string,
  skipGameIds: ReadonlySet<string>
): string | null {
  const lg = normalizeLeague(league);
  const cur = String(currentGameId);
  const idx = games.findIndex((g) => String(g.id) === cur);
  if (idx === -1) return null;
  for (let i = idx + 1; i < games.length; i++) {
    const g = games[i];
    if (normalizeLeague(g.league ?? "") !== lg) continue;
    const id = String(g.id ?? "");
    if (!id) continue;
    if (g.status !== "scheduled") continue;
    if (skipGameIds.has(id)) continue;
    return id;
  }
  return null;
}

/** 同一日・同一リーグの試合を kickoff 順で見て、直後の未決着（予想可能）かつ skip されていない試合の ID */
export async function getNextScheduledGameIdOnSameDay(opts: {
  currentGameId: string;
  league: string;
  dayAnchor: Date;
  /** すでに予想済みなど、モーダル候補から除外する gameId */
  skipGameIds?: Iterable<string>;
}): Promise<string | null> {
  const league = normalizeLeague(opts.league) as League;
  const skip = toSkipSet(opts.skipGameIds);
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
    const id = String(g.id ?? "");
    if (g.status !== "scheduled" || skip.has(id)) continue;
    return id;
  }
  return null;
}
