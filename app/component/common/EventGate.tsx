// app/component/common/EventGate.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import EventModal from "@/app/component/modals/EventModal";
import { CURRENT_EVENT } from "@/lib/events/currentEvent";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { usePathname } from "next/navigation";
import { isProfileSetupRoute } from "@/lib/profileSetupRoute";

const eventSeenStorageKey = () => `event_seen_${CURRENT_EVENT.id}`;

export default function EventGate() {
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [readsReady, setReadsReady] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const pathname = usePathname();
  const isPublicLp = pathname === "/lp" || pathname === "/mobile/lp";

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

    // users/{uid} の更新を監視して、オンボーディング完了後にモーダルを出す
    const userRef = doc(db, "users", uid);
    const unsub = onSnapshot(userRef, (snap) => {
      const d = snap.data() as Record<string, unknown> | undefined;
      const lang = d?.language;
      const handle = d?.handle || d?.slug || d?.username;

      const ok = (lang === "ja" || lang === "en") && Boolean(handle);
      setOnboardingComplete(ok);
    });

    return () => unsub();
  }, [isPublicLp, uid]);

  // localStorage の旧既読を Firestore に移し、キーを削除
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
        const key = eventSeenStorageKey();
        if (!window.localStorage.getItem(key)) return;
        await setDoc(
          doc(db, `users/${uid}/reads`, CURRENT_EVENT.id),
          { at: serverTimestamp() },
          { merge: true }
        );
        try {
          window.localStorage.removeItem(key);
        } catch {
          /* ignore */
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

  // 既読コレクション購読
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
    if (isProfileSetupRoute(pathname)) return;
    if (!CURRENT_EVENT.showModal) return;
    if (!readsReady || !migrationDone) return;
    if (readIds.has(CURRENT_EVENT.id)) return;

    setOpen(true);
  }, [
    isPublicLp,
    uid,
    onboardingComplete,
    pathname,
    readsReady,
    migrationDone,
    readIds,
  ]);

  const close = async () => {
    if (uid) {
      try {
        await setDoc(
          doc(db, `users/${uid}/reads`, CURRENT_EVENT.id),
          { at: serverTimestamp() },
          { merge: true }
        );
      } catch {
        /* ignore */
      }
    }
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(eventSeenStorageKey());
      }
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (isPublicLp) return null;

  if (!open) return null;

  return <EventModal event={CURRENT_EVENT} onClose={close} />;
}
