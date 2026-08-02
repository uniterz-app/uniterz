/**
 * users/{uid}/reads をコレクション丸ごと購読しない。
 * 必要な announcementId だけ getDoc（未読判定・イベントモーダル用）。
 */
import { doc, getDoc, type Firestore } from "firebase/firestore";

const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  at: number;
  knownRead: Set<string>;
  knownUnread: Set<string>;
};

const cacheByUid = new Map<string, CacheEntry>();

export const ANNOUNCEMENT_READS_REFRESH_EVENT =
  "uniterz:announcement-reads-refresh";

export function invalidateAnnouncementReadsCache(uid?: string | null): void {
  if (uid) cacheByUid.delete(uid);
  else cacheByUid.clear();
}

const listeners = new Set<() => void>();

export function subscribeAnnouncementReadsRefresh(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function notifyAnnouncementReadsChanged(uid?: string | null): void {
  invalidateAnnouncementReadsCache(uid);
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent(ANNOUNCEMENT_READS_REFRESH_EVENT, {
        detail: { uid: uid ?? null },
      })
    );
  } catch {
    /* ignore */
  }
}

function getOrCreateCache(uid: string): CacheEntry {
  const hit = cacheByUid.get(uid);
  if (hit && Date.now() - hit.at <= CACHE_TTL_MS) return hit;
  const entry: CacheEntry = {
    at: Date.now(),
    knownRead: new Set(),
    knownUnread: new Set(),
  };
  cacheByUid.set(uid, entry);
  return entry;
}

/** 指定 ID のうち、reads ドキュメントが存在する ID を返す。 */
export async function loadAnnouncementReadIdsFor(
  db: Firestore,
  uid: string,
  announcementIds: readonly string[]
): Promise<Set<string>> {
  const safeUid = uid.trim();
  const unique = [
    ...new Set(
      announcementIds.filter((id) => typeof id === "string" && id.trim())
    ),
  ];
  if (!safeUid || unique.length === 0) return new Set();

  const cache = getOrCreateCache(safeUid);
  const needFetch = unique.filter(
    (id) => !cache.knownRead.has(id) && !cache.knownUnread.has(id)
  );

  if (needFetch.length > 0) {
    const CONCURRENCY = 10;
    for (let i = 0; i < needFetch.length; i += CONCURRENCY) {
      const chunk = needFetch.slice(i, i + CONCURRENCY);
      const snaps = await Promise.all(
        chunk.map((id) => getDoc(doc(db, `users/${safeUid}/reads`, id)))
      );
      snaps.forEach((snap, j) => {
        const id = chunk[j]!;
        if (snap.exists()) cache.knownRead.add(id);
        else cache.knownUnread.add(id);
      });
    }
    cache.at = Date.now();
  }

  return new Set(unique.filter((id) => cache.knownRead.has(id)));
}
