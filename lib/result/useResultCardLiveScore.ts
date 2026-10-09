"use client";

import { useLiveGameStats } from "@/lib/games/useLiveGameStats";

/**
 * リザルト一覧カードの LIVE 中実スコア。
 * 「ライブ中のスコア」表示 ON の人だけ /api/games/live-stats（Firestore のみ・60 秒）を取りに行く。
 */
export function useResultCardLiveScore(params: {
  gameId: string | null;
  isNba: boolean;
  live: boolean;
  showLiveScore: boolean;
  apiBaseUrl?: string | null;
  paused?: boolean;
}): { home: number; away: number; clock: string | null } | null {
  const enabled =
    Boolean(params.gameId) && params.isNba && params.live && params.showLiveScore;
  const { report } = useLiveGameStats(params.gameId, enabled, {
    apiBaseUrl: params.apiBaseUrl,
    paused: params.paused,
  });
  if (!enabled || !report) return null;
  const home = report.home?.score;
  const away = report.away?.score;
  if (typeof home !== "number" || typeof away !== "number") return null;
  const clock = report.clock?.trim() || report.periodLabel?.trim() || null;
  return { home, away, clock };
}
