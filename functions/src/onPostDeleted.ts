// functions/src/onPostDeletedV2.ts
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  applyCumulativeIncrementInTransaction,
  type PostCumulativeContribution,
} from "./rankings/cumulativeFromDaily";
import {
  normalizeNbaSeasonPhase,
  resolveNbaRankingBucketKeys,
} from "./rankings/nbaSeason";

function normalizeLeague(raw?: string | null): string | null {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === "wc" || v === "fifa") return "wc";
  if (v === "nba") return "nba";
  return v || null;
}

function nbaBucketKeysForDelete(
  leagueKey: string | null,
  forRanking: boolean,
  startAt: Timestamp | undefined,
  seasonPhase: unknown
): { nbaSeasonKey: string | null; nbaPlayoffsSeasonKey: string | null } {
  if (!forRanking || leagueKey !== "nba" || !startAt) {
    return { nbaSeasonKey: null, nbaPlayoffsSeasonKey: null };
  }
  return resolveNbaRankingBucketKeys(
    leagueKey,
    forRanking,
    startAt.toDate(),
    normalizeNbaSeasonPhase(seasonPhase)
  );
}

function buildDeleteContribution(
  before: Record<string, unknown>,
  stats: Record<string, unknown>,
  startAt: Timestamp | undefined
): PostCumulativeContribution {
  const leagueKey = normalizeLeague(
    typeof before.league === "string" ? before.league : null
  );
  const isWc = leagueKey === "wc";
  const wcStageRaw = before.wcStage;
  const wcStage =
    wcStageRaw === "qualifying" || wcStageRaw === "main" ? wcStageRaw : null;
  const forRanking =
    stats.countedForRanking !== false && leagueKey !== "wc";
  const { nbaSeasonKey, nbaPlayoffsSeasonKey } = nbaBucketKeysForDelete(
    leagueKey,
    forRanking,
    startAt,
    before.seasonPhase
  );
  return {
    forRanking,
    nbaSeasonKey,
    nbaPlayoffsSeasonKey,
    leagueKey,
    isWc,
    wcStage,
    isWin: stats.isWin === true,
    points: Number(stats.pointsV3 ?? 0),
    upsetPoints: Number(stats.upsetPoints ?? 0),
    exactHit: stats.exactMatch === true,
    goalScorerHit: Number(stats.goalScorerBonus ?? 0) > 0,
    upsetBonus: Number(stats.upsetBonus ?? 0),
    streakBonus: Number(stats.streakBonus ?? 0),
  };
}

function teamIdFromSide(side: unknown): string | null {
  if (!side || typeof side !== "object") return null;
  const id = (side as { teamId?: unknown }).teamId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function uniqueGameTeamIds(
  homeTeamId?: string | null,
  awayTeamId?: string | null
): string[] {
  const ids = [homeTeamId, awayTeamId]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return [...new Set(ids)];
}

function teamDecrementFields(
  teamId: string,
  dec: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(dec)) {
    if (k === "updatedAt") continue;
    out[`teams.${teamId}.${k}`] = v;
  }
  return out;
}

export const onPostDeletedV2 = onDocumentDeleted(
  {
    document: "posts/{postId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const before = snap.data() as any;
    if (!before) return;

    const uid = before.authorUid;
    const stats = before.stats;
    const startAt: Timestamp =
      before.startAtJst ?? before.startAt ?? before.createdAt;
    const gameId =
      typeof before.gameId === "string" ? before.gameId.trim() : "";

    if (uid && gameId) {
      try {
        await getFirestore()
          .doc(`games/${gameId}`)
          .set(
            {
              predictorUids: FieldValue.arrayRemove(uid),
              predictorCount: FieldValue.increment(-1),
            },
            { merge: true }
          );
      } catch (e) {
        console.error("[onPostDeletedV2] predictorUids remove", e);
      }
    }

    if (!uid || !startAt) return;

    const db = getFirestore();

    const d = startAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const markerRef = dailyRef.collection("applied_posts").doc(snap.id);
    const cumulativeRef = db.doc(`cumulative_stats/${uid}`);
    const userRef = db.doc(`users/${uid}`);

    if (!stats) {
      await db.runTransaction(async (tx) => {
        const dailySnap = await tx.get(dailyRef);
        if (!dailySnap.exists) return;

        const markerSnap = await tx.get(markerRef);
        if (!markerSnap.exists) return;

        const dec = {
          posts: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        };

        tx.set(dailyRef, { all: dec, ranking: dec }, { merge: true });

        const leagueKey = before.league ?? null;
        if (leagueKey) {
          tx.set(dailyRef, { leagues: { [leagueKey]: dec } }, { merge: true });
        }

        const userSnap = await tx.get(userRef);
        const user = userSnap.exists ? userSnap.data()! : {};
        applyCumulativeIncrementInTransaction(
          tx,
          cumulativeRef,
          user,
          uid,
          {
            forRanking: true,
            nbaSeasonKey: null,
            nbaPlayoffsSeasonKey: null,
            leagueKey: normalizeLeague(
              typeof before.league === "string" ? before.league : null
            ),
            isWc: false,
            wcStage: null,
            isWin: false,
            points: 0,
            upsetPoints: 0,
            exactHit: false,
            goalScorerHit: false,
            upsetBonus: 0,
            streakBonus: 0,
          },
          -1
        );

        tx.delete(markerRef);
      });

      return;
    }

    const leagueKeyNorm = normalizeLeague(
      typeof before.league === "string" ? before.league : null
    );
    const countRank =
      stats.countedForRanking !== false && leagueKeyNorm !== "wc";

    const isWin = stats.isWin === true;
    const scoreError = stats.scoreError ?? 0;
    const hadUpsetGame = stats.hadUpsetGame === true;
    const upsetHit = stats.upsetHit === true;
    const upsetPoints = stats.upsetPoints ?? 0;
    const pointsV3 = stats.pointsV3 ?? 0;
    const leagueKey = before.league ?? null;
    const exactMatch = stats.exactMatch === true;
    const goalScorerHit = (stats.goalScorerBonus ?? 0) > 0;

    await db.runTransaction(async (tx) => {
      const dailySnap = await tx.get(dailyRef);
      if (!dailySnap.exists) return;

      const markerSnap = await tx.get(markerRef);
      if (!markerSnap.exists) return;

      const marker = markerSnap.data() as
        | {
            homeTeamId?: string | null;
            awayTeamId?: string | null;
            countedForRanking?: boolean;
          }
        | undefined;

      const dec = {
        posts: FieldValue.increment(-1),
        wins: FieldValue.increment(isWin ? -1 : 0),
        scoreErrorSum: FieldValue.increment(-scoreError),
        upsetOpportunityCount: FieldValue.increment(hadUpsetGame ? -1 : 0),
        upsetHitCount: FieldValue.increment(upsetHit ? -1 : 0),
        upsetPickCount: FieldValue.increment(hadUpsetGame ? -1 : 0),
        upsetPointsSum: FieldValue.increment(-upsetPoints),
        exactHitCount: FieldValue.increment(0),
        goalScorerHitCount: FieldValue.increment(goalScorerHit ? -1 : 0),
        pointsSumV3: FieldValue.increment(-pointsV3),
        updatedAt: FieldValue.serverTimestamp(),
      };

      tx.set(dailyRef, { all: dec }, { merge: true });
      if (countRank) {
        tx.set(dailyRef, { ranking: dec }, { merge: true });
      }

      const seasonPhase = before.seasonPhase;
      const { nbaSeasonKey, nbaPlayoffsSeasonKey } = nbaBucketKeysForDelete(
        normalizeLeague(typeof before.league === "string" ? before.league : null),
        countRank,
        startAt,
        seasonPhase
      );
      if (nbaSeasonKey) {
        tx.set(
          dailyRef,
          { rankingBySeason: { [nbaSeasonKey]: dec } },
          { merge: true }
        );
      }
      if (nbaPlayoffsSeasonKey) {
        tx.set(
          dailyRef,
          { rankingByNbaPlayoffs: { [nbaPlayoffsSeasonKey]: dec } },
          { merge: true }
        );
      }

      const leagueKeyInner = before.league ?? null;
      if (leagueKeyInner) {
        tx.set(dailyRef, { leagues: { [leagueKeyInner]: dec } }, { merge: true });
      }

      const gameTeamIds = uniqueGameTeamIds(
        marker?.homeTeamId ??
          teamIdFromSide(before.home) ??
          null,
        marker?.awayTeamId ??
          teamIdFromSide(before.away) ??
          null
      );
      const countTeams =
        marker?.countedForRanking !== false && countRank;
      if (countTeams && gameTeamIds.length > 0) {
        for (const teamId of gameTeamIds) {
          tx.set(dailyRef, teamDecrementFields(teamId, dec), { merge: true });
        }
      }

      const userSnap = await tx.get(userRef);
      const user = userSnap.exists ? userSnap.data()! : {};
      applyCumulativeIncrementInTransaction(
        tx,
        cumulativeRef,
        user,
        uid,
        buildDeleteContribution(before, stats, startAt),
        -1
      );

      tx.delete(markerRef);
    });
  }
);