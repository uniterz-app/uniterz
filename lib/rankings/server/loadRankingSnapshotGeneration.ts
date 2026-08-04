import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  buildRankingSnapshotGenerationKey,
  type RankingSnapshotGenerationMeta,
} from "@/lib/rankings/rankingSnapshotGeneration";

type GenerationDoc = {
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
const GENERATION_MEM_TTL_MS = 30_000;
let generationMemCache: { key: string | null; at: number } | null = null;

export async function loadRankingSnapshotGenerationKey(): Promise<string | null> {
  const now = Date.now();
  if (
    generationMemCache &&
    now - generationMemCache.at < GENERATION_MEM_TTL_MS
  ) {
    return generationMemCache.key;
  }

  const snap = await getAdminDb()
    .collection("cumulative_ranking_snapshots")
    .doc("_generation")
    .get();
  if (!snap.exists) {
    generationMemCache = { key: null, at: now };
    return null;
  }

  const d = snap.data() as GenerationDoc;
  const meta = metaFromBlock(d.nba);
  const key = buildRankingSnapshotGenerationKey(meta);
  generationMemCache = { key, at: now };
  return key;
}
