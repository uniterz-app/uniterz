import type { PostWithMillis } from "./result-page-data";

export function readPostActiveWinStreak(post: PostWithMillis): number {
  const stats = post.stats as
    | { pointsV3Detail?: { activeWinStreak?: unknown } }
    | undefined;
  const v = stats?.pointsV3Detail?.activeWinStreak;
  return typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.floor(v))
    : 0;
}

/**
 * リザルト一覧の同一日付バケット内ソート。
 * 1. キックオフが遅い試合を上
 * 2. 同時キックオフは連勝の高い順（activeWinStreak 降順）
 * 3. 同点は gameId 降順
 */
export function compareResultPostsForDayList(
  a: PostWithMillis,
  b: PostWithMillis
): number {
  const ae = a.startAtMillis ?? a.createdAtMillis ?? 0;
  const be = b.startAtMillis ?? b.createdAtMillis ?? 0;
  if (ae !== be) return be - ae;

  const streakDiff = readPostActiveWinStreak(b) - readPostActiveWinStreak(a);
  if (streakDiff !== 0) return streakDiff;

  return String(b.gameId ?? "").localeCompare(String(a.gameId ?? ""));
}

/** リザルト一覧・プロフィール確定投稿など、表示用の並び替え */
export function sortResultPostsForDisplay(
  posts: readonly PostWithMillis[]
): PostWithMillis[] {
  return [...posts].sort(compareResultPostsForDayList);
}
