import { useEffect, useState } from "react";
import { GAME_SCHEDULE_SEASON } from "@uniterz/shared";
import { db } from "../../../lib/firebase";
import {
  readWcTournamentGoalCountsCache,
  subscribeWcSeasonGames,
} from "@/lib/wc/wcSeasonGamesCache";

export function useNativeWcTournamentGoalCounts(
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
