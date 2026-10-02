"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { RankingDivision } from "@/lib/rankings/rankingDivision";
import type { RankingPeriod } from "@/lib/rankings/rankingPeriod";
import type { BulkMetricPayload } from "@/lib/rankings/useCumulativeRankingsBulk";
import { mergePeriodPersonalOverlay } from "@/lib/rankings/mergePeriodPersonalOverlay";
import {
  appendRankingSnapshotGenerationParam,
  fetchRankingSnapshotGeneration,
} from "@/lib/rankings/rankingSnapshotGenerationClient";

type PeriodBulkResult = {
  byMetric: Record<string, BulkMetricPayload>;
  range: { startKey: string; endKey: string; labelKey: string } | null;
  availableLabels: string[];
  activeLabel: string | null;
  proRequired: boolean;
  snapshotGeneration: string | null;
};

const emptyResult: PeriodBulkResult = {
  byMetric: {},
  range: null,
  availableLabels: [],
  activeLabel: null,
  proRequired: false,
  snapshotGeneration: null,
};

/** 世代キー付きなので長めでも安全（16:00 で key が変わる） */
const PERIOD_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const PERSONAL_CACHE_TTL_MS = 60 * 1000;

type PeriodCacheEntry = { at: number; value: PeriodBulkResult };
const periodCache = new Map<string, PeriodCacheEntry>();
const periodInflight = new Map<string, Promise<PeriodBulkResult>>();

type PersonalCacheEntry = {
  at: number;
  byMetric: Record<string, BulkMetricPayload>;
};
const personalCache = new Map<string, PersonalCacheEntry>();
const personalInflight = new Map<
  string,
  Promise<Record<string, BulkMetricPayload>>
>();

/** Pro Skin / プロフィール更新後にクライアント一覧メモリを捨てる */
export function clearPeriodRankingsClientCache(): void {
  periodCache.clear();
  periodInflight.clear();
  personalCache.clear();
  personalInflight.clear();
}

function periodCacheKey(
  period: string,
  label: string | null,
  division: RankingDivision,
  generation: string
): string {
  return `${period}|${label ?? "current"}|${division}|${generation}`;
}

function personalCacheKey(
  uid: string,
  period: string,
  label: string | null,
  division: RankingDivision,
  generation: string
): string {
  return `${uid}|${periodCacheKey(period, label, division, generation)}`;
}

async function fetchPeriodPersonalOverlay(opts: {
  period: string;
  label: string | null;
  division: RankingDivision;
  apiBaseUrl?: string | null;
}): Promise<Record<string, BulkMetricPayload>> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) return {};

  const params = new URLSearchParams({
    period: opts.period,
    personalOnly: "1",
  });
  if (opts.label) params.set("label", opts.label);
  if (opts.division === "open") params.set("division", "open");

  const base = (opts.apiBaseUrl ?? "").replace(/\/$/, "");
  const res = await fetch(`${base}/api/period-ranking/bulk?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "default",
  });
  if (!res.ok) return {};
  const json = (await res.json()) as {
    ok?: boolean;
    byMetric?: Record<string, BulkMetricPayload>;
  };
  if (!json?.ok) return {};
  return json.byMetric ?? {};
}

export function usePeriodRankingsBulk(
  period: Exclude<RankingPeriod, "season"> | null,
  /** 過去期間のラベル。null なら現在期間 */
  label: string | null = null,
  division: RankingDivision = "standard"
) {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [listReady, setListReady] = useState(false);
  const [personalPending, setPersonalPending] = useState(false);
  const [byMetric, setByMetric] = useState<Record<string, BulkMetricPayload>>(
    {}
  );
  const [sharedByMetric, setSharedByMetric] = useState<
    Record<string, BulkMetricPayload>
  >({});
  const [range, setRange] = useState<PeriodBulkResult["range"]>(null);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [proRequired, setProRequired] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
  }, []);

  /**
   * Pick Up ↔ PRO LEAGUE 切替で、旧 division の byMetric が1フレ残ると
   * Pro クロムに Pickup 順位が出る。描画前に必ず捨てる。
   */
  useLayoutEffect(() => {
    if (!period) {
      setByMetric({});
      setSharedByMetric({});
      setRange(null);
      setAvailableLabels([]);
      setActiveLabel(null);
      setProRequired(false);
      setPersonalPending(false);
      setListReady(true);
      return;
    }
    setListReady(false);
    setPersonalPending(false);
    setByMetric({});
    setSharedByMetric({});
    setProRequired(false);
  }, [period, label, division]);

  const loadShared = useCallback(async (): Promise<PeriodBulkResult> => {
    if (!period) return emptyResult;

    const generation = await fetchRankingSnapshotGeneration();
    const key = periodCacheKey(period, label, division, generation);
    const cached = periodCache.get(key);
    if (cached && Date.now() - cached.at < PERIOD_CACHE_TTL_MS) {
      return cached.value;
    }

    const pending = periodInflight.get(key);
    const run =
      pending ??
      (async (): Promise<PeriodBulkResult> => {
        try {
          const token =
            division === "open"
              ? await auth.currentUser?.getIdToken().catch(() => null)
              : null;
          const params = new URLSearchParams({ period });
          if (label) params.set("label", label);
          if (division === "open") params.set("division", "open");
          appendRankingSnapshotGenerationParam(params, generation);
          const res = await fetch(`/api/period-ranking/bulk?${params}`, {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
            cache: "force-cache",
          });
          const json = (await res.json()) as {
            ok?: boolean;
            error?: string;
            label?: string;
            byMetric?: Record<string, BulkMetricPayload>;
            range?: PeriodBulkResult["range"];
            availableLabels?: string[];
            snapshotGeneration?: string;
          };
          if (res.status === 403 && json?.error === "pro_required") {
            return { ...emptyResult, proRequired: true };
          }
          if (!res.ok || !json?.ok) {
            return emptyResult;
          }
          return {
            byMetric: json.byMetric ?? {},
            range: json.range ?? null,
            availableLabels: json.availableLabels ?? [],
            activeLabel: json.label ?? null,
            proRequired: false,
            snapshotGeneration: generation,
          };
        } catch {
          return emptyResult;
        }
      })().finally(() => {
        periodInflight.delete(key);
      });

    if (!pending) periodInflight.set(key, run);

    const value = await run;
    periodCache.set(key, { at: Date.now(), value });
    return value;
  }, [period, label, division]);

  useEffect(() => {
    if (!period) return;
    let cancelled = false;
    void (async () => {
      const value = await loadShared();
      if (cancelled) return;
      setSharedByMetric(value.byMetric);
      setByMetric(value.byMetric);
      setRange(value.range);
      setAvailableLabels(value.availableLabels);
      setActiveLabel(value.activeLabel);
      setProRequired(value.proRequired);
      setListReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadShared, period]);

  /** 一覧のあと — top50 外の My Rank を personalOnly で重ねる */
  useEffect(() => {
    if (!period || !listReady || proRequired) {
      setPersonalPending(false);
      return;
    }
    if (!uid) {
      setPersonalPending(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const generation = await fetchRankingSnapshotGeneration();
      if (cancelled) return;
      const key = personalCacheKey(uid, period, label, division, generation);

      const hit = personalCache.get(key);
      if (hit && Date.now() - hit.at < PERSONAL_CACHE_TTL_MS) {
        if (cancelled) return;
        setByMetric(mergePeriodPersonalOverlay(sharedByMetric, hit.byMetric));
        setPersonalPending(false);
        return;
      }

      setPersonalPending(true);
      const pending = personalInflight.get(key);
      const run =
        pending ??
        fetchPeriodPersonalOverlay({ period, label, division }).finally(() => {
          personalInflight.delete(key);
        });
      if (!pending) personalInflight.set(key, run);

      try {
        const personal = await run;
        personalCache.set(key, { at: Date.now(), byMetric: personal });
        if (cancelled) return;
        setByMetric(mergePeriodPersonalOverlay(sharedByMetric, personal));
      } catch {
        if (!cancelled) setByMetric(sharedByMetric);
      } finally {
        if (!cancelled) setPersonalPending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    period,
    label,
    division,
    uid,
    listReady,
    proRequired,
    sharedByMetric,
  ]);

  const ensureMetric = useCallback((_metric: string) => {
    /* period bulk loads all metrics at once */
  }, []);

  return {
    listReady: period ? listReady : true,
    personalPending: period ? personalPending : false,
    myUid: uid,
    byMetric: period ? byMetric : {},
    myMetricValueDeltas: null,
    ensureMetric,
    range: period ? range : null,
    availableLabels: period ? availableLabels : [],
    activeLabel,
    proRequired,
  };
}
