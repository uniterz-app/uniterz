/**
 * NBA Kinetik メトリクスの Season / Playoffs × Week / Month 切替用クライアント hook。
 */

"use client";

import { useEffect, useState } from "react";
import type {
  SummaryForCardsV2,
  SummaryRanksV2,
} from "@/app/component/profile/useUserStatsV2";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type {
  ProfileKinetikBoard,
  ProfileKinetikWindow,
} from "@/lib/profile/resolveNbaWindowProfileSummary";

export type { ProfileKinetikBoard, ProfileKinetikWindow };
export type ProfileKinetikMetricsPeriod = ProfileKinetikBoard;

export type NbaPeriodKinetikStats = {
  period: ProfileKinetikMetricsPeriod;
  seasonKey: string;
  summary: SummaryForCardsV2;
  summaryRanks: SummaryRanksV2;
};

export type NbaWindowKinetikStats = {
  board: ProfileKinetikBoard;
  window: ProfileKinetikWindow;
  seasonKey: string;
  label: string;
  summary: SummaryForCardsV2;
  summaryRanks: SummaryRanksV2;
};

const cache = new Map<
  string,
  { at: number; data: NbaPeriodKinetikStats }
>();
const windowCache = new Map<
  string,
  { at: number; data: NbaWindowKinetikStats }
>();
const CACHE_TTL_MS = 60_000;
const inflight = new Map<string, Promise<NbaPeriodKinetikStats | null>>();
const windowInflight = new Map<
  string,
  Promise<NbaWindowKinetikStats | null>
>();

function cacheKey(uid: string, period: ProfileKinetikMetricsPeriod): string {
  return `${uid}:${period}:${CURRENT_NBA_SEASON_KEY}`;
}

function windowCacheKey(
  uid: string,
  board: ProfileKinetikBoard,
  window: ProfileKinetikWindow
): string {
  return `${uid}:${board}:${window}:${CURRENT_NBA_SEASON_KEY}`;
}

function readCache(uid: string, period: ProfileKinetikMetricsPeriod) {
  const hit = cache.get(cacheKey(uid, period));
  if (!hit) return null;
  if (Date.now() - hit.at >= CACHE_TTL_MS) return null;
  return hit.data;
}

function readWindowCache(
  uid: string,
  board: ProfileKinetikBoard,
  window: ProfileKinetikWindow
) {
  const hit = windowCache.get(windowCacheKey(uid, board, window));
  if (!hit) return null;
  if (Date.now() - hit.at >= CACHE_TTL_MS) return null;
  return hit.data;
}

/** Native 親 stats（period=season）と Hero の period hook で共有 */
export function seedNbaKinetikPeriodStatsCache(
  uid: string,
  period: ProfileKinetikMetricsPeriod,
  summary: SummaryForCardsV2,
  summaryRanks: SummaryRanksV2
): void {
  const safeUid = uid.trim();
  if (!safeUid) return;
  const next: NbaPeriodKinetikStats = {
    period,
    seasonKey: CURRENT_NBA_SEASON_KEY,
    summary,
    summaryRanks,
  };
  cache.set(cacheKey(safeUid, period), { at: Date.now(), data: next });
}

async function fetchNbaPeriodKinetikStats(
  uid: string,
  period: ProfileKinetikMetricsPeriod,
  apiBase?: string
): Promise<NbaPeriodKinetikStats | null> {
  const key = cacheKey(uid, period);
  const cached = readCache(uid, period);
  if (cached) return cached;

  const existing = inflight.get(key);
  if (existing) return existing;

  const qs = new URLSearchParams({
    uid,
    parts: "phase",
    league: "nba",
    period,
  });
  const base = (apiBase ?? "").replace(/\/$/, "");
  const url = `${base}/api/profile/user-stats?${qs.toString()}`;

  const promise = fetch(url, {
    method: "GET",
    cache: "no-store",
  })
    .then(async (res) => {
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "nba period stats failed");
      }
      const summary = (json.summary as SummaryForCardsV2) ?? null;
      const summaryRanks =
        (json.summaryRanks as SummaryRanksV2 | null | undefined) ?? {
          totalPrecision: null,
          totalUpset: null,
          totalPoints: null,
          totalPointsDenominator: null,
          rankDeltaPlaces: null,
        };
      if (!summary) {
        throw new Error("nba period summary missing");
      }
      const next: NbaPeriodKinetikStats = {
        period,
        seasonKey: CURRENT_NBA_SEASON_KEY,
        summary,
        summaryRanks,
      };
      cache.set(key, { at: Date.now(), data: next });
      return next;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

async function fetchNbaWindowKinetikStats(
  uid: string,
  board: ProfileKinetikBoard,
  window: ProfileKinetikWindow,
  apiBase?: string
): Promise<NbaWindowKinetikStats | null> {
  const key = windowCacheKey(uid, board, window);
  const cached = readWindowCache(uid, board, window);
  if (cached) return cached;

  const existing = windowInflight.get(key);
  if (existing) return existing;

  const qs = new URLSearchParams({
    uid,
    parts: "phase",
    league: "nba",
    period: window,
    board,
  });
  const base = (apiBase ?? "").replace(/\/$/, "");
  const url = `${base}/api/profile/user-stats?${qs.toString()}`;

  const promise = fetch(url, {
    method: "GET",
    cache: "no-store",
  })
    .then(async (res) => {
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "nba window stats failed");
      }
      const summary = (json.summary as SummaryForCardsV2) ?? null;
      const summaryRanks =
        (json.summaryRanks as SummaryRanksV2 | null | undefined) ?? {
          totalPrecision: null,
          totalUpset: null,
          totalPoints: null,
          totalPointsDenominator: null,
          rankDeltaPlaces: null,
        };
      if (!summary) {
        throw new Error("nba window summary missing");
      }
      const label =
        (typeof json.windowLabel === "string" && json.windowLabel) ||
        (typeof json.monthLabel === "string" && json.monthLabel) ||
        (typeof json.weekLabel === "string" && json.weekLabel) ||
        "";
      const next: NbaWindowKinetikStats = {
        board,
        window,
        seasonKey: CURRENT_NBA_SEASON_KEY,
        label,
        summary,
        summaryRanks,
      };
      windowCache.set(key, { at: Date.now(), data: next });
      return next;
    })
    .catch(() => null)
    .finally(() => {
      windowInflight.delete(key);
    });

  windowInflight.set(key, promise);
  return promise;
}

/** 反対タブを裏で温める */
export function prefetchNbaKinetikPeriodStats(
  uid: string | null | undefined,
  period: ProfileKinetikMetricsPeriod,
  apiBase?: string
): void {
  const safeUid = uid?.trim() ?? "";
  if (!safeUid) return;
  void fetchNbaPeriodKinetikStats(safeUid, period, apiBase);
}

export function prefetchNbaKinetikWindowStats(
  uid: string | null | undefined,
  board: ProfileKinetikBoard,
  window: ProfileKinetikWindow,
  apiBase?: string
): void {
  const safeUid = uid?.trim() ?? "";
  if (!safeUid) return;
  void fetchNbaWindowKinetikStats(safeUid, board, window, apiBase);
}

export function useNbaKinetikPeriodStats(
  uid: string | null | undefined,
  period: ProfileKinetikMetricsPeriod,
  enabled: boolean,
  /** Native は API ベース URL。Web は省略（相対パス） */
  apiBase?: string
): {
  data: NbaPeriodKinetikStats | null;
  loading: boolean;
} {
  const safeUid = uid?.trim() ?? "";
  const initial =
    enabled && safeUid ? readCache(safeUid, period) : null;
  const [data, setData] = useState<NbaPeriodKinetikStats | null>(initial);
  const [loading, setLoading] = useState(
    () => Boolean(enabled && safeUid && !initial)
  );

  useEffect(() => {
    if (!enabled || !safeUid) {
      setData(null);
      setLoading(false);
      return;
    }

    const cached = readCache(safeUid, period);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchNbaPeriodKinetikStats(safeUid, period, apiBase).then((next) => {
      if (cancelled) return;
      setData(next);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [uid, period, enabled, apiBase, safeUid]);

  return { data, loading };
}

/** Season/Playoff × Week/Month のカードメトリクス */
export function useNbaKinetikWindowStats(
  uid: string | null | undefined,
  board: ProfileKinetikBoard,
  window: ProfileKinetikWindow,
  enabled: boolean,
  apiBase?: string
): {
  data: NbaWindowKinetikStats | null;
  loading: boolean;
} {
  const safeUid = uid?.trim() ?? "";
  const initial =
    enabled && safeUid ? readWindowCache(safeUid, board, window) : null;
  const [data, setData] = useState<NbaWindowKinetikStats | null>(initial);
  const [loading, setLoading] = useState(
    () => Boolean(enabled && safeUid && !initial)
  );

  useEffect(() => {
    if (!enabled || !safeUid) {
      setData(null);
      setLoading(false);
      return;
    }

    const cached = readWindowCache(safeUid, board, window);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchNbaWindowKinetikStats(safeUid, board, window, apiBase).then(
      (next) => {
        if (cancelled) return;
        setData(next);
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [uid, board, window, enabled, apiBase, safeUid]);

  return { data, loading };
}

/** @deprecated useNbaKinetikPeriodStats に統合 */
export type NbaMonthlyKinetikStats = NbaPeriodKinetikStats & {
  monthLabel: string;
};

/** @deprecated useNbaKinetikPeriodStats に統合 */
export function useNbaKinetikMonthlyStats(
  uid: string | null | undefined,
  enabled: boolean,
  apiBase?: string
) {
  return useNbaKinetikPeriodStats(uid, "season", enabled, apiBase);
}

export function getNbaKinetikPeriodTitle(
  period: ProfileKinetikMetricsPeriod,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): string {
  const label = formatNbaSeasonShortLabel(seasonKey);
  if (period === "playoffs") {
    return `NBA // ${label} PLAYOFFS STATS`;
  }
  return `NBA // ${label} SEASON STATS`;
}

/** 期間タブ併記時の見出し（SEASON/PLAYOFF はタブ側で示す） */
export function getNbaKinetikBoardTitle(
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): string {
  return `NBA // ${formatNbaSeasonShortLabel(seasonKey)}`;
}

/** 競技切替と同じ◀▶用 — ボード名をタイトルに含める */
export function getNbaKinetikScopeTitle(
  period: ProfileKinetikMetricsPeriod,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): string {
  const label = formatNbaSeasonShortLabel(seasonKey);
  if (period === "playoffs") {
    return `NBA // ${label} PLAYOFFS`;
  }
  return `NBA // ${label} SEASON`;
}

function formatNbaSeasonShortLabel(seasonKey: string): string {
  const short = seasonKey.replace(/^20/, "").replace("-20", "-");
  if (/^\d{4}-\d{2}$/.test(seasonKey)) {
    return `${seasonKey.slice(2, 4)}-${seasonKey.slice(5)}`;
  }
  return short;
}

/** @deprecated */
export function getNbaKinetikMonthlyTitle(monthLabel: string): string {
  const m = monthLabel.trim();
  if (/^\d{4}-\d{2}$/.test(m)) return `NBA // ${m} STATS`;
  return getNbaKinetikPeriodTitle("season");
}
