"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import type { TeamNameById } from "@/lib/games/gameTeamFilter";

export type ScheduleTeamOption = { id: string; name: string };

const SCHEDULE_TEAMS_TTL_MS = 30 * 60 * 1000;
const scheduleTeamsCache = new Map<
  League,
  { teams: ScheduleTeamOption[]; savedAt: number }
>();

/** スケジュール画面のチームセレクト用（リーグ一致の teams コレクション） */
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

    const q = query(collection(db, "teams"), where("league", "==", league));

    getDocs(q)
      .then((snap) => {
        if (!alive) return;
        const rows: ScheduleTeamOption[] = snap.docs.map((d) => {
          const x = d.data() as { name?: string; shortName?: string };
          const name = String(x?.name ?? x?.shortName ?? d.id);
          return { id: d.id, name };
        });
        rows.sort((a, b) => a.name.localeCompare(b.name, "ja"));
        scheduleTeamsCache.set(league, { teams: rows, savedAt: Date.now() });
        setTeams(rows);
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
