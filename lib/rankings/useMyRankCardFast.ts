/**
 * Web: マイランクカードを cumulative_stats 1 read で先行取得。
 */
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  fetchMyRankCardFastClient,
  type MyRankCardFastPayload,
} from "@/lib/rankings/fetchMyRankCardClient";

const idle: MyRankCardFastPayload & { loading: boolean } = {
  loading: true,
  myRank: null,
  myRankDeltaPlaces: null,
  myRow: null,
  plan: "free",
};

export function useMyRankCardFast(
  uid: string | null | undefined,
  options?: { enabled?: boolean }
): MyRankCardFastPayload & { loading: boolean } {
  const enabled = options?.enabled ?? true;
  const [state, setState] = useState(idle);

  useEffect(() => {
    if (!enabled || !uid?.trim()) {
      setState({ ...idle, loading: false });
      return;
    }

    const safeUid = uid.trim();
    let cancelled = false;

    async function run() {
      setState((prev) => ({ ...prev, loading: true }));
      const payload = await fetchMyRankCardFastClient(db, safeUid);
      if (cancelled) return;
      if (!payload) {
        setState({ ...idle, loading: false });
        return;
      }
      setState({ ...payload, loading: false });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, uid]);

  return state;
}
