/**
 * Web `lib/profile/profileSettledTodayPosts.ts` 相当（Native Firestore）。
 */
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { enrichSettledPostsFromGames } from "../../../../../lib/profile/enrichSettledPostsFromGames";
import {
  filterSettledTodayForScope,
} from "../../../../../lib/profile/profileSettledTodayPosts";
import type { SettledPostRow } from "../../../../../lib/profile/profileStreakPostsCompute";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import { sortResultPostsForDisplay } from "../../../../../lib/result/resultPostDaySort";
import type { PostWithMillis as LibPostWithMillis } from "../../../../../lib/result/result-page-data";
import { getDayRangeInTimeZone, TIMEZONE_JST } from "../../../../../lib/time/zonedTime";
import { db } from "../../lib/firebase";
import {
  mapDocToPostWithMillis,
  type PostWithMillis,
} from "../results/nativeResultModel";

const TODAY_FETCH_LIMIT = 48;
/** モバイルプロフィール表示上限（Web mobile と同じ） */
export const NATIVE_SETTLED_TODAY_MAX = 6;

function settledRowFromPost(post: PostWithMillis): SettledPostRow | null {
  const raw = post as PostWithMillis & Record<string, unknown>;
  const settledAtMs = post.settledAtMillis;
  const isWin = (post.stats as { isWin?: unknown } | undefined)?.isWin;
  if (typeof settledAtMs !== "number" || !Number.isFinite(settledAtMs)) {
    return null;
  }
  if (typeof isWin !== "boolean") return null;
  return {
    postId: post.id,
    gameId: typeof post.gameId === "string" ? post.gameId : null,
    settledAtMs,
    isWin,
    league: post.league as string | null | undefined,
    seasonPhase: raw.seasonPhase,
    wcStage: raw.wcStage,
  };
}

function sortSettledTodayPosts(posts: PostWithMillis[]): PostWithMillis[] {
  return sortResultPostsForDisplay(
    posts as unknown as LibPostWithMillis[]
  ) as unknown as PostWithMillis[];
}

/**
 * 本日（JST）に確定した投稿を、プロフィールのリーグ／WC スコープで絞り込み。
 */
export async function loadProfileSettledTodayResultPostsNative(
  uid: string,
  ctx: ProfileStatsStreakContext
): Promise<PostWithMillis[]> {
  const safeUid = uid.trim();
  if (!safeUid) return [];

  const { start, end } = getDayRangeInTimeZone(new Date(), TIMEZONE_JST);
  let posts: PostWithMillis[];
  try {
    const q = query(
      collection(db, "posts"),
      where("authorUid", "==", safeUid),
      where("schemaVersion", "==", 2),
      where("settledAt", ">=", Timestamp.fromDate(start)),
      where("settledAt", "<", Timestamp.fromDate(end)),
      orderBy("settledAt", "desc"),
      limit(TODAY_FETCH_LIMIT)
    );
    const snap = await getDocs(q);
    posts = snap.docs
      .map((d) => mapDocToPostWithMillis(d.id, d.data()))
      .filter((p) => p.status === "final" && p.settledAtMillis != null);
  } catch {
    return [];
  }

  const rowCandidates = posts
    .map(settledRowFromPost)
    .filter((row): row is SettledPostRow => row != null);
  const enrichedRows = await enrichSettledPostsFromGames(rowCandidates, db);
  const todayRows = filterSettledTodayForScope(enrichedRows, ctx);
  const visibleIds = new Set(todayRows.map((row) => row.postId));

  return sortSettledTodayPosts(posts.filter((post) => visibleIds.has(post.id)));
}
