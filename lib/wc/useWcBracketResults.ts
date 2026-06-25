"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";

export type WcOfficialWinners = Partial<
  Record<WcBracketPredictMatchId, string>
>;

type Options = {
  /** false のとき Firestore を叩かない（入力モーダル中など） */
  enabled?: boolean;
};

/**
 * `wcBracketResults/{season}` の公式勝者。
 * onSnapshot ではなく getDoc — Firestore 12.x の ca9 アサーション回避（StrictMode / モバイル Safari）。
 */
export function useWcBracketResults(
  season = WC_KNOCKOUT_SEASON,
  options: Options = {}
) {
  const { enabled = true } = options;
  const [winners, setWinners] = useState<WcOfficialWinners>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setWinners({});
      setReady(false);
      return;
    }

    let cancelled = false;
    const ref = doc(db, "wcBracketResults", season);

    async function load() {
      try {
        const snap = await getDoc(ref);
        if (cancelled) return;
        const w = snap.data()?.winners;
        setWinners(
          w && typeof w === "object" ? (w as WcOfficialWinners) : {}
        );
      } catch (e) {
        if (!cancelled) {
          console.warn("wcBracketResults load failed", e);
          setWinners({});
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [season, enabled]);

  return { winners, ready };
}
