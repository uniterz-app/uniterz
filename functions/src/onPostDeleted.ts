// functions/src/onPostDeletedV2.ts
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

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

    if (!stats) {
      await db.runTransaction(async (tx) => {
        const dailySnap = await tx.get(dailyRef);
        if (!dailySnap.exists) return;

        const dec = {
          posts: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        };

        tx.set(dailyRef, { all: dec, ranking: dec }, { merge: true });

        const leagueKey = before.league ?? null;
        if (leagueKey) {
          tx.set(dailyRef, { leagues: { [leagueKey]: dec } }, { merge: true });
        }

        tx.delete(markerRef);
      });

      return;
    }

    const countRank = stats.countedForRanking !== false;

    const isWin = stats.isWin === true;
    const scoreError = stats.scoreError ?? 0;
    const scorePrecision = stats.scorePrecision ?? 0;
    const hadUpsetGame = stats.hadUpsetGame === true;
    const upsetHit = stats.upsetHit === true;
    const upsetPoints = stats.upsetPoints ?? 0;
    const pointsV3 = stats.pointsV3 ?? 0;
    const leagueKey = before.league ?? null;
    const isWc = String(leagueKey ?? "").toLowerCase() === "wc";
    const exactMatch = stats.exactMatch === true;
    const goalScorerHit = (stats.goalScorerBonus ?? 0) > 0;

    await db.runTransaction(async (tx) => {
      const dailySnap = await tx.get(dailyRef);
      if (!dailySnap.exists) return;

      const markerSnap = await tx.get(markerRef);
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
        scorePrecisionSum: FieldValue.increment(isWc ? 0 : -scorePrecision),
        exactHitCount: FieldValue.increment(isWc && exactMatch ? -1 : 0),
        goalScorerHitCount: FieldValue.increment(goalScorerHit ? -1 : 0),
        pointsSumV3: FieldValue.increment(-pointsV3),
        updatedAt: FieldValue.serverTimestamp(),
      };

      tx.set(dailyRef, { all: dec }, { merge: true });
      if (countRank) {
        tx.set(dailyRef, { ranking: dec }, { merge: true });
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

      tx.delete(markerRef);
    });
  }
);