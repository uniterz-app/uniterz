// app/lib/profile/useProfilePlayoffBracket.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildPlayoffDisplayData,
  type PlayoffDisplayData,
} from "@/lib/playoff-bracket-display";
import {
  loadPlayoffBracket,
  type PlayoffBracketDoc,
} from "@/lib/playoff-bracket-firestore";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";
import { usePlayoffOfficialResults } from "@/lib/playoff/usePlayoffOfficialResults";

export function useProfilePlayoffBracket(
  targetUid: string | null,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  const [loading, setLoading] = useState(false);
  const [playoffBracketDoc, setPlayoffBracketDoc] =
    useState<PlayoffBracketDoc | null>(null);

  const season = getCurrentPlayoffSeason();

  const officialResults = usePlayoffOfficialResults(
    enabled && targetUid ? season : null
  );

  useEffect(() => {
    if (!targetUid) {
      setPlayoffBracketDoc(null);
    }
  }, [targetUid]);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlayoffBracket() {
      if (!targetUid) {
        setLoading(false);
        return;
      }

      if (!enabled) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await loadPlayoffBracket(targetUid, season);
        if (cancelled) return;
        setPlayoffBracketDoc(data);
      } catch (e) {
        if (cancelled) return;
        console.error("failed to load playoff bracket", e);
        setPlayoffBracketDoc(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlayoffBracket();

    return () => {
      cancelled = true;
    };
  }, [targetUid, season, enabled]);

  const playoffDisplayData: PlayoffDisplayData | null = useMemo(() => {
    if (!playoffBracketDoc?.bracket || !playoffBracketDoc?.season) return null;
    return buildPlayoffDisplayData(
      playoffBracketDoc.bracket,
      playoffBracketDoc.season
    );
  }, [playoffBracketDoc]);

  const playoffScore = playoffBracketDoc?.totalScore ?? 0;

  return {
    loading,
    playoffBracketDoc,
    playoffDisplayData,
    playoffScore,
    season,
    officialResults,
  };
}
