/** 公開お知らせ ID 一覧（one-shot + TTL。continuous onSnapshot を避ける） */

import { getDocs } from "firebase/firestore";
import {
  queryVisibleAnnouncementsNoOrder,
  sortAnnouncementsByPinnedThenPosted,
  VISIBLE_ANNOUNCEMENTS_FETCH_LIMIT,
  type AnnouncementSortRow,
} from "@/lib/announcements/announcementsClientQuery";

const ANNOUNCEMENTS_LIMIT = 30;
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { at: number; ids: Set<string> };

let cache: CacheEntry | null = null;
let inflight: Promise<Set<string>> | null = null;

export async function loadVisibleAnnouncementIds(
  options?: { force?: boolean }
): Promise<Set<string>> {
  const force = options?.force === true;
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return new Set(cache.ids);
  }
  if (!force && inflight) return inflight.then((s) => new Set(s));

  const task = (async () => {
    const snap = await getDocs(
      queryVisibleAnnouncementsNoOrder(VISIBLE_ANNOUNCEMENTS_FETCH_LIMIT)
    );
    const rows: AnnouncementSortRow[] = snap.docs.map((d) => {
      const data = d.data() as {
        pinned?: boolean;
        postedAt?: AnnouncementSortRow["postedAt"];
      };
      return {
        id: d.id,
        pinned: data.pinned,
        postedAt: data.postedAt ?? null,
      };
    });
    const top = sortAnnouncementsByPinnedThenPosted(rows).slice(
      0,
      ANNOUNCEMENTS_LIMIT
    );
    const ids = new Set(top.map((r) => r.id));
    cache = { at: Date.now(), ids };
    return ids;
  })();

  inflight = task;
  try {
    return await task;
  } finally {
    inflight = null;
  }
}

export function invalidateVisibleAnnouncementIdsCache() {
  cache = null;
  inflight = null;
}
