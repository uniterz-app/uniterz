"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { nbaRegularSeasonWinsLosses } from "@/lib/nbaRegularSeasonRecord";
import { footballWinsLossesDraws } from "@/lib/teamRecordDisplay";
import { fetchWcTeamRecordMap } from "@/lib/wc/wcTeamRecordsCache";

export type MatchCardTeamRecord = {
  wins: number;
  losses: number;
  draws?: number;
  rank?: number;
  lastGames?: { at?: unknown; isWin?: boolean }[];
};

/** MatchCard の homeRecord / awayRecord 用（ScheduleList と同じデータ源） */
export function useMatchCardTeamRecords(
  league: string | undefined,
  teamIds: readonly string[]
): Record<string, MatchCardTeamRecord> {
  const [map, setMap] = useState<Record<string, MatchCardTeamRecord>>({});

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
        if (league === "wc") {
          const wcMap = await fetchWcTeamRecordMap(db);
          if (!alive) return;
          const next: Record<string, MatchCardTeamRecord> = {};
          for (const teamId of ids) {
            const value = wcMap[teamId];
            if (value) next[teamId] = value;
          }
          setMap(next);
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
            const isNbaTeam = String(d.league ?? "") === "nba";
            if (isNbaTeam) {
              const wl = nbaRegularSeasonWinsLosses(d);
              next[teamId] = {
                wins: wl.wins,
                losses: wl.losses,
                rank: typeof d.rank === "number" ? d.rank : undefined,
                lastGames: Array.isArray(d.lastGames)
                  ? (d.lastGames as MatchCardTeamRecord["lastGames"])
                  : [],
              };
            } else {
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
        }
        setMap(next);
      } catch {
        if (alive) setMap({});
      }
    })();

    return () => {
      alive = false;
    };
  }, [league, teamIds.join("|")]);

  return map;
}
