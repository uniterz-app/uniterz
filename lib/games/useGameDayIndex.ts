/**
 * 日付ストリップ用のシーズン全試合日キー（Web / Native 共用 hook）。
 * 取得前・失敗時は null（呼び出し側は取得済み窓の試合日にフォールバック）。
 */

import { useEffect, useMemo, useState } from "react";
import type { League } from "@/lib/leagues";
import { gameDayKeysFromStartMs } from "@/lib/games/gameDayIndex";
import {
  fetchGameDayIndexShared,
  peekGameDayIndexShared,
} from "@/lib/games/fetchGameDayIndexShared";

export function useGameDayIndex(params: {
  league: League;
  season: string;
  timeZone: string;
  apiBaseUrl?: string | null;
  enabled?: boolean;
}): string[] | null {
  const { league, season, timeZone, apiBaseUrl } = params;
  const enabled = params.enabled ?? true;
  const [startMs, setStartMs] = useState<number[] | null>(() =>
    peekGameDayIndexShared({ league, season, apiBaseUrl })
  );

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const hit = peekGameDayIndexShared({ league, season, apiBaseUrl });
    setStartMs(hit);
    if (hit) return;
    void fetchGameDayIndexShared({ league, season, apiBaseUrl })
      .then((value) => {
        if (alive) setStartMs(value);
      })
      .catch((e) => {
        console.warn("[useGameDayIndex] fetch failed", e);
      });
    return () => {
      alive = false;
    };
  }, [enabled, league, season, apiBaseUrl]);

  return useMemo(() => {
    if (!startMs || startMs.length === 0) return null;
    return gameDayKeysFromStartMs(startMs, timeZone);
  }, [startMs, timeZone]);
}
