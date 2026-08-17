"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { RankingDivision } from "@/lib/rankings/rankingDivision";
import type { RankingPeriod } from "@/lib/rankings/rankingPeriod";
import type { BulkMetricPayload } from "@/lib/rankings/useCumulativeRankingsBulk";
import { mergePeriodPersonalOverlay } from "@/lib/rankings/mergePeriodPersonalOverlay";

type PeriodBulkResult = {
  byMetric: Record<string, BulkMetricPayload>;
  range: { startKey: string; endKey: string; labelKey: string } | null;
  availableLabels: string[];
  activeLabel: string | null;
  proRequired: boolean;
};

const emptyResult: PeriodBulkResult = {
  byMetric: {},
  range: null,
  availableLabels: [],
  activeLabel: null,
  proRequired: false,
};

const PERIOD_CACHE_TTL_MS = 10 * 60 * 1000;
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

function periodCacheKey(
  period: string,
  label: string | null,
  division: RankingDivision
): string {
  return `${period}|${label ?? "current"}|${division}`;
}

function personalCacheKey(
  uid: string,
  period: string,
  label: string | null,
  division: RankingDivision
): string {
  return `${uid}|${periodCacheKey(period, label, division)}`;
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
    cache: "no-store",
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

  const loadShared = useCallback(async () => {
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

    const key = periodCacheKey(period, label, division);
    const cached = periodCache.get(key);
    if (cached && Date.now() - cached.at < PERIOD_CACHE_TTL_MS) {
      setSharedByMetric(cached.value.byMetric);
      setByMetric(cached.value.byMetric);
      setRange(cached.value.range);
      setAvailableLabels(cached.value.availableLabels);
      setActiveLabel(cached.value.activeLabel);
      setProRequired(cached.value.proRequired);
      setListReady(true);
      return;
    }

    setListReady(false);
    setProRequired(false);

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
          const res = await fetch(`/api/period-ranking/bulk?${params}`, {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
            cache: division === "open" ? "no-store" : "force-cache",
          });
          const json = (await res.json()) as {
            ok?: boolean;
            error?: string;
            label?: string;
            byMetric?: Record<string, BulkMetricPayload>;
            range?: PeriodBulkResult["range"];
            availableLabels?: string[];
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
          };
        } catch {
          return emptyResult;
        }
      })().finally(() => {
        periodInflight.delete(key);
      });

    if (!pending) periodInflight.set(key, run);

    try {
      const value = await run;
      periodCache.set(key, { at: Date.now(), value });
      setSharedByMetric(value.byMetric);
      setByMetric(value.byMetric);
      setRange(value.range);
      setAvailableLabels(value.availableLabels);
      setActiveLabel(value.activeLabel);
      setProRequired(value.proRequired);
    } finally {
      setListReady(true);
    }
  }, [period, label, division]);

  useEffect(() => {
    void loadShared();
  }, [loadShared]);

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
    const key = personalCacheKey(uid, period, label, division);

    void (async () => {
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
    ensureMetric,
    range: period ? range : null,
    availableLabels: period ? availableLabels : [],
    activeLabel,
    proRequired,
  };
}
