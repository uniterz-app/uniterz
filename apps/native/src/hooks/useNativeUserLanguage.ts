import { auth } from "../lib/firebase";
import {
  useNativeUserLanguage as useNativeUserLanguageCore,
} from "../i18n/useNativeUserLanguage";
import type { Language } from "../../../../lib/i18n/language";

/**
 * Firestore `users.language` を読む（Web `useUserLanguage` 相当）。
 * 7言語（ja/en/ko/zh/es/pt/fr + de/ar）をそのまま返す。
 */
export function useNativeUserLanguage(uid: string | null | undefined): {
  language: Language;
  ready: boolean;
  countryCode: string | null;
} {
  const { language, loading, countryCode } = useNativeUserLanguageCore(uid);
  return { language, ready: !loading, countryCode };
}

export function useNativeUserLanguageFromAuth() {
  const uid = auth.currentUser?.uid ?? null;
  return useNativeUserLanguage(uid);
}
