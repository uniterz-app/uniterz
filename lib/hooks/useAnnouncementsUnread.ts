"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  queryVisibleAnnouncementsNoOrder,
  sortAnnouncementsByPinnedThenPosted,
  VISIBLE_ANNOUNCEMENTS_FETCH_LIMIT,
  type AnnouncementSortRow,
} from "@/lib/announcements/announcementsClientQuery";
import { isAuthStateResolved, useFirebaseUser } from "@/lib/useFirebaseUser";
import { mergeSyntheticIdsIntoVisibleSet } from "@/lib/announcements/inAppEventAnnouncement";
import {
  ANNOUNCEMENT_READ_IDS_STORAGE_KEY,
  ANNOUNCEMENT_READS_CHANGED_EVENT,
  getLocalAnnouncementReadIds,
} from "@/lib/announcements/localAnnouncementReads";

const ANNOUNCEMENTS_LIMIT = 30;

type Options = {
  /** false のとき購読しない（未読は常に 0） */
  enabled?: boolean;
};

/**
 * Firestore お知らせ＋アプリ内合成イベントの未読件数。
 * ログイン: users/{uid}/reads と突合。ゲスト: localStorage の既読 ID と突合。
 */
export function useAnnouncementsUnread(options: Options = {}) {
  const { enabled = true } = options;
  const { fUser: user, status } = useFirebaseUser();
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !isAuthStateResolved(status)) return;
    const q = queryVisibleAnnouncementsNoOrder(VISIBLE_ANNOUNCEMENTS_FETCH_LIMIT);
    const unsub = onSnapshot(
      q,
      (snap) => {
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
        const sorted = sortAnnouncementsByPinnedThenPosted(rows);
        const top = sorted.slice(0, ANNOUNCEMENTS_LIMIT);
        setVisibleIds(new Set(top.map((r) => r.id)));
      },
      (err) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[useAnnouncementsUnread] announcements 購読エラー", err);
        }
      }
    );
    return () => unsub();
  }, [enabled, status]);

  useEffect(() => {
    if (!enabled || !isAuthStateResolved(status)) {
      setReadIds(new Set());
      return;
    }
    if (user?.uid) {
      const colRef = collection(db, `users/${user.uid}/reads`);
      const unsub = onSnapshot(colRef, (snap) => {
        const s = new Set<string>();
        snap.forEach((d) => s.add(d.id));
        setReadIds(s);
      });
      return () => unsub();
    }
    const sync = () => setReadIds(getLocalAnnouncementReadIds());
    sync();
    const onCustom = () => sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === ANNOUNCEMENT_READ_IDS_STORAGE_KEY) sync();
    };
    window.addEventListener(ANNOUNCEMENT_READS_CHANGED_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ANNOUNCEMENT_READS_CHANGED_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [enabled, status, user?.uid]);

  const unreadCount = useMemo(() => {
    if (!enabled || !isAuthStateResolved(status)) return 0;
    const ids = mergeSyntheticIdsIntoVisibleSet(visibleIds);
    let c = 0;
    ids.forEach((id) => {
      if (!readIds.has(id)) c++;
    });
    return c;
  }, [enabled, status, visibleIds, readIds]);

  return { unreadCount, visibleIds, readIds };
}
