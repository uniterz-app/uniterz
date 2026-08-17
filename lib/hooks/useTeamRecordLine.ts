"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { footballWinsLossesDraws, type TeamRecordLine } from "@/lib/teamRecordDisplay";
import { nbaRegularSeasonWinsLosses } from "@/lib/nbaRegularSeasonRecord";

/** teams/{teamId} から戦績行を取得 */
export function useTeamRecordLine(
  teamId: string | null | undefined,
  _leagueRaw?: string | null
): TeamRecordLine | null {
  const [record, setRecord] = useState<TeamRecordLine | null>(null);

  useEffect(() => {
    if (!teamId) {
      setRecord(null);
      return;
    }

    let alive = true;

    (async () => {
      const snap = await getDoc(doc(db, "teams", teamId));
      if (!alive || !snap.exists()) {
        if (alive) setRecord(null);
        return;
      }

      const d = snap.data() as Record<string, unknown>;
      const isNba = String(d.league ?? "") === "nba";
      if (isNba) {
        const wl = nbaRegularSeasonWinsLosses(
          d as Parameters<typeof nbaRegularSeasonWinsLosses>[0]
        );
        if (alive) {
          setRecord({
            wins: wl.wins,
            losses: wl.losses,
            rank: typeof d.rank === "number" ? d.rank : undefined,
          });
        }
        return;
      }

      const wl = footballWinsLossesDraws(d);
      if (alive) {
        setRecord({
          wins: wl.wins,
          losses: wl.losses,
          draws: wl.draws,
          rank: typeof d.rank === "number" ? d.rank : undefined,
        });
      }
    })().catch(() => {
      if (alive) setRecord(null);
    });

    return () => {
      alive = false;
    };
  }, [teamId]);

  return record;
}
