/**
 * 試合一覧のライブ自動更新判定（Web useGameDays / Native useTodayGames 共用）。
 * 開始時刻を過ぎて未終了の試合がある間だけ窓を取り直す。
 */

import { toDateOrNull } from "@/lib/games/transform";

export const GAMES_WINDOW_LIVE_REFRESH_MS = 60_000;
/** 開始からこの時間を過ぎても final にならない行は放置データとみなし更新しない */
const LIVE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
/** 次の試合開始までの待機上限（これより先は再判定しない） */
const NEXT_START_HORIZON_MS = 12 * 60 * 60 * 1000;

function isFinalRow(row: Record<string, unknown>): boolean {
  if (row.final === true || row.final === 1) return true;
  const s = String(row.status ?? "").toLowerCase();
  return s === "final" || s === "ended";
}

function isSkippedRow(row: Record<string, unknown>): boolean {
  const s = String(row.status ?? "").toLowerCase();
  return s.includes("postpon") || s.includes("cancel");
}

export type GamesWindowLiveRefreshPlan = {
  /** いま 60 秒ポーリングすべきか */
  active: boolean;
  /** active でないとき、次に再判定する時刻（ms）。null は待たない */
  wakeAtMs: number | null;
};

export function planGamesWindowLiveRefresh(
  rows: ReadonlyArray<Record<string, unknown>>,
  nowMs: number
): GamesWindowLiveRefreshPlan {
  let nextStart: number | null = null;
  for (const row of rows) {
    if (isFinalRow(row) || isSkippedRow(row)) continue;
    const start = toDateOrNull(row.startAtJst)?.getTime();
    if (start == null || !Number.isFinite(start)) continue;
    if (start <= nowMs) {
      if (nowMs - start < LIVE_MAX_AGE_MS) return { active: true, wakeAtMs: null };
      continue;
    }
    if (nextStart == null || start < nextStart) nextStart = start;
  }
  if (nextStart != null && nextStart - nowMs <= NEXT_START_HORIZON_MS) {
    return { active: false, wakeAtMs: nextStart };
  }
  return { active: false, wakeAtMs: null };
}
