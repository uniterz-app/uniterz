/**
 * Web `useProfile` の Firestore 解決（handle / uid → users ドキュメント）。
 */
import { useEffect, useMemo, useState } from "react";
import { db } from "../../lib/firebase";
import { fetchUserDocByRouteKey } from "../../../../../lib/profile/fetchUserDocByRouteKey";
import {
  parseUserProfileFields,
  parseUserProfileViewCount,
  parseUserUnitBalance,
} from "../../../../../lib/profile/parseUserProfileFields";
import { parseMemberSinceMs } from "../../../../../lib/profile/parseMemberSinceMs";
import { parseUserPlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariantField";
import { currentSeasonWinStreak } from "../../../../../lib/profile/currentSeasonWinStreak";
import { seedProfileHeroFromUserDoc } from "../../../../../lib/profile/seedProfileHeroFromUserDoc";
import {
  peekPublicProfileIdentity,
  primePublicProfileIdentity,
} from "../../../../../lib/profile/publicProfileIdentityCache";
import { peekUserDocMemory } from "../../../../../lib/user/userDocMemoryCache";
import { looksLikeFirestoreUid } from "../../../../../lib/profile/profilePathKey";
import { seedNativeProfileStatsFromUserDoc } from "./useNativeProfileStats";
import {
  PROFILE_PLAN_PRO_BG_DEFAULT,
  type ProfilePlanProBgVariant,
} from "../../../../../lib/profile/profilePlanProBgVariants";

export type NativeProfileByHandleState = {
  loading: boolean;
  notFound: boolean;
  /** identity だけ先に揃っている（カード即描画可） */
  identityReady: boolean;
  targetUid: string | null;
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  language: "ja" | "en";
  countryCode: string;
  plan: "free" | "pro";
  planProBgVariant: ProfilePlanProBgVariant;
  currentStreak: number;
  maxStreak: number;
  memberSinceMs: number | null;
  /** 保有 Unit（公開） */
  unitBalance: number;
  profileViewCount: number | null;
};

const idleState: NativeProfileByHandleState = {
  loading: false,
  notFound: false,
  identityReady: false,
  targetUid: null,
  displayName: "",
  handle: "",
  bio: "",
  avatarUrl: "",
  language: "ja",
  countryCode: "",
  plan: "free",
  planProBgVariant: PROFILE_PLAN_PRO_BG_DEFAULT,
  currentStreak: 0,
  maxStreak: 0,
  memberSinceMs: null,
  unitBalance: 0,
  profileViewCount: null,
};

function mapUserDoc(
  id: string,
  data: Record<string, unknown>
): NativeProfileByHandleState {
  const { displayName, handle } = parseUserProfileFields(data);
  const fromFirestorePhoto =
    typeof data.photoURL === "string" && data.photoURL.trim().length > 0
      ? data.photoURL.trim()
      : typeof data.avatarUrl === "string" && data.avatarUrl.trim().length > 0
        ? data.avatarUrl.trim()
        : "";

  return {
    loading: false,
    notFound: false,
    identityReady: true,
    targetUid: id,
    displayName,
    handle: typeof data.handle === "string" ? data.handle.trim() : handle,
    bio: typeof data.bio === "string" ? data.bio : "",
    avatarUrl: fromFirestorePhoto,
    language: data.language === "en" ? "en" : "ja",
    countryCode: typeof data.countryCode === "string" ? data.countryCode : "",
    plan: data.plan === "pro" ? "pro" : "free",
    planProBgVariant: parseUserPlanProBgVariant(data.planProBgVariant),
    currentStreak: currentSeasonWinStreak(
      data.currentStreak,
      data.streakSeasonKeyBasketball
    ),
    maxStreak:
      typeof data.maxStreak === "number" && Number.isFinite(data.maxStreak)
        ? Math.max(0, Math.floor(data.maxStreak))
        : 0,
    memberSinceMs: parseMemberSinceMs(data),
    unitBalance: parseUserUnitBalance(data),
    profileViewCount: parseUserProfileViewCount(data),
  };
}

function seedFromCaches(decoded: string): NativeProfileByHandleState | null {
  if (looksLikeFirestoreUid(decoded)) {
    const mem = peekUserDocMemory(decoded);
    if (mem) return mapUserDoc(decoded, mem);
  }

  const identity = peekPublicProfileIdentity(decoded);
  if (!identity) return null;

  if (identity.targetUid) {
    const mem = peekUserDocMemory(identity.targetUid);
    if (mem) return mapUserDoc(identity.targetUid, mem);
  }

  return {
    ...idleState,
    loading: true,
    identityReady: true,
    targetUid: identity.targetUid,
    displayName: identity.displayName,
    handle: identity.handle || decoded,
    bio: identity.bio,
    avatarUrl: identity.photoURL,
    plan: identity.plan,
    countryCode: identity.countryCode,
  };
}

export function useNativeProfileByHandle(routeKey: string | undefined | null) {
  const decoded = useMemo(() => {
    const raw = typeof routeKey === "string" ? routeKey.trim() : "";
    if (!raw) return "";
    try {
      return decodeURIComponent(raw).trim();
    } catch {
      return raw;
    }
  }, [routeKey]);

  const [state, setState] = useState<NativeProfileByHandleState>(() => {
    if (!decoded) return idleState;
    return seedFromCaches(decoded) ?? { ...idleState, loading: true };
  });

  useEffect(() => {
    if (!decoded) {
      setState(idleState);
      return;
    }

    let cancelled = false;
    const seeded = seedFromCaches(decoded);
    if (seeded) {
      setState(seeded);
    } else {
      setState((prev) => ({
        ...prev,
        loading: true,
        notFound: false,
        identityReady: false,
      }));
    }

    void (async () => {
      try {
        const docSnap = await fetchUserDocByRouteKey(db, decoded);
        if (cancelled) return;

        if (!docSnap) {
          setState({
            ...idleState,
            loading: false,
            notFound: true,
          });
          return;
        }

        const mapped = mapUserDoc(docSnap.id, docSnap.data);
        setState(mapped);
        seedNativeProfileStatsFromUserDoc(docSnap.id, docSnap.data);
        seedProfileHeroFromUserDoc(docSnap.id, docSnap.data);
        primePublicProfileIdentity({
          routeKey: decoded,
          uid: docSnap.id,
          handle: mapped.handle,
          displayName: mapped.displayName,
          bio: mapped.bio,
          photoURL: mapped.avatarUrl,
          plan: mapped.plan,
          countryCode: mapped.countryCode,
          fromUserDoc: true,
        });
      } catch {
        if (cancelled) return;
        setState({
          ...idleState,
          loading: false,
          notFound: true,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [decoded]);

  return { ...state, routeKey: decoded };
}
