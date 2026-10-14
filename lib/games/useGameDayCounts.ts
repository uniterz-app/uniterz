/**
 * カレンダー用の日別試合数（Web / Native 共用 hook）。
 * `useGameDayIndex` と同じ `/api/games/days` を共有キャッシュで読む（追加 fetch なし）。
 * API が `gameStartMs` を返さない間は null。
 */

import { useEffect, useMemo, useState } from "react";
import type { League } from "@/lib/leagues";
import { gameCountsByDayKey } from "@/lib/games/gameDayIndex";
import {
  fetchGameStartMsShared,
  peekGameStartMsShared,
} from "@/lib/games/fetchGameDayIndexShared";

export function useGameDayCounts(params: {
  league: League;
  season: string;
  timeZone: string;
  apiBaseUrl?: string | null;
  enabled?: boolean;
}): Record<string, number> | null {
  const { league, season, timeZone, apiBaseUrl } = params;
  const enabled = params.enabled ?? true;
  const [gameStartMs, setGameStartMs] = useState<number[] | null>(() =>
    peekGameStartMsShared({ league, season, apiBaseUrl })
  );

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const hit = peekGameStartMsShared({ league, season, apiBaseUrl });
    if (hit) {
      setGameStartMs(hit);
      return;
    }
    void fetchGameStartMsShared({ league, season, apiBaseUrl })
      .then((value) => {
        if (alive) setGameStartMs(value);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled, league, season, apiBaseUrl]);

  return useMemo(
    () => (gameStartMs ? gameCountsByDayKey(gameStartMs, timeZone) : null),
    [gameStartMs, timeZone]
  );
}
