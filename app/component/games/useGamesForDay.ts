// app/component/games/useGamesForDay.ts
"use client";

import { useEffect, useState } from "react";
import { fetchGamesForDay } from "@/lib/games/queries";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";

export function useGamesForDay(params: {
  league: League;        // ← League を統一して使う
  dateJst: Date;
  season: string;        // "2025-26"
}) {
  const { league: rawLeague, dateJst, season } = params;

  // ★ Firestore の揺れを吸収し、League 型に正規化
  const league = normalizeLeague(rawLeague);

  const [games, setGames] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // ★ fetch に渡すのも正規化された league だけ
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
