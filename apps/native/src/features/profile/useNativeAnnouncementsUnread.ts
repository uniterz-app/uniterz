/**
 * Web `useAnnouncementsUnread` 相当 — 一覧は one-shot + TTL、reads は必要 ID だけ getDoc。
 */
import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { db } from "../../lib/firebase";
import { SYNTHETIC_EVENT_NOTICES } from "../../../../../lib/events/syntheticEventNotices";
import {
  loadAnnouncementReadIdsFor,
  subscribeAnnouncementReadsRefresh,
} from "../../../../../lib/announcements/loadAnnouncementReadIds";
import { loadVisibleAnnouncementIds } from "../../../../../lib/announcements/loadVisibleAnnouncementIds";

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
    let cancelled = false;

    const load = () => {
      void loadVisibleAnnouncementIds().then((ids) => {
        if (!cancelled) setVisibleIds(ids);
      });
    };

    load();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") load();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
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
    const unsub = subscribeAnnouncementReadsRefresh(() => {
      void refresh();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [enabled, authReady, uid, visibleIds]);

  const unreadCount = useMemo(() => {
    if (!enabled || !authReady || !uid) return 0;
    const ids = mergeSyntheticIdsIntoVisibleSetNative(visibleIds);
    let c = 0;
    ids.forEach((id) => {
      if (!readIds.has(id)) c++;
    });
    return c;
  }, [enabled, authReady, uid, visibleIds, readIds]);

  return { unreadCount, visibleIds, readIds };
}
