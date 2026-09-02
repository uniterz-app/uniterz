/** Web `useTeamRecordLine` 相当 — NBA チーム戦績 */
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { normalizeLeague } from "../../../../../lib/leagues";
import { loadNbaStandingsTeamRecordsShared } from "../../../../../lib/nba/standings/loadNbaStandingsTeamRecordsShared";
import { footballWinsLossesDraws } from "../../../../../lib/teamRecordDisplay";
import {
  formatTeamRecordWithRank,
  type TeamRecordLine,
} from "../../../../../lib/teamRecordDisplay";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";

export function useTeamRecordLineNative(
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
            apiBaseUrl: getUniterzApiBaseUrl(),
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
        setRecord({
          wins: wl.wins,
          losses: wl.losses,
          draws: wl.draws,
          rank: typeof d.rank === "number" ? d.rank : undefined,
        });
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

export function formatTeamRecordLabelNative(
  _teamId: string | null | undefined,
  leagueRaw: string | null | undefined,
  record: TeamRecordLine | null
): string {
  if (record) return formatTeamRecordWithRank(record, leagueRaw);
  const league = String(leagueRaw ?? "").toLowerCase();
  return league === "j1" || league === "pl" ? "(0-0-0)" : "(0-0)";
}
