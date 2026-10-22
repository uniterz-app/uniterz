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
 * 同時に終わった試合は別々に確定するので、確定時刻が数秒前後して連勝の順と逆転しうる。
 * 同じ分に確定したものは同時とみなし、連勝で並べる。
 */
const SETTLED_SAME_BUCKET_MS = 60_000;

function settledBucket(post: PostWithMillis): number | null {
  const ms = post.settledAtMillis;
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return null;
  return Math.floor(ms / SETTLED_SAME_BUCKET_MS);
}

/**
 * リザルト一覧・プロフィール Result Drop の同一日付バケット内ソート。
 * 1. 確定済みは確定が新しい順（連勝が上から 5,4,3… と読める）
 * 2. 同じ分に確定したものは連勝の高い順（activeWinStreak 降順）
 * 3. 未確定はキックオフが遅い試合を上
 * 4. 同点は gameId 降順
 */
export function compareResultPostsForDayList(
  a: PostWithMillis,
  b: PostWithMillis
): number {
  const as = settledBucket(a);
  const bs = settledBucket(b);
  if (as != null && bs != null) {
    if (as !== bs) return bs - as;
    const streakDiff = readPostActiveWinStreak(b) - readPostActiveWinStreak(a);
    if (streakDiff !== 0) return streakDiff;
  } else if (as != null || bs != null) {
    return as != null ? -1 : 1;
  }

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
