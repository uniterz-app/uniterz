"use client";

import { useEffect, useMemo, useState } from "react";
import type { Firestore } from "firebase/firestore";
import {
  readWcSeasonGamesCache,
  subscribeWcSeasonGames,
} from "@/lib/wc/wcSeasonGamesCache";
import {
  resolveWcGroupStandingsForMatch,
  type WcGroupStandingsForMatch,
} from "@/lib/wc/wcGroupStandingRank";

export const WC_DEFAULT_SEASON = "2025-26";

/** リザルトカード等：同一シーズンの WC 試合をキャッシュ共有してグループ順位を返す */
export function useWcGroupStandingRanks(
  db: Firestore,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  season: string | null | undefined = WC_DEFAULT_SEASON
): WcGroupStandingsForMatch {
  const [, tick] = useState(0);

  useEffect(() => {
    return subscribeWcSeasonGames(db, season, () => tick((n) => n + 1));
  }, [db, season]);

  const { games } = readWcSeasonGamesCache(season);

  return useMemo(
    () => resolveWcGroupStandingsForMatch(homeTeamId, awayTeamId, games),
    [homeTeamId, awayTeamId, games]
  );
}
