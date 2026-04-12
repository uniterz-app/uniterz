// app/component/common/EventGate.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import EventModal from "@/app/component/modals/EventModal";
import { CURRENT_EVENT } from "@/lib/events/currentEvent";
import { doc, onSnapshot } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { isProfileSetupRoute } from "@/lib/profileSetupRoute";

export default function EventGate() {
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
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
      const d = snap.data() as any;
      const lang = d?.language;
      const handle = d?.handle || d?.slug || d?.username;

      const ok = (lang === "ja" || lang === "en") && Boolean(handle);
      setOnboardingComplete(ok);
    });

    return () => unsub();
  }, [isPublicLp, uid]);

  useEffect(() => {
    if (isPublicLp) return;
    if (!uid) return;
    if (!onboardingComplete) return;

    // オンボーディング中はモーダルを出さない
    if (isProfileSetupRoute(pathname)) return;

    const key = `event_seen_${CURRENT_EVENT.id}`;
    if (localStorage.getItem(key)) return;

    setOpen(true);
  }, [isPublicLp, uid, onboardingComplete, pathname]);

  const close = () => {
    localStorage.setItem(
      `event_seen_${CURRENT_EVENT.id}`,
      "1"
    );
    setOpen(false);
  };

  if (isPublicLp) return null;

  if (!open) return null;

  return <EventModal event={CURRENT_EVENT} onClose={close} />;
}
