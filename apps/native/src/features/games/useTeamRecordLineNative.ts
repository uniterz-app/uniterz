import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  footballWinsLossesDraws,
  formatTeamRecordWithRank,
  type TeamRecordLine,
} from "../../../../../lib/teamRecordDisplay";
import { nbaRegularSeasonWinsLosses } from "../../../../../lib/nbaRegularSeasonRecord";
import { fetchWcTeamRecordMap } from "../../../../../lib/wc/wcTeamRecordsCache";
import { normalizeWcTeamId } from "../../../../../lib/wc/resolveWcTeamId";

export function useTeamRecordLineNative(
  teamId: string | null | undefined,
  leagueRaw?: string | null
): TeamRecordLine | null {
  const [record, setRecord] = useState<TeamRecordLine | null>(null);
  const league = String(leagueRaw ?? "").toLowerCase();
  const isWc = league === "wc" || Boolean(normalizeWcTeamId(teamId));

  useEffect(() => {
    if (!teamId) {
      setRecord(null);
      return;
    }

    let alive = true;

    (async () => {
      if (isWc) {
        const wcMap = await fetchWcTeamRecordMap(db);
        if (!alive) return;
        setRecord(wcMap[teamId] ?? null);
        return;
      }

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
  }, [teamId, isWc]);

  return record;
}

export function formatTeamRecordLabelNative(
  teamId: string | null | undefined,
  leagueRaw: string | null | undefined,
  record: TeamRecordLine | null
): string {
  if (record) return formatTeamRecordWithRank(record, leagueRaw);
  const league = String(leagueRaw ?? "").toLowerCase();
  return league === "wc" || league === "j1" || league === "pl" ? "(0-0-0)" : "(0-0)";
}
