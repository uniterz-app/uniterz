"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import {
  readWcTournamentGoalCountsCache,
  subscribeWcSeasonGames,
} from "@/lib/wc/wcSeasonGamesCache";

/** WC 大会累計ゴール数（確定試合の games.goalScorers からリアルタイム集計） */
export function useWcTournamentGoalCounts(
  season: string | null | undefined = GAME_SCHEDULE_SEASON
): {
  goalCounts: ReadonlyMap<string, number> | null;
  loading: boolean;
  error: string | null;
} {
  const [, tick] = useState(0);

  useEffect(() => {
    return subscribeWcSeasonGames(db, season, () => tick((n) => n + 1));
  }, [season]);

  return readWcTournamentGoalCountsCache(season);
}
