// app/component/profile/useUserStatsV2.ts
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RankingRowWithCountry } from "@/app/component/rankings/_data/mockRows";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import { looksLikeFirestoreUid } from "@/lib/profile/profilePathKey";

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
  /** WC overall のライブ最大連勝（サーバーが user_stats_v2 から付与） */
  maxWinStreak?: number;
};

export type SummaryRanksV2 = {
  totalPrecision: number | null;
  totalUpset: number | null;
  totalPoints: number | null;
  totalPointsDenominator: number | null;
  rankDeltaPlaces: number | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
/** この時間内に API 取得済みなら背景再取得をスキップ */
const BACKGROUND_REFRESH_MS = 30_000;

/** カード数値 + ティアタグ用スナップショット（Firestore、Functions 不要） */
const PARTS_SUMMARY = "phase";
/** ranks のみ再取得（通常は phase レスポンスに同梱） */
const PARTS_RANKS = "ranks";
/** チャートは後追い */
const PARTS_TREND = "trend";

type CacheEntry = {
  at: number;
  summary: SummaryForCardsV2 | null;
  summaryRanks: SummaryRanksV2 | null;
  metricValueDeltas: MyRankMetricValueDeltas | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[] | null;
};

const statsCache = new Map<string, CacheEntry>();

type UseUserStatsContext = {
  rankingLeague?: RankingLeagueSource;
  wcStage?: WcRankingStage;
  /** false のとき表示中リーグのみ取得（プロフィール初回表示用） */
  prefetchOtherLeague?: boolean;
  /**
   * URL の handle/uid。uid が未解決でも handle でサマリーを先行取得し、
   * useProfile の handle→uid 解決と並行させてウォーターフォールを短縮する。
   */
  routeKey?: string | null;
  /**
   * グループランキング由来の先読みサマリー（期間集計）を無視し、
   * API の WC/NBA 全体スタッツのみ表示する。
   */
  skipPrimedStatsCache?: boolean;
};

/** ランキング行から成績サマリー + ティア用順位を先読み（プロフィール初回の即時描画用） */
export function primeProfileStatsFromRankingRow(
  uid: string,
  row: RankingRowWithCountry,
  context: { rankingLeague: RankingLeagueSource; wcStage?: WcRankingStage },
  rankHints?: {
    totalPointsRank?: number | null;
    totalPointsDenominator?: number | null;
  }
) {
  const safeUid = uid.trim();
  if (!safeUid) return;

  const posts = row.posts ?? 0;
  const winRateRaw = row.winRate ?? 0;
  const winRate = winRateRaw <= 1 ? winRateRaw : winRateRaw / 100;
  const ext = row as RankingRowWithCountry & {
    totalPoints?: number;
    totalPrecision?: number;
    totalUpset?: number;
    activeWinStreak?: number;
  };
  const totalPoints = ext.totalPoints ?? ext.totalScore ?? 0;
  const totalPrecision = ext.totalPrecision ?? ext.marginPrecisionScore ?? 0;
  const totalUpset = ext.totalUpset ?? ext.upsetScore ?? 0;

  const summary: SummaryForCardsV2 = {
    posts,
    fullPosts: posts,
    recent3Posts: Math.min(3, posts),
    wins: Math.round(winRate * posts),
    winRate,
    scorePrecisionSum: totalPrecision,
    upsetPointsSum: totalUpset,
    pointsSumV3: totalPoints,
    basePointsSum: totalPoints,
    upsetBonusSum: 0,
    streakBonusSum: 0,
    upsetChanceCount: 0,
    upsetHitCount: 0,
    activeWinStreak: row.streak ?? ext.activeWinStreak ?? 0,
  };

  mergeCacheEntry(statsCacheKey(safeUid, context.rankingLeague, context.wcStage), {
    summary,
    ...(rankHints?.totalPointsRank != null
      ? {
          summaryRanks: {
            totalPoints: rankHints.totalPointsRank,
            totalPointsDenominator: rankHints.totalPointsDenominator ?? null,
            rankDeltaPlaces:
              typeof row.rankDeltaPlaces === "number" ? row.rankDeltaPlaces : null,
            totalPrecision: null,
            totalUpset: null,
          } satisfies SummaryRanksV2,
        }
      : {}),
  });
}

function statsCacheKey(
  uid: string,
  rankingLeague: RankingLeagueSource,
  wcStage?: WcRankingStage
): string {
  const safeWcStage =
    rankingLeague === "worldcup" ? (wcStage ?? "overall") : undefined;
  return `${uid}:${rankingLeague}:${safeWcStage ?? "-"}`;
}

function readValidCache(
  key: string,
  opts?: { skipPrimedOnly?: boolean }
): CacheEntry | null {
  const cached = statsCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.at >= CACHE_TTL_MS) return null;
  if (cached.summary == null) return null;
  if (opts?.skipPrimedOnly && cached.metricValueDeltas == null) return null;
  return cached;
}

function mergeCacheEntry(key: string, patch: Partial<CacheEntry>) {
  const prev = statsCache.get(key);
  statsCache.set(key, {
    at: Date.now(),
    summary: patch.summary ?? prev?.summary ?? null,
    summaryRanks: patch.summaryRanks ?? prev?.summaryRanks ?? null,
    metricValueDeltas: patch.metricValueDeltas ?? prev?.metricValueDeltas ?? null,
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
    setMetricValueDeltas: (v: MyRankMetricValueDeltas | null) => void;
    setDailyTrend: (v: ProfileDailyTrendRow[] | null) => void;
    setLoading: (v: boolean) => void;
  }
) {
  setters.setStats(cached.stats);
  setters.setSummary(cached.summary);
  setters.setSummaryRanks(cached.summaryRanks ?? null);
  setters.setMetricValueDeltas(cached.metricValueDeltas ?? null);
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
): Promise<{
  summary: SummaryForCardsV2 | null;
  summaryRanks: SummaryRanksV2 | null;
  metricValueDeltas: MyRankMetricValueDeltas | null;
}> {
  const qs = buildStatsQuery(uid, PARTS_SUMMARY, rankingLeague, wcStage);
  const res = await fetch(`/api/profile/user-stats?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? "failed to fetch profile stats");
  }
  const summary = (json?.summary as SummaryForCardsV2) ?? null;
  const summaryRanks = (json?.summaryRanks as SummaryRanksV2 | null | undefined) ?? null;
  const metricValueDeltas =
    (json?.metricValueDeltas as MyRankMetricValueDeltas | null | undefined) ??
    null;
  return { summary, summaryRanks, metricValueDeltas };
}

/** handle/uid のいずれでも phase を取得し、resolvedUid 起点でキャッシュへ投入する先行取得 */
const bootstrapInflight = new Map<string, Promise<string | null>>();

/** グループランキング等 — 全体スタッツを API から先読み（期間集計の行キャッシュは使わない） */
export function prefetchProfileStatsFromRoute(
  routeKey: string,
  context: { rankingLeague: RankingLeagueSource; wcStage?: WcRankingStage }
): void {
  const safeKey = routeKey.trim();
  if (!safeKey) return;
  void (async () => {
    const resolvedUid = await bootstrapStatsByRouteKey(
      safeKey,
      context.rankingLeague,
      context.wcStage
    );
    if (!resolvedUid) return;
    const key = statsCacheKey(resolvedUid, context.rankingLeague, context.wcStage);
    const cached = statsCache.get(key);
    if (cached?.dailyTrend == null) {
      await fetchTrendIntoCache(
        resolvedUid,
        key,
        context.rankingLeague,
        context.wcStage
      );
    }
  })();
}

async function bootstrapStatsByRouteKey(
  routeKey: string,
  rankingLeague: RankingLeagueSource,
  wcStage?: WcRankingStage
): Promise<string | null> {
  const safeKey = routeKey.trim();
  if (!safeKey) return null;
  const safeWcStage =
    rankingLeague === "worldcup" ? (wcStage ?? "overall") : undefined;
  const dedupeKey = `${safeKey}:${rankingLeague}:${safeWcStage ?? "-"}`;
  const existing = bootstrapInflight.get(dedupeKey);
  if (existing) return existing;

  const promise = (async () => {
    const qs = new URLSearchParams({ parts: PARTS_SUMMARY, phase: "playoffs", refresh: "1" });
    /** uid 形式ならそのまま uid 解決、それ以外は handle 解決（サーバーで resolveUidByHandleCached） */
    if (looksLikeFirestoreUid(safeKey)) qs.set("uid", safeKey);
    else qs.set("handle", safeKey);
    if (rankingLeague) qs.set("league", rankingLeague);
    if (safeWcStage) qs.set("wcStage", safeWcStage);

    const res = await fetch(`/api/profile/user-stats?${qs.toString()}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok || !json?.ok) return null;
    const resolvedUid =
      typeof json.resolvedUid === "string" ? json.resolvedUid : null;
    const summary = (json.summary as SummaryForCardsV2) ?? null;
    if (!resolvedUid || !summary) return resolvedUid;

    mergeCacheEntry(statsCacheKey(resolvedUid, rankingLeague, wcStage), {
      summary,
      metricValueDeltas:
        (json.metricValueDeltas as MyRankMetricValueDeltas | null | undefined) ??
        null,
      summaryRanks:
        (json.summaryRanks as SummaryRanksV2 | null | undefined) ?? null,
    });
    return resolvedUid;
  })();

  bootstrapInflight.set(dedupeKey, promise);
  try {
    return await promise;
  } catch {
    return null;
  } finally {
    bootstrapInflight.delete(dedupeKey);
  }
}

async function fetchProfileRanks(
  uid: string,
  rankingLeague: RankingLeagueSource,
  wcStage?: WcRankingStage
): Promise<SummaryRanksV2 | null> {
  const qs = buildStatsQuery(uid, PARTS_RANKS, rankingLeague, wcStage);
  const res = await fetch(`/api/profile/user-stats?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
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
    cache: "no-store",
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
      const phaseResult = await fetchProfilePhase(uid, rankingLeague, wcStage);
      if (!phaseResult.summary) return;
      mergeCacheEntry(key, {
        summary: phaseResult.summary,
        metricValueDeltas: phaseResult.metricValueDeltas,
        summaryRanks: phaseResult.summaryRanks,
      });
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
  const prefetchOtherLeague = context?.prefetchOtherLeague !== false;
  const routeKey = context?.routeKey ?? null;
  const skipPrimedStatsCache = context?.skipPrimedStatsCache === true;
  const cacheReadOpts = skipPrimedStatsCache
    ? { skipPrimedOnly: true as const }
    : undefined;
  const cacheKey = uid ? statsCacheKey(uid, rankingLeague, wcStage) : "";

  const [loading, setLoading] = useState(() => {
    if (!uid) return false;
    return readValidCache(statsCacheKey(uid, rankingLeague, wcStage), cacheReadOpts) == null;
  });
  const [summary, setSummary] = useState<SummaryForCardsV2 | null>(() => {
    if (!uid) return null;
    return (
      readValidCache(statsCacheKey(uid, rankingLeague, wcStage), cacheReadOpts)?.summary ??
      null
    );
  });
  const [summaryRanks, setSummaryRanks] = useState<SummaryRanksV2 | null>(() => {
    if (!uid) return null;
    return (
      readValidCache(statsCacheKey(uid, rankingLeague, wcStage), cacheReadOpts)
        ?.summaryRanks ?? null
    );
  });
  const [metricValueDeltas, setMetricValueDeltas] =
    useState<MyRankMetricValueDeltas | null>(() => {
      if (!uid) return null;
      return (
        readValidCache(statsCacheKey(uid, rankingLeague, wcStage), cacheReadOpts)
          ?.metricValueDeltas ?? null
      );
    });
  const [stats, setStats] = useState<Record<string, unknown> | null>(() => {
    if (!uid) return null;
    return (
      readValidCache(statsCacheKey(uid, rankingLeague, wcStage), cacheReadOpts)?.stats ??
      null
    );
  });
  const [dailyTrend, setDailyTrend] = useState<ProfileDailyTrendRow[] | null>(() => {
    if (!uid) return null;
    return (
      readValidCache(statsCacheKey(uid, rankingLeague, wcStage), cacheReadOpts)
        ?.dailyTrend ?? null
    );
  });

  const activeFetchKeyRef = useRef<string>("");

  /** リーグ切替を paint 前にキャッシュ反映（スケルトン1フレームを防ぐ） */
  useLayoutEffect(() => {
    if (!uid || !cacheKey) {
      setSummary(null);
      setSummaryRanks(null);
      setMetricValueDeltas(null);
      setStats(null);
      setDailyTrend(null);
      setLoading(false);
      return;
    }

    const cached = readValidCache(cacheKey, cacheReadOpts);
    if (cached) {
      applyCacheEntry(cached, {
        setStats,
        setSummary,
        setSummaryRanks,
        setMetricValueDeltas,
        setDailyTrend,
        setLoading,
      });
      return;
    }
    setLoading(true);
  }, [cacheKey, cacheReadOpts, uid]);

  /**
   * uid 未解決でも handle/uid（routeKey）でサマリーを先行取得し、resolvedUid 起点で
   * キャッシュを温める。useProfile の handle→uid 解決と並行するため、
   * 「uid 解決 → その後 stats 取得」の直列ウォーターフォールを短縮できる。
   */
  useEffect(() => {
    if (uid || !routeKey) return;
    void bootstrapStatsByRouteKey(routeKey, rankingLeague, wcStage);
  }, [uid, routeKey, rankingLeague, wcStage]);

  useEffect(() => {
    if (!uid) return;
    prefetchLeagueStats(uid, rankingLeague);
    if (!prefetchOtherLeague) return;
    const otherLeague: RankingLeagueSource =
      rankingLeague === "nba" ? "worldcup" : "nba";
    const deferredId = window.setTimeout(() => {
      prefetchLeagueStats(uid, otherLeague);
    }, 4000);
    return () => window.clearTimeout(deferredId);
  }, [prefetchOtherLeague, uid, rankingLeague]);

  useEffect(() => {
    let cancelled = false;

    if (!uid || !cacheKey) {
      return;
    }

    const safeUid = uid;
    const setters = {
      setStats,
      setSummary,
      setSummaryRanks,
      setMetricValueDeltas,
      setDailyTrend,
      setLoading,
    };

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
          totalPointsDenominator: null,
          rankDeltaPlaces: null,
        },
      });
      setSummaryRanks(statsCache.get(cacheKey)?.summaryRanks ?? null);
    }

    /**
     * ランキング行由来の先読みサマリー（概算・前日比なし・最大連勝なし）は
     * metricValueDeltas を持たない。背景で本取得して正値・前日比・最大連勝を補完する。
     */
    async function refreshPrimedPhase(safeUid: string) {
      const phaseResult = await fetchProfilePhase(safeUid, rankingLeague, wcStage);
      if (cancelled || !phaseResult.summary) return;
      mergeCacheEntry(cacheKey, {
        summary: phaseResult.summary,
        metricValueDeltas: phaseResult.metricValueDeltas,
        ...(phaseResult.summaryRanks != null
          ? { summaryRanks: phaseResult.summaryRanks }
          : {}),
      });
      setSummary(phaseResult.summary);
      setMetricValueDeltas(phaseResult.metricValueDeltas);
      if (phaseResult.summaryRanks != null) {
        setSummaryRanks(phaseResult.summaryRanks);
      }
    }

    async function run() {
      const cached = readValidCache(cacheKey, cacheReadOpts);
      if (cached) {
        if (cancelled) return;
        applyCacheEntry(cached, setters);
        const cacheAge = Date.now() - cached.at;
        const needsRefresh =
          cached.metricValueDeltas == null ||
          cacheAge >= BACKGROUND_REFRESH_MS;
        if (needsRefresh) void refreshPrimedPhase(safeUid);
        if (cached.dailyTrend == null) void ensureTrend(safeUid);
        else if (cached.summaryRanks == null) void ensureRanks(safeUid);
        return;
      }

      if (activeFetchKeyRef.current === cacheKey) return;
      activeFetchKeyRef.current = cacheKey;

      try {
        const phaseResult = await fetchProfilePhase(
          safeUid,
          rankingLeague,
          wcStage
        );
        if (cancelled) return;

        const ranksFromPhase = phaseResult.summaryRanks;
        mergeCacheEntry(cacheKey, {
          summary: phaseResult.summary,
          metricValueDeltas: phaseResult.metricValueDeltas,
          ...(ranksFromPhase != null
            ? {
                summaryRanks: ranksFromPhase,
              }
            : {}),
        });
        setSummary(phaseResult.summary);
        setMetricValueDeltas(phaseResult.metricValueDeltas);
        if (ranksFromPhase != null) {
          setSummaryRanks(ranksFromPhase);
        }
        setLoading(false);

        void ensureTrend(safeUid);
        if (ranksFromPhase == null) {
          void ensureRanks(safeUid);
        }
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
  }, [cacheKey, cacheReadOpts, rankingLeague, wcStage, uid]);

  /** タブ復帰時もサマリーを再取得（確定直後のプロフィール閲覧向け） */
  useEffect(() => {
    if (!uid || !cacheKey) return;

    const safeUid = uid;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void (async () => {
        const phaseResult = await fetchProfilePhase(safeUid, rankingLeague, wcStage);
        if (!phaseResult.summary) return;
        mergeCacheEntry(cacheKey, {
          summary: phaseResult.summary,
          metricValueDeltas: phaseResult.metricValueDeltas,
          ...(phaseResult.summaryRanks != null
            ? { summaryRanks: phaseResult.summaryRanks }
            : {}),
        });
        setSummary(phaseResult.summary);
        setMetricValueDeltas(phaseResult.metricValueDeltas);
        if (phaseResult.summaryRanks != null) {
          setSummaryRanks(phaseResult.summaryRanks);
        }
      })();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [cacheKey, rankingLeague, uid, wcStage]);

  const statsLoading = loading;

  return {
    loading,
    extending: false,
    summary,
    summaryRanks,
    metricValueDeltas,
    stats,
    dailyTrend,
    statsLoading,
  };
}
