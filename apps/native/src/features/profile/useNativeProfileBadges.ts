/**
 * Web `useProfileBadges` と同等（master + user_badges の突合）。
 * Prefetch と hook は同じメモリ / inflight を共有（二重 read しない）。
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
import {
  pickBadgeParticipantCount,
  readGrantParticipantCount,
} from "../../../../../lib/badges/badgeGrant";

export type MasterBadgeNative = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  participantCount?: number;
};

export type ResolvedBadgeNative = MasterBadgeNative & {
  grantedAt: Date | null;
};

export type UserGrantedBadgeNative = {
  badgeId: string;
  grantedAt: Date | null;
  participantCount: number | null;
};

const MASTER_BADGES_TTL_MS = 30 * 60 * 1000;
const USER_BADGES_TTL_MS = 10 * 60 * 1000;

let masterBadgesMemoryCache: { at: number; badges: MasterBadgeNative[] } | null =
  null;
let masterBadgesInflight: Promise<MasterBadgeNative[]> | null = null;

const userBadgesMemoryCache = new Map<
  string,
  { at: number; badges: UserGrantedBadgeNative[] }
>();
const userBadgesInflight = new Map<
  string,
  Promise<UserGrantedBadgeNative[]>
>();

function isFreshMasterCache(now = Date.now()): boolean {
  return (
    !!masterBadgesMemoryCache &&
    now - masterBadgesMemoryCache.at < MASTER_BADGES_TTL_MS
  );
}

function peekUserBadgesCache(
  uid: string
): UserGrantedBadgeNative[] | undefined {
  const hit = userBadgesMemoryCache.get(uid);
  if (!hit || Date.now() - hit.at >= USER_BADGES_TTL_MS) return undefined;
  return hit.badges;
}

async function loadMasterBadgesFromFirestore(): Promise<MasterBadgeNative[]> {
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
      ...(typeof data.participantCount === "number" &&
      Number.isFinite(data.participantCount) &&
      data.participantCount > 0
        ? { participantCount: Math.floor(data.participantCount) }
        : {}),
    });
  });
  return list;
}

async function fetchMasterBadgesOnce(): Promise<MasterBadgeNative[]> {
  if (isFreshMasterCache()) {
    return masterBadgesMemoryCache!.badges;
  }
  if (masterBadgesInflight) return masterBadgesInflight;

  masterBadgesInflight = (async () => {
    let list: MasterBadgeNative[] = [];
    try {
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
          list = await loadMasterBadgesFromFirestore();
        }
      } else {
        list = await loadMasterBadgesFromFirestore();
      }
    } catch {
      list = [];
    }
    masterBadgesMemoryCache = { at: Date.now(), badges: list };
    return list;
  })().finally(() => {
    masterBadgesInflight = null;
  });

  return masterBadgesInflight;
}

async function fetchUserBadgesOnce(
  uid: string
): Promise<UserGrantedBadgeNative[]> {
  const safeUid = uid.trim();
  if (!safeUid) return [];

  const cached = peekUserBadgesCache(safeUid);
  if (cached) return cached;

  const existing = userBadgesInflight.get(safeUid);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const colRef = collection(db, "user_badges", safeUid, "badges");
      const q = query(colRef, orderBy("grantedAt", "desc"));
      const snap = await getDocs(q);
      const list: UserGrantedBadgeNative[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const ga = data.grantedAt;
        return {
          badgeId: (typeof data.badgeId === "string" ? data.badgeId : d.id) as string,
          grantedAt: ga instanceof Timestamp ? ga.toDate() : null,
          participantCount: readGrantParticipantCount(data),
        };
      });
      userBadgesMemoryCache.set(safeUid, { at: Date.now(), badges: list });
      return list;
    } catch {
      return [];
    }
  })().finally(() => {
    userBadgesInflight.delete(safeUid);
  });

  userBadgesInflight.set(safeUid, promise);
  return promise;
}

/** Games / タブ押下時 — hook と同じキャッシュへ温める */
export async function prefetchNativeProfileBadges(
  uid: string | undefined | null
): Promise<void> {
  const safeUid = uid?.trim();
  if (!safeUid) return;
  await Promise.all([fetchMasterBadgesOnce(), fetchUserBadgesOnce(safeUid)]);
}

function useUserBadgesNative(uid: string | undefined) {
  const [badges, setBadges] = useState<UserGrantedBadgeNative[]>(() => {
    if (!uid) return [];
    return peekUserBadgesCache(uid) ?? [];
  });
  const [loading, setLoading] = useState(() => {
    if (!uid) return false;
    return peekUserBadgesCache(uid) === undefined;
  });

  useEffect(() => {
    if (!uid) {
      setBadges([]);
      setLoading(false);
      return;
    }
    const userId = uid;
    let cancelled = false;

    const hit = peekUserBadgesCache(userId);
    if (hit) {
      setBadges(hit);
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchUserBadgesOnce(userId).then((list) => {
      if (cancelled) return;
      setBadges(list);
      setLoading(false);
    });

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
  const [loading, setLoading] = useState(() => !isFreshMasterCache());

  useEffect(() => {
    if (isFreshMasterCache()) {
      setBadges(masterBadgesMemoryCache!.badges);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchMasterBadgesOnce().then((list) => {
      if (cancelled) return;
      setBadges(list);
      setLoading(false);
    });
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
        const participantCount = pickBadgeParticipantCount(
          ub.participantCount,
          master.participantCount,
        );
        return {
          ...master,
          ...(icon ? { icon } : {}),
          grantedAt: ub.grantedAt,
          ...(participantCount != null ? { participantCount } : {}),
        } satisfies ResolvedBadgeNative;
      })
      .filter((b): b is ResolvedBadgeNative => b !== null);
  }, [userBadges, masterBadges]);

  return {
    resolvedBadges,
    loading: userLoading || masterLoading,
  };
}
