// app/lib/trend.ts
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";

/* ============================================================
   ▼▼ Game Trend（既存ロジックはそのまま）▼▼
   ============================================================ */

export type TrendGame = {
  gameId: string;
  league: "NBA" | "B1" | "J1" | "PL";
  score: number;
  raw: number;
  clicks: number;
  opens: number;
  creates: number;
  lastAt?: Timestamp;
};

export type TrendCacheGames = {
  updatedAt?: Timestamp;
  windowHours: number;
  B1?: TrendGame[];
  J1?: TrendGame[];
  NBA?: TrendGame[];
  PL?: TrendGame[];
};

export async function fetchTrendCacheGames(): Promise<TrendCacheGames | null> {
  const ref = doc(db, "trend_cache", "games");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as any;

  return {
    updatedAt: data?.updatedAt,
    windowHours: Number(data?.windowHours ?? 72),
    B1: Array.isArray(data?.B1) ? data.B1 : [],
    J1: Array.isArray(data?.J1) ? data.J1 : [],
    NBA: Array.isArray(data?.NBA) ? data.NBA : [],
    PL: Array.isArray(data?.PL) ? data.PL : [],
  };
}

export function pickTopPerLeague(cache: TrendCacheGames, n = 1) {
  return {
    NBA: (cache.NBA ?? []).slice(0, n),
    B1: (cache.B1 ?? []).slice(0, n),
    J1: (cache.J1 ?? []).slice(0, n),
    PL: (cache.PL ?? []).slice(0, n),
  };
}

export type UICardGame = {
  gameId: string;
  league: "NBA" | "B1" | "J1" | "PL",
  clickCount: number;
  viewCount: number;
  predictCount: number;
  updatedAt: number;
};

export function selectLeagueGames(
  cache: TrendCacheGames | null,
  league: "NBA" | "B1" | "J1" | "PL",
  limit = 10
): UICardGame[] {
  if (!cache) return [];

  const rawArr = (cache[league] ?? []) as TrendGame[];

  return rawArr
    .map((g) => ({
      gameId: String(g.gameId),
      league,
      clickCount: Number(g.clicks ?? 0),
      viewCount: Number(g.opens ?? 0),
      predictCount: Number(g.creates ?? 0),
      updatedAt: g.lastAt
        ? (typeof g.lastAt.toMillis === "function" ? g.lastAt.toMillis() : Number(g.lastAt))
        : (typeof cache.updatedAt?.toMillis === "function"
            ? cache.updatedAt.toMillis()
            : Date.now()),
    }))
    .sort(
      (a, b) =>
        b.predictCount - a.predictCount ||
        b.updatedAt - a.updatedAt
    )
    .slice(0, limit);
}

export function pickTopGameIdByScore(
  cache: TrendCacheGames | null,
  league: "NBA" | "B1" | "J1" | "PL"
): string | null {
  if (!cache) return null;
  const arr = cache[league] ?? [];
  if (!arr.length) return null;
  return String(arr[0].gameId ?? "") || null;
}

export function toDisplayDatetime(ts?: Timestamp | null): string | null {
  if (!ts) return null;
  const ms = typeof ts.toMillis === "function" ? ts.toMillis() : Number(ts);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleString();
}

/* ============================================================
   ▼▼ User Trend（V2：連勝専用）▼▼
   ============================================================ */

export type TrendUser = {
  uid: string;
  displayName: string;
  handle: string;
  photoURL?: string;

  currentStreak: number;
  maxStreak: number;
};

export async function fetchTrendUsers(max: number = 12): Promise<TrendUser[]> {
  try {
    const ref = doc(db, "trend_cache", "users");
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data() as { users?: TrendUser[] };
      return (data.users ?? []).slice(0, max);
    }
  } catch (e) {
    console.warn("fetchTrendUsers: read failed", e);
  }

  return [];
}

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "m";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

/* ============================================================
   ▼▼ Hit Posts Trend（当日NBA・20:00集計）▼▼
   ============================================================ */

import type { PredictionPostV2 } from "@/types/prediction-post-v2";

export async function fetchTrendHitPosts(
  limit: number = 10
): Promise<PredictionPostV2[]> {
  try {
    const ref = doc(db, "trend_cache", "hit_posts_today");
    const snap = await getDoc(ref);

    if (!snap.exists()) return [];

    const data = snap.data() as any;

    // ★ game JOIN を削除。trend_cache の完成データをそのまま返す
    const posts = Array.isArray(data.posts) ? data.posts.slice(0, limit) : [];

    return posts as PredictionPostV2[];
  } catch (e) {
    console.warn("fetchTrendHitPosts failed", e);
    return [];
  }
}
