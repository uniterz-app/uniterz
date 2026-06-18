"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import type { WcStandingGame } from "@/lib/wc/computeGroupStandings";
import {
  readWcSeasonGamesCache,
  subscribeWcSeasonGames,
} from "@/lib/wc/wcSeasonGamesCache";

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
  const [, tick] = useState(0);

  useEffect(() => {
    return subscribeWcSeasonGames(db, season, () => tick((n) => n + 1));
  }, [season]);

  const cached = readWcSeasonGamesCache(season);
  return {
    games: cached.games,
    loading: cached.loading,
    error: cached.error,
  };
}
