import { useEffect, useMemo, useState } from "react";
import { normalizeLeague } from "../../../../../lib/leagues";
import type { TeamNameById } from "../../../../../lib/games/gameTeamFilter";
import { fetchTeamsByLeagueShared } from "../../../../../lib/games/fetchTeamsByLeagueShared";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../lib/nba-team-names";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";
import type { SupportedLeague } from "./useTodayGames";

export type ScheduleTeamOption = { id: string; name: string };

function displayTeamName(id: string, raw: Record<string, unknown>): string {
  const fromMap = NBA_TEAM_NAME_BY_ID[id];
  if (fromMap) return fromMap;
  return String(raw.name ?? raw.shortName ?? id);
}

const SCHEDULE_TEAMS_TTL_MS = 30 * 60 * 1000;
const scheduleTeamsCache = new Map<
  string,
  { teams: ScheduleTeamOption[]; savedAt: number }
>();

/** Web `useScheduleTeams` 相当（共通 API + CDN） */
export function useScheduleTeamsNative(rawLeague: SupportedLeague) {
  const league = useMemo(() => normalizeLeague(rawLeague), [rawLeague]);
  const [teams, setTeams] = useState<ScheduleTeamOption[]>(
    () => scheduleTeamsCache.get(league)?.teams ?? []
  );

  useEffect(() => {
    let alive = true;
    const hit = scheduleTeamsCache.get(league);
    if (hit && Date.now() - hit.savedAt < SCHEDULE_TEAMS_TTL_MS) {
      setTeams(hit.teams);
      return () => {
        alive = false;
      };
    }

    setTeams([]);
    const apiBase = getUniterzApiBaseUrl();

    void fetchTeamsByLeagueShared({ league, apiBaseUrl: apiBase })
      .then((rows) => {
        if (!alive) return;
        const next: ScheduleTeamOption[] = rows.map((d) => {
          const id = String(d.id);
          return { id, name: displayTeamName(id, d) };
        });
        scheduleTeamsCache.set(league, { teams: next, savedAt: Date.now() });
        setTeams(next);
      })
      .catch(() => {
        if (alive) setTeams([]);
      });

    return () => {
      alive = false;
    };
  }, [league]);

  const nameById: TeamNameById = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t.name])),
    [teams]
  );

  return { teams, nameById };
}
