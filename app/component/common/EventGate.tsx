// app/component/common/EventGate.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import EventModal from "@/app/component/modals/EventModal";
import { EVENT_MODAL_QUEUE } from "@/lib/events/syntheticEventNotices";
import type { EventNoticeContent } from "@/lib/events/eventNoticeTypes";
import { usePathname } from "next/navigation";
import { isPublicLpPath } from "@/lib/lp/publicLpPaths";
import { isAuthEntryRoute } from "@/lib/profileSetupRoute";
import { normalizeLanguage } from "@/lib/i18n/language";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { subscribeUserDocLive } from "@/lib/user/subscribeUserDocLive";
import { subscribeAppTutorialBlockingEvents } from "@/lib/tutorial/tutorialBlockingEvents";
import {
  ANNOUNCEMENT_READS_REFRESH_EVENT,
  loadAnnouncementReadIdsFor,
  notifyAnnouncementReadsChanged,
} from "@/lib/announcements/loadAnnouncementReadIds";

const eventSeenStorageKey = (id: string) => `event_seen_${id}`;

export default function EventGate() {
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [readsReady, setReadsReady] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const [tutorialBlocking, setTutorialBlocking] = useState(false);
  const [displayEvent, setDisplayEvent] = useState<EventNoticeContent | null>(
    null
  );
  const pendingReadIdsRef = useRef<Set<string>>(new Set());
  const pathname = usePathname();
  const isPublicLp = isPublicLpPath(pathname);
  const { language, loading: languageLoading } = useUserLanguage(uid);

  useEffect(() => {
    if (isPublicLp) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return () => unsub();
  }, [isPublicLp]);

  useEffect(() => {
    if (isPublicLp) return;
    if (!uid) {
      setOnboardingComplete(false);
      return;
    }
    return subscribeUserDocLive(uid, (d) => {
      const lang = d?.language;
      const handle = d?.handle || d?.slug || d?.username;
      const ok = normalizeLanguage(lang) !== null && Boolean(handle);
      setOnboardingComplete(ok);
    });
  }, [isPublicLp, uid]);

  useEffect(() => {
    if (!uid) {
      setMigrationDone(true);
      return;
    }
    setMigrationDone(false);
    let cancelled = false;
    (async () => {
      try {
        if (typeof window === "undefined") return;
        for (const ev of EVENT_MODAL_QUEUE) {
          const key = eventSeenStorageKey(ev.id);
          if (!window.localStorage.getItem(key)) continue;
          await setDoc(
            doc(db, `users/${uid}/reads`, ev.id),
            { at: serverTimestamp() },
            { merge: true }
          );
          try {
            window.localStorage.removeItem(key);
          } catch {
            /* ignore */
          }
        }
        notifyAnnouncementReadsChanged(uid);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setMigrationDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  /** モーダル対象 ID だけ既読確認（reads 全件購読しない） */
  useEffect(() => {
    if (!uid) {
      setReadIds(new Set());
      setReadsReady(false);
      return;
    }
    let cancelled = false;
    const ids = EVENT_MODAL_QUEUE.map((e) => e.id);

    const refresh = async () => {
      setReadsReady(false);
      const next = await loadAnnouncementReadIdsFor(db, uid, ids);
      if (cancelled) return;
      setReadIds(next);
      setReadsReady(true);
    };

    void refresh();
    const onRefresh = () => {
      void refresh();
    };
    window.addEventListener(ANNOUNCEMENT_READS_REFRESH_EVENT, onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener(ANNOUNCEMENT_READS_REFRESH_EVENT, onRefresh);
    };
  }, [uid]);

  useEffect(() => {
    return subscribeAppTutorialBlockingEvents(setTutorialBlocking);
  }, []);

  useEffect(() => {
    if (isPublicLp) return;
    if (!uid) return;
    if (!onboardingComplete) return;
    if (isAuthEntryRoute(pathname)) return;
    if (languageLoading) return;
    if (!readsReady || !migrationDone) return;
    if (open) return;
    if (tutorialBlocking) return;

    const merged = new Set(readIds);
    pendingReadIdsRef.current.forEach((id) => merged.add(id));
    const next = EVENT_MODAL_QUEUE.find((e) => !merged.has(e.id));
    if (!next) return;

    setDisplayEvent(next);
    setOpen(true);
  }, [
    isPublicLp,
    uid,
    onboardingComplete,
    pathname,
    languageLoading,
    readsReady,
    migrationDone,
    readIds,
    open,
    tutorialBlocking,
  ]);

  const close = async () => {
    const ev = displayEvent;
    if (!ev) return;
    if (uid) {
      try {
        await setDoc(
          doc(db, `users/${uid}/reads`, ev.id),
          { at: serverTimestamp() },
          { merge: true }
        );
        pendingReadIdsRef.current.add(ev.id);
        notifyAnnouncementReadsChanged(uid);
      } catch {
        /* ignore */
      }
    } else {
      pendingReadIdsRef.current.add(ev.id);
    }
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(eventSeenStorageKey(ev.id));
      }
    } catch {
      /* ignore */
    }
    setOpen(false);
    setDisplayEvent(null);
  };

  if (isPublicLp) return null;

  if (!open || !displayEvent || languageLoading || !uid || !onboardingComplete) {
    return null;
  }

  if (isAuthEntryRoute(pathname)) return null;

  return (
    <EventModal event={displayEvent} onClose={close} language={language} />
  );
}
