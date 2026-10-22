/**
 * NBA settle 後に users.profileHeroSnapshot を増分更新（cumulative_stats 非読）。
 */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  normalizeNbaSeasonPhase,
  resolveNbaRankingBucketKeys,
} from "../rankings/nbaSeason";
import {
  CURRENT_NBA_SEASON_KEY,
  emptyHeroSnapshot,
  incrementHeroScope,
  parseStoredHeroSnapshot,
} from "./profileHeroSnapshot";

/** users を読んだあとのヒーロー差分。同じ投稿の再実行なら null */
export function buildHeroSettlePatch(
  user: Record<string, unknown>,
  opts: {
    postId: string;
    startAt: FirebaseFirestore.Timestamp | Date | null | undefined;
    league: string | null | undefined;
    countsForRanking: boolean;
    isPickup: boolean;
    seasonPhase: string | null | undefined;
    isWin: boolean;
    points: number;
    upsetPoints: number;
    upsetBonus: number;
    streakBonus: number;
    goalScorerHit: boolean;
    hadUpsetGame: boolean;
    upsetHit: boolean;
    activeWinStreak: number;
  }
): Record<string, unknown> | null {
  const leagueKey = String(opts.league ?? "").trim().toLowerCase();
  if (!opts.countsForRanking || leagueKey !== "nba") return null;

  const startDate =
    opts.startAt && typeof (opts.startAt as { toDate?: () => Date }).toDate === "function"
      ? (opts.startAt as FirebaseFirestore.Timestamp).toDate()
      : opts.startAt instanceof Date
        ? opts.startAt
        : new Date();
  const phase = normalizeNbaSeasonPhase(opts.seasonPhase);
  const { nbaSeasonKey, nbaPlayoffsSeasonKey } = resolveNbaRankingBucketKeys(
    "nba",
    true,
    startDate,
    phase
  );
  const incSeason = opts.isPickup && Boolean(nbaSeasonKey);
  const incPlayoffs = Boolean(nbaPlayoffsSeasonKey);
  if (!incSeason && !incPlayoffs) return null;

  const seasonKey = nbaSeasonKey ?? nbaPlayoffsSeasonKey ?? CURRENT_NBA_SEASON_KEY;
  const inc = {
    isWin: opts.isWin,
    points: opts.points,
    upsetPoints: opts.upsetPoints,
    upsetBonus: opts.upsetBonus,
    streakBonus: opts.streakBonus,
    goalScorerHit: opts.goalScorerHit,
    hadUpsetGame: opts.hadUpsetGame,
    upsetHit: opts.upsetHit,
  };
  let hero = parseStoredHeroSnapshot(user);
  if (!hero || hero.seasonKey !== seasonKey) {
    hero = emptyHeroSnapshot(seasonKey);
  }
  if (hero.lastPostId === opts.postId) return null;
  if (incSeason) hero.season = incrementHeroScope(hero.season, inc);
  if (incPlayoffs) hero.playoffs = incrementHeroScope(hero.playoffs, inc);
  hero.activeWinStreak = Math.max(0, Math.floor(opts.activeWinStreak || 0));
  hero.updatedAtMs = Date.now();
  hero.lastPostId = opts.postId;
  return {
    profileHeroSnapshot: hero,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export async function syncProfileHeroSnapshotOnNbaSettle(opts: {
  uid: string;
  postId: string;
  startAt: FirebaseFirestore.Timestamp | Date | null | undefined;
  league: string | null | undefined;
  countsForRanking: boolean;
  isPickup: boolean;
  seasonPhase: string | null | undefined;
  isWin: boolean;
  points: number;
  upsetPoints: number;
  upsetBonus: number;
  streakBonus: number;
  goalScorerHit: boolean;
  hadUpsetGame: boolean;
  upsetHit: boolean;
  activeWinStreak: number;
}): Promise<void> {
  const db = getFirestore();
  const userRef = db.doc(`users/${opts.uid}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const user = (snap.exists ? snap.data() : {}) as Record<string, unknown>;
    const patch = buildHeroSettlePatch(user, opts);
    if (!patch) return;
    tx.set(userRef, patch, { merge: true });
  });
}

/**
 * 日次 rank snapshot 後 — cumulative から hero を再構築（順位 + ドリフト補正）。
 */
export async function refreshProfileHeroSnapshotFromCumulative(
  uid: string,
  cumulative: Record<string, unknown> | null | undefined,
  seasonKey: string
): Promise<void> {
  const { buildProfileHeroSnapshotFromCumulative } = await import(
    "./profileHeroSnapshot"
  );
  const hero = buildProfileHeroSnapshotFromCumulative(cumulative, seasonKey);
  await getFirestore()
    .doc(`users/${uid}`)
    .set(
      {
        profileHeroSnapshot: hero,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}
