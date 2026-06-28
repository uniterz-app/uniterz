"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import { isWcKnockoutBracketSubmissionOpen } from "@/lib/wc/wc-knockout-config";
import { wcKnockoutChallengeNoticeId } from "@/lib/wc/wcKnockoutChallengeNotice";

type WcKnockoutChallengePromptState = {
  /** モーダルを表示すべきか */
  open: boolean;
  /** 表示済みとして記録して閉じる */
  dismiss: () => void;
};

/**
 * ノックアウト試合の予想フローで、UNITERZ ノックアウトチャレンジ告知を
 * 各ユーザーに生涯1回だけ表示するためのフック。
 *
 * @param enabled ノックアウト試合の予想フロー上のときだけ true
 */
export function useWcKnockoutChallengePrompt(
  enabled: boolean,
  season: string = WC_KNOCKOUT_SEASON
): WcKnockoutChallengePromptState {
  const [uid, setUid] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const noticeId = wcKnockoutChallengeNoticeId(season);
  const dismissedRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!enabled || !uid) return;
    if (!isWcKnockoutBracketSubmissionOpen(season)) return;
    if (dismissedRef.current) return;

    let cancelled = false;
    void getDoc(doc(db, `users/${uid}/reads`, noticeId))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists() && !dismissedRef.current) setOpen(true);
      })
      .catch(() => {
        /* 読み取り失敗時は表示しない（次回再試行） */
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, uid, season, noticeId]);

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setOpen(false);
    if (uid) {
      void setDoc(
        doc(db, `users/${uid}/reads`, noticeId),
        { at: serverTimestamp() },
        { merge: true }
      ).catch(() => {
        /* 書き込み失敗は無視（再表示されうるが致命ではない） */
      });
    }
  }, [uid, noticeId]);

  return { open, dismiss };
}
