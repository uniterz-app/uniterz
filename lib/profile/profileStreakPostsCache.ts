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
import { enrichSettledPostsFromGames } from "@/lib/profile/enrichSettledPostsFromGames";
import {
  computeAllScopeMetrics,
  type SettledPostRow,
} from "@/lib/profile/profileStreakPostsCompute";

export { computeAllScopeMetrics, type SettledPostRow } from "@/lib/profile/profileStreakPostsCompute";

const FETCH_LIMIT = 400;
const CACHE_TTL_MS = 5 * 60 * 1000;
/** ゲーム補完ロジック変更時に bump */
const CACHE_VERSION = 2;

type CacheEntry = {
  at: number;
  rows: SettledPostRow[];
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<SettledPostRow[]>>();

function cacheKey(uid: string): string {
  return `${uid}:v${CACHE_VERSION}`;
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
      league: data.league,
      seasonPhase: data.seasonPhase,
      wcStage: data.wcStage,
    });
  }
  return rows;
}

export async function loadProfileSettledPosts(
  uid: string
): Promise<SettledPostRow[]> {
  const key = cacheKey(uid);
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
      limit(FETCH_LIMIT)
    );
    const snap = await getDocs(q);
    const parsed = parseRows(snap.docs);
    const rows = await enrichSettledPostsFromGames(parsed);
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
