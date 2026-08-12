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
import { resolveUniterzAssetUrl } from "../../lib/resolveUniterzAssetUrl";

export type MasterBadgeNative = {
  id: string;
  title: string;
  description: string;
  icon?: string;
};

export type ResolvedBadgeNative = MasterBadgeNative & {
  grantedAt: Date | null;
};

export type UserGrantedBadgeNative = {
  badgeId: string;
  grantedAt: Date | null;
};

const MASTER_BADGES_TTL_MS = 30 * 60 * 1000;
const USER_BADGES_TTL_MS = 10 * 60 * 1000;
let masterBadgesMemoryCache: { at: number; badges: MasterBadgeNative[] } | null =
  null;
const userBadgesMemoryCache = new Map<
  string,
  { at: number; badges: UserGrantedBadgeNative[] }
>();

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

    const hit = userBadgesMemoryCache.get(userId);
    if (hit && Date.now() - hit.at < USER_BADGES_TTL_MS) {
      setBadges(hit.badges);
      setLoading(false);
      return;
    }

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
        userBadgesMemoryCache.set(userId, { at: Date.now(), badges: list });
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
    async function loadFromFirestore(): Promise<MasterBadgeNative[]> {
      const col = collection(db, "master_badges");
      const snap = await getDocs(col);
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
      return list;
    }
    async function run() {
      try {
        setLoading(true);
        let list: MasterBadgeNative[] = [];
        const { getUniterzApiBaseUrl } = await import(
          "../games/submitPredictionApi"
        );
        const apiBaseUrl = getUniterzApiBaseUrl();
        if (apiBaseUrl) {
          try {
            const { fetchMasterBadgesShared } = await import(
              "../../../../../lib/badges/fetchMasterBadgesShared"
            );
            list = await fetchMasterBadgesShared({ apiBaseUrl });
          } catch {
            list = await loadFromFirestore();
          }
        } else {
          list = await loadFromFirestore();
        }
        if (cancelled) return;
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
        const icon = resolveUniterzAssetUrl(master.icon);
        return {
          ...master,
          ...(icon ? { icon } : {}),
          grantedAt: ub.grantedAt,
        } satisfies ResolvedBadgeNative;
      })
      .filter((b): b is ResolvedBadgeNative => b !== null);
  }, [userBadges, masterBadges]);

  return {
    resolvedBadges,
    loading: userLoading || masterLoading,
  };
}
