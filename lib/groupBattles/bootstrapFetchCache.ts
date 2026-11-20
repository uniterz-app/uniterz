/**
 * スクワッドバトル bootstrap のクライアント TTL + inflight。
 * remount で毎回フルペイロードを取り直さない。
 */
const BOOTSTRAP_TTL_MS = 45_000;

type CacheEntry<T> = { value: T; at: number };

const fresh = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * キーに閲覧者（uid）を含める。アカウントを切り替えた直後に前のユーザーの
 * 招待・申請・公開スクワッドが 45 秒見えないようにする。
 */
export function groupBattleBootstrapCacheKey(opts: {
  battleId?: string | null;
  period?: string | null;
  label?: string | null;
  weekIndex?: number | null;
  viewerUid?: string | null;
}): string {
  return [
    opts.viewerUid ?? "",
    opts.battleId ?? "",
    opts.period ?? "",
    opts.label ?? "",
    opts.weekIndex ?? "",
  ].join("|");
}

export function peekGroupBattleBootstrapCache<T>(key: string): T | null {
  const hit = fresh.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > BOOTSTRAP_TTL_MS) {
    fresh.delete(key);
    return null;
  }
  return hit.value as T;
}

export function loadGroupBattleBootstrapCache<T>(
  key: string,
  loader: () => Promise<T | null>
): Promise<T | null> {
  const cached = peekGroupBattleBootstrapCache<T>(key);
  if (cached != null) return Promise.resolve(cached);

  const pending = inflight.get(key) as Promise<T | null> | undefined;
  if (pending) return pending;

  const started = loader()
    .then((value) => {
      if (value != null) {
        fresh.set(key, { value, at: Date.now() });
      }
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, started);
  return started;
}

export function invalidateGroupBattleBootstrapCache(key?: string) {
  if (key) {
    fresh.delete(key);
    inflight.delete(key);
    return;
  }
  fresh.clear();
  inflight.clear();
}
