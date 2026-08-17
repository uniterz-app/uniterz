/** Web `useTeamRecordLine` 相当 — NBA チーム戦績 */
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { nbaRegularSeasonWinsLosses } from "../../../../../lib/nbaRegularSeasonRecord";
import {
  formatTeamRecordWithRank,
  type TeamRecordLine,
} from "../../../../../lib/teamRecordDisplay";

export function useTeamRecordLineNative(
  teamId: string | null | undefined,
  _league?: string | null
): TeamRecordLine | null {
  const [record, setRecord] = useState<TeamRecordLine | null>(null);

  useEffect(() => {
    if (!teamId) {
      setRecord(null);
      return;
    }
    let alive = true;
    void getDoc(doc(db, "teams", teamId))
      .then((snap) => {
        if (!alive || !snap.exists()) {
          if (alive) setRecord(null);
          return;
        }
        const d = snap.data() as Record<string, unknown>;
        const wl = nbaRegularSeasonWinsLosses(
          d as Parameters<typeof nbaRegularSeasonWinsLosses>[0]
        );
        setRecord({
          wins: wl.wins,
          losses: wl.losses,
          rank: typeof d.rank === "number" ? d.rank : undefined,
        });
      })
      .catch(() => {
        if (alive) setRecord(null);
      });
    return () => {
      alive = false;
    };
  }, [teamId]);

  return record;
}

export function formatTeamRecordLabelNative(
  _teamId: string | null | undefined,
  leagueRaw: string | null | undefined,
  record: TeamRecordLine | null
): string {
  if (record) return formatTeamRecordWithRank(record, leagueRaw);
  const league = String(leagueRaw ?? "").toLowerCase();
  return league === "j1" || league === "pl" ? "(0-0-0)" : "(0-0)";
}
