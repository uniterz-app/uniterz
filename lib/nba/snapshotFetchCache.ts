"use client";

/**
 * 共有スナップショット（`/api/nba/*`）用の TTL キャッシュ + 同時リクエスト dedupe。
 *
 * 同じ画面の複数コンポーネントが同じ公開 API を叩くため（検索バーと各パネル）、
 * フック単位で fetch するとリクエストが 2〜3 倍になる。season をキーに 1 本へまとめる。
 *
 * AbortSignal は受け取らない: 1 コンポーネントのアンマウントで、
 * 他が待っている共有リクエストを中断させないため。
 *
 * `T` に null を入れないこと（`peek` の miss と区別できない）。
 */
export type SnapshotFetchCache<T> = {
  /** 有効期限内の値。無ければ null */
  peek: (key: string) => T | null;
  /** キャッシュ → 進行中リクエスト → loader の順に解決 */
  load: (key: string, loader: () => Promise<T>) => Promise<T>;
  /** key 省略で全消去 */
  invalidate: (key?: string) => void;
};

export function createSnapshotFetchCache<T>(
  ttlMs: number
): SnapshotFetchCache<T> {
  const fresh = new Map<string, { value: T; at: number }>();
  const inflight = new Map<string, Promise<T>>();

  function peek(key: string): T | null {
    const hit = fresh.get(key);
    if (!hit) return null;
    if (Date.now() - hit.at > ttlMs) {
      fresh.delete(key);
      return null;
    }
    return hit.value;
  }

  function load(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = peek(key);
    if (cached !== null) return Promise.resolve(cached);

    const pending = inflight.get(key);
    if (pending) return pending;

    const started = loader()
      .then((value) => {
        fresh.set(key, { value, at: Date.now() });
        return value;
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, started);
    return started;
  }

  function invalidate(key?: string): void {
    if (key == null) {
      fresh.clear();
      return;
    }
    fresh.delete(key);
  }

  return { peek, load, invalidate };
}

/** リーグ表・リーダーボードは ingest が日次なので画面遷移をまたいで再利用してよい */
export const NBA_SNAPSHOT_CACHE_TTL_MS = 5 * 60 * 1000;

export function nbaSnapshotCacheKey(
  apiBaseUrl: string | null | undefined,
  season: string
): string {
  return `${(apiBaseUrl ?? "").trim()}|${season}`;
}
