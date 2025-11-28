// app/component/games/useGamesForDay.ts
"use client";
import { useEffect, useState } from "react";
import { fetchGamesForDay } from "@/lib/games/queries";

export function useGamesForDay(params: {
  league: "bj" | "j";
  dateJst: Date;
  season: string; // 例: "2025-26"
}) {
  const { league, dateJst, season } = params;
  const [games, setGames] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await fetchGamesForDay({ league, dateJst, season });
        if (!alive) return;
        setGames(rows);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "取得に失敗しました");
        setGames([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [league, dateJst, season]);

  return { games: games ?? [], loading, error };
}
