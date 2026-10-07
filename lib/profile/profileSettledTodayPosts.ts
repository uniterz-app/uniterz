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
import { sortResultPostsForDisplay } from "@/lib/result/resultPostDaySort";
import { nbaSlateDayRange } from "@/lib/games/latestNbaSlate";

const IN_QUERY_CHUNK = 30;
const SLATE_FETCH_LIMIT = 48;

export function filterSettledRowsForScope(
  rows: readonly SettledPostRow[],
  ctx: ProfileStatsStreakContext
): SettledPostRow[] {
  const scope = resolveProfileStreakScopeKey(ctx);
  return rows.filter((row) => postMatchesProfileStreakScope(row, scope));
}

/** 確定済みで、試合開始が試合日（米国東部）の範囲に入る投稿 */
export function isSettledPostInSlate(
  post: { status?: unknown; settledAtMillis?: number | null; startAtMillis?: number | null },
  range: { start: Date; end: Date }
): boolean {
  if (post.status !== "final" || post.settledAtMillis == null) return false;
  const startMs = post.startAtMillis;
  if (typeof startMs !== "number" || !Number.isFinite(startMs)) return false;
  return startMs >= range.start.getTime() && startMs < range.end.getTime();
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

/**
 * 最新の NBA 試合日（米国東部の暦日）に始まった試合の確定投稿を、
 * プロフィールのリーグ／WC スコープで絞り込み、リザルトカード用の PostWithMillis を返す。
 *
 * 試合日の試合は試合日 0:00（東部）以降に確定するので settledAt >= 試合日開始で引き、
 * 試合開始時刻で試合日に絞る。
 */
export async function loadProfileSettledTodayResultPosts(
  uid: string,
  ctx: ProfileStatsStreakContext,
  slateDateKey: string
): Promise<PostWithMillis[]> {
  const range = nbaSlateDayRange(slateDateKey);
  if (!range) return [];
  const startMs = range.start.getTime();

  // 連勝キャッシュ（5分 TTL・直近 40 件）があれば候補をそこから取り、posts 再クエリを避ける
  try {
    const cachedRows = await loadProfileSettledPosts(uid);
    if (cachedRows.length > 0) {
      const newest = cachedRows[0]?.settledAtMs ?? 0;
      if (newest < startMs) return [];
      // 試合日より前の確定まで入っていれば、試合日分はキャッシュに全部ある
      if (cachedRows.some((r) => r.settledAtMs < startMs)) {
        const candidates = filterSettledRowsForScope(
          cachedRows.filter((r) => r.settledAtMs >= startMs),
          ctx
        );
        const posts = await fetchPostsByIds(candidates.map((r) => r.postId));
        return sortResultPostsForDisplay(
          posts.filter((p) => isSettledPostInSlate(p, range))
        );
      }
    }
  } catch {
    /* fall through */
  }

  const q = query(
    collection(db, "posts"),
    where("authorUid", "==", uid),
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

  return sortResultPostsForDisplay(
    posts.filter((post) => visibleIds.has(post.id))
  );
}
