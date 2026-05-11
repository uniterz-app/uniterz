"use client";

import { useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Language } from "@/lib/i18n/language";
import {
  guessLanguageFromNavigator,
  normalizeLanguage,
} from "@/lib/i18n/language";

export function useUserLanguage(uid: string | null | undefined) {
  const [language, setLanguage] = useState<Language>(() =>
    guessLanguageFromNavigator()
  );
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLanguage(guessLanguageFromNavigator());
      setCountryCode(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.data() as any | undefined;
        const resolved = normalizeLanguage(d?.language);
        setLanguage(resolved ?? guessLanguageFromNavigator());
        setCountryCode(typeof d?.countryCode === "string" ? d.countryCode : null);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  return { language, countryCode, loading };
}

