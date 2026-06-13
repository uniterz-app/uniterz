// app/component/common/EventGate.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import EventModal from "@/app/component/modals/EventModal";
import { EVENT_MODAL_QUEUE } from "@/lib/events/syntheticEventNotices";
import type { EventNoticeContent } from "@/lib/events/eventNoticeTypes";
import { usePathname } from "next/navigation";
import { isAuthEntryRoute } from "@/lib/profileSetupRoute";
import { normalizeLanguage } from "@/lib/i18n/language";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

const eventSeenStorageKey = (id: string) => `event_seen_${id}`;

export default function EventGate() {
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [readsReady, setReadsReady] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const [displayEvent, setDisplayEvent] = useState<EventNoticeContent | null>(
    null
  );
  /** Firestore 購読が追いつく前に次モーダルが同じ ID で開かないようにする */
  const pendingReadIdsRef = useRef<Set<string>>(new Set());
  const pathname = usePathname();
  const isPublicLp = pathname === "/lp" || pathname === "/mobile/lp";
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

    const userRef = doc(db, "users", uid);
    const unsub = onSnapshot(userRef, (snap) => {
      const d = snap.data() as Record<string, unknown> | undefined;
      const lang = d?.language;
      const handle = d?.handle || d?.slug || d?.username;

      const ok = normalizeLanguage(lang) !== null && Boolean(handle);
      setOnboardingComplete(ok);
    });

    return () => unsub();
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

  useEffect(() => {
    if (!uid) {
      setReadIds(new Set());
      setReadsReady(false);
      return;
    }
    const colRef = collection(db, `users/${uid}/reads`);
    const unsub = onSnapshot(colRef, (snap) => {
      const s = new Set<string>();
      snap.forEach((d) => s.add(d.id));
      setReadIds(s);
      setReadsReady(true);
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (isPublicLp) return;
    if (!uid) return;
    if (!onboardingComplete) return;
    if (isAuthEntryRoute(pathname)) return;
    if (languageLoading) return;
    if (!readsReady || !migrationDone) return;
    if (open) return;

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
