/**
 * 試合日インデックス API クライアント（Web / Native 共用）。
 * TTL + inflight で同一リーグ・シーズンの二重 fetch を抑える。
 */

import type { League } from "@/lib/leagues";
import type { GameDayIndexPayload } from "@/lib/games/gameDayIndex";

const GAME_DAY_INDEX_FETCH_TTL_MS = 30 * 60 * 1000;

const resultCache = new Map<string, { at: number; value: number[] }>();
const resultInflight = new Map<string, Promise<number[]>>();

function cacheKey(league: League, season: string, apiBaseUrl: string): string {
  return `${apiBaseUrl}|${league}|${season}`;
}

export function peekGameDayIndexShared(params: {
  league: League;
  season: string;
  apiBaseUrl?: string | null;
}): number[] | null {
  const base = (params.apiBaseUrl ?? "").replace(/\/$/, "");
  const hit = resultCache.get(cacheKey(params.league, params.season, base));
  if (!hit || Date.now() - hit.at >= GAME_DAY_INDEX_FETCH_TTL_MS) return null;
  return hit.value;
}

export async function fetchGameDayIndexShared(params: {
  league: League;
  season: string;
  /** Native: API origin。Web は省略で相対パス */
  apiBaseUrl?: string | null;
}): Promise<number[]> {
  const base = (params.apiBaseUrl ?? "").replace(/\/$/, "");
  const key = cacheKey(params.league, params.season, base);
  const hit = peekGameDayIndexShared(params);
  if (hit) return hit;
  const pending = resultInflight.get(key);
  if (pending) return pending;

  const q = new URLSearchParams({ league: params.league, season: params.season });
  const promise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8_000);
    try {
      const res = await fetch(`${base}/api/games/days?${q.toString()}`, {
        method: "GET",
        cache: "default",
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => null)) as
        | (GameDayIndexPayload & { error?: string })
        | null;
      if (!res.ok || !json?.ok || !Array.isArray(json.startMs)) {
        throw new Error(json?.error ?? `game_days_http_${res.status}`);
      }
      const value = json.startMs.filter(
        (v): v is number => typeof v === "number" && Number.isFinite(v)
      );
      resultCache.set(key, { at: Date.now(), value });
      return value;
    } finally {
      clearTimeout(timeoutId);
    }
  })().finally(() => {
    resultInflight.delete(key);
  });

  resultInflight.set(key, promise);
  return promise;
}
