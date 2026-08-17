"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/lib/i18n/language";
import {
  guessLanguageFromNavigator,
  normalizeLanguage,
} from "@/lib/i18n/language";
import { subscribeUserDocLive } from "@/lib/user/subscribeUserDocLive";

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

/** ランキング画面用 — users/{uid} を共有ハブ経由で購読 */
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
    return subscribeUserDocLive(uid, (data) => {
      if (!data) {
        setUser({ ...EMPTY, language: guessLanguageFromNavigator() });
        setLoading(false);
        return;
      }

      const d = data as {
        displayName?: string;
        handle?: string;
        photoURL?: string;
        plan?: string;
        language?: string;
        countryCode?: string;
      };

      setUser({
        displayName: d.displayName?.trim() || "",
        handle: d.handle?.trim() || "",
        photoURL: d.photoURL?.trim() || "",
        plan: d.plan === "pro" ? "pro" : "free",
        language: normalizeLanguage(d.language) ?? guessLanguageFromNavigator(),
        countryCode: typeof d.countryCode === "string" ? d.countryCode : null,
      });
      setLoading(false);
    });
  }, [uid]);

  return { user, loading };
}
