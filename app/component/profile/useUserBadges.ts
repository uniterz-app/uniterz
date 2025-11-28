"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

export type UserBadge = {
  id: string;
  awardedAt: Date | null;
  icon?: string;
  name?: string;
  description?: string;
};

export function useUserBadges(uid: string | null) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ★ uid が null の間は Firestore にアクセスしない
    if (!uid) {
      setBadges([]);
      setLoading(false);
      return;
    }

    // Firestore クエリ
    const q = query(
      collection(db, `users/${uid}/badges`),
      orderBy("awardedAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: UserBadge[] = snap.docs.map((d) => {
          const data = d.data();

          return {
            id: d.id,
            awardedAt: data.awardedAt?.toDate
              ? data.awardedAt.toDate()
              : null,
            icon: data.icon ?? null,
            name: data.name ?? null,
            description: data.description ?? null,
          };
        });

        setBadges(list);
        setLoading(false);
      },
      () => {
        // permission-denied などの場合
        setBadges([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  return { badges, loading };
}
