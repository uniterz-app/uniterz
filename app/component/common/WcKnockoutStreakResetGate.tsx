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
import { usePathname } from "next/navigation";
import { isAuthEntryRoute } from "@/lib/profileSetupRoute";
import { normalizeLanguage } from "@/lib/i18n/language";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import WcConcurrentStreakModal from "@/app/component/predict/WcConcurrentStreakModal";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import { isWcKnockoutStageStarted } from "@/lib/wc/wc-knockout-config";
import {
  resolveWcKnockoutStreakResetCopy,
  wcKnockoutStreakResetNoticeId,
} from "@/lib/wc/wcKnockoutStreakResetNotice";

/** ノックアウト開始後、ログイン済みユーザーへ連勝リセットルールを生涯1回表示 */
export default function WcKnockoutStreakResetGate() {
  const pathname = usePathname();
  const isPublicLp = pathname === "/lp" || pathname === "/mobile/lp";

  const [uid, setUid] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [readsReady, setReadsReady] = useState(false);
  const [open, setOpen] = useState(false);
  const pendingReadRef = useRef<string | null>(null);

  const season = WC_KNOCKOUT_SEASON;
  const noticeId = wcKnockoutStreakResetNoticeId(season);
  const knockoutStarted = isWcKnockoutStageStarted(season);
  const { language, loading: languageLoading } = useUserLanguage(uid);

  useEffect(() => {
    if (isPublicLp) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return () => unsub();
  }, [isPublicLp]);

  useEffect(() => {
    if (isPublicLp || !uid) {
      setOnboardingComplete(false);
      return;
    }
    const userRef = doc(db, "users", uid);
    const unsub = onSnapshot(userRef, (snap) => {
      const d = snap.data() as Record<string, unknown> | undefined;
      const lang = d?.language;
      const handle = d?.handle || d?.slug || d?.username;
      setOnboardingComplete(
        normalizeLanguage(lang) !== null && Boolean(handle)
      );
    });
    return () => unsub();
  }, [isPublicLp, uid]);

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
    if (!uid || !onboardingComplete) return;
    if (!knockoutStarted) return;
    if (isAuthEntryRoute(pathname)) return;
    if (languageLoading || !readsReady) return;
    if (open) return;
    if (readIds.has(noticeId) || pendingReadRef.current === noticeId) return;
    setOpen(true);
  }, [
    isPublicLp,
    uid,
    onboardingComplete,
    knockoutStarted,
    pathname,
    languageLoading,
    readsReady,
    open,
    readIds,
    noticeId,
  ]);

  const close = async () => {
    pendingReadRef.current = noticeId;
    if (uid) {
      try {
        await setDoc(
          doc(db, `users/${uid}/reads`, noticeId),
          { at: serverTimestamp() },
          { merge: true }
        );
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  };

  if (
    isPublicLp ||
    !open ||
    !uid ||
    !onboardingComplete ||
    !knockoutStarted ||
    languageLoading ||
    isAuthEntryRoute(pathname)
  ) {
    return null;
  }

  return (
    <WcConcurrentStreakModal
      open={open}
      language={language}
      copy={resolveWcKnockoutStreakResetCopy(language)}
      onClose={close}
    />
  );
}
