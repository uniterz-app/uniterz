/**
 * ランキングバッジ付与の共通処理。
 * 付与した時点の参加者数（その回・その部門の投稿者数）を user_badges.meta と
 * master_badges に固定する。以後スナップショットが変わっても表示は動かない。
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { userBadgeGrantFields, type BadgeGrantMeta } from "../badgeGrant";
import { splitRankingBadgeId } from "../rankingBadgeId";
import { loadBadgeParticipantCounts } from "./loadBadgeParticipantCounts";
import { stampMasterBadgeParticipantCount } from "./stampMasterBadgeParticipantCount";

export type RankingBadgeGrant = {
  uid: string;
  badgeId: string;
  meta?: Omit<BadgeGrantMeta, "participantCount">;
};

export async function grantRankingBadges(
  db: Firestore,
  grants: readonly RankingBadgeGrant[],
  opts: { dryRun?: boolean } = {}
): Promise<{
  written: number;
  participantCountByBadge: Map<string, number>;
  missingParticipantCount: string[];
}> {
  const badgeIds = [...new Set(grants.map((g) => g.badgeId))];
  for (const id of badgeIds) {
    if (splitRankingBadgeId(id).legacy) {
      throw new Error(
        `grantRankingBadges: ${id} に部門（pickup_ / pro_）がありません`
      );
    }
  }

  const counts = await loadBadgeParticipantCounts(db, badgeIds);
  const missing = badgeIds.filter((id) => !counts.has(id));

  if (opts.dryRun) {
    return {
      written: 0,
      participantCountByBadge: counts,
      missingParticipantCount: missing,
    };
  }

  let batch = db.batch();
  let ops = 0;
  let written = 0;
  for (const g of grants) {
    const fields = userBadgeGrantFields({
      badgeId: g.badgeId,
      meta: {
        ...(g.meta ?? {}),
        division: splitRankingBadgeId(g.badgeId).division,
        participantCount: counts.get(g.badgeId),
      },
    });
    batch.set(
      db.collection("user_badges").doc(g.uid).collection("badges").doc(g.badgeId),
      { ...fields, grantedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    ops++;
    written++;
    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();

  for (const [id, n] of counts) {
    await stampMasterBadgeParticipantCount(db, [id], n);
  }

  return {
    written,
    participantCountByBadge: counts,
    missingParticipantCount: missing,
  };
}
