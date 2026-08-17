"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { isAuthStateResolved, useFirebaseUser } from "@/lib/useFirebaseUser";
import { mergeSyntheticIdsIntoVisibleSet } from "@/lib/announcements/inAppEventAnnouncement";
import {
  ANNOUNCEMENT_READ_IDS_STORAGE_KEY,
  ANNOUNCEMENT_READS_CHANGED_EVENT,
  getLocalAnnouncementReadIds,
} from "@/lib/announcements/localAnnouncementReads";
import {
  ANNOUNCEMENT_READS_REFRESH_EVENT,
  loadAnnouncementReadIdsFor,
} from "@/lib/announcements/loadAnnouncementReadIds";
import { loadVisibleAnnouncementIds } from "@/lib/announcements/loadVisibleAnnouncementIds";

type Options = {
  /** false のとき取得しない（未読は常に 0） */
  enabled?: boolean;
};

/**
 * Firestore お知らせ＋アプリ内合成イベントの未読件数。
 * 一覧は one-shot + TTL。reads は必要 ID だけ getDoc。
 */
export function useAnnouncementsUnread(options: Options = {}) {
  const { enabled = true } = options;
  const { fUser: user, status } = useFirebaseUser();
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !isAuthStateResolved(status)) return;
    let cancelled = false;

    const load = (force = false) => {
      void loadVisibleAnnouncementIds({ force }).then((ids) => {
        if (!cancelled) setVisibleIds(ids);
      });
    };

    load(false);

    const onVisible = () => {
      if (document.visibilityState === "visible") load(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, status]);

  useEffect(() => {
    if (!enabled || !isAuthStateResolved(status)) {
      setReadIds(new Set());
      return;
    }

    if (!user?.uid) {
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
    }

    const uid = user.uid;
    let cancelled = false;

    const refresh = async () => {
      const ids = [...mergeSyntheticIdsIntoVisibleSet(visibleIds)];
      const next = await loadAnnouncementReadIdsFor(db, uid, ids);
      if (!cancelled) setReadIds(next);
    };

    void refresh();

    const onRefresh = () => {
      void refresh();
    };
    window.addEventListener(ANNOUNCEMENT_READS_REFRESH_EVENT, onRefresh);
    window.addEventListener(ANNOUNCEMENT_READS_CHANGED_EVENT, onRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener(ANNOUNCEMENT_READS_REFRESH_EVENT, onRefresh);
      window.removeEventListener(ANNOUNCEMENT_READS_CHANGED_EVENT, onRefresh);
    };
  }, [enabled, status, user?.uid, visibleIds]);

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
