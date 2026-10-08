/** `resolveLatestNbaSlateDateKey` のクライアント用フック（サーバールートは `latestNbaSlate` を直接使う） */

import { useEffect, useState } from "react";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import {
  fetchGameDayIndexShared,
  peekGameDayIndexShared,
} from "@/lib/games/fetchGameDayIndexShared";
import { resolveLatestNbaSlateDateKey } from "@/lib/games/latestNbaSlate";

export function useLatestNbaSlateDateKey(apiBaseUrl?: string | null): string {
  const [startMs, setStartMs] = useState<number[] | null>(() =>
    peekGameDayIndexShared({
      league: "nba",
      season: GAME_SCHEDULE_SEASON,
      apiBaseUrl,
    })
  );

  useEffect(() => {
    if (startMs) return;
    let alive = true;
    void fetchGameDayIndexShared({
      league: "nba",
      season: GAME_SCHEDULE_SEASON,
      apiBaseUrl,
    })
      .then((value) => {
        if (alive) setStartMs(value);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [apiBaseUrl, startMs]);

  return resolveLatestNbaSlateDateKey(startMs);
}
