"use client";

import { useEffect, useMemo, useState } from "react";
import type { DocumentData } from "firebase/firestore";
import { subscribeUserDocLive } from "@/lib/user/subscribeUserDocLive";
import type { Language } from "@/lib/i18n/language";
import {
  guessLanguageFromNavigator,
  normalizeLanguage,
} from "@/lib/i18n/language";
import { resolveDisplayTimeZone } from "@/lib/i18n/countryTimezone";

export function useUserLanguage(uid: string | null | undefined) {
  const [language, setLanguage] = useState<Language>(() =>
    guessLanguageFromNavigator()
  );
  const [countryCode, setCountryCode] = useState<string | null>(null);
  /** 手動設定のみ。null は自動（端末） */
  const [displayTimeZone, setDisplayTimeZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLanguage(guessLanguageFromNavigator());
      setCountryCode(null);
      setDisplayTimeZone(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    return subscribeUserDocLive(uid, (data: DocumentData | null) => {
      const resolved = normalizeLanguage(data?.language);
      setLanguage(resolved ?? guessLanguageFromNavigator());
      setCountryCode(
        typeof data?.countryCode === "string" ? data.countryCode : null
      );
      setDisplayTimeZone(
        typeof data?.displayTimeZone === "string" ? data.displayTimeZone : null
      );
      setLoading(false);
    });
  }, [uid]);

  /** 試合日付・時刻の表示 TZ（手動 → 端末 → 国 → 言語） */
  const timeZone = useMemo(
    () => resolveDisplayTimeZone({ displayTimeZone, countryCode, language }),
    [displayTimeZone, countryCode, language]
  );

  return { language, countryCode, displayTimeZone, timeZone, loading };
}
