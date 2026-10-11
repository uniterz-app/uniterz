import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { ChineseScript, Language } from "../../../../lib/i18n/language";
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import { setActiveChineseScript } from "./chineseScriptNative";
import { useNativeUserLanguage } from "./useNativeUserLanguage";

type NativeLanguageContextValue = {
  language: Language;
  /** `language === "zh"` のときの字体（繁体字は表示時に変換） */
  chineseScript: ChineseScript;
  countryCode: string | null;
  /** 手動設定のみ。null は自動（端末） */
  displayTimeZone: string | null;
  /** 試合日付・時刻の表示 TZ */
  timeZone: string;
  loading: boolean;
};

const NativeLanguageContext = createContext<NativeLanguageContextValue>({
  language: "ja",
  chineseScript: "hans",
  countryCode: null,
  displayTimeZone: null,
  timeZone: "Asia/Tokyo",
  loading: false,
});

export function NativeLanguageProvider({ children }: { children: ReactNode }) {
  const { fUser } = useFirebaseUser();
  const { language, chineseScript, countryCode, displayTimeZone, timeZone, loading } =
    useNativeUserLanguage(fUser?.uid);

  useEffect(() => {
    setActiveChineseScript(language === "zh" ? chineseScript : "hans");
  }, [language, chineseScript]);

  return (
    <NativeLanguageContext.Provider
      value={{ language, chineseScript, countryCode, displayTimeZone, timeZone, loading }}
    >
      {children}
    </NativeLanguageContext.Provider>
  );
}

export function useNativeLanguage() {
  return useContext(NativeLanguageContext);
}
