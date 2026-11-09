/**
 * OS 標準のストアレビュー依頼を出す条件（Native 起動時）。
 *
 * - 登録から 7 日以上・今季の予想 10 試合以上（`users.proSkinProgress.posts`）
 * - 前回の依頼から 90 日以上（OS 側にも回数制限あり）
 * - 調子がいい瞬間だけ: 今の連勝 3 以上、または直近 30 時間に確定した予想が 3 件以上で的中率 6 割以上
 */

const DAY_MS = 86_400_000;

export const STORE_REVIEW_MIN_ACCOUNT_AGE_MS = 7 * DAY_MS;
export const STORE_REVIEW_MIN_SEASON_POSTS = 10;
export const STORE_REVIEW_INTERVAL_MS = 90 * DAY_MS;
export const STORE_REVIEW_RECENT_WINDOW_MS = 30 * 3600_000;
export const STORE_REVIEW_GOOD_DAY_MIN_SETTLED = 3;
export const STORE_REVIEW_GOOD_DAY_WIN_RATE = 0.6;
export const STORE_REVIEW_WIN_STREAK = 3;

type ProgressLike = { posts?: unknown; lastActiveWinStreak?: unknown };

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function readStoreReviewProgress(userData: Record<string, unknown> | null | undefined): {
  seasonPosts: number;
  winStreak: number;
} {
  const p = (userData?.proSkinProgress ?? null) as ProgressLike | null;
  return { seasonPosts: num(p?.posts), winStreak: num(p?.lastActiveWinStreak) };
}

/** 結果を読まずに判定できる前提条件 */
export function isStoreReviewBaseEligible(input: {
  nowMs: number;
  accountCreatedAtMs: number | null;
  seasonPosts: number;
  lastRequestedAtMs: number | null;
}): boolean {
  const { nowMs, accountCreatedAtMs, seasonPosts, lastRequestedAtMs } = input;
  if (accountCreatedAtMs == null || nowMs - accountCreatedAtMs < STORE_REVIEW_MIN_ACCOUNT_AGE_MS) {
    return false;
  }
  if (seasonPosts < STORE_REVIEW_MIN_SEASON_POSTS) return false;
  if (lastRequestedAtMs != null && nowMs - lastRequestedAtMs < STORE_REVIEW_INTERVAL_MS) {
    return false;
  }
  return true;
}

/** 直近の確定結果（`isWin`）と今の連勝から「調子がいい」か */
export function isStoreReviewGoodMoment(input: {
  winStreak: number;
  recentResults: readonly boolean[];
}): boolean {
  if (input.winStreak >= STORE_REVIEW_WIN_STREAK) return true;
  const n = input.recentResults.length;
  if (n < STORE_REVIEW_GOOD_DAY_MIN_SETTLED) return false;
  const wins = input.recentResults.filter(Boolean).length;
  return wins / n >= STORE_REVIEW_GOOD_DAY_WIN_RATE;
}
