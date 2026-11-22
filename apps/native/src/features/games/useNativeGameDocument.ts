import { useEffect, useState } from "react";
import { fetchPublicGameDoc } from "../../../../../lib/games/fetchPublicGameDoc";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";
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
        const { exists, game: raw, peers } = await fetchPublicGameDoc({
          gameId,
          view: "slim",
          includePeers: true,
          apiBaseUrl: getUniterzApiBaseUrl(),
        });
        if (cancelled) return;
        if (!exists || !raw) {
          setGame(null);
          setPeerGames([]);
          setNotFound(true);
          return;
        }
        setGame(raw as NativeGameRow);
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
