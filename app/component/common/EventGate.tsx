// app/component/common/EventGate.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import EventModal from "@/app/component/modals/EventModal";
import { CURRENT_EVENT } from "@/lib/events/currentEvent";
import { doc, onSnapshot } from "firebase/firestore";
import { usePathname } from "next/navigation";

export default function EventGate() {
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setOnboardingComplete(false);
      return;
    }

    // users/{uid} の更新を監視して、オンボーディング完了後にモーダルを出す
    const userRef = doc(db, "users", uid);
    const unsub = onSnapshot(userRef, (snap) => {
      const d = snap.data() as any;
      const lang = d?.language;
      const handle = d?.handle || d?.slug || d?.username;

      const ok = (lang === "ja" || lang === "en") && Boolean(handle);
      setOnboardingComplete(ok);
    });

    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    if (!onboardingComplete) return;

    // オンボーディング中はモーダルを出さない
    const isOnboarding =
      pathname === "/web/onboarding" ||
      pathname === "/mobile/onboarding";
    if (isOnboarding) return;

    const key = `event_seen_${CURRENT_EVENT.id}`;
    if (localStorage.getItem(key)) return;

    setOpen(true);
  }, [uid, onboardingComplete, pathname]);

  const close = () => {
    localStorage.setItem(
      `event_seen_${CURRENT_EVENT.id}`,
      "1"
    );
    setOpen(false);
  };

  if (!open) return null;

  return <EventModal event={CURRENT_EVENT} onClose={close} />;
}
