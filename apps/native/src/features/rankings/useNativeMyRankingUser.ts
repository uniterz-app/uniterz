import { useEffect, useState } from "react";
import type { DocumentData } from "firebase/firestore";
import { subscribeUserDocLive } from "../../../../../lib/user/subscribeUserDocLive";

export type NativeMyRankingUser = {
  displayName: string;
  handle: string;
  photoURL: string;
  plan: "free" | "pro";
  language: "ja" | "en";
  countryCode: string | null;
};

const EMPTY_USER: NativeMyRankingUser = {
  displayName: "",
  handle: "",
  photoURL: "",
  plan: "free",
  language: "ja",
  countryCode: null,
};

export function useNativeMyRankingUser(uid: string | null | undefined) {
  const [user, setUser] = useState<NativeMyRankingUser>(EMPTY_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setUser(EMPTY_USER);
      setLoading(false);
      return;
    }

    setLoading(true);
    return subscribeUserDocLive(uid, (data: DocumentData | null) => {
      if (!data) {
        setUser(EMPTY_USER);
        setLoading(false);
        return;
      }

      const d = data as {
        displayName?: string;
        handle?: string;
        photoURL?: string;
        plan?: string;
        language?: string;
        countryCode?: string | null;
      };

      setUser({
        displayName: d.displayName?.trim() || "",
        handle: d.handle?.trim() || "",
        photoURL: d.photoURL?.trim() || "",
        plan: d.plan === "pro" ? "pro" : "free",
        language: d.language === "en" ? "en" : "ja",
        countryCode:
          typeof d.countryCode === "string" && d.countryCode.trim()
            ? d.countryCode.trim()
            : null,
      });
      setLoading(false);
    });
  }, [uid]);

  return { user, loading };
}
