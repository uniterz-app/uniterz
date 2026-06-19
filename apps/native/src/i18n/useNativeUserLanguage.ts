/** Web `useUserLanguage` 相当 */
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import {
  guessLanguageFromNavigator,
  normalizeLanguage,
  type Language,
} from "../../../../lib/i18n/language";
import { db } from "../lib/firebase";

export function useNativeUserLanguage(uid: string | null | undefined) {
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
        const d = snap.data();
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
