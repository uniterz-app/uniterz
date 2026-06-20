import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

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
    let alive = true;
    setReady(false);
    void getDoc(doc(db, "users", uid)).then((snap) => {
      if (!alive) return;
      const lang = snap.data()?.language;
      setLanguage(lang === "en" ? "en" : "ja");
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [uid]);

  return { language, ready };
}

export function useNativeUserLanguageFromAuth() {
  const uid = auth.currentUser?.uid ?? null;
  return useNativeUserLanguage(uid);
}
