"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { loadWcBracket } from "@/lib/wc/wc-bracket-firestore";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import { isWcKnockoutBracketSubmissionOpen } from "@/lib/wc/wc-knockout-config";

type WcBracketSubmittedState = {
  uid: string | null;
  /** null = 判定前（ローディング）、true/false = 提出済み/未提出 */
  submitted: boolean | null;
  /** 提出受付中かつログイン済みかつ未提出のとき true（!バッジ表示用） */
  shouldPromptInput: boolean;
};

/** ログインユーザーが当該シーズンの WC ブラケットを提出済みか判定する */
export function useWcBracketSubmitted(
  season: string = WC_KNOCKOUT_SEASON
): WcBracketSubmittedState {
  const [uid, setUid] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setSubmitted(null);
      return;
    }
    let cancelled = false;
    setSubmitted(null);
    void loadWcBracket(uid, season)
      .then((doc) => {
        if (!cancelled) setSubmitted(Boolean(doc?.isSubmitted));
      })
      .catch(() => {
        if (!cancelled) setSubmitted(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, season]);

  const shouldPromptInput =
    isWcKnockoutBracketSubmissionOpen(season) &&
    uid != null &&
    submitted === false;

  return { uid, submitted, shouldPromptInput };
}
