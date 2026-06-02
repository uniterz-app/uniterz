import {
  collection,
  documentId,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SettledPostRow } from "@/lib/profile/profileStreakPostsCompute";
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
 * 本日（JST）に確定した投稿を、プロフィールのリーグ／WC スコープで絞り込み、
 * リザルトカード用の PostWithMillis を返す。
 */
export async function loadProfileSettledTodayResultPosts(
  uid: string,
  ctx: ProfileStatsStreakContext
): Promise<PostWithMillis[]> {
  const rows = await loadProfileSettledPosts(uid);
  const todayRows = filterSettledTodayForScope(rows, ctx);
  const ids = todayRows.map((r) => r.postId);
  const posts = await fetchPostsByIds(ids);
  return posts.filter((p) => p.status === "final" && p.settledAtMillis != null);
}
