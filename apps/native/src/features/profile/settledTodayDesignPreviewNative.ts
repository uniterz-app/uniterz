/**
 * Result Drop デザイン確認用のモック投稿。
 * 本日確定が空のときもパネル見た目を確認できるようにする。
 */
import type { PostWithMillis } from "../results/nativeResultModel";

export const SETTLED_TODAY_PREVIEW_ID_PREFIX = "settled-today-preview:";

export function isSettledTodayDesignPreviewPost(postId: string): boolean {
  return postId.startsWith(SETTLED_TODAY_PREVIEW_ID_PREFIX);
}

export function buildSettledTodayDesignPreviewPosts(
  nowMs: number = Date.now()
): PostWithMillis[] {
  return [
    {
      id: `${SETTLED_TODAY_PREVIEW_ID_PREFIX}hit`,
      status: "final",
      schemaVersion: 2,
      league: "nba",
      seasonPhase: "regular",
      settledAtMillis: nowMs - 45 * 60_000,
      startAtMillis: nowMs - 3 * 60 * 60_000,
      home: { name: "Lakers", teamId: "lal" },
      away: { name: "Celtics", teamId: "bos" },
      prediction: {
        winner: "home",
        score: { home: 112, away: 108 },
      },
      result: { home: 115, away: 110 },
      stats: {
        isWin: true,
        pointsV3: 7.4,
        upsetPoints: 2.2,
        upsetHit: false,
        scoreError: 3,
        pointsV3Detail: { activeWinStreak: 3 },
      },
    },
    {
      id: `${SETTLED_TODAY_PREVIEW_ID_PREFIX}miss`,
      status: "final",
      schemaVersion: 2,
      league: "nba",
      seasonPhase: "regular",
      settledAtMillis: nowMs - 90 * 60_000,
      startAtMillis: nowMs - 5 * 60 * 60_000,
      home: { name: "Warriors", teamId: "gsw" },
      away: { name: "Nuggets", teamId: "den" },
      prediction: {
        winner: "away",
        score: { home: 104, away: 111 },
      },
      result: { home: 118, away: 109 },
      stats: {
        isWin: false,
        pointsV3: 1.1,
        upsetPoints: 0,
        upsetHit: false,
        scoreError: 8,
        pointsV3Detail: { activeWinStreak: 0 },
      },
    },
  ];
}
