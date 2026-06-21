"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Firestore } from "firebase/firestore";
import type { WcStandingGame } from "@/lib/wc/computeGroupStandings";
import {
  readWcSeasonGamesCache,
  subscribeWcSeasonGames,
} from "@/lib/wc/wcSeasonGamesCache";
import {
  resolveWcGroupStandingsForMatch,
  type WcGroupStandingsForMatch,
} from "@/lib/wc/wcGroupStandingRank";

export const WC_DEFAULT_SEASON = "2025-26";

/** getSnapshot は同一参照を返す必要がある（毎回 [] を作ると無限ループ） */
const EMPTY_WC_STANDING_GAMES: WcStandingGame[] = [];

/** useSyncExternalStore 用 — entry.games の参照だけを返す（新オブジェクトを毎回作らない） */
function readWcSeasonGamesSnapshot(
  season: string | null | undefined
): WcStandingGame[] {
  if (!season) return EMPTY_WC_STANDING_GAMES;
  return readWcSeasonGamesCache(season).games ?? EMPTY_WC_STANDING_GAMES;
}

/** リザルトカード等：同一シーズンの WC 試合をキャッシュ共有してグループ順位を返す */
export function useWcGroupStandingRanks(
  db: Firestore,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  season: string | null | undefined = WC_DEFAULT_SEASON
): WcGroupStandingsForMatch {
  const games = useSyncExternalStore(
    (onStoreChange) => {
      if (!season) return () => {};
      return subscribeWcSeasonGames(db, season, onStoreChange);
    },
    () => readWcSeasonGamesSnapshot(season),
    () => EMPTY_WC_STANDING_GAMES
  );

  return useMemo(
    () => resolveWcGroupStandingsForMatch(homeTeamId, awayTeamId, games),
    [homeTeamId, awayTeamId, games]
  );
}
