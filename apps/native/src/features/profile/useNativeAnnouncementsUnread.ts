/**
 * Web `useAnnouncementsUnread` 相当 — reads は必要 ID だけ getDoc。
 */
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { SYNTHETIC_EVENT_NOTICES } from "../../../../../lib/events/syntheticEventNotices";
import {
  loadAnnouncementReadIdsFor,
  subscribeAnnouncementReadsRefresh,
} from "../../../../../lib/announcements/loadAnnouncementReadIds";

const FETCH_LIMIT = 100;
const ANNOUNCEMENTS_LIMIT = 30;

type SortRow = {
  id: string;
  pinned?: boolean;
  postedAt?: Timestamp | Date | null;
};

function postedAtMillis(v: Timestamp | Date | null | undefined): number {
  if (!v) return 0;
  if (v instanceof Timestamp) return v.toMillis();
  return v.getTime();
}

function sortAnnouncementsByPinnedThenPosted<T extends SortRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const pa = a.pinned ? 1 : 0;
    const pb = b.pinned ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return postedAtMillis(b.postedAt) - postedAtMillis(a.postedAt);
  });
}

function mergeSyntheticIdsIntoVisibleSetNative(
  firestoreTopIds: Set<string>
): Set<string> {
  const out = new Set(firestoreTopIds);
  for (const e of SYNTHETIC_EVENT_NOTICES) {
    if (!e.listInAnnouncements) continue;
    if (firestoreTopIds.has(e.id)) continue;
    out.add(e.id);
  }
  return out;
}

type Options = { enabled?: boolean };

export function useNativeAnnouncementsUnread(
  uid: string | undefined,
  authReady: boolean,
  options: Options = {}
) {
  const { enabled = true } = options;
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !authReady || !uid) return;
    const q = query(
      collection(db, "announcements"),
      where("visible", "==", true),
      limit(FETCH_LIMIT)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: SortRow[] = snap.docs.map((d) => {
          const data = d.data() as {
            pinned?: boolean;
            postedAt?: SortRow["postedAt"];
          };
          return {
            id: d.id,
            pinned: data.pinned,
            postedAt: data.postedAt ?? null,
          };
        });
        const sorted = sortAnnouncementsByPinnedThenPosted(rows);
        const top = sorted.slice(0, ANNOUNCEMENTS_LIMIT);
        setVisibleIds(new Set(top.map((r) => r.id)));
      },
      () => {}
    );
    return () => unsub();
  }, [enabled, authReady, uid]);

  useEffect(() => {
    if (!enabled || !authReady || !uid) {
      setReadIds(new Set());
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const ids = [...mergeSyntheticIdsIntoVisibleSetNative(visibleIds)];
      const next = await loadAnnouncementReadIdsFor(db, uid, ids);
      if (!cancelled) setReadIds(next);
    };
    void refresh();
    const unsubRefresh = subscribeAnnouncementReadsRefresh(() => {
      void refresh();
    });
    return () => {
      cancelled = true;
      unsubRefresh();
    };
  }, [enabled, authReady, uid, visibleIds]);

  const unreadCount = useMemo(() => {
    if (!enabled || !authReady) return 0;
    const ids = mergeSyntheticIdsIntoVisibleSetNative(visibleIds);
    let c = 0;
    ids.forEach((id) => {
      if (!readIds.has(id)) c++;
    });
    return c;
  }, [enabled, authReady, visibleIds, readIds]);

  return { unreadCount, readIds };
}
