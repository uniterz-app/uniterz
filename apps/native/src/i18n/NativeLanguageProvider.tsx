import { createContext, useContext, type ReactNode } from "react";
import type { Language } from "../../../../lib/i18n/language";
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "./useNativeUserLanguage";

type NativeLanguageContextValue = {
  language: Language;
  countryCode: string | null;
  loading: boolean;
};

const NativeLanguageContext = createContext<NativeLanguageContextValue>({
  language: "ja",
  countryCode: null,
  loading: false,
});

export function NativeLanguageProvider({ children }: { children: ReactNode }) {
  const { fUser } = useFirebaseUser();
  const { language, countryCode, loading } = useNativeUserLanguage(fUser?.uid);

  return (
    <NativeLanguageContext.Provider value={{ language, countryCode, loading }}>
      {children}
    </NativeLanguageContext.Provider>
  );
}

export function useNativeLanguage() {
  return useContext(NativeLanguageContext);
}
