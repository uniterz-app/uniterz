// app/component/profile/useUserStatsV2.ts
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export type SummaryForCardsV2 = {
  posts: number;
  fullPosts: number;
  recent3Posts: number;

  // 的中数
  wins: number;

  // ① 勝率
  winRate: number;

  // ② スコア精度（期間合計）
  scorePrecisionSum: number;

  // ③ アップセット得点（期間合計）
  upsetPointsSum: number;

  // ④ 総合得点（期間合計）
  pointsSumV3: number;

  /** pointsV3 = base + upsetBonus + streakBonus */
  basePointsSum: number;
  upsetBonusSum: number;
  streakBonusSum: number;

  upsetChanceCount: number;
  upsetHitCount: number;
  /** リーグ切替時の現在連勝表示用（NBA: activeWinStreak / WC: streakFootball） */
  activeWinStreak?: number;
};

export type SummaryRanksV2 = {
  totalPrecision: number | null;
  totalUpset: number | null;
  totalPoints: number | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

/** カード数値のみ（Firestore cumulative 1 read） */
const PARTS_SUMMARY = "phase";
/** 順位は Functions — 数値表示をブロックしない */
const PARTS_RANKS = "ranks";
/** チャートは後追い */
const PARTS_TREND = "trend";

type CacheEntry = {
  at: number;
  summary: SummaryForCardsV2 | null;
  summaryRanks: SummaryRanksV2 | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[] | null;
};

const statsCache = new Map<string, CacheEntry>();

type UseUserStatsContext = {
  rankingLeague?: RankingLeagueSource;
  wcStage?: WcRankingStage;
};

function statsCacheKey(
  uid: string,
  rankingLeague: RankingLeagueSource,
  wcStage?: WcRankingStage
): string {
  const safeWcStage =
    rankingLeague === "worldcup" ? (wcStage ?? "overall") : undefined;
  return `${uid}:${rankingLeague}:${safeWcStage ?? "-"}`;
}

function readValidCache(key: string): CacheEntry | null {
  const cached = statsCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.at >= CACHE_TTL_MS) return null;
  if (cached.summary == null) return null;
  return cached;
}

function mergeCacheEntry(key: string, patch: Partial<CacheEntry>) {
  const prev = statsCache.get(key);
  statsCache.set(key, {
    at: Date.now(),
    summary: patch.summary ?? prev?.summary ?? null,
    summaryRanks: patch.summaryRanks ?? prev?.summaryRanks ?? null,
    stats: patch.stats ?? prev?.stats ?? null,
    dailyTrend: patch.dailyTrend ?? prev?.dailyTrend ?? null,
  });
}

function applyCacheEntry(
  cached: CacheEntry,
  setters: {
    setStats: (v: Record<string, unknown> | null) => void;
    setSummary: (v: SummaryForCardsV2 | null) => void;
    setSummaryRanks: (v: SummaryRanksV2 | null) => void;
    setDailyTrend: (v: ProfileDailyTrendRow[] | null) => void;
    setLoading: (v: boolean) => void;
  }
) {
  setters.setStats(cached.stats);
  setters.setSummary(cached.summary);
  setters.setSummaryRanks(cached.summaryRanks ?? null);
  setters.setDailyTrend(cached.dailyTrend ?? null);
  setters.setLoading(false);
}

function buildStatsQuery(
  uid: string,
  parts: string,
  rankingLeague: RankingLeagueSource,
  wcStage?: WcRankingStage
) {
  const safeWcStage =
    rankingLeague === "worldcup" ? (wcStage ?? "overall") : undefined;
  const qs = new URLSearchParams({
    uid,
    parts,
    phase: "playoffs",
  });
  if (rankingLeague) qs.set("league", rankingLeague);
  if (safeWcStage) qs.set("wcStage", safeWcStage);
  return qs;
}

async function fetchProfilePhase(
  uid: string,
  rankingLeague: RankingLeagueSource,
  wcStage?: WcRankingStage
): Promise<SummaryForCardsV2 | null> {
  const qs = buildStatsQuery(uid, PARTS_SUMMARY, rankingLeague, wcStage);
  const res = await fetch(`/api/profile/user-stats?${qs.toString()}`, {
    method: "GET",
  });
  const json = await res.json();
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? "failed to fetch profile stats");
  }
  return (json?.summary as SummaryForCardsV2) ?? null;
}

async function fetchProfileRanks(
  uid: string,
  rankingLeague: RankingLeagueSource,
  wcStage?: WcRankingStage
): Promise<SummaryRanksV2 | null> {
  const qs = buildStatsQuery(uid, PARTS_RANKS, rankingLeague, wcStage);
  const res = await fetch(`/api/profile/user-stats?${qs.toString()}`, {
    method: "GET",
  });
  const json = await res.json();
  if (!res.ok || !json?.ok) return null;
  return (json?.summaryRanks as SummaryRanksV2) ?? null;
}

async function fetchTrendIntoCache(
  uid: string,
  cacheKey: string,
  rankingLeague: RankingLeagueSource,
  wcStage?: WcRankingStage
) {
  const qs = buildStatsQuery(uid, PARTS_TREND, rankingLeague, wcStage);
  const res = await fetch(`/api/profile/user-stats?${qs.toString()}`, {
    method: "GET",
  });
  const json = await res.json();
  if (!res.ok || !json?.ok) return;

  const nextDailyTrend = Array.isArray(json?.dailyTrend)
    ? (json.dailyTrend as ProfileDailyTrendRow[])
    : null;

  const prev = statsCache.get(cacheKey);
  if (!prev) return;

  mergeCacheEntry(cacheKey, { dailyTrend: nextDailyTrend });
}

function prefetchLeagueStats(uid: string, rankingLeague: RankingLeagueSource) {
  const wcStage: WcRankingStage | undefined =
    rankingLeague === "worldcup" ? "overall" : undefined;
  const key = statsCacheKey(uid, rankingLeague, wcStage);
  if (readValidCache(key)) return;

  void (async () => {
    try {
      const [summary, summaryRanks] = await Promise.all([
        fetchProfilePhase(uid, rankingLeague, wcStage),
        fetchProfileRanks(uid, rankingLeague, wcStage),
      ]);
      if (!summary) return;
      mergeCacheEntry(key, { summary, summaryRanks });
      const cached = statsCache.get(key);
      if (cached?.dailyTrend == null) {
        void fetchTrendIntoCache(uid, key, rankingLeague, wcStage);
      }
    } catch {
      // prefetch は失敗しても UI を止めない
    }
  })();
}

export function useUserStatsV2(uid?: string | null, context?: UseUserStatsContext) {
  const rankingLeague: RankingLeagueSource = context?.rankingLeague ?? "nba";
  const wcStage = context?.wcStage;
  const cacheKey = uid ? statsCacheKey(uid, rankingLeague, wcStage) : "";

  const [loading, setLoading] = useState(() => {
    if (!uid) return false;
    return readValidCache(statsCacheKey(uid, rankingLeague, wcStage)) == null;
  });
  const [summary, setSummary] = useState<SummaryForCardsV2 | null>(() => {
    if (!uid) return null;
    return readValidCache(statsCacheKey(uid, rankingLeague, wcStage))?.summary ?? null;
  });
  const [summaryRanks, setSummaryRanks] = useState<SummaryRanksV2 | null>(() => {
    if (!uid) return null;
    return readValidCache(statsCacheKey(uid, rankingLeague, wcStage))?.summaryRanks ?? null;
  });
  const [stats, setStats] = useState<Record<string, unknown> | null>(() => {
    if (!uid) return null;
    return readValidCache(statsCacheKey(uid, rankingLeague, wcStage))?.stats ?? null;
  });
  const [dailyTrend, setDailyTrend] = useState<ProfileDailyTrendRow[] | null>(() => {
    if (!uid) return null;
    return readValidCache(statsCacheKey(uid, rankingLeague, wcStage))?.dailyTrend ?? null;
  });

  const activeFetchKeyRef = useRef<string>("");

  /** リーグ切替を paint 前にキャッシュ反映（スケルトン1フレームを防ぐ） */
  useLayoutEffect(() => {
    if (!uid || !cacheKey) {
      setSummary(null);
      setSummaryRanks(null);
      setStats(null);
      setDailyTrend(null);
      setLoading(false);
      return;
    }

    const cached = readValidCache(cacheKey);
    if (cached) {
      applyCacheEntry(cached, {
        setStats,
        setSummary,
        setSummaryRanks,
        setDailyTrend,
        setLoading,
      });
      return;
    }
    setLoading(true);
  }, [cacheKey, uid]);

  useEffect(() => {
    if (!uid) return;
    prefetchLeagueStats(uid, "nba");
    prefetchLeagueStats(uid, "worldcup");
  }, [uid]);

  useEffect(() => {
    let cancelled = false;

    if (!uid || !cacheKey) {
      return;
    }

    const safeUid = uid;
    const setters = { setStats, setSummary, setSummaryRanks, setDailyTrend, setLoading };

    async function ensureTrend(safeUid: string) {
      const cached = statsCache.get(cacheKey);
      if (!cached || cached.dailyTrend != null) return;
      await fetchTrendIntoCache(safeUid, cacheKey, rankingLeague, wcStage);
      if (cancelled) return;
      const next = statsCache.get(cacheKey);
      if (next?.dailyTrend) setDailyTrend(next.dailyTrend);
    }

    async function ensureRanks(safeUid: string) {
      const cached = statsCache.get(cacheKey);
      if (!cached?.summary || cached.summaryRanks != null) return;
      const ranks = await fetchProfileRanks(safeUid, rankingLeague, wcStage);
      if (cancelled) return;
      mergeCacheEntry(cacheKey, {
        summaryRanks: ranks ?? {
          totalPrecision: null,
          totalUpset: null,
          totalPoints: null,
        },
      });
      setSummaryRanks(statsCache.get(cacheKey)?.summaryRanks ?? null);
    }

    async function run() {
      const cached = readValidCache(cacheKey);
      if (cached) {
        if (cancelled) return;
        applyCacheEntry(cached, setters);
        if (cached.dailyTrend == null) void ensureTrend(safeUid);
        void ensureRanks(safeUid);
        return;
      }

      if (activeFetchKeyRef.current === cacheKey) return;
      activeFetchKeyRef.current = cacheKey;

      const ranksPromise = fetchProfileRanks(safeUid, rankingLeague, wcStage);

      try {
        const nextSummary = await fetchProfilePhase(
          safeUid,
          rankingLeague,
          wcStage
        );
        if (cancelled) return;

        mergeCacheEntry(cacheKey, { summary: nextSummary });
        setSummary(nextSummary);
        setLoading(false);

        void ensureTrend(safeUid);

        const ranks = await ranksPromise;
        if (cancelled) return;
        mergeCacheEntry(cacheKey, {
          summaryRanks: ranks ?? {
            totalPrecision: null,
            totalUpset: null,
            totalPoints: null,
          },
        });
        setSummaryRanks(statsCache.get(cacheKey)?.summaryRanks ?? null);
      } catch {
        if (!cancelled) setLoading(false);
      } finally {
        if (activeFetchKeyRef.current === cacheKey) {
          activeFetchKeyRef.current = "";
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, rankingLeague, wcStage, uid]);

  const statsLoading = loading;

  return {
    loading,
    extending: false,
    summary,
    summaryRanks,
    stats,
    dailyTrend,
    statsLoading,
  };
}
