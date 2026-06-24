import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { db } from "../../lib/firebase";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";
import { wcConcurrentStreakNoticeId } from "../../../../../lib/wc/wcConcurrentStreakNotice";
import WcConcurrentStreakModalNative from "./WcConcurrentStreakModalNative";

/** ログイン済みユーザーへ WC 同時キックオフ連勝ルールを生涯1回表示 */
export default function WcConcurrentStreakGateNative() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const authed = status === "ready" && !!uid;
  const { language, ready: languageReady } = useNativeUserLanguage(uid);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [readsReady, setReadsReady] = useState(false);
  const [open, setOpen] = useState(false);
  const pendingReadRef = useRef<string | null>(null);
  const noticeId = wcConcurrentStreakNoticeId();

  useEffect(() => {
    if (!authed || !uid) {
      setOnboardingComplete(false);
      return;
    }
    let cancelled = false;
    void getDoc(doc(db, "users", uid)).then((snap) => {
      if (cancelled) return;
      const d = snap.data();
      const handle = d?.handle || d?.slug || d?.username;
      setOnboardingComplete(Boolean(handle) && Boolean(d?.language));
    });
    return () => {
      cancelled = true;
    };
  }, [authed, uid]);

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
    if (!authed || !uid || !onboardingComplete) return;
    if (!languageReady || !readsReady) return;
    if (open) return;
    if (readIds.has(noticeId) || pendingReadRef.current === noticeId) return;
    setOpen(true);
  }, [
    authed,
    uid,
    onboardingComplete,
    languageReady,
    readsReady,
    open,
    readIds,
    noticeId,
  ]);

  const close = () => {
    pendingReadRef.current = noticeId;
    if (uid) {
      void setDoc(
        doc(db, `users/${uid}/reads`, noticeId),
        { at: serverTimestamp() },
        { merge: true }
      );
    }
    setOpen(false);
  };

  if (!authed || !onboardingComplete) return null;

  return (
    <WcConcurrentStreakModalNative
      visible={open}
      language={language === "en" ? "en" : "ja"}
      onClose={close}
    />
  );
}
