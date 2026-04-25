"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  CUMULATIVE_RANKING_INVALIDATE_EVENT,
  CUMULATIVE_RANKING_PATCH_MY_COUNTRY_EVENT,
  clearRankCountrySessionOverride,
  readRankCountrySessionOverride,
  type CumulativeRankingPatchMyCountryDetail,
} from "@/lib/rankings/cumulativeRankingInvalidate";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";

/** 指標タブで既に読み込んだバンドルを捨てずにまとめて取り直す */
const REFETCH_ALL_METRICS =
  "totalPoints,totalPrecision,totalUpset,activeWinStreak,winRate";

export type BulkMetricPayload = {
  ok: boolean;
  rows: unknown[];
  count: number;
  myRank: number | null;
  myRow: Record<string, unknown> | null;
  myRankDeltaPlaces: number | null;
};

const ANON_KEY = "__anon__";

function emptyBulkMetric(): BulkMetricPayload {
  return {
    ok: true,
    rows: [],
    count: 0,
    myRank: null,
    myRow: null,
    myRankDeltaPlaces: null,
  };
}

/** 初回は総合（totalPoints）のみ先読み。 */
const PRIMARY_METRICS = "totalPoints";

function mergeMetricBundles(
  prev: Record<string, BulkMetricPayload> | null,
  patch: Record<string, BulkMetricPayload>
): Record<string, BulkMetricPayload> {
  const out = { ...(prev ?? {}) };
  for (const [k, incoming] of Object.entries(patch)) {
    const inc = incoming as BulkMetricPayload;
    const old = out[k];
    if (
      old &&
      (inc.myRank == null || inc.myRow == null) &&
      (old.myRank != null || old.myRow != null)
    ) {
      out[k] = {
        ...inc,
        myRank: inc.myRank ?? old.myRank,
        myRow: (inc.myRow ?? old.myRow) as Record<string, unknown> | null,
        myRankDeltaPlaces:
          inc.myRankDeltaPlaces ?? old.myRankDeltaPlaces ?? null,
      };
    } else {
      out[k] = inc;
    }
  }
  return out;
}

/** プロフィール保存直後：該当 uid の行と myRow の countryCode を即座に差し替え */
function patchCountryInBundles(
  prev: Record<string, BulkMetricPayload> | null,
  uid: string,
  countryCode: string | null
): Record<string, BulkMetricPayload> | null {
  if (!prev) return prev;
  const next: Record<string, BulkMetricPayload> = {};
  for (const [key, bundle] of Object.entries(prev)) {
    const b = bundle as BulkMetricPayload;
    const rows = Array.isArray(b.rows)
      ? b.rows.map((row) => {
          const r = row as { uid?: string };
          if (r?.uid === uid) return { ...r, countryCode };
          return row;
        })
      : b.rows;
    const my = b.myRow as { uid?: string } | null | undefined;
    const myRow =
      my && typeof my.uid === "string" && my.uid === uid
        ? ({ ...my, countryCode } as Record<string, unknown>)
        : b.myRow;
    next[key] = { ...b, rows, myRow };
  }
  return next;
}

/** プロフィール保存で sessionStorage に残した国を、取得済みバンドルへ反映 */
function applySessionCountryOverride(
  bundles: Record<string, BulkMetricPayload> | null,
  uid: string | null
): Record<string, BulkMetricPayload> | null {
  if (!bundles || !uid) return bundles;
  const stored = readRankCountrySessionOverride(uid);
  if (stored === undefined) return bundles;
  return patchCountryInBundles(bundles, uid, stored);
}

/** サーバの myRow / 自分の行がセッションと一致したらセッション上書きを消す */
function maybeClearSessionCountryAfterFetch(
  partial: Record<string, BulkMetricPayload>,
  uid: string
): void {
  const stored = readRankCountrySessionOverride(uid);
  if (stored === undefined) return;

  const tp = partial.totalPoints;
  if (!tp) return;
  const rows = tp?.rows as
    | Array<{ uid?: string; countryCode?: string | null }>
    | undefined;
  const myRow = tp?.myRow as { uid?: string; countryCode?: string | null } | null;
  const mine = rows?.find((r) => r?.uid === uid);
  const serverCode =
    mine?.countryCode ??
    (myRow?.uid === uid ? myRow.countryCode : undefined) ??
    null;

  if (stored === null && (serverCode == null || serverCode === "")) {
    clearRankCountrySessionOverride(uid);
  } else if (typeof stored === "string" && serverCode === stored) {
    clearRankCountrySessionOverride(uid);
  }
}

async function fetchBulkMetrics(
  metrics: string,
  uid: string | null,
  phase: RankingPhase,
  round: PlayoffRoundKey
): Promise<Record<string, BulkMetricPayload> | null> {
  const params = new URLSearchParams();
  params.set("metrics", metrics);
  params.set("phase", phase);
  params.set("round", round);
  if (uid) params.set("uid", uid);
  const res = await fetch(`/api/cumulative-ranking/bulk?${params.toString()}`);
  const json = await res.json();
  if (!json?.ok || !json?.byMetric) return null;
  return json.byMetric as Record<string, BulkMetricPayload>;
}

export function useCumulativeRankingsBulk(
  phase: RankingPhase = "playoffs",
  round: PlayoffRoundKey = "overall"
) {
  const [authReady, setAuthReady] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [byMetric, setByMetric] = useState<Record<
    string,
    BulkMetricPayload
  > | null>(null);
  const [appliedTotalPointsUid, setAppliedTotalPointsUid] = useState<
    string | null
  >(null);

  const mountPrimaryGenRef = useRef(0);
  const uidPrimarySeqRef = useRef(0);
  const metricReqSeqRef = useRef(0);
  /** phase / round が変わったら増加。古い ensureMetric の結果をマージしない。 */
  const phaseRoundGenRef = useRef(0);
  const invalidateSeqRef = useRef(0);

  /** プロフィールで国を保存した直後：一覧の該当行を即更新（ランキング画面を開いているときのみ効く） */
  useEffect(() => {
    const onPatchMyCountry = (ev: Event) => {
      const d = (ev as CustomEvent<CumulativeRankingPatchMyCountryDetail>)
        .detail;
      if (!d?.uid) return;
      setByMetric((prev) => patchCountryInBundles(prev, d.uid, d.countryCode));
    };
    window.addEventListener(
      CUMULATIVE_RANKING_PATCH_MY_COUNTRY_EVENT,
      onPatchMyCountry
    );
    return () => {
      window.removeEventListener(
        CUMULATIVE_RANKING_PATCH_MY_COUNTRY_EVENT,
        onPatchMyCountry
      );
    };
  }, []);

  /** プロフィール保存後など、サーバと揃えるため全指標を背後で再取得（一覧は消さない） */
  useEffect(() => {
    const onInvalidate = () => {
      const seq = ++invalidateSeqRef.current;
      void (async () => {
        const uid = auth.currentUser?.uid ?? null;
        try {
          const partial = await fetchBulkMetrics(REFETCH_ALL_METRICS, uid, phase, round);
          if (seq !== invalidateSeqRef.current) return;
          if (partial) {
            const merged = mergeMetricBundles(null, partial);
            const withSession = applySessionCountryOverride(merged, uid);
            setByMetric(withSession);
            if (uid) maybeClearSessionCountryAfterFetch(partial, uid);
            setAppliedTotalPointsUid(uid ?? ANON_KEY);
          }
        } catch {
          if (seq !== invalidateSeqRef.current) return;
        }
      })();
    };

    window.addEventListener(CUMULATIVE_RANKING_INVALIDATE_EVENT, onInvalidate);
    return () => {
      invalidateSeqRef.current += 1;
      window.removeEventListener(
        CUMULATIVE_RANKING_INVALIDATE_EVENT,
        onInvalidate
      );
    };
  }, [phase, round]);

  useEffect(() => {
    phaseRoundGenRef.current += 1;
    metricReqSeqRef.current += 1;
    let cancelled = false;
    // Phase changed: drop previous phase bundles immediately
    setByMetric(null);
    setAppliedTotalPointsUid(null);
    setLoading(true);

    void (async () => {
      const g = ++mountPrimaryGenRef.current;
      try {
        const partial = await fetchBulkMetrics(PRIMARY_METRICS, null, phase, round);
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        if (partial) {
          setByMetric((p) =>
            applySessionCountryOverride(mergeMetricBundles(p, partial), null)
          );
          setAppliedTotalPointsUid(ANON_KEY);
        } else {
          setByMetric(
            applySessionCountryOverride(
              mergeMetricBundles(null, { totalPoints: emptyBulkMetric() }),
              null
            )
          );
          setAppliedTotalPointsUid(ANON_KEY);
        }
      } catch {
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        setByMetric(
          applySessionCountryOverride(
            mergeMetricBundles(null, { totalPoints: emptyBulkMetric() }),
            null
          )
        );
        setAppliedTotalPointsUid(ANON_KEY);
      } finally {
        if (!cancelled && g === mountPrimaryGenRef.current) {
          setLoading(false);
        }
      }
    })();

    const unsub = onAuthStateChanged(auth, (user) => {
      const uid = user?.uid ?? null;
      setMyUid(uid);
      setAuthReady(true);

      if (!uid) {
        const g = ++mountPrimaryGenRef.current;
        void (async () => {
          try {
            const partial = await fetchBulkMetrics(PRIMARY_METRICS, null, phase, round);
            if (cancelled || g !== mountPrimaryGenRef.current) return;
            if (partial) {
              setByMetric((p) =>
                applySessionCountryOverride(mergeMetricBundles(p, partial), null)
              );
              setAppliedTotalPointsUid(ANON_KEY);
            } else {
              setByMetric(
                applySessionCountryOverride(
                  mergeMetricBundles(null, { totalPoints: emptyBulkMetric() }),
                  null
                )
              );
              setAppliedTotalPointsUid(ANON_KEY);
            }
          } catch {
            if (cancelled || g !== mountPrimaryGenRef.current) return;
            setByMetric(
              applySessionCountryOverride(
                mergeMetricBundles(null, { totalPoints: emptyBulkMetric() }),
                null
              )
            );
            setAppliedTotalPointsUid(ANON_KEY);
          }
        })();
        return;
      }

      const uq = ++uidPrimarySeqRef.current;
      void (async () => {
        try {
          const partial = await fetchBulkMetrics(PRIMARY_METRICS, uid, phase, round);
          if (cancelled || uq !== uidPrimarySeqRef.current) return;
          if (partial) {
            setByMetric((p) =>
              applySessionCountryOverride(mergeMetricBundles(p, partial), uid)
            );
            maybeClearSessionCountryAfterFetch(partial, uid);
            setAppliedTotalPointsUid(uid);
          } else {
            setAppliedTotalPointsUid(uid);
          }
        } catch {
          if (cancelled || uq !== uidPrimarySeqRef.current) return;
          setAppliedTotalPointsUid(uid);
        }
      })();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [phase, round]);

  const ensureMetric = useCallback(
    async (metric: string) => {
      if (metric === "totalPoints") return;
      if (!authReady) return;
      if (!byMetric?.totalPoints) return;
      if (byMetric?.[metric]) return;

      const uidForMetric = myUid;
      if (uidForMetric) {
        if (appliedTotalPointsUid !== uidForMetric) return;
      } else if (appliedTotalPointsUid !== ANON_KEY) {
        return;
      }

      const genAtStart = phaseRoundGenRef.current;
      const seq = ++metricReqSeqRef.current;
      try {
        const partial = await fetchBulkMetrics(metric, uidForMetric, phase, round);
        if (genAtStart !== phaseRoundGenRef.current) return;
        if (seq !== metricReqSeqRef.current) return;
        if (partial) {
          setByMetric((p) =>
            applySessionCountryOverride(
              mergeMetricBundles(p, partial),
              uidForMetric
            )
          );
          if (uidForMetric) maybeClearSessionCountryAfterFetch(partial, uidForMetric);
        } else {
          setByMetric((p) =>
            applySessionCountryOverride(
              mergeMetricBundles(p, { [metric]: emptyBulkMetric() }),
              uidForMetric
            )
          );
        }
      } catch {
        if (seq !== metricReqSeqRef.current) return;
        setByMetric((p) =>
          applySessionCountryOverride(
            mergeMetricBundles(p, { [metric]: emptyBulkMetric() }),
            uidForMetric
          )
        );
      }
    },
    [authReady, byMetric, myUid, appliedTotalPointsUid, phase, round]
  );

  const listReady = byMetric?.totalPoints != null;
  const personalPending =
    myUid != null &&
    appliedTotalPointsUid != null &&
    appliedTotalPointsUid !== myUid;

  return {
    loading,
    listReady,
    personalPending,
    myUid,
    byMetric,
    authReady,
    ensureMetric,
  };
}
