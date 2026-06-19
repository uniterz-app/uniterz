import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import {
  readWcSeasonGamesCache,
  subscribeWcSeasonGames,
} from "../../../../../../lib/wc/wcSeasonGamesCache";

/** Web `useWcSeasonGames` 相当（グループ順位のクライアント集計用） */
export function useWcSeasonGamesNative(season: string | null | undefined) {
  const [, tick] = useState(0);

  useEffect(() => {
    return subscribeWcSeasonGames(db, season, () => tick((n) => n + 1));
  }, [season]);

  return readWcSeasonGamesCache(season);
}
