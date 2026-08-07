"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveGameStatsReport } from "@/lib/games/liveGameStats";

const LIVE_POLL_MS = 30_000;

export type UseLiveGameStatsOptions = {
  /** Native など相対パスが使えないとき（末尾スラッシュなし） */
  apiBaseUrl?: string | null;
};

/**
 * NBA ライブ/最終スタッツを /api/games/live-stats から取得する。
 * ライブ中は 30 秒間隔で再取得、final になったら停止。
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

  useEffect(() => {
    reportRef.current = null;
    setReport(null);

    if (!gameId || !enabled) {
      setLoading(false);
      return;
    }

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchOnce = async () => {
      try {
        const path = `/api/games/live-stats?gameId=${encodeURIComponent(gameId)}`;
        const url = apiBase ? `${apiBase}${path}` : path;
        const res = await fetch(url, { cache: "no-store" });
        if (!alive) return;
        if (res.ok) {
          const json = (await res.json().catch(() => null)) as {
            ok?: boolean;
            report?: LiveGameStatsReport | null;
          } | null;
          if (!alive) return;
          const next = json?.ok ? json.report ?? null : null;
          reportRef.current = next;
          setReport(next);
        }
      } catch {
        // ネットワーク一時失敗は次のポーリングに任せる
      } finally {
        if (alive) setLoading(false);
      }

      if (!alive) return;
      // final になったらポーリング停止。未登録(null)はライブ開始待ちの可能性があるため継続
      if (reportRef.current?.phase === "final") return;
      timer = setTimeout(fetchOnce, LIVE_POLL_MS);
    };

    setLoading(true);
    fetchOnce();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [gameId, enabled, apiBase]);

  return { report, loading };
}
