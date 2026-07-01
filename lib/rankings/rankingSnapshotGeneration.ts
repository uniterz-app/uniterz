import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export type RankingSnapshotGenerationMeta = {
  updatedAtMs: number;
  rankDeltaBasisDateKey?: string;
};

/** API / クライアントキャッシュの世代キー（スナップショット再生成で変わる） */
export function buildRankingSnapshotGenerationKey(
  wcStage: WcRankingStage | null,
  meta: RankingSnapshotGenerationMeta | null | undefined
): string | null {
  if (!meta || !Number.isFinite(meta.updatedAtMs) || meta.updatedAtMs <= 0) {
    return null;
  }
  if (wcStage) return `wc:${wcStage}:${meta.updatedAtMs}`;
  return `nba:${meta.updatedAtMs}`;
}

export function isNewerSnapshotGeneration(
  incoming: string | null | undefined,
  cached: string | null | undefined
): boolean {
  if (!incoming) return false;
  if (!cached) return false;
  return incoming !== cached;
}
