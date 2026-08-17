import { useEffect, useState } from "react";
import type { DocumentData } from "firebase/firestore";
import { auth } from "../lib/firebase";
import { subscribeUserDocLive } from "../../../../lib/user/subscribeUserDocLive";

/** Firestore `users.language` を読む（Web `useUserLanguage` 相当） */
export function useNativeUserLanguage(uid: string | null | undefined) {
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [ready, setReady] = useState(!uid);

  useEffect(() => {
    if (!uid) {
      setLanguage("ja");
      setReady(true);
      return;
    }
    setReady(false);
    return subscribeUserDocLive(uid, (data: DocumentData | null) => {
      const lang = data?.language;
      setLanguage(lang === "en" ? "en" : "ja");
      setReady(true);
    });
  }, [uid]);

  return { language, ready };
}

export function useNativeUserLanguageFromAuth() {
  const uid = auth.currentUser?.uid ?? null;
  return useNativeUserLanguage(uid);
}
