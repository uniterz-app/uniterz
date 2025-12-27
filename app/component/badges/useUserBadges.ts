"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserGrantedBadge = {
  badgeId: string;
  grantedAt: Date | null;
};


export function useUserBadges(uid: string | null) {
  const [badges, setBadges] = useState<UserGrantedBadge[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔴 ここで即ガード
    if (uid == null) {
      setBadges([]);
      setLoading(false);
      return;
    }

    // 🔑 TS が信用する「string確定」変数
    const userId: string = uid;

    let cancelled = false;

    async function fetchUserBadges() {
      try {
        // ✅ ここはもう絶対にエラー出ない
        const colRef = collection(db, "user_badges", userId, "badges");
        const q = query(colRef, orderBy("grantedAt", "desc"));
        const snap = await getDocs(q);

        if (cancelled) return;

        const list: UserGrantedBadge[] = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            badgeId: data.badgeId ?? doc.id,
            grantedAt:
              data.grantedAt instanceof Timestamp
                ? data.grantedAt.toDate()
                : null,
          };
        });

        setBadges(list);
      } catch (e) {
        console.error("Failed to load user badges:", e);
        setBadges([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUserBadges();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { badges, loading };
}
