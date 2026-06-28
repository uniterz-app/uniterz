"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { isAuthEntryRoute } from "@/lib/profileSetupRoute";
import { normalizeLanguage } from "@/lib/i18n/language";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import WcBracketStartPromptModal from "@/app/component/predict/wc/WcBracketStartPromptModal";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import { loadWcBracket } from "@/lib/wc/wc-bracket-firestore";
import { isWcKnockoutBracketSubmissionOpen } from "@/lib/wc/wc-knockout-config";
import { wcBracketStartPromptNoticeId } from "@/lib/wc/wcBracketStartPromptNotice";
import { buildWcBracketRankingsHref } from "@/lib/navigation/rankingsProfileFrom";

/** ログイン済み・未提出ユーザーへ WC ブラケット告知を生涯1回表示（アプリ起動時） */
export default function WcBracketStartPromptGate() {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicLp = pathname === "/lp" || pathname === "/mobile/lp";

  const [uid, setUid] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [readsReady, setReadsReady] = useState(false);
  const [bracketReady, setBracketReady] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [open, setOpen] = useState(false);
  const pendingReadRef = useRef<string | null>(null);

  const season = WC_KNOCKOUT_SEASON;
  const noticeId = wcBracketStartPromptNoticeId(season);
  const submissionOpen = isWcKnockoutBracketSubmissionOpen(season);
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
    if (!uid) {
      setBracketReady(false);
      setHasSubmitted(false);
      return;
    }
    let cancelled = false;
    setBracketReady(false);
    void loadWcBracket(uid, season)
      .then((doc) => {
        if (cancelled) return;
        setHasSubmitted(Boolean(doc?.isSubmitted));
      })
      .catch(() => {
        if (!cancelled) setHasSubmitted(false);
      })
      .finally(() => {
        if (!cancelled) setBracketReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, season]);

  useEffect(() => {
    if (isPublicLp) return;
    if (!uid || !onboardingComplete) return;
    if (isAuthEntryRoute(pathname)) return;
    if (languageLoading || !readsReady || !bracketReady) return;
    if (!submissionOpen || hasSubmitted) return;
    if (open) return;
    if (readIds.has(noticeId) || pendingReadRef.current === noticeId) return;
    setOpen(true);
  }, [
    isPublicLp,
    uid,
    onboardingComplete,
    pathname,
    languageLoading,
    readsReady,
    bracketReady,
    submissionOpen,
    hasSubmitted,
    open,
    readIds,
    noticeId,
  ]);

  const markSeen = async () => {
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

  const handleStart = () => {
    void markSeen();
    router.push(buildWcBracketRankingsHref(pathname, { openInput: true }));
  };

  if (
    isPublicLp ||
    !open ||
    !uid ||
    !onboardingComplete ||
    languageLoading ||
    isAuthEntryRoute(pathname) ||
    !submissionOpen ||
    hasSubmitted
  ) {
    return null;
  }

  return (
    <WcBracketStartPromptModal
      open={open}
      language={language}
      season={season}
      onClose={() => {
        void markSeen();
      }}
      onStart={handleStart}
    />
  );
}
