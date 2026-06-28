"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchRankPlayoffTrendClient } from "@/lib/profile/fetchRankPlayoffTrendClient";
import {
  isWcRankingStage,
  type WcRankingStage,
} from "@/lib/rankings/wcRankingStage";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";

export type PlayoffRankTrendPoint = {
  dateKey: string;
  rank: number;
  /** X 軸表示用 M/D */
  labelShort: string;
  /** Recharts 用（dateKey と同じ） */
  date: string;
};

const RANK_TREND_CACHE_TTL_MS = 5 * 60 * 1000;
const rankTrendCache = new Map<
  string,
  { at: number; points: PlayoffRankTrendPoint[] }
>();

function rankTrendCacheKey(
  uid: string,
  rankingLeague: RankingLeagueSource,
  wcStage: WcRankingStage
) {
  return `${uid}:${rankingLeague}:${wcStage}`;
}

export function useProfilePlayoffRankTrend(
  targetUid: string | null,
  options?: {
    enabled?: boolean;
    rankingLeague?: RankingLeagueSource;
    wcStage?: WcRankingStage;
  }
) {
  const enabled = options?.enabled ?? true;
  const rankingLeague = options?.rankingLeague ?? "nba";
  const wcStage: WcRankingStage =
    rankingLeague === "worldcup" && isWcRankingStage(options?.wcStage)
      ? options.wcStage
      : "overall";

  const cacheKey =
    targetUid && enabled
      ? rankTrendCacheKey(targetUid, rankingLeague, wcStage)
      : "";

  const [points, setPoints] = useState<PlayoffRankTrendPoint[]>(() => {
    if (!cacheKey) return [];
    const hit = rankTrendCache.get(cacheKey);
    if (!hit || Date.now() - hit.at > RANK_TREND_CACHE_TTL_MS) return [];
    return hit.points;
  });
  const [loading, setLoading] = useState(() => {
    if (!cacheKey) return false;
    const hit = rankTrendCache.get(cacheKey);
    return !hit || Date.now() - hit.at > RANK_TREND_CACHE_TTL_MS;
  });

  useEffect(() => {
    if (!enabled || !targetUid) {
      setPoints([]);
      setLoading(false);
      return;
    }

    const uid = targetUid;
    const key = rankTrendCacheKey(uid, rankingLeague, wcStage);
    const cached = rankTrendCache.get(key);
    if (cached && Date.now() - cached.at <= RANK_TREND_CACHE_TTL_MS) {
      setPoints(cached.points);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const nextPoints = await fetchRankPlayoffTrendClient(
          uid,
          rankingLeague,
          wcStage
        );

        if (cancelled) return;

        rankTrendCache.set(key, { at: Date.now(), points: nextPoints });
        setPoints(nextPoints);
      } catch {
        if (!cancelled) setPoints([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, rankingLeague, targetUid, wcStage]);

  const chartRows = useMemo(() => points, [points]);

  return { chartRows, loading, rawPoints: points };
}
