import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

export type PostDistribution = {
  home: number;
  away: number;
  draw: number;
};

const EMPTY: PostDistribution = { home: 0, away: 0, draw: 0 };

/**
 * Web `GamePredictionDistribution` と同条件: `posts` で `gameId` かつ schemaVersion 2
 */
export function usePredictionPostDistribution(
  gameId: string | null
): { data: PostDistribution; loading: boolean; error: string | null } {
  const [data, setData] = useState<PostDistribution>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setData(EMPTY);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, "posts"),
      where("gameId", "==", gameId),
      where("schemaVersion", "==", 2)
    );
    getDocs(q)
      .then((snap) => {
        if (!alive) return;
        let h = 0;
        let a2 = 0;
        let d = 0;
        snap.docs.forEach((docSnap) => {
          const r = docSnap.data() as {
            prediction?: { winner?: string };
            winner?: string;
          };
          const winner = r?.prediction?.winner ?? r?.winner ?? null;
          if (winner === "home") h++;
          else if (winner === "away") a2++;
          else if (winner === "draw") d++;
        });
        setData({ home: h, away: a2, draw: d });
      })
      .catch((e) => {
        if (!alive) return;
        setData(EMPTY);
        setError(e?.message ?? "load error");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [gameId]);

  return { data, loading, error };
}
