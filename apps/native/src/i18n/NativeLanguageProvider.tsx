import { createContext, useContext, type ReactNode } from "react";
import type { Language } from "../../../../lib/i18n/language";
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "./useNativeUserLanguage";

type NativeLanguageContextValue = {
  language: Language;
  countryCode: string | null;
  /** 手動設定のみ。null は自動（端末） */
  displayTimeZone: string | null;
  /** 試合日付・時刻の表示 TZ */
  timeZone: string;
  loading: boolean;
};

const NativeLanguageContext = createContext<NativeLanguageContextValue>({
  language: "ja",
  countryCode: null,
  displayTimeZone: null,
  timeZone: "Asia/Tokyo",
  loading: false,
});

export function NativeLanguageProvider({ children }: { children: ReactNode }) {
  const { fUser } = useFirebaseUser();
  const { language, countryCode, displayTimeZone, timeZone, loading } =
    useNativeUserLanguage(fUser?.uid);

  return (
    <NativeLanguageContext.Provider
      value={{ language, countryCode, displayTimeZone, timeZone, loading }}
    >
      {children}
    </NativeLanguageContext.Provider>
  );
}

export function useNativeLanguage() {
  return useContext(NativeLanguageContext);
}
