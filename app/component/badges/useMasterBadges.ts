"use client";

import { useEffect, useState } from "react";
import { fetchMasterBadgesShared } from "@/lib/badges/fetchMasterBadgesShared";

export type MasterBadge = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  participantCount?: number;
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
        const list = await fetchMasterBadgesShared();
        if (!cancelled) {
          masterBadgesMemoryCache = { at: Date.now(), badges: list };
          setBadges(list);
        }
      } catch {
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
