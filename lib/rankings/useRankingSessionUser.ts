"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Language } from "@/lib/i18n/language";
import {
  guessLanguageFromNavigator,
  normalizeLanguage,
} from "@/lib/i18n/language";

export type RankingSessionUser = {
  displayName: string;
  handle: string;
  photoURL: string;
  plan: "free" | "pro";
  language: Language;
  countryCode: string | null;
};

const EMPTY: RankingSessionUser = {
  displayName: "",
  handle: "",
  photoURL: "",
  plan: "free",
  language: guessLanguageFromNavigator(),
  countryCode: null,
};

/** ランキング画面用 — users/{uid} を 1 本の onSnapshot で購読 */
export function useRankingSessionUser(uid: string | null | undefined) {
  const [user, setUser] = useState<RankingSessionUser>(EMPTY);
  const [loading, setLoading] = useState(!!uid);

  useEffect(() => {
    if (!uid) {
      setUser({ ...EMPTY, language: guessLanguageFromNavigator() });
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.data() as
          | {
              displayName?: string;
              handle?: string;
              photoURL?: string;
              plan?: string;
              language?: string;
              countryCode?: string;
            }
          | undefined;

        if (!d) {
          setUser({ ...EMPTY, language: guessLanguageFromNavigator() });
          setLoading(false);
          return;
        }

        setUser({
          displayName: d.displayName?.trim() || "",
          handle: d.handle?.trim() || "",
          photoURL: d.photoURL?.trim() || "",
          plan: d.plan === "pro" ? "pro" : "free",
          language: normalizeLanguage(d.language) ?? guessLanguageFromNavigator(),
          countryCode: typeof d.countryCode === "string" ? d.countryCode : null,
        });
        setLoading(false);
      },
      () => {
        setUser({ ...EMPTY, language: guessLanguageFromNavigator() });
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  return { user, loading };
}
