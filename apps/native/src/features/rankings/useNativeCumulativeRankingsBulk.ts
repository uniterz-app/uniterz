import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type { RankingPhase } from "../../../../../lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "../../../../../lib/rankings/playoffRound";
import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";

export type BulkMetricPayload = {
  ok: boolean;
  rows: unknown[];
  count: number;
  myRank: number | null;
  myRow: Record<string, unknown> | null;
  myRankDeltaPlaces: number | null;
};

const ANON_KEY = "__anon__";
const PRIMARY_METRICS = "totalPoints";

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

function mergeMetricBundles(
  prev: Record<string, BulkMetricPayload> | null,
  patch: Record<string, BulkMetricPayload>
): Record<string, BulkMetricPayload> {
  const out = { ...(prev ?? {}) };
  for (const [key, incoming] of Object.entries(patch)) {
    const inc = incoming;
    const old = out[key];
    if (
      old &&
      (inc.myRank == null || inc.myRow == null) &&
      (old.myRank != null || old.myRow != null)
    ) {
      out[key] = {
        ...inc,
        myRank: inc.myRank ?? old.myRank,
        myRow: (inc.myRow ?? old.myRow) as Record<string, unknown> | null,
        myRankDeltaPlaces: inc.myRankDeltaPlaces ?? old.myRankDeltaPlaces ?? null,
      };
    } else {
      out[key] = inc;
    }
  }
  return out;
}

/** 匿名一覧で個人 myRank / myRow を消さない（Web useCumulativeRankingsBulk と同系） */
function mergeAnonListBundles(
  prev: Record<string, BulkMetricPayload> | null,
  bundles: Record<string, BulkMetricPayload>
): Record<string, BulkMetricPayload> {
  const out: Record<string, BulkMetricPayload> = { ...bundles };
  if (!prev) return out;
  for (const key of Object.keys(out)) {
    const incoming = out[key]!;
    const kept = prev[key];
    if (
      kept &&
      (kept.myRank != null ||
        kept.myRow != null ||
        kept.myRankDeltaPlaces != null)
    ) {
      out[key] = {
        ...incoming,
        myRank: kept.myRank ?? incoming.myRank,
        myRow: (kept.myRow ?? incoming.myRow) as Record<string, unknown> | null,
        myRankDeltaPlaces:
          kept.myRankDeltaPlaces ?? incoming.myRankDeltaPlaces ?? null,
      };
    }
  }
  return out;
}

function applyAnonListToState(
  setByMetric: Dispatch<
    SetStateAction<Record<string, BulkMetricPayload> | null>
  >,
  setAppliedTotalPointsUid: Dispatch<SetStateAction<string | null>>,
  bundles: Record<string, BulkMetricPayload>
): void {
  setByMetric((prev) => mergeAnonListBundles(prev, bundles));
  setAppliedTotalPointsUid((prev) =>
    prev && prev !== ANON_KEY ? prev : ANON_KEY
  );
}

async function fetchBulkMetrics(
  metrics: string,
  uid: string | null,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): Promise<Record<string, BulkMetricPayload> | null> {
  const base = getUniterzApiBaseUrl();
  if (!base) return null;

  const params = new URLSearchParams();
  params.set("metrics", metrics);
  params.set("phase", phase);
  params.set("round", round);
  if (wcStage) params.set("wcStage", wcStage);
  if (uid) params.set("uid", uid);

  const res = await fetch(`${base}/api/cumulative-ranking/bulk?${params.toString()}`, {
    cache: "no-store",
  });
  const json = (await res.json()) as {
    ok?: boolean;
    byMetric?: Record<string, BulkMetricPayload>;
    wcStage?: WcRankingStage;
  };
  if (!json?.ok || !json.byMetric) return null;
  if (wcStage != null && json.wcStage !== wcStage) return null;
  return json.byMetric;
}

export function useNativeCumulativeRankingsBulk(
  phase: RankingPhase = "playoffs",
  round: PlayoffRoundKey = "overall",
  wcStage: WcRankingStage | null = null
) {
  const [authReady, setAuthReady] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [byMetric, setByMetric] = useState<Record<string, BulkMetricPayload> | null>(null);
  const [appliedTotalPointsUid, setAppliedTotalPointsUid] = useState<string | null>(null);

  const mountPrimaryGenRef = useRef(0);
  const uidPrimarySeqRef = useRef(0);
  const metricReqSeqRef = useRef(0);
  const phaseRoundGenRef = useRef(0);

  useEffect(() => {
    phaseRoundGenRef.current += 1;
    metricReqSeqRef.current += 1;
    let cancelled = false;
    setByMetric(null);
    setAppliedTotalPointsUid(null);
    setLoading(true);

    void (async () => {
      const g = ++mountPrimaryGenRef.current;
      try {
        const partial = await fetchBulkMetrics(PRIMARY_METRICS, null, phase, round, wcStage);
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        if (partial) {
          applyAnonListToState(setByMetric, setAppliedTotalPointsUid, partial);
        } else {
          applyAnonListToState(setByMetric, setAppliedTotalPointsUid, {
            totalPoints: emptyBulkMetric(),
          });
        }
      } catch {
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        applyAnonListToState(setByMetric, setAppliedTotalPointsUid, {
          totalPoints: emptyBulkMetric(),
        });
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
            const partial = await fetchBulkMetrics(PRIMARY_METRICS, null, phase, round, wcStage);
            if (cancelled || g !== mountPrimaryGenRef.current) return;
            if (partial) {
              applyAnonListToState(setByMetric, setAppliedTotalPointsUid, partial);
            } else {
              applyAnonListToState(setByMetric, setAppliedTotalPointsUid, {
                totalPoints: emptyBulkMetric(),
              });
            }
          } catch {
            if (cancelled || g !== mountPrimaryGenRef.current) return;
            applyAnonListToState(setByMetric, setAppliedTotalPointsUid, {
              totalPoints: emptyBulkMetric(),
            });
          }
        })();
        return;
      }

      const uq = ++uidPrimarySeqRef.current;
      void (async () => {
        try {
          const partial = await fetchBulkMetrics(PRIMARY_METRICS, uid, phase, round, wcStage);
          if (cancelled || uq !== uidPrimarySeqRef.current) return;
          if (partial) {
            setByMetric((prev) => mergeMetricBundles(prev, partial));
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
  }, [phase, round, wcStage]);

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
        const partial = await fetchBulkMetrics(metric, uidForMetric, phase, round, wcStage);
        if (genAtStart !== phaseRoundGenRef.current) return;
        if (seq !== metricReqSeqRef.current) return;
        if (partial) {
          setByMetric((prev) => mergeMetricBundles(prev, partial));
        } else {
          setByMetric((prev) => mergeMetricBundles(prev, { [metric]: emptyBulkMetric() }));
        }
      } catch {
        if (seq !== metricReqSeqRef.current) return;
        setByMetric((prev) => mergeMetricBundles(prev, { [metric]: emptyBulkMetric() }));
      }
    },
    [authReady, byMetric, myUid, appliedTotalPointsUid, phase, round, wcStage]
  );

  const listReady = byMetric?.totalPoints != null;
  const personalPending =
    myUid != null && appliedTotalPointsUid != null && appliedTotalPointsUid !== myUid;

  return {
    loading,
    listReady,
    personalPending,
    myUid,
    byMetric,
    ensureMetric,
  };
}
