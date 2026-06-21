import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  calcWcGoalScorerBonus,
  type WcGameGoalScorer,
} from "@/lib/wc/goalScorer";
import { buildPostMatchGoalScorersGrouped } from "@/lib/wc/matchGoalScorers";

const BATCH_LIMIT = 400;

/**
 * 終了済み WC 試合で得点者データを後から入れたとき、
 * 精算済み投稿の得点者ボーナス・総合得点・実得点者表示を更新する。
 */
export async function resettleWcGoalScorerBonusesForGame(
  db: Firestore,
  gameId: string,
  goalScorers: WcGameGoalScorer[],
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): Promise<{ updated: number }> {
  const matchGoalScorers = buildPostMatchGoalScorersGrouped(
    goalScorers,
    homeTeamId,
    awayTeamId
  );

  const postsSnap = await db
    .collection("posts")
    .where("gameId", "==", gameId)
    .where("schemaVersion", "==", 2)
    .get();

  let updated = 0;
  let batch = db.batch();
  let ops = 0;

  const commitBatch = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const doc of postsSnap.docs) {
    const p = doc.data();
    if (String(p.league ?? "").toLowerCase() !== "wc") continue;
    if (!p.settledAt) continue;

    const oldBonus = Number(
      p.stats?.goalScorerBonus ?? p.stats?.pointsV3Detail?.goalScorerBonus ?? 0
    );
    const newBonus = calcWcGoalScorerBonus("wc", p.prediction, goalScorers);
    if (!Number.isFinite(oldBonus) || !Number.isFinite(newBonus)) continue;

    const bonusChanged = Math.abs(oldBonus - newBonus) >= 1e-6;
    const oldMatch = JSON.stringify(p.matchGoalScorers ?? []);
    const newMatch = JSON.stringify(matchGoalScorers);
    const scorersChanged = oldMatch !== newMatch;

    if (!bonusChanged && !scorersChanged) continue;

    const patch: Record<string, unknown> = {
      matchGoalScorers,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (bonusChanged) {
      const oldPoints = Number(p.stats?.pointsV3 ?? 0);
      const newPoints = oldPoints - oldBonus + newBonus;
      patch["stats.goalScorerBonus"] = newBonus;
      patch["stats.pointsV3"] = newPoints;
      patch["stats.pointsV3Detail.goalScorerBonus"] = newBonus;
    }

    batch.update(doc.ref, patch);
    updated += 1;
    ops += 1;

    if (ops >= BATCH_LIMIT) {
      await commitBatch();
    }
  }

  await commitBatch();
  return { updated };
}
