import { useEffect, useState } from "react";
import {
  fetchNbaFavoriteCount,
  type NbaFavoriteCountKind,
} from "@/lib/nba/favoriteCounts";

/**
 * 取得時点の自分の星状態との差分で楽観表示する（トグル直後に再取得しない）。
 * `ready` は自分のお気に入り読込完了。
 */
export function useNbaFavoriteCount(opts: {
  apiBase: string | null;
  kind: NbaFavoriteCountKind;
  id: string;
  active: boolean;
  ready: boolean;
}): number | null {
  const { apiBase, kind, id, active, ready } = opts;
  const [fetched, setFetched] = useState<number | null>(null);
  const [baseActive, setBaseActive] = useState<boolean | null>(null);

  useEffect(() => {
    setFetched(null);
    setBaseActive(null);
    if (apiBase == null || !id) return;
    let cancelled = false;
    void fetchNbaFavoriteCount(apiBase, kind, id)
      .then((n) => {
        if (!cancelled) setFetched(n);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [apiBase, kind, id]);

  useEffect(() => {
    if (fetched != null && ready && baseActive == null) {
      setBaseActive(active);
    }
  }, [fetched, ready, baseActive, active]);

  if (fetched == null || baseActive == null) return null;
  const delta = (active ? 1 : 0) - (baseActive ? 1 : 0);
  return Math.max(0, fetched + delta);
}
