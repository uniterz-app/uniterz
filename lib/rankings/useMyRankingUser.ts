// lib/rankings/useMyRankingUser.ts
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export type MyRankingUser = {
  displayName: string;
  handle: string;
  photoURL: string;
};

const EMPTY_USER: MyRankingUser = {
  displayName: "",
  handle: "",
  photoURL: "",
};

export function useMyRankingUser(uid: string | null | undefined) {
  const [user, setUser] = useState<MyRankingUser>(EMPTY_USER);
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

  return {
    user,
    loading,
  };
}