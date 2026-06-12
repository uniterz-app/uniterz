import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SettledPostRow } from "@/lib/profile/profileStreakPostsCompute";
import { enrichSettledPostsFromGames } from "@/lib/profile/enrichSettledPostsFromGames";
import { loadProfileSettledPosts } from "@/lib/profile/profileStreakPostsCache";
import {
  postMatchesProfileStreakScope,
  resolveProfileStreakScopeKey,
  type ProfileStatsStreakContext,
} from "@/lib/profile/profileStreakScope";
import {
  mapDocToPostWithMillis,
  type PostWithMillis,
} from "@/lib/result/result-page-data";
import { getDayRangeInTimeZone, TIMEZONE_JST } from "@/lib/time/zonedTime";

const IN_QUERY_CHUNK = 30;
const TODAY_FETCH_LIMIT = 48;

/** 確定日時が JST の暦日「今日」に含まれるか */
export function isSettledOnJstDay(
  settledAtMs: number,
  now: Date = new Date()
): boolean {
  if (!Number.isFinite(settledAtMs)) return false;
  const { start, end } = getDayRangeInTimeZone(now, TIMEZONE_JST);
  const startMs = start.getTime();
  const endMs = end.getTime();
  return settledAtMs >= startMs && settledAtMs < endMs;
}

export function filterSettledTodayForScope(
  rows: readonly SettledPostRow[],
  ctx: ProfileStatsStreakContext,
  now: Date = new Date()
): SettledPostRow[] {
  const scope = resolveProfileStreakScopeKey(ctx);
  const { start, end } = getDayRangeInTimeZone(now, TIMEZONE_JST);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const out: SettledPostRow[] = [];
  for (const row of rows) {
    if (row.settledAtMs < startMs || row.settledAtMs >= endMs) continue;
    if (
      !postMatchesProfileStreakScope(
        {
          league: row.league,
          seasonPhase: row.seasonPhase,
          wcStage: row.wcStage,
        },
        scope
      )
    ) {
      continue;
    }
    out.push(row);
  }

  out.sort((a, b) => b.settledAtMs - a.settledAtMs);
  return out;
}

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
    league: post.league,
    seasonPhase: raw.seasonPhase,
    wcStage: raw.wcStage,
  };
}

async function fetchPostsByIds(ids: readonly string[]): Promise<PostWithMillis[]> {
  if (ids.length === 0) return [];

  const byId = new Map<string, PostWithMillis>();
  for (let i = 0; i < ids.length; i += IN_QUERY_CHUNK) {
    const chunk = ids.slice(i, i + IN_QUERY_CHUNK);
    const q = query(
      collection(db, "posts"),
      where(documentId(), "in", chunk)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      byId.set(d.id, mapDocToPostWithMillis(d.id, d.data()));
    }
  }

  return ids
    .map((id) => byId.get(id))
    .filter((p): p is PostWithMillis => p != null);
}

async function loadProfileSettledTodayResultPostsFallback(
  uid: string,
  ctx: ProfileStatsStreakContext
): Promise<PostWithMillis[]> {
  const rows = await loadProfileSettledPosts(uid);
  const todayRows = filterSettledTodayForScope(rows, ctx);
  const ids = todayRows.map((r) => r.postId);
  const posts = await fetchPostsByIds(ids);
  return posts.filter((p) => p.status === "final" && p.settledAtMillis != null);
}

/**
 * 本日（JST）に確定した投稿を、プロフィールのリーグ／WC スコープで絞り込み、
 * リザルトカード用の PostWithMillis を返す。
 */
export async function loadProfileSettledTodayResultPosts(
  uid: string,
  ctx: ProfileStatsStreakContext
): Promise<PostWithMillis[]> {
  const { start, end } = getDayRangeInTimeZone(new Date(), TIMEZONE_JST);
  let posts: PostWithMillis[];
  try {
    const q = query(
      collection(db, "posts"),
      where("authorUid", "==", uid),
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
    return loadProfileSettledTodayResultPostsFallback(uid, ctx);
  }

  const rowCandidates = posts
    .map(settledRowFromPost)
    .filter((row): row is SettledPostRow => row != null);
  const enrichedRows = await enrichSettledPostsFromGames(rowCandidates);
  const todayRows = filterSettledTodayForScope(enrichedRows, ctx);
  const visibleIds = new Set(todayRows.map((row) => row.postId));

  return posts
    .filter((post) => visibleIds.has(post.id))
    .sort((a, b) => (b.settledAtMillis ?? 0) - (a.settledAtMillis ?? 0));
}
