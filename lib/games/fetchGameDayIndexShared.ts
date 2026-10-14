/**
 * 試合日インデックス API クライアント（Web / Native 共用）。
 * TTL + inflight で同一リーグ・シーズンの二重 fetch を抑える。
 */

import type { League } from "@/lib/leagues";
import type { GameDayIndexPayload } from "@/lib/games/gameDayIndex";

const GAME_DAY_INDEX_FETCH_TTL_MS = 30 * 60 * 1000;

type CachedIndex = { startMs: number[]; gameStartMs: number[] | null };

const resultCache = new Map<string, { at: number; value: CachedIndex }>();
const resultInflight = new Map<string, Promise<CachedIndex>>();

type Params = {
  league: League;
  season: string;
  /** Native: API origin。Web は省略で相対パス */
  apiBaseUrl?: string | null;
};

function cacheKey(league: League, season: string, apiBaseUrl: string): string {
  return `${apiBaseUrl}|${league}|${season}`;
}

function baseOf(params: Params): string {
  return (params.apiBaseUrl ?? "").replace(/\/$/, "");
}

function peekIndex(params: Params): CachedIndex | null {
  const hit = resultCache.get(cacheKey(params.league, params.season, baseOf(params)));
  if (!hit || Date.now() - hit.at >= GAME_DAY_INDEX_FETCH_TTL_MS) return null;
  return hit.value;
}

function finiteNumbers(raw: unknown): number[] | null {
  return Array.isArray(raw)
    ? raw.filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    : null;
}

async function fetchIndex(
  params: Params,
  requireGameStartMs = false
): Promise<CachedIndex> {
  const base = baseOf(params);
  const key = cacheKey(params.league, params.season, base);
  const hit = peekIndex(params);
  if (hit && (!requireGameStartMs || hit.gameStartMs)) return hit;
  const pending = resultInflight.get(key);
  if (pending) return pending;

  /** `v`: gameStartMs 追加前の CDN キャッシュを踏まない */
  const q = new URLSearchParams({
    league: params.league,
    season: params.season,
    v: "2",
  });
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
      const startMs = finiteNumbers(json?.startMs);
      if (!res.ok || !json?.ok || !startMs) {
        throw new Error(json?.error ?? `game_days_http_${res.status}`);
      }
      const value: CachedIndex = {
        startMs,
        gameStartMs: finiteNumbers(json.gameStartMs),
      };
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

export function peekGameDayIndexShared(params: Params): number[] | null {
  return peekIndex(params)?.startMs ?? null;
}

export async function fetchGameDayIndexShared(params: Params): Promise<number[]> {
  return (await fetchIndex(params)).startMs;
}

/** 全試合の開始 ms（日別試合数用）。API が古く返さないときは null */
export function peekGameStartMsShared(params: Params): number[] | null {
  return peekIndex(params)?.gameStartMs ?? null;
}

export async function fetchGameStartMsShared(
  params: Params
): Promise<number[] | null> {
  return (await fetchIndex(params, true)).gameStartMs;
}
