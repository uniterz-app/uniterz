/**
 * 1 チームのシーズン試合日キー（日付ストリップ・カレンダーの印用。Web / Native 共用 hook）。
 * チーム未指定・取得前・失敗時は null。
 */

import { useEffect, useMemo, useState } from "react";
import type { League } from "@/lib/leagues";
import { gameDayKeysFromStartMs } from "@/lib/games/gameDayIndex";

const TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { at: number; startMs: number[] }>();
const inflight = new Map<string, Promise<number[]>>();

type Params = {
  league: League;
  season: string;
  teamId: string | null;
  apiBaseUrl?: string | null;
};

function keyOf(p: Params, base: string): string {
  return `${base}|${p.league}|${p.season}|${p.teamId}`;
}

function peek(key: string): number[] | null {
  const hit = cache.get(key);
  return hit && Date.now() - hit.at < TTL_MS ? hit.startMs : null;
}

async function fetchTeamStartMs(p: Params, base: string, key: string): Promise<number[]> {
  const pending = inflight.get(key);
  if (pending) return pending;
  const q = new URLSearchParams({
    league: p.league,
    season: p.season,
    team: String(p.teamId),
  });
  const promise = (async () => {
    const res = await fetch(`${base}/api/games/team-days?${q.toString()}`);
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      startMs?: unknown;
    } | null;
    if (!res.ok || !json?.ok || !Array.isArray(json.startMs)) {
      throw new Error(`team_days_http_${res.status}`);
    }
    const startMs = json.startMs.filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v)
    );
    cache.set(key, { at: Date.now(), startMs });
    return startMs;
  })().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export function useTeamGameDayKeys(
  params: Params & { timeZone: string }
): ReadonlySet<string> | null {
  const { league, season, teamId, apiBaseUrl, timeZone } = params;
  const base = (apiBaseUrl ?? "").replace(/\/$/, "");
  const key = teamId ? keyOf({ league, season, teamId }, base) : null;
  const [state, setState] = useState<{ key: string; startMs: number[] } | null>(() => {
    const hit = key ? peek(key) : null;
    return key && hit ? { key, startMs: hit } : null;
  });

  useEffect(() => {
    if (!key || !teamId) return;
    const hit = peek(key);
    if (hit) {
      setState({ key, startMs: hit });
      return;
    }
    let alive = true;
    void fetchTeamStartMs({ league, season, teamId }, base, key)
      .then((startMs) => {
        if (alive) setState({ key, startMs });
      })
      .catch((e) => console.warn("[useTeamGameDayKeys] fetch failed", e));
    return () => {
      alive = false;
    };
  }, [key, league, season, teamId, base]);

  return useMemo(() => {
    if (!key || state?.key !== key) return null;
    return new Set(gameDayKeysFromStartMs(state.startMs, timeZone));
  }, [key, state, timeZone]);
}
