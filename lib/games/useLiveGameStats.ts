"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildLiveGameStatsReport,
  normalizeLiveGameStatsDoc,
  type LiveGameStatsReport,
} from "@/lib/games/liveGameStats";

const LIVE_POLL_MS = 60_000;

export type UseLiveGameStatsOptions = {
  /** Native など相対パスが使えないとき（末尾スラッシュなし） */
  apiBaseUrl?: string | null;
  /**
   * API が空/失敗のとき games/{id} を直接読む（Native は Window API が liveStats を落とす）。
   */
  loadGameDoc?: (
    gameId: string
  ) => Promise<Record<string, unknown> | null>;
};

/**
 * NBA ライブ/最終スタッツを /api/games/live-stats から取得する。
 * ライブ中は 60 秒間隔で再取得、final になったら停止。
 * データが未登録の試合は report: null のまま（呼び出し側で空状態）。
 */
export function useLiveGameStats(
  gameId: string | null,
  enabled: boolean,
  options?: UseLiveGameStatsOptions
): { report: LiveGameStatsReport | null; loading: boolean } {
  const [report, setReport] = useState<LiveGameStatsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef<LiveGameStatsReport | null>(null);
  const apiBase = (options?.apiBaseUrl ?? "").replace(/\/+$/, "");
  const loadGameDocRef = useRef(options?.loadGameDoc);
  loadGameDocRef.current = options?.loadGameDoc;

  useEffect(() => {
    reportRef.current = null;
    setReport(null);

    if (!gameId || !enabled) {
      setLoading(false);
      return;
    }

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const abort = new AbortController();

    const reportFromGameDoc = async (): Promise<LiveGameStatsReport | null> => {
      const loader = loadGameDocRef.current;
      if (!loader) return null;
      const game = await loader(gameId);
      if (!game) return null;
      const live = normalizeLiveGameStatsDoc(game.liveStats);
      if (!live) return null;
      return buildLiveGameStatsReport(gameId, game, live);
    };

    const fetchOnce = async () => {
      let next: LiveGameStatsReport | null = null;
      try {
        if (apiBase) {
          const path = `/api/games/live-stats?gameId=${encodeURIComponent(gameId)}`;
          const url = `${apiBase}${path}`;
          const res = await fetch(url, {
            cache: "no-store",
            signal: abort.signal,
          });
          if (res.ok) {
            const json = (await res.json().catch(() => null)) as {
              ok?: boolean;
              report?: LiveGameStatsReport | null;
            } | null;
            next = json?.ok ? json.report ?? null : null;
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // API 失敗は Firestore フォールバックへ
      }

      if (!alive) return;

      if (!next) {
        try {
          next = await reportFromGameDoc();
        } catch {
          next = null;
        }
      }

      if (!alive) return;
      reportRef.current = next;
      setReport(next);
      setLoading(false);

      if (reportRef.current?.phase === "final") return;
      timer = setTimeout(fetchOnce, LIVE_POLL_MS);
    };

    setLoading(true);
    void fetchOnce();

    return () => {
      alive = false;
      abort.abort();
      if (timer) clearTimeout(timer);
    };
  }, [gameId, enabled, apiBase]);

  return { report, loading };
}
