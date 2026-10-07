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
  filterSettledRowsForScope,
  isSettledPostInSlate,
} from "../../../../../lib/profile/profileSettledTodayPosts";
import { nbaSlateDayRange } from "../../../../../lib/games/latestNbaSlate";
import type { SettledPostRow } from "../../../../../lib/profile/profileStreakPostsCompute";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import { sortResultPostsForDisplay } from "../../../../../lib/result/resultPostDaySort";
import type { PostWithMillis as LibPostWithMillis } from "../../../../../lib/result/result-page-data";
import { db } from "../../lib/firebase";
import {
  mapDocToPostWithMillis,
  type PostWithMillis,
} from "../results/nativeResultModel";

const SLATE_FETCH_LIMIT = 48;
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
 * 最新の NBA 試合日（米国東部の暦日）に始まった試合の確定投稿を、プロフィールのリーグ／WC スコープで絞り込み。
 */
export async function loadProfileSettledTodayResultPostsNative(
  uid: string,
  ctx: ProfileStatsStreakContext,
  slateDateKey: string
): Promise<PostWithMillis[]> {
  const safeUid = uid.trim();
  if (!safeUid) return [];
  const range = nbaSlateDayRange(slateDateKey);
  if (!range) return [];

  const q = query(
    collection(db, "posts"),
    where("authorUid", "==", safeUid),
    where("schemaVersion", "==", 2),
    where("settledAt", ">=", Timestamp.fromDate(range.start)),
    orderBy("settledAt", "desc"),
    limit(SLATE_FETCH_LIMIT)
  );
  const snap = await getDocs(q);
  const posts = snap.docs
    .map((d) => mapDocToPostWithMillis(d.id, d.data()))
    .filter((p) => isSettledPostInSlate(p, range));

  const rowCandidates = posts
    .map(settledRowFromPost)
    .filter((row): row is SettledPostRow => row != null);
  const enrichedRows = await enrichSettledPostsFromGames(rowCandidates, db);
  const visibleIds = new Set(
    filterSettledRowsForScope(enrichedRows, ctx).map((row) => row.postId)
  );

  return sortSettledTodayPosts(posts.filter((post) => visibleIds.has(post.id)));
}
