"use client";

/**
 * My Rank カードの Ranking Progress 用 — 自分の総合得点順位の日次推移。
 * `/api/profile/rank-playoff-trend`（rankSnapshotHistory 最新10件）を読む。
 */

import { useEffect, useState } from "react";
import type { MyRankProgressPoint } from "@/lib/rankings/myRankRankingProgress";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { at: number; points: MyRankProgressPoint[] }>();

function cacheKey(input: {
  uid: string;
  rankingLeague: RankingLeagueSource;
  wcStage: WcRankingStage | null;
}): string {
  return [input.uid, input.rankingLeague, input.wcStage ?? "-"].join(":");
}

function normalizePoints(raw: unknown): MyRankProgressPoint[] {
  if (!Array.isArray(raw)) return [];
  const out: MyRankProgressPoint[] = [];
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const dateKey = (p as { dateKey?: unknown }).dateKey;
    const rank = (p as { rank?: unknown }).rank;
    if (typeof dateKey !== "string" || typeof rank !== "number") continue;
    if (!Number.isFinite(rank) || rank < 1) continue;
    out.push({ dateKey, rank: Math.floor(rank) });
  }
  return out;
}

export function useMyRankProgress(input: {
  uid: string | null | undefined;
  enabled: boolean;
  rankingLeague: RankingLeagueSource;
  wcStage?: WcRankingStage | null;
}): { points: MyRankProgressPoint[] | null; loading: boolean } {
  const { uid, enabled, rankingLeague } = input;
  const wcStage = input.wcStage ?? null;

  const [state, setState] = useState<{
    key: string | null;
    points: MyRankProgressPoint[] | null;
    loading: boolean;
  }>({ key: null, points: null, loading: false });

  useEffect(() => {
    if (!enabled || !uid) {
      setState({ key: null, points: null, loading: false });
      return;
    }

    const key = cacheKey({ uid, rankingLeague, wcStage });
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setState({ key, points: cached.points, loading: false });
      return;
    }

    let aborted = false;
    setState({ key, points: null, loading: true });

    const params = new URLSearchParams({ uid, phase: "playoffs" });
    if (rankingLeague === "worldcup") {
      params.set("league", "worldcup");
      params.set("wcStage", wcStage ?? "overall");
    }

    (async () => {
      try {
        const res = await fetch(
          `/api/profile/rank-playoff-trend?${params.toString()}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as { ok?: boolean; points?: unknown };
        const points = json?.ok ? normalizePoints(json.points) : [];
        cache.set(key, { at: Date.now(), points });
        if (!aborted) setState({ key, points, loading: false });
      } catch {
        if (!aborted) setState({ key, points: [], loading: false });
      }
    })();

    return () => {
      aborted = true;
    };
  }, [enabled, uid, rankingLeague, wcStage]);

  return { points: state.points, loading: state.loading };
}
