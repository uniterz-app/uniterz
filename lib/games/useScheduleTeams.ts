"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import type { TeamNameById } from "@/lib/games/gameTeamFilter";

export type ScheduleTeamOption = { id: string; name: string };

/** スケジュール画面のチームセレクト用（リーグ一致の teams コレクション） */
export function useScheduleTeams(rawLeague: League) {
  const league = useMemo(() => normalizeLeague(rawLeague), [rawLeague]);
  const [teams, setTeams] = useState<ScheduleTeamOption[]>([]);

  useEffect(() => {
    let alive = true;
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
