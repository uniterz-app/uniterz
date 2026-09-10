"use client";

import { useEffect, useMemo, useState } from "react";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import type { TeamNameById } from "@/lib/games/gameTeamFilter";
import { fetchTeamsByLeagueShared } from "@/lib/games/fetchTeamsByLeagueShared";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";

export type ScheduleTeamOption = { id: string; name: string };

function displayTeamName(id: string, raw: Record<string, unknown>): string {
  const fromMap = NBA_TEAM_NAME_BY_ID[id];
  if (fromMap) return fromMap;
  return String(raw.name ?? raw.shortName ?? id);
}

const SCHEDULE_TEAMS_TTL_MS = 30 * 60 * 1000;
const scheduleTeamsCache = new Map<
  League,
  { teams: ScheduleTeamOption[]; savedAt: number }
>();

/** スケジュール画面のチームセレクト用（共通 API + CDN） */
export function useScheduleTeams(rawLeague: League) {
  const league = useMemo(() => normalizeLeague(rawLeague), [rawLeague]);
  const [teams, setTeams] = useState<ScheduleTeamOption[]>(
    () => scheduleTeamsCache.get(league)?.teams ?? [],
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

    void fetchTeamsByLeagueShared({ league })
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
    [teams],
  );

  return { teams, nameById };
}
