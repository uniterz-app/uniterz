/**
 * 期間のみ更新した日用 — cumulative_ranking_snapshots/_generation を進める。
 * クライアント CDN キー（?g=）と Next unstable_cache キーを切り替える。
 */
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export async function bumpNbaRankingSnapshotGeneration(): Promise<{
  updatedAtMs: number;
}> {
  const updatedAtMs = Date.now();
  await getFirestore()
    .collection("cumulative_ranking_snapshots")
    .doc("_generation")
    .set(
      {
        updatedAt: FieldValue.serverTimestamp(),
        nba: {
          updatedAtMs,
        },
      },
      { merge: true }
    );
  return { updatedAtMs };
}
