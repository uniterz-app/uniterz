"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import type { WcOfficialWinners } from "@/lib/wc/wc-bracket-results-types";
import { parseWcOfficialWinnersDoc } from "@/lib/wc/wc-bracket-results-types";

export type { WcOfficialWinners } from "@/lib/wc/wc-bracket-results-types";

type Options = {
  /** false のとき Firestore を叩かない（入力モーダル中など） */
  enabled?: boolean;
  /** 0 以外なら getDoc を定期再取得（ノックアウト中の survivor 更新用） */
  pollIntervalMs?: number;
};

/**
 * `wcBracketResults/{season}` の公式勝者。
 * onSnapshot ではなく getDoc — Firestore 12.x の ca9 アサーション回避（StrictMode / モバイル Safari）。
 */
export function useWcBracketResults(
  season = WC_KNOCKOUT_SEASON,
  options: Options = {}
) {
  const { enabled = true, pollIntervalMs = 0 } = options;
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
        setWinners(parseWcOfficialWinnersDoc(snap.data()));
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

    let timer: ReturnType<typeof setInterval> | undefined;
    if (pollIntervalMs > 0) {
      timer = setInterval(() => {
        void load();
      }, pollIntervalMs);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [season, enabled, pollIntervalMs]);

  return { winners, ready };
}
