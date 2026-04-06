"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export type BulkMetricPayload = {
  ok: boolean;
  rows: unknown[];
  count: number;
  myRank: number | null;
  myRow: Record<string, unknown> | null;
};

const ANON_KEY = "__anon__";

/**
 * 5 指標を 1 回の /api/cumulative-ranking/bulk で取得。
 * 匿名の bulk を先に走らせてトップ一覧を早く表示し、認証確定後に uid 付きで再取得して自分順位を埋める。
 */
export function useCumulativeRankingsBulk() {
  const [authReady, setAuthReady] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [byMetric, setByMetric] = useState<Record<
    string,
    BulkMetricPayload
  > | null>(null);
  const [appliedUidKey, setAppliedUidKey] = useState<string | null>(null);

  const seqRef = useRef(0);
  const hasListRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const runFetch = (uidForRequest: string | null) => {
      const mySeq = ++seqRef.current;
      const firstEver = !hasListRef.current;
      if (firstEver) setLoading(true);

      void (async () => {
        try {
          const q = uidForRequest
            ? `?uid=${encodeURIComponent(uidForRequest)}`
            : "";
          const res = await fetch(`/api/cumulative-ranking/bulk${q}`);
          const json = await res.json();

          if (cancelled || mySeq !== seqRef.current) return;

          if (json?.ok && json?.byMetric) {
            setByMetric(json.byMetric as Record<string, BulkMetricPayload>);
            hasListRef.current = true;
            setAppliedUidKey(uidForRequest ?? ANON_KEY);
          } else if (!hasListRef.current) {
            setByMetric(null);
            setAppliedUidKey(null);
          }
        } catch {
          if (cancelled || mySeq !== seqRef.current) return;
          if (!hasListRef.current) {
            setByMetric(null);
            setAppliedUidKey(null);
          }
        } finally {
          if (cancelled || mySeq !== seqRef.current) return;
          setLoading(false);
        }
      })();
    };

    runFetch(null);

    const unsub = onAuthStateChanged(auth, (user) => {
      const uid = user?.uid ?? null;
      setMyUid(uid);
      setAuthReady(true);
      runFetch(uid);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const listReady = byMetric != null;
  const personalPending =
    myUid != null &&
    appliedUidKey != null &&
    appliedUidKey !== myUid;

  return {
    /** 初回など、まだ一覧用の bulk が一度も取れていない */
    loading,
    /** トップ一覧などに使える行データが揃った */
    listReady,
    /** ログイン済みだが、まだ uid 付きレスポンスが反映されていない（自分順位待ち） */
    personalPending,
    myUid,
    byMetric,
    authReady,
  };
}
