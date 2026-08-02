/**
 * NBA Kinetik メトリクスの Season / Playoffs 切替用クライアント hook。
 */

"use client";

import { useEffect, useState } from "react";
import type {
  SummaryForCardsV2,
  SummaryRanksV2,
} from "@/app/component/profile/useUserStatsV2";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export type ProfileKinetikMetricsPeriod = "playoffs" | "season";

export type NbaPeriodKinetikStats = {
  period: ProfileKinetikMetricsPeriod;
  seasonKey: string;
  summary: SummaryForCardsV2;
  summaryRanks: SummaryRanksV2;
};

const cache = new Map<
  string,
  { at: number; data: NbaPeriodKinetikStats }
>();
const CACHE_TTL_MS = 60_000;
const inflight = new Map<string, Promise<NbaPeriodKinetikStats | null>>();

function cacheKey(uid: string, period: ProfileKinetikMetricsPeriod): string {
  return `${uid}:${period}:${CURRENT_NBA_SEASON_KEY}`;
}

function readCache(uid: string, period: ProfileKinetikMetricsPeriod) {
  const hit = cache.get(cacheKey(uid, period));
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
  if (period === "playoffs") {
    const short = seasonKey.replace(/^20/, "").replace("-20", "-");
    const label = /^\d{4}-\d{2}$/.test(seasonKey)
      ? `${seasonKey.slice(2, 4)}-${seasonKey.slice(5)}`
      : short;
    return `NBA // ${label} PLAYOFFS STATS`;
  }
  const short = seasonKey.replace(/^20/, "").replace("-20", "-");
  const label = /^\d{4}-\d{2}$/.test(seasonKey)
    ? `${seasonKey.slice(2, 4)}-${seasonKey.slice(5)}`
    : short;
  return `NBA // ${label} SEASON STATS`;
}

/** @deprecated */
export function getNbaKinetikMonthlyTitle(monthLabel: string): string {
  const m = monthLabel.trim();
  if (/^\d{4}-\d{2}$/.test(m)) return `NBA // ${m} STATS`;
  return getNbaKinetikPeriodTitle("season");
}
