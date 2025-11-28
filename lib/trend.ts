// app/lib/trend.ts
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  Timestamp,
  // ▼ 追記: ユーザー用フォールバック取得に必要
  collection,
  getDocs,
  query,
  orderBy,
  limit as fsLimit,
} from "firebase/firestore";

/**
 * Firestore 保存形式（CFが書くそのまま）
 */
export type TrendGame = {
  gameId: string;
  league: "B1" | "J1" | string; // 入力は string 許容（念のため）
  score: number;
  raw: number;
  clicks: number;   // ← UIでは clickCount にマップ
  opens: number;    // ← UIでは viewCount にマップ
  creates: number;  // ← UIでは predictCount にマップ
  lastAt?: Timestamp;
};

export type TrendCacheGames = {
  updatedAt?: Timestamp;     // 集計実行時刻
  windowHours: number;       // 集計窓
  B1?: TrendGame[];
  J1?: TrendGame[];
};

/**
 * Firestore から trend_cache/games を1回取得（未存在なら null）
 */
export async function fetchTrendCacheGames(): Promise<TrendCacheGames | null> {
  const ref = doc(db, "trend_cache", "games");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;

  // 最低限の型整形（undefined 安全化）
  return {
    updatedAt: data?.updatedAt,
    windowHours: Number(data?.windowHours ?? 72),
    B1: Array.isArray(data?.B1) ? (data.B1 as TrendGame[]) : [],
    J1: Array.isArray(data?.J1) ? (data.J1 as TrendGame[]) : [],
  };
}

/**
 * シンプル: 各リーグの先頭 n 件をそのまま返す（加工無し）
 * 既存の呼び出し互換のため残す
 */
export function pickTopPerLeague(cache: TrendCacheGames, n = 1) {
  const topB1 = (cache.B1 ?? []).slice(0, n);
  const topJ1 = (cache.J1 ?? []).slice(0, n);
  return { topB1, topJ1 };
}

/**
 * ─────────────────────────────────────────────
 * ここから UI 向けの薄いアダプタ（追加分）
 * Firestore のフィールド名を UI 用に揃えるだけ。DBは変更しない。
 * ─────────────────────────────────────────────
 */
export type UICardGame = {
  gameId: string;
  league: "B1" | "J1";
  clickCount: number;    // = clicks
  viewCount: number;     // = opens
  predictCount: number;  // = creates
  updatedAt: number;     // epoch ms（lastAt or cache.updatedAt）
};

/**
 * 指定リーグの配列を UI 向けに整形して返す
 * - フィールド名変換（clicks→clickCount 等）
 * - Timestamp → epoch ms
 * - 並び順: predictCount desc → updatedAt desc
 */
export function selectLeagueGames(
  cache: TrendCacheGames | null,
  league: "B1" | "J1",
  limit = 10
): UICardGame[] {
  if (!cache) return [];
  const rawArr = (cache[league] ?? []) as TrendGame[];

  return rawArr
    .map((g) => ({
      gameId: String(g.gameId ?? ""),
      league: (league as "B1" | "J1"),
      clickCount: Number(g.clicks ?? 0),
      viewCount: Number(g.opens ?? 0),
      predictCount: Number(g.creates ?? 0),
      updatedAt: g.lastAt
        ? (typeof (g.lastAt as any)?.toMillis === "function"
            ? (g.lastAt as any).toMillis()
            : Number(g.lastAt))
        : (typeof (cache.updatedAt as any)?.toMillis === "function"
            ? (cache.updatedAt as any).toMillis()
            : Date.now()),
    }))
    .sort(
      (a, b) =>
        (b.predictCount - a.predictCount) ||
        (b.updatedAt - a.updatedAt)
    )
    .slice(0, limit);
}

/**
 * ★ 追加：score（CFの並び）を信頼して「各リーグの先頭1件の gameId」だけ返す
 *  - 並び替えは一切しない（＝CFの score 降順そのままを採用）
 */
export function pickTopGameIdByScore(
  cache: TrendCacheGames | null,
  league: "B1" | "J1"
): string | null {
  if (!cache) return null;
  const arr = (cache[league] ?? []) as TrendGame[];
  if (!arr.length) return null;
  const id = String(arr[0].gameId ?? "");
  return id || null;
}

/**
 * UI 用の最終更新表示に使うヘルパ（任意）
 */
export function toDisplayDatetime(ts?: Timestamp | null): string | null {
  if (!ts) return null;
  const ms =
    typeof (ts as any)?.toMillis === "function"
      ? (ts as any).toMillis()
      : Number(ts);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleString();
}

/* ============================================================
   ▼▼ ここから「Trend Users」用の追記（既存ロジックは変更しない）▼▼
   ============================================================ */

export type TrendUser = {
  uid: string;
  displayName: string;
  handle: string;
  photoURL?: string;
  score?: number;
  counts?: { posts?: number; followers?: number; following?: number };
};

/** 1. 12人ぶんを trend_cache/users → fallback: users から取得 */
export async function fetchTrendUsers(max: number = 12): Promise<TrendUser[]> {
  // 1) キャッシュ: trend_cache/users（単一ドキュメントに { users: TrendUser[] } を想定）
  try {
    const ref = doc(db, "trend_cache", "users");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as { users?: TrendUser[] };
      return (data?.users ?? []).slice(0, max);
    }
  } catch (e) {
    console.warn("fetchTrendUsers: trend_cache/users read failed -> fallback", e);
  }

  // 2) フォールバック: users コレクションを followers desc, posts desc で取得
  try {
    const usersRef = collection(db, "users");
    const qUsers = query(
      usersRef,
      orderBy("counts.followers", "desc"),
      orderBy("counts.posts", "desc"),
      fsLimit(max)
    );
    const qs = await getDocs(qUsers);
    const arr: TrendUser[] = [];
    qs.forEach((d) => {
      const v = d.data() as any;
      arr.push({
        uid: d.id,
        displayName: v.displayName ?? "",
        handle: v.handle ?? d.id,
        photoURL: v.photoURL ?? undefined,
        counts: v.counts ?? {},
      });
    });
    return arr;
  } catch (e) {
    console.error("fetchTrendUsers fallback error", e);
    return [];
  }
}

/** 2. 数字の簡易フォーマット（1.2k / 3.1m） */
export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0) + "m";
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 ? 1 : 0) + "k";
  return String(n);
}
