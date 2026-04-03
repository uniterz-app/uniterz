"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Bracket } from "@/lib/score-playoff-bracket";

/**
 * Subscribes to `playoffResults/{season}` (same document the admin tools / Cloud
 * Functions use). When you save results there, bracket views update live.
 */
export function usePlayoffOfficialResults(season: string | undefined | null) {
  const [results, setResults] = useState<Bracket | null>(null);

  useEffect(() => {
    if (!season) {
      setResults(null);
      return;
    }

    const ref = doc(db, "playoffResults", season);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setResults(null);
          return;
        }
        const data = snap.data() as { results?: Bracket };
        setResults(data.results ?? {});
      },
      (e) => {
        console.error("playoffResults subscription failed", e);
        setResults(null);
      }
    );

    return () => unsub();
  }, [season]);

  return results;
}
