"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeLeague } from "@/lib/leagues";
import { loadNbaStandingsTeamRecordsShared } from "@/lib/nba/standings/loadNbaStandingsTeamRecordsShared";
import { footballWinsLossesDraws } from "@/lib/teamRecordDisplay";

export type MatchCardTeamRecord = {
  wins: number;
  losses: number;
  draws?: number;
  rank?: number;
  /** BDL standings + game logs（古→新） */
  recentForm?: ("W" | "L")[];
  lastGames?: { at?: unknown; isWin?: boolean }[];
};

/** MatchCard の homeRecord / awayRecord 用（ScheduleList と同じデータ源） */
export function useMatchCardTeamRecords(
  league: string | undefined,
  teamIds: readonly string[]
): Record<string, MatchCardTeamRecord> {
  const [map, setMap] = useState<Record<string, MatchCardTeamRecord>>({});
  const normalizedLeague = normalizeLeague(league);
  const isNba = normalizedLeague === "nba";

  useEffect(() => {
    let alive = true;
    const ids = [...new Set(teamIds.filter(Boolean))];

    if (!ids.length) {
      setMap({});
      return () => {
        alive = false;
      };
    }

    void (async () => {
      try {
        if (isNba) {
          const next = await loadNbaStandingsTeamRecordsShared({ teamIds: ids });
          if (alive) setMap(next);
          return;
        }

        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 10) {
          chunks.push(ids.slice(i, i + 10));
        }

        const snaps = await Promise.all(
          chunks.map((chunk) =>
            getDocs(query(collection(db, "teams"), where("__name__", "in", chunk)))
          )
        );

        if (!alive) return;

        const next: Record<string, MatchCardTeamRecord> = {};
        for (const snap of snaps) {
          for (const docSnap of snap.docs) {
            const d = docSnap.data() as Record<string, unknown>;
            const teamId = docSnap.id;
            const wl = footballWinsLossesDraws(d);
            next[teamId] = {
              wins: wl.wins,
              losses: wl.losses,
              draws: wl.draws,
              rank: typeof d.rank === "number" ? d.rank : undefined,
              lastGames: Array.isArray(d.lastGames)
                ? (d.lastGames as MatchCardTeamRecord["lastGames"])
                : [],
            };
          }
        }
        setMap(next);
      } catch {
        if (alive) setMap({});
      }
    })();

    return () => {
      alive = false;
    };
  }, [isNba, teamIds.join("|")]);

  return map;
}
