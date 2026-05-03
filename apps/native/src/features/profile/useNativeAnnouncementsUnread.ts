/**
 * Web `useAnnouncementsUnread` のログイン時分岐相当（お知らせ未読数）。
 * lib の `@/` 依存を避け、クエリとソートをローカル実装。
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
import { PLAYOFF_COMPETITION_EVENT } from "../../../../../lib/events/playoffCompetition";

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

function shouldInjectSyntheticEventAnnouncement(firestoreIds: Set<string>): boolean {
  if (!PLAYOFF_COMPETITION_EVENT.listInAnnouncements) return false;
  if (firestoreIds.has(PLAYOFF_COMPETITION_EVENT.id)) return false;
  return true;
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
    const colRef = collection(db, `users/${uid}/reads`);
    const unsub = onSnapshot(colRef, (snap) => {
      const s = new Set<string>();
      snap.forEach((d) => s.add(d.id));
      setReadIds(s);
    });
    return () => unsub();
  }, [enabled, authReady, uid]);

  const unreadCount = useMemo(() => {
    if (!enabled || !authReady) return 0;
    const ids = new Set(visibleIds);
    if (shouldInjectSyntheticEventAnnouncement(visibleIds)) {
      ids.add(PLAYOFF_COMPETITION_EVENT.id);
    }
    let c = 0;
    ids.forEach((id) => {
      if (!readIds.has(id)) c++;
    });
    return c;
  }, [enabled, authReady, visibleIds, readIds]);

  return { unreadCount, readIds };
}
