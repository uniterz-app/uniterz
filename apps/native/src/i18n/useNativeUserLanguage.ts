/** Web `useUserLanguage` 相当 */
import { useEffect, useState } from "react";
import type { DocumentData } from "firebase/firestore";
import {
  guessLanguageFromNavigator,
  normalizeLanguage,
  type Language,
} from "../../../../lib/i18n/language";
import { subscribeUserDocLive } from "../../../../lib/user/subscribeUserDocLive";

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
    return subscribeUserDocLive(uid, (data: DocumentData | null) => {
      const resolved = normalizeLanguage(data?.language);
      setLanguage(resolved ?? guessLanguageFromNavigator());
      setCountryCode(
        typeof data?.countryCode === "string" ? data.countryCode : null
      );
      setLoading(false);
    });
  }, [uid]);

  return { language, countryCode, loading };
}
