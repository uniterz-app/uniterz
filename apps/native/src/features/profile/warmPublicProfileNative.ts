/**
 * 他人プロフィール遷移直前の warm（identity + users + stats/badges）。
 * 押下と同時に fire-and-forget。画面は identity seed で即描画する。
 */
import type { RankingRowWithCountry } from "../../../../../lib/rankings/rankingMetrics";
import { profilePathKeyFromRow } from "../../../../../lib/profile/profilePathKey";
import { primePublicProfileIdentity } from "../../../../../lib/profile/publicProfileIdentityCache";
import { seedProfileHeroFromUserDoc } from "../../../../../lib/profile/seedProfileHeroFromUserDoc";
import { fetchUserDocByRouteKey } from "../../../../../lib/profile/fetchUserDocByRouteKey";
import { db } from "../../lib/firebase";
import { loadProfileUserDocNative } from "./profileUserDocCacheNative";
import { prefetchNativeProfileBadges } from "./useNativeProfileBadges";
import {
  prefetchNativeProfileStats,
  primeNativeProfileStatsFromRankingRow,
  seedNativeProfileStatsFromUserDoc,
} from "./useNativeProfileStats";

export type WarmPublicProfileNativeInput = {
  routeKey: string;
  uid?: string | null;
  handle?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  plan?: "free" | "pro" | string | null;
  countryCode?: string | null;
  posts?: number | null;
  /** ランキング行があるとき（グループ期間集計は skipStatsPrime） */
  rankingRow?: RankingRowWithCountry | null;
  skipStatsPrime?: boolean;
  rankHints?: {
    totalPointsRank?: number | null;
    totalPointsDenominator?: number | null;
  };
};

function warmFromUserDoc(uid: string, data: Record<string, unknown>): void {
  seedNativeProfileStatsFromUserDoc(uid, data);
  seedProfileHeroFromUserDoc(uid, data);
  void prefetchNativeProfileBadges(uid);
  void prefetchNativeProfileStats(uid);
}

/**
 * 同期: identity を即 seed。非同期: users / stats / badges を裏で温める。
 */
export function warmPublicProfileNative(
  input: WarmPublicProfileNativeInput
): void {
  const routeKey = input.routeKey.trim();
  if (!routeKey) return;

  const row = input.rankingRow ?? null;
  const uid =
    (typeof input.uid === "string" ? input.uid.trim() : "") ||
    (typeof row?.uid === "string" ? row.uid.trim() : "");
  const handle =
    (typeof input.handle === "string" ? input.handle.trim() : "") ||
    (typeof row?.handle === "string" ? row.handle.trim() : "");
  const displayName =
    input.displayName ??
    (typeof row?.displayName === "string" ? row.displayName : null);
  const photoURL =
    input.photoURL ??
    (typeof row?.photoURL === "string" ? row.photoURL : null);
  const plan = input.plan ?? row?.plan ?? null;
  const countryCode =
    input.countryCode ??
    (typeof row?.countryCode === "string" ? row.countryCode : null);
  const posts =
    input.posts ?? (typeof row?.posts === "number" ? row.posts : null);

  primePublicProfileIdentity({
    routeKey,
    uid: uid || null,
    handle: handle || null,
    displayName,
    photoURL,
    plan,
    countryCode,
    posts,
  });

  if (uid && row && !input.skipStatsPrime) {
    primeNativeProfileStatsFromRankingRow(uid, row, "nba", input.rankHints);
  }

  if (uid) {
    void (async () => {
      const loaded = await loadProfileUserDocNative(uid);
      if (!loaded?.exists) return;
      warmFromUserDoc(uid, loaded.data);
      primePublicProfileIdentity({
        routeKey,
        uid,
        handle:
          typeof loaded.data.handle === "string"
            ? loaded.data.handle
            : handle,
        displayName:
          typeof loaded.data.displayName === "string"
            ? loaded.data.displayName
            : displayName,
        bio: typeof loaded.data.bio === "string" ? loaded.data.bio : "",
        photoURL:
          typeof loaded.data.photoURL === "string"
            ? loaded.data.photoURL
            : photoURL,
        plan: loaded.data.plan === "pro" ? "pro" : "free",
        countryCode:
          typeof loaded.data.countryCode === "string"
            ? loaded.data.countryCode
            : countryCode,
        posts:
          typeof (loaded.data.counts as { posts?: number } | undefined)
            ?.posts === "number"
            ? (loaded.data.counts as { posts: number }).posts
            : posts,
        fromUserDoc: true,
      });
    })();
    return;
  }

  void (async () => {
    const docSnap = await fetchUserDocByRouteKey(db, routeKey);
    if (!docSnap) return;
    warmFromUserDoc(docSnap.id, docSnap.data);
    primePublicProfileIdentity({
      routeKey,
      uid: docSnap.id,
      handle:
        typeof docSnap.data.handle === "string"
          ? docSnap.data.handle
          : handle,
      displayName:
        typeof docSnap.data.displayName === "string"
          ? docSnap.data.displayName
          : displayName,
      bio: typeof docSnap.data.bio === "string" ? docSnap.data.bio : "",
      photoURL:
        typeof docSnap.data.photoURL === "string"
          ? docSnap.data.photoURL
          : photoURL,
      plan: docSnap.data.plan === "pro" ? "pro" : "free",
      countryCode:
        typeof docSnap.data.countryCode === "string"
          ? docSnap.data.countryCode
          : countryCode,
      fromUserDoc: true,
    });
  })();
}

/** ランキング行から routeKey を決めて warm */
export function warmPublicProfileFromRankingRowNative(
  row: RankingRowWithCountry,
  options?: {
    skipStatsPrime?: boolean;
    rankHints?: WarmPublicProfileNativeInput["rankHints"];
  }
): string | null {
  const routeKey = profilePathKeyFromRow(row);
  if (!routeKey) return null;
  warmPublicProfileNative({
    routeKey,
    rankingRow: row,
    skipStatsPrime: options?.skipStatsPrime,
    rankHints: options?.rankHints,
  });
  return routeKey;
}
