import { useEffect, useState } from "react";
import { nbaRegularSeasonWinsLosses } from "../../../../../lib/nbaRegularSeasonRecord";
import { footballWinsLossesDraws } from "../../../../../lib/teamRecordDisplay";
import { fetchTeamsByLeagueShared } from "../../../../../lib/games/fetchTeamsByLeagueShared";
import { normalizeLeague } from "../../../../../lib/leagues";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";
import type { TeamRecordSnapshot } from "./teamRecordDisplay";
import type { NativeGameRow, SupportedLeague } from "./useTodayGames";

function uniqueTeamIdsFromGames(games: NativeGameRow[]): string[] {
  const s = new Set<string>();
  for (const g of games) {
    const h = g.home as { teamId?: string } | undefined;
    const a = g.away as { teamId?: string } | undefined;
    if (h?.teamId) s.add(String(h.teamId).trim());
    if (a?.teamId) s.add(String(a.teamId).trim());
  }
  return Array.from(s).filter(Boolean);
}

const leagueTeamsCache = new Map<
  string,
  { at: number; byId: Map<string, Record<string, unknown>> }
>();
const LEAGUE_TEAMS_TTL_MS = 5 * 60 * 1000;

/**
 * モバイル `ScheduleList` の teamRecordMap 相当：共通 teams API から W/L/rank
 */
export function useTeamRecordMap(
  games: NativeGameRow[],
  selectedLeague: SupportedLeague
) {
  const [map, setMap] = useState<Record<string, TeamRecordSnapshot>>({});
  const teamIdsKey = uniqueTeamIdsFromGames(games).sort().join(",");
  const league = normalizeLeague(selectedLeague);

  useEffect(() => {
    let alive = true;
    const teamIds = teamIdsKey ? teamIdsKey.split(",") : [];
    if (teamIds.length === 0) {
      setMap({});
      return;
    }

    void (async () => {
      try {
        const now = Date.now();
        let byId = leagueTeamsCache.get(league)?.byId;
        const cached = leagueTeamsCache.get(league);
        if (!cached || now - cached.at >= LEAGUE_TEAMS_TTL_MS) {
          const rows = await fetchTeamsByLeagueShared({
            league,
            apiBaseUrl: getUniterzApiBaseUrl(),
          });
          byId = new Map(rows.map((r) => [String(r.id), r]));
          leagueTeamsCache.set(league, { at: now, byId });
        }

        const merged: Record<string, TeamRecordSnapshot> = {};
        for (const id of teamIds) {
          const d = byId?.get(id);
          if (!d) continue;
          const isNbaTeam = String(d.league ?? "") === "nba";
          const rank = typeof d.rank === "number" ? d.rank : undefined;
          if (isNbaTeam) {
            const wl = nbaRegularSeasonWinsLosses(
              d as Parameters<typeof nbaRegularSeasonWinsLosses>[0]
            );
            merged[id] = { wins: wl.wins, losses: wl.losses, rank };
          } else {
            const wl = footballWinsLossesDraws(d);
            merged[id] = {
              wins: wl.wins,
              losses: wl.losses,
              draws: wl.draws,
              rank,
            };
          }
        }
        if (alive) setMap(merged);
      } catch {
        if (alive) setMap({});
      }
    })();

    return () => {
      alive = false;
    };
  }, [teamIdsKey, league]);

  return map;
}
