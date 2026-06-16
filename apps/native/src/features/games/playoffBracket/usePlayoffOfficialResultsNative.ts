import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Bracket } from "../../../../../../lib/score-playoff-bracket";

/** `playoffResults/{season}` を購読（Web `usePlayoffOfficialResults` 相当） */
export function usePlayoffOfficialResultsNative(season: string | undefined | null) {
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
      () => {
        setResults(null);
      }
    );

    return () => unsub();
  }, [season]);

  return results;
}
