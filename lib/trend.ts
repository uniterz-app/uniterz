// trend_cache/games（functions/lib/trend/games.aggregate.js）と整合
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TrendGameEntry = {
  gameId: string;
  league: string;
  score: number;
  raw?: number;
  lastAt?: unknown;
  clicks?: number;
  opens?: number;
  creates?: number;
};

export type TrendCacheGames = {
  updatedAt?: Timestamp | number | { seconds: number; nanoseconds?: number };
  windowHours?: number;
} & Record<string, TrendGameEntry[] | Timestamp | number | undefined>;

export async function fetchTrendCacheGames(): Promise<TrendCacheGames | null> {
  const snap = await getDoc(doc(db, "trend_cache", "games"));
  if (!snap.exists()) return null;
  return snap.data() as TrendCacheGames;
}

/** 指定リーグの上位 n 件（キャッシュ上の並び順のまま） */
export function selectLeagueGames(
  cache: TrendCacheGames | null,
  leagueKey: string,
  limit: number
): TrendGameEntry[] {
  if (!cache || limit <= 0) return [];
  const raw = cache[leagueKey];
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, limit) as TrendGameEntry[];
}

function toDate(v: TrendCacheGames["updatedAt"]): Date | null {
  if (v == null) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === "number" && Number.isFinite(v)) return new Date(v);
  if (typeof v === "object" && v !== null && "seconds" in v) {
    const sec = (v as { seconds: number }).seconds;
    return new Date(sec * 1000);
  }
  return null;
}

/** ヘッダ用の更新日時表示 */
export function toDisplayDatetime(v: TrendCacheGames["updatedAt"]): string {
  const d = toDate(v);
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ja-JP");
}

// --- trend_cache/users（functions/lib/trend/users.aggregate.js）---

export type TrendUser = {
  uid: string;
  displayName: string;
  handle: string;
  photoURL: string;
  currentStreak: number;
  maxStreak: number;
};

export async function fetchTrendUsers(max: number): Promise<TrendUser[]> {
  const snap = await getDoc(doc(db, "trend_cache", "users"));
  if (!snap.exists()) return [];
  const raw = snap.data()?.users;
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, Math.max(0, max)) as TrendUser[];
}

// --- trend_cache/hit_posts_today（functions/lib/trend/hitPosts.aggregate.js）---

export type TrendHitPost = {
  id: string;
  authorUid: string;
  authorHandle: string | null;
  author: { name: string; avatarUrl: string };
  gameId: string;
  league: string;
  prediction?: unknown;
  stats?: { scoreError?: number };
  settledAt?: unknown;
  createdAt?: unknown;
};

export type TrendHitPostsCache = {
  updatedAt?: Timestamp | number | { seconds: number; nanoseconds?: number };
  league?: string;
  window?: string;
  posts: TrendHitPost[];
};

export async function fetchTrendHitPostsToday(): Promise<TrendHitPostsCache | null> {
  const snap = await getDoc(doc(db, "trend_cache", "hit_posts_today"));
  if (!snap.exists()) return null;
  const d = snap.data() as TrendHitPostsCache;
  return {
    ...d,
    posts: Array.isArray(d.posts) ? d.posts : [],
  };
}
