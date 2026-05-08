"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WcStandingGame } from "@/lib/wc/computeGroupStandings";

/**
 * 指定シーズンの WC 試合を全件取得する hook。
 * グループ順位表のクライアントサイド集計に使う想定。
 *
 * （試合数は最大でも 64 試合 / シーズンなので、全件 fetch して
 *  必要なものをクライアント側で絞る方が実装も Firestore index も最小）
 */
export function useWcSeasonGames(season: string | null | undefined): {
  games: WcStandingGame[] | null;
  loading: boolean;
  error: string | null;
} {
  const [games, setGames] = useState<WcStandingGame[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!season) {
      setGames(null);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const q = query(
          collection(db, "games"),
          where("league", "==", "wc"),
          where("season", "==", season),
        );
        const snap = await getDocs(q);
        if (!alive) return;
        const list: WcStandingGame[] = [];
        snap.forEach((d) => {
          const data = d.data() as Record<string, unknown>;
          const home = (data?.home ?? {}) as { teamId?: unknown };
          const away = (data?.away ?? {}) as { teamId?: unknown };
          const homeTeamId =
            typeof home.teamId === "string" ? home.teamId : "";
          const awayTeamId =
            typeof away.teamId === "string" ? away.teamId : "";
          if (!homeTeamId || !awayTeamId) return;
          const homeScore =
            typeof data.homeScore === "number" ? data.homeScore : null;
          const awayScore =
            typeof data.awayScore === "number" ? data.awayScore : null;
          const status =
            typeof data.status === "string" ? data.status : "scheduled";
          list.push({ homeTeamId, awayTeamId, homeScore, awayScore, status });
        });
        setGames(list);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "failed to fetch wc games");
        setGames([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [season]);

  return { games, loading, error };
}
