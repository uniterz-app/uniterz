/**
 * games.topScorerCandidates / leadingScorers の管理と再採点。
 */

import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  calcNbaTopScorerBonus,
  normalizeNbaLeadingScorers,
  type NbaLeadingScorer,
} from "@/lib/nba/topScorer";
import { FieldValue } from "firebase-admin/firestore";

export async function resettleNbaTopScorerBonusesForGame(
  gameId: string,
  leadingScorers: NbaLeadingScorer[]
): Promise<{ updated: number }> {
  const db = getAdminDb();
  const postsSnap = await db
    .collection("posts")
    .where("gameId", "==", gameId)
    .where("schemaVersion", "==", 2)
    .get();

  let updated = 0;
  const batch = db.batch();
  let ops = 0;

  for (const doc of postsSnap.docs) {
    const p = doc.data();
    if (!p.settledAt) continue;

    const newBonus = calcNbaTopScorerBonus("nba", p.prediction, leadingScorers);
    const oldBonus = Number(p.stats?.goalScorerBonus ?? 0);
    if (newBonus === oldBonus) continue;

    const delta = newBonus - oldBonus;
    const oldTotal = Number(p.stats?.pointsV3 ?? p.stats?.totalPoints ?? 0);
    const nextTotal = Math.max(0, oldTotal + delta);

    batch.update(doc.ref, {
      "stats.goalScorerBonus": newBonus,
      "stats.pointsV3": nextTotal,
      "stats.pointsV3Detail.goalScorerBonus": newBonus,
      updatedAt: FieldValue.serverTimestamp(),
    });
    updated += 1;
    ops += 1;
    if (ops >= 400) break;
  }

  if (ops > 0) await batch.commit();
  return { updated };
}

export function leadingScorersPayload(
  list: NbaLeadingScorer[]
): Array<{ playerId: string; teamId: string; points: number; name?: string }> {
  return normalizeNbaLeadingScorers(list).map((g) => ({
    playerId: g.playerId,
    teamId: g.teamId,
    points: g.points,
    ...(g.name ? { name: g.name } : {}),
  }));
}
