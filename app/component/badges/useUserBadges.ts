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

const CACHE_TTL_MS = 10 * 60 * 1000;
type CacheEntry = { at: number; badges: UserGrantedBadge[] };
const cache = new Map<string, CacheEntry>();

export function useUserBadges(uid: string | null) {
  const [badges, setBadges] = useState<UserGrantedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid == null) {
      setBadges([]);
      setLoading(false);
      return;
    }

    const userId: string = uid;
    let cancelled = false;

    const hit = cache.get(userId);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      setBadges(hit.badges);
      setLoading(false);
      return;
    }

    async function fetchUserBadges() {
      try {
        const colRef = collection(db, "user_badges", userId, "badges");
        const q = query(colRef, orderBy("grantedAt", "desc"));
        const snap = await getDocs(q);

        if (cancelled) return;

        const list: UserGrantedBadge[] = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            badgeId: data.badgeId ?? docSnap.id,
            grantedAt:
              data.grantedAt instanceof Timestamp
                ? data.grantedAt.toDate()
                : null,
          };
        });

        cache.set(userId, { at: Date.now(), badges: list });
        setBadges(list);
      } catch (e) {
        console.error("Failed to load user badges:", e);
        setBadges([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchUserBadges();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { badges, loading };
}
