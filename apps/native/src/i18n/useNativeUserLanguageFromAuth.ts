import { auth } from "../lib/firebase";
import { useNativeUserLanguage } from "./useNativeUserLanguage";

/** 7言語対応 — シーズン予想 / プラン変更 / スクワッドバトル等 */
export function useNativeUserLanguageFromAuth() {
  const uid = auth.currentUser?.uid ?? null;
  return useNativeUserLanguage(uid);
}
