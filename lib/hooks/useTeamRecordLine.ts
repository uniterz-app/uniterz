"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeLeague } from "@/lib/leagues";
import { loadNbaStandingsTeamRecordsShared } from "@/lib/nba/standings/loadNbaStandingsTeamRecordsShared";
import { footballWinsLossesDraws, type TeamRecordLine } from "@/lib/teamRecordDisplay";

/** teams/{teamId} または BDL standings から戦績行を取得 */
export function useTeamRecordLine(
  teamId: string | null | undefined,
  leagueRaw?: string | null
): TeamRecordLine | null {
  const [record, setRecord] = useState<TeamRecordLine | null>(null);
  const league = normalizeLeague(leagueRaw);
  const isNba = league === "nba";

  useEffect(() => {
    if (!teamId) {
      setRecord(null);
      return;
    }

    let alive = true;

    void (async () => {
      try {
        if (isNba) {
          const map = await loadNbaStandingsTeamRecordsShared({
            teamIds: [teamId],
          });
          if (!alive) return;
          setRecord(map[teamId] ?? null);
          return;
        }

        const snap = await getDoc(doc(db, "teams", teamId));
        if (!alive || !snap.exists()) {
          if (alive) setRecord(null);
          return;
        }

        const d = snap.data() as Record<string, unknown>;
        const wl = footballWinsLossesDraws(d);
        if (alive) {
          setRecord({
            wins: wl.wins,
            losses: wl.losses,
            draws: wl.draws,
            rank: typeof d.rank === "number" ? d.rank : undefined,
          });
        }
      } catch {
        if (alive) setRecord(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [teamId, isNba]);

  return record;
}
