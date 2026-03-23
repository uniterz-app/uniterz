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

export function useProfilePlayoffBracket(targetUid: string | null) {
  const [loading, setLoading] = useState(false);
  const [playoffBracketDoc, setPlayoffBracketDoc] =
    useState<PlayoffBracketDoc | null>(null);

  const season = getCurrentPlayoffSeason();

  useEffect(() => {
    let cancelled = false;

    async function fetchPlayoffBracket() {
      if (!targetUid) {
        setPlayoffBracketDoc(null);
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
  }, [targetUid, season]);

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
  };
}