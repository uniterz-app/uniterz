"use client";

import { useEffect, useState } from "react";
import {
  getCachedTeamRecord,
  type TeamRecordSnapshot,
} from "@/lib/result/resultDetailFirestoreCache";

/** teams/{teamId} wins/losses/rank; missing docs do not update state (same as prior getDoc hook). */
export function useCachedTeamRecord(
  teamId?: string
): TeamRecordSnapshot | null {
  const [rec, setRec] = useState<TeamRecordSnapshot | null>(null);

  useEffect(() => {
    if (!teamId) return;

    let cancelled = false;
    getCachedTeamRecord(teamId).then((r) => {
      if (!cancelled && r !== null) setRec(r);
    });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return rec;
}
