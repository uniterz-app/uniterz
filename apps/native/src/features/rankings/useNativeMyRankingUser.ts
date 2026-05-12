import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

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
    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.data() as
          | {
              displayName?: string;
              handle?: string;
              photoURL?: string;
              plan?: string;
              language?: string;
              countryCode?: string | null;
            }
          | undefined;

        if (!d) {
          setUser(EMPTY_USER);
          setLoading(false);
          return;
        }

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
      },
      () => {
        setUser(EMPTY_USER);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  return { user, loading };
}
