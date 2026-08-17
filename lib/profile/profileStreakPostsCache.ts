"use client";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { resolvePostListLeague } from "@/lib/leagues";
import { enrichSettledPostsFromGames } from "@/lib/profile/enrichSettledPostsFromGames";
import {
  filterPostsForScope,
  type SettledPostRow,
} from "@/lib/profile/profileStreakPostsCompute";
import type { ProfileStreakScopeKey } from "@/lib/profile/profileStreakScope";

export { computeAllScopeMetrics, type SettledPostRow } from "@/lib/profile/profileStreakPostsCompute";

/** Last20 向け。denorm 未整備時のフォールバック。スコープ落ち余裕を抑えて read 削減 */
const STREAK_FETCH_LIMIT = 40;
const LEGACY_FETCH_LIMIT = 120;
const CACHE_TTL_MS = 5 * 60 * 1000;
/** NBA シーズンスコープ変更時に bump */
const CACHE_VERSION = 6;

type CacheEntry = {
  at: number;
  rows: SettledPostRow[];
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<SettledPostRow[]>>();

function cacheKey(uid: string, fetchLimit: number): string {
  return `${uid}:v${CACHE_VERSION}:n${fetchLimit}`;
}

function settledAtToMs(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "object" && v !== null && "toMillis" in v) {
    const m = (v as { toMillis: () => number }).toMillis();
    return Number.isFinite(m) ? m : null;
  }
  return null;
}

function parseRows(
  docs: { id: string; data: () => Record<string, unknown> }[]
): SettledPostRow[] {
  const rows: SettledPostRow[] = [];
  for (const d of docs) {
    const data = d.data();
    const ms = settledAtToMs(data.settledAt);
    if (ms == null) continue;
    const stats = data.stats as Record<string, unknown> | undefined;
    const iw = stats?.isWin;
    if (typeof iw !== "boolean") continue;
    rows.push({
      postId: d.id,
      gameId: typeof data.gameId === "string" ? data.gameId : null,
      settledAtMs: ms,
      isWin: iw,
      league: resolvePostListLeague({
        league: data.league,
        gameId: data.gameId,
      }),
      seasonPhase: data.seasonPhase,
      wcStage: data.wcStage,
    });
  }
  return rows;
}

async function fetchSettledPostsRaw(
  uid: string,
  fetchLimit: number
): Promise<SettledPostRow[]> {
  const key = cacheKey(uid, fetchLimit);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.rows;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const q = query(
      collection(db, "posts"),
      where("authorUid", "==", uid),
      where("schemaVersion", "==", 2),
      orderBy("settledAt", "desc"),
      limit(fetchLimit)
    );
    const snap = await getDocs(q);
    const rows = parseRows(snap.docs);
    cache.set(key, { at: Date.now(), rows });
    inflight.delete(key);
    return rows;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } catch (e) {
    inflight.delete(key);
    throw e;
  }
}

/**
 * 全スコープ集計など向け。必要なら games 補完あり。
 */
export async function loadProfileSettledPosts(
  uid: string
): Promise<SettledPostRow[]> {
  const rows = await fetchSettledPostsRaw(uid, LEGACY_FETCH_LIMIT);
  return enrichSettledPostsFromGames(rows, db);
}

/**
 * Last20 Tracker 向け: 読み取り数を抑え、スコープに足りるなら games 補完をスキップ。
 */
export async function loadProfileSettledPostsForStreakScope(
  uid: string,
  scopeKey: ProfileStreakScopeKey,
  lastN: number
): Promise<SettledPostRow[]> {
  const rows = await fetchSettledPostsRaw(uid, STREAK_FETCH_LIMIT);
  const withoutEnrich = filterPostsForScope(rows, scopeKey, lastN);
  if (withoutEnrich.length >= lastN) {
    return withoutEnrich;
  }

  const enriched = await enrichSettledPostsFromGames(rows, db);
  return filterPostsForScope(enriched, scopeKey, lastN);
}
