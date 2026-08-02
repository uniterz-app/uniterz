"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchRankPlayoffTrendClient } from "@/lib/profile/fetchRankPlayoffTrendClient";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
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
  return `${uid}:${rankingLeague}:${wcStage}:v2:${CURRENT_NBA_SEASON_KEY}`;
}

export function useProfilePlayoffRankTrend(
  targetUid: string | null,
  options?: {
    enabled?: boolean;
    rankingLeague?: RankingLeagueSource;
    wcStage?: WcRankingStage;
    /** profileCharts.rankTrend（空配列 + seedComplete で独立 fetch しない） */
    seedPoints?: { dateKey: string; rank: number }[] | null;
    seedComplete?: boolean;
  }
) {
  const enabled = options?.enabled ?? true;
  const rankingLeague = options?.rankingLeague ?? "nba";
  const wcStage: WcRankingStage = "overall";
  const seedComplete = options?.seedComplete === true;
  const seedPoints = options?.seedPoints;
  const useSeed =
    enabled &&
    rankingLeague === "nba" &&
    (seedComplete || (Array.isArray(seedPoints) && seedPoints.length > 0));

  const cacheKey =
    targetUid && enabled && !useSeed
      ? rankTrendCacheKey(targetUid, rankingLeague, wcStage)
      : "";

  const seededPoints = useMemo((): PlayoffRankTrendPoint[] => {
    if (!useSeed) return [];
    const raw = seedPoints ?? [];
    return raw.map((p) => {
      const parts = p.dateKey.split("-");
      const m = parts[1] ? Number(parts[1]) : 0;
      const d = parts[2] ? Number(parts[2]) : 0;
      return {
        dateKey: p.dateKey,
        rank: p.rank,
        labelShort: m > 0 && d > 0 ? `${m}/${d}` : p.dateKey,
        date: p.dateKey,
      };
    });
  }, [seedPoints, useSeed]);

  const [points, setPoints] = useState<PlayoffRankTrendPoint[]>(() => {
    if (useSeed) return seededPoints;
    if (!cacheKey) return [];
    const hit = rankTrendCache.get(cacheKey);
    if (!hit || Date.now() - hit.at > RANK_TREND_CACHE_TTL_MS) return [];
    return hit.points;
  });
  const [loading, setLoading] = useState(() => {
    if (useSeed) return false;
    if (!cacheKey) return false;
    const hit = rankTrendCache.get(cacheKey);
    return !hit || Date.now() - hit.at > RANK_TREND_CACHE_TTL_MS;
  });

  useEffect(() => {
    if (useSeed) {
      setPoints(seededPoints);
      setLoading(false);
      return;
    }

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
  }, [
    enabled,
    rankingLeague,
    seededPoints,
    targetUid,
    useSeed,
    wcStage,
  ]);

  const chartRows = useMemo(
    () => (useSeed ? seededPoints : points),
    [points, seededPoints, useSeed]
  );

  return { chartRows, loading: useSeed ? false : loading, rawPoints: chartRows };
}
