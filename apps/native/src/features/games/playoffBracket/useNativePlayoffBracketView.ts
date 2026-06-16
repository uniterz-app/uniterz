import { useEffect, useMemo, useState } from "react";
import {
  buildPlayoffDisplayData,
  type PlayoffDisplayData,
} from "../../../../../../lib/playoff-bracket-display";
import {
  loadPlayoffBracket,
  type BracketState,
  type PlayoffBracketDoc,
} from "../../../../../../lib/playoff-bracket-firestore";
import { getCurrentPlayoffSeason } from "../../../../../../lib/playoff-bracket-config";
import { usePlayoffOfficialResultsNative } from "./usePlayoffOfficialResultsNative";

export function useNativePlayoffBracketView(uid: string | undefined) {
  const fallbackSeason = getCurrentPlayoffSeason();
  const [loading, setLoading] = useState(true);
  const [bracketDoc, setBracketDoc] = useState<PlayoffBracketDoc | null>(null);
  const [season, setSeason] = useState(fallbackSeason);

  const officialResults = usePlayoffOfficialResultsNative(season);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!uid) {
        setBracketDoc(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const saved = await loadPlayoffBracket(uid, fallbackSeason);
        if (cancelled) return;
        if (!saved) {
          setBracketDoc(null);
          return;
        }
        setBracketDoc(saved);
        setSeason(saved.season ?? fallbackSeason);
      } catch {
        if (!cancelled) setBracketDoc(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [uid, fallbackSeason]);

  const display: PlayoffDisplayData | null = useMemo(() => {
    if (!bracketDoc?.bracket) return null;
    return buildPlayoffDisplayData(bracketDoc.bracket, season);
  }, [bracketDoc, season]);

  const savedBracket: BracketState | null = bracketDoc?.bracket ?? null;
  const score = bracketDoc?.totalScore ?? 0;

  return {
    loading,
    display,
    savedBracket,
    score,
    season,
    officialResults,
    hasSubmitted: Boolean(bracketDoc?.bracket),
  };
}
