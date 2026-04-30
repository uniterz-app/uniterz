import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { nbaRegularSeasonWinsLosses } from "../../../../../lib/nbaRegularSeasonRecord";
import { db } from "../../lib/firebase";
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

/**
 * モバイル `ScheduleList` の teamRecordMap 相当：`teams` コレクションから W/L/rank
 */
export function useTeamRecordMap(
  games: NativeGameRow[],
  _selectedLeague: SupportedLeague
) {
  void _selectedLeague;
  const [map, setMap] = useState<Record<string, TeamRecordSnapshot>>({});

  useEffect(() => {
    let alive = true;
    const teamIds = uniqueTeamIdsFromGames(games);
    if (teamIds.length === 0) {
      setMap({});
      return;
    }

    (async () => {
      const merged: Record<string, TeamRecordSnapshot> = {};
      try {
        for (let i = 0; i < teamIds.length; i += 10) {
          const chunk = teamIds.slice(i, i + 10);
          const snap = await getDocs(
            query(collection(db, "teams"), where("__name__", "in", chunk))
          );
          snap.forEach((docSnap) => {
            const d = docSnap.data() as Record<string, unknown>;
            const isNbaTeam = String(d.league ?? "") === "nba";
            const wl = isNbaTeam
              ? nbaRegularSeasonWinsLosses(d as Parameters<typeof nbaRegularSeasonWinsLosses>[0])
              : {
                  wins: Number(d.wins ?? 0),
                  losses: Number(d.losses ?? 0),
                };
            const rank = typeof d.rank === "number" ? d.rank : undefined;
            merged[docSnap.id] = {
              wins: wl.wins,
              losses: wl.losses,
              rank,
            };
          });
        }
        if (alive) setMap(merged);
      } catch {
        if (alive) setMap({});
      }
    })();
    return () => {
      alive = false;
    };
  }, [games]);

  return map;
}
