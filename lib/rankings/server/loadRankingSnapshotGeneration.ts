import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  buildRankingSnapshotGenerationKey,
  type RankingSnapshotGenerationMeta,
} from "@/lib/rankings/rankingSnapshotGeneration";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

type GenerationDoc = {
  wc?: RankingSnapshotGenerationMeta;
  nba?: RankingSnapshotGenerationMeta;
};

function metaFromBlock(raw: unknown): RankingSnapshotGenerationMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const updatedAtMs = Number(o.updatedAtMs);
  if (!Number.isFinite(updatedAtMs) || updatedAtMs <= 0) return null;
  const rankDeltaBasisDateKey =
    typeof o.rankDeltaBasisDateKey === "string"
      ? o.rankDeltaBasisDateKey
      : undefined;
  return { updatedAtMs, rankDeltaBasisDateKey };
}

/** cumulative_ranking_snapshots/_generation から一覧キャッシュ世代を取得 */
export async function loadRankingSnapshotGenerationKey(
  wcStage: WcRankingStage | null
): Promise<string | null> {
  const snap = await getAdminDb()
    .collection("cumulative_ranking_snapshots")
    .doc("_generation")
    .get();
  if (!snap.exists) return null;

  const d = snap.data() as GenerationDoc;
  const meta = wcStage ? metaFromBlock(d.wc) : metaFromBlock(d.nba);
  return buildRankingSnapshotGenerationKey(wcStage, meta);
}
