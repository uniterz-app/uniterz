import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  buildRankingSnapshotGenerationKey,
  type RankingSnapshotGenerationMeta,
} from "@/lib/rankings/rankingSnapshotGeneration";

type GenerationDoc = {
  nba?: RankingSnapshotGenerationMeta;
};

/** `_generation` が無いときの安定キー。日付にしない（0:00 stampede 防止） */
export const RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK = "nba:static";

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
const GENERATION_MEM_TTL_MS = 5 * 60 * 1000;
let generationMemCache: { key: string; at: number } | null = null;
let generationInflight: Promise<string> | null = null;

export async function loadRankingSnapshotGenerationKey(): Promise<string> {
  const now = Date.now();
  if (
    generationMemCache &&
    now - generationMemCache.at < GENERATION_MEM_TTL_MS
  ) {
    return generationMemCache.key;
  }
  if (generationInflight) return generationInflight;

  generationInflight = (async () => {
    try {
      const snap = await getAdminDb()
        .collection("cumulative_ranking_snapshots")
        .doc("_generation")
        .get();
      if (!snap.exists) {
        generationMemCache = {
          key: RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK,
          at: Date.now(),
        };
        return generationMemCache.key;
      }

      const d = snap.data() as GenerationDoc;
      const meta = metaFromBlock(d.nba);
      const key =
        buildRankingSnapshotGenerationKey(meta) ??
        RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK;
      generationMemCache = { key, at: Date.now() };
      return key;
    } catch {
      if (generationMemCache) return generationMemCache.key;
      return RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK;
    } finally {
      generationInflight = null;
    }
  })();

  return generationInflight;
}
