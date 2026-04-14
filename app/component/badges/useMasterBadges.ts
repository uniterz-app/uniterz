"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type MasterBadge = {
  id: string;
  title: string;
  description: string;
  icon?: string;
};

const MASTER_BADGES_TTL_MS = 30 * 60 * 1000;

let masterBadgesMemoryCache: { at: number; badges: MasterBadge[] } | null =
  null;

export function useMasterBadges() {
  const [badges, setBadges] = useState<MasterBadge[]>(
    () => masterBadgesMemoryCache?.badges ?? []
  );
  const [loading, setLoading] = useState(
    () =>
      !masterBadgesMemoryCache ||
      Date.now() - masterBadgesMemoryCache.at >= MASTER_BADGES_TTL_MS
  );

  useEffect(() => {
    const now = Date.now();
    if (
      masterBadgesMemoryCache &&
      now - masterBadgesMemoryCache.at < MASTER_BADGES_TTL_MS
    ) {
      setBadges(masterBadgesMemoryCache.badges);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchBadges() {
      try {
        setLoading(true);
        const col = collection(db, "master_badges");
        const snap = await getDocs(col);

        const list: MasterBadge[] = [];
        snap.forEach((d) => {
          const data = d.data() as Omit<MasterBadge, "id">;

          list.push({
            id: d.id,
            title: data.title,
            description: data.description,
            icon: data.icon,
          });
        });

        if (!cancelled) {
          masterBadgesMemoryCache = { at: Date.now(), badges: list };
          setBadges(list);
        }
      } catch (e) {
        console.error("Failed to load master_badges:", e);
        if (!cancelled) setBadges([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchBadges();

    return () => {
      cancelled = true;
    };
  }, []);

  return { badges, loading };
}
