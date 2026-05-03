/**
 * Web `useProfileBadges` と同等（master + user_badges の突合）。
 */
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export type MasterBadgeNative = {
  id: string;
  title: string;
  description: string;
  icon?: string;
};

export type ResolvedBadgeNative = MasterBadgeNative & {
  grantedAt: Date | null;
};

const MASTER_BADGES_TTL_MS = 30 * 60 * 1000;
let masterBadgesMemoryCache: { at: number; badges: MasterBadgeNative[] } | null =
  null;

export type UserGrantedBadgeNative = {
  badgeId: string;
  grantedAt: Date | null;
};

function useUserBadgesNative(uid: string | undefined) {
  const [badges, setBadges] = useState<UserGrantedBadgeNative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setBadges([]);
      setLoading(false);
      return;
    }
    const userId = uid;
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        const colRef = collection(db, "user_badges", userId, "badges");
        const q = query(colRef, orderBy("grantedAt", "desc"));
        const snap = await getDocs(q);
        if (cancelled) return;
        const list: UserGrantedBadgeNative[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ga = data.grantedAt;
          return {
            badgeId: (typeof data.badgeId === "string" ? data.badgeId : d.id) as string,
            grantedAt:
              ga instanceof Timestamp ? ga.toDate() : null,
          };
        });
        setBadges(list);
      } catch {
        if (!cancelled) setBadges([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { badges, loading };
}

function useMasterBadgesNative() {
  const [badges, setBadges] = useState<MasterBadgeNative[]>(
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
    async function run() {
      try {
        setLoading(true);
        const col = collection(db, "master_badges");
        const snap = await getDocs(col);
        if (cancelled) return;
        const list: MasterBadgeNative[] = [];
        snap.forEach((d) => {
          const data = d.data() as Omit<MasterBadgeNative, "id">;
          list.push({
            id: d.id,
            title: data.title,
            description: data.description,
            icon: data.icon,
          });
        });
        masterBadgesMemoryCache = { at: Date.now(), badges: list };
        setBadges(list);
      } catch {
        if (!cancelled) setBadges([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { badges, loading };
}

export function useNativeProfileBadges(targetUid: string | undefined) {
  const { badges: userBadges, loading: userLoading } = useUserBadgesNative(targetUid);
  const { badges: masterBadges, loading: masterLoading } = useMasterBadgesNative();

  const resolvedBadges = useMemo((): ResolvedBadgeNative[] => {
    if (!userBadges.length || !masterBadges.length) return [];
    return userBadges
      .map((ub) => {
        const master = masterBadges.find((m) => m.id === ub.badgeId);
        if (!master) return null;
        return { ...master, grantedAt: ub.grantedAt };
      })
      .filter((b): b is ResolvedBadgeNative => b !== null);
  }, [userBadges, masterBadges]);

  return {
    resolvedBadges,
    loading: userLoading || masterLoading,
  };
}
