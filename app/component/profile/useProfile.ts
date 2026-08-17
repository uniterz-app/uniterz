// app/component/profile/useProfile.ts
"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import { prefetchProfileSettledTodayResults } from "@/lib/profile/useProfileSettledTodayResults";
import { primeProfileStatsFromRankingRow } from "./useUserStatsV2";
import { db } from "@/lib/firebase";
import { fetchUserDocByRouteKey } from "@/lib/profile/fetchUserDocByRouteKey";
import {
  parseUserProfileFields,
  parseUserUnitBalance,
  profileDisplayFromUser,
} from "@/lib/profile/parseUserProfileFields";
import { parseMemberSinceMs } from "@/lib/profile/parseMemberSinceMs";
import type { RankingRowWithCountry, MobileMetric } from "@/lib/rankings/rankingMetrics";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { parseUserPlanProBgVariant } from "@/lib/profile/profilePlanProBgVariantField";
import { currentSeasonWinStreak } from "@/lib/profile/currentSeasonWinStreak";
import { seedProfileHeroFromUserDoc } from "@/lib/profile/seedProfileHeroFromUserDoc";

export type Profile = {
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  counts: { posts: number };
  currentStreak: number;
  maxStreak: number;
  plan: "free" | "pro";
  planProBgVariant: ProfilePlanProBgVariant;
  countryCode: string | null;
  memberSinceMs: number | null;
  /** 保有 Unit（公開表示） */
  unitBalance: number;
};

type UserState = {
  displayName?: string;
  handle?: string;
  bio?: string;
  photoURL?: string;
  currentStreak?: number;
  maxStreak?: number;
  plan?: "free" | "pro";
  planProBgVariant?: ProfilePlanProBgVariant;
  countryCode?: string | null;
  memberSinceMs?: number | null;
  unitBalance?: number;
} | null;

type Counts = {
  posts: number;
};

function parseCountryCode(data: Record<string, unknown>): string | null {
  const raw = data.countryCode;
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return code.length >= 2 ? code : null;
}

const EMPTY_COUNTS: Counts = {
  posts: 0,
};

type ProfileLoadState = {
  loading: boolean;
  /** Firestore users 本文。ランキング先行キャッシュでは false */
  userDocReady: boolean;
  targetUid: string | null;
  user: UserState;
  counts: Counts;
};

const initialLoadState: ProfileLoadState = {
  loading: true,
  userDocReady: false,
  targetUid: null,
  user: null,
  counts: EMPTY_COUNTS,
};

const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
const profileCache = new Map<string, { at: number; state: ProfileLoadState }>();

export function invalidateAllProfileCache(): void {
  profileCache.clear();
}

function normalizeProfileCacheKey(key: string): string {
  return decodeURIComponent(key).trim().toLowerCase();
}

function readProfileCache(key: string): ProfileLoadState | null {
  const cached = profileCache.get(normalizeProfileCacheKey(key));
  if (!cached) return null;
  if (Date.now() - cached.at > PROFILE_CACHE_TTL_MS) return null;
  return { ...cached.state };
}

function writeProfileCache(
  keys: Array<string | null | undefined>,
  state: ProfileLoadState
) {
  const at = Date.now();
  for (const key of keys) {
    const k = typeof key === "string" ? key.trim() : "";
    if (!k) continue;
    profileCache.set(normalizeProfileCacheKey(k), { at, state });
  }
}

export function primeProfileCacheFromRankingRow(
  routeKey: string,
  row: RankingRowWithCountry,
  statsContext?: {
    rankingLeague: RankingLeagueSource;
    wcStage?: WcRankingStage;
  },
  rankHints?: {
    metric: MobileMetric;
    rank: number;
    participantCount?: number | null;
  },
  options?: {
    /** グループランキング行は期間集計のため、成績サマリー先読みを省略する */
    skipStatsPrime?: boolean;
  }
) {
  const uid = typeof row.uid === "string" ? row.uid.trim() : "";
  const handle = typeof row.handle === "string" ? row.handle.trim() : "";
  const displayName =
    typeof row.displayName === "string" && row.displayName.trim()
      ? row.displayName
      : handle || "User";

  writeProfileCache([routeKey, uid, handle], {
    loading: false,
    // uid がある identity は即描画可（users 本文は裏で上書き）
    userDocReady: uid.length > 0,
    targetUid: uid || null,
    counts: { posts: row.posts ?? 0 },
    user: {
      displayName,
      handle,
      bio: "",
      photoURL: typeof row.photoURL === "string" ? row.photoURL : "",
      currentStreak: 0,
      maxStreak: 0,
      plan: row.plan === "pro" ? "pro" : "free",
    },
  });

  if (uid && statsContext && !options?.skipStatsPrime) {
    primeProfileStatsFromRankingRow(
      uid,
      row,
      statsContext,
      rankHints?.metric === "totalScore"
        ? {
            totalPointsRank: rankHints.rank,
            totalPointsDenominator: rankHints.participantCount ?? null,
          }
        : undefined
    );
    prefetchProfileSettledTodayResults(uid, statsContext);
  }
}

/** リザルト得点上位など、ランキング行以外からの identity + users warm */
export function warmPublicProfileFromListEntry(input: {
  routeKey: string;
  uid?: string | null;
  handle?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  plan?: "free" | "pro" | boolean | null;
  countryCode?: string | null;
  posts?: number | null;
}): void {
  const uid = typeof input.uid === "string" ? input.uid.trim() : "";
  const handle = typeof input.handle === "string" ? input.handle.trim() : "";
  const displayName =
    typeof input.displayName === "string" && input.displayName.trim()
      ? input.displayName.trim()
      : handle || "User";
  const plan: "free" | "pro" =
    input.plan === true || input.plan === "pro" ? "pro" : "free";

  writeProfileCache([input.routeKey, uid, handle], {
    loading: false,
    userDocReady: uid.length > 0,
    targetUid: uid || null,
    counts: { posts: input.posts ?? 0 },
    user: {
      displayName,
      handle,
      bio: "",
      photoURL: typeof input.photoURL === "string" ? input.photoURL : "",
      currentStreak: 0,
      maxStreak: 0,
      plan,
      countryCode:
        typeof input.countryCode === "string" ? input.countryCode : null,
    },
  });

  if (!uid) return;
  void (async () => {
    const { getUserDocDataCached } = await import("@/lib/user/userDocCache");
    const data = await getUserDocDataCached(uid);
    if (!data) return;
    seedProfileHeroFromUserDoc(uid, data);
    const { displayName: dn, handle: hn } = parseUserProfileFields(data);
    writeProfileCache([input.routeKey, uid, hn], {
      loading: false,
      userDocReady: true,
      targetUid: uid,
      counts: {
        posts:
          typeof (data.counts as { posts?: number } | undefined)?.posts ===
          "number"
            ? (data.counts as { posts: number }).posts
            : 0,
      },
      user: {
        displayName: dn,
        handle: hn,
        bio: typeof data.bio === "string" ? data.bio : "",
        photoURL: typeof data.photoURL === "string" ? data.photoURL : "",
        currentStreak: currentSeasonWinStreak(
          data.currentStreak,
          data.streakSeasonKeyBasketball
        ),
        maxStreak: typeof data.maxStreak === "number" ? data.maxStreak : 0,
        plan: data.plan === "pro" ? "pro" : "free",
        planProBgVariant: parseUserPlanProBgVariant(data.planProBgVariant),
        countryCode:
          typeof data.countryCode === "string" ? data.countryCode : null,
        memberSinceMs: parseMemberSinceMs(data),
        unitBalance: parseUserUnitBalance(data),
      },
    });
  })();
}

export function useProfile(handle: string) {
  const decodedHandle = useMemo(() => decodeURIComponent(handle), [handle]);

  const [state, setState] = useState<ProfileLoadState>(() => {
    const cached = readProfileCache(decodedHandle);
    return cached ?? initialLoadState;
  });

  useLayoutEffect(() => {
    const cached = readProfileCache(decodedHandle);
    if (cached) {
      setState(cached);
      return;
    }
    setState({
      ...initialLoadState,
      loading: true,
    });
  }, [decodedHandle]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const docSnap = await fetchUserDocByRouteKey(db, decodedHandle);

        if (cancelled) return;

        if (!docSnap) {
          setState({
            loading: false,
            userDocReady: true,
            targetUid: null,
            user: null,
            counts: EMPTY_COUNTS,
          });
          return;
        }

        const d = docSnap.data;
        const { displayName, handle: userHandle } = parseUserProfileFields(d);

        const rawPlan = d.plan;
        const plan: "free" | "pro" = rawPlan === "pro" ? "pro" : "free";
        const countsRaw = d.counts as { posts?: number } | undefined;

        seedProfileHeroFromUserDoc(docSnap.id, d);

        const nextState: ProfileLoadState = {
          loading: false,
          userDocReady: true,
          targetUid: docSnap.id,
          counts: {
            posts: countsRaw?.posts ?? 0,
          },
          user: {
            displayName,
            handle: userHandle,
            bio: typeof d.bio === "string" ? d.bio : "",
            photoURL: typeof d.photoURL === "string" ? d.photoURL : "",
            currentStreak: currentSeasonWinStreak(
              d.currentStreak,
              d.streakSeasonKeyBasketball
            ),
            maxStreak: typeof d.maxStreak === "number" ? d.maxStreak : 0,
            plan,
            planProBgVariant: parseUserPlanProBgVariant(d.planProBgVariant),
            countryCode: parseCountryCode(d),
            memberSinceMs: parseMemberSinceMs(d),
            unitBalance: parseUserUnitBalance(d),
          },
        };
        writeProfileCache([decodedHandle, docSnap.id, userHandle], nextState);
        setState(nextState);
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [decodedHandle]);

  const { user, counts, targetUid, loading, userDocReady } = state;

  const profile: Profile = useMemo(() => {
    const u = user ?? {};
    const placeholder = loading && user === null;
    const { displayName, handle: profileHandle } = profileDisplayFromUser(
      u,
      decodedHandle,
      placeholder
    );

    return {
      displayName,
      handle: profileHandle,
      bio: u.bio ?? "",
      avatarUrl: u.photoURL && u.photoURL.trim() ? u.photoURL : "",
      counts,
      currentStreak: u.currentStreak ?? 0,
      maxStreak: u.maxStreak ?? 0,
      plan: u.plan ?? "free",
      planProBgVariant: u.planProBgVariant ?? parseUserPlanProBgVariant(undefined),
      countryCode: u.countryCode ?? null,
      memberSinceMs: u.memberSinceMs ?? null,
      unitBalance: u.unitBalance ?? 0,
    };
  }, [user, decodedHandle, counts, loading]);

  return {
    profile,
    loading,
    userDocReady,
    counts,
    targetUid,
  };
}
