import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { fetchPlayoffSeriesPeerGames } from "../../../../../lib/games/fetchPlayoffSeriesPeerGames";
import type { NativeGameRow } from "./useTodayGames";

export function useNativeGameDocument(gameId: string | undefined) {
  const [game, setGame] = useState<NativeGameRow | null>(null);
  const [peerGames, setPeerGames] = useState<NativeGameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setPeerGames([]);
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    void (async () => {
      try {
        const snap = await getDoc(doc(db, "games", gameId));
        if (cancelled) return;
        if (!snap.exists()) {
          setGame(null);
          setPeerGames([]);
          setNotFound(true);
          return;
        }
        const raw = { id: snap.id, ...snap.data() } as NativeGameRow;
        const peers = await fetchPlayoffSeriesPeerGames(raw as Record<string, unknown>);
        if (cancelled) return;
        setGame(raw);
        setPeerGames(peers as NativeGameRow[]);
      } catch {
        if (cancelled) return;
        setGame(null);
        setPeerGames([]);
        setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return { game, peerGames, loading, notFound };
}
