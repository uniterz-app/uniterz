export type RankingSnapshotGenerationMeta = {
  updatedAtMs: number;
  rankDeltaBasisDateKey?: string;
};

/** スコア snap（16:00）用。日付にしない（0:00 stampede 防止） */
export const RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK = "nba:static";

/** 行 chrome（Pro Skin / plan / 国旗など）用 */
export const RANKING_UI_GENERATION_STATIC_FALLBACK = "nba-ui:static";

export type RankingListCacheKeys = {
  /** スコア snap 世代 */
  generation: string;
  /** Skin / plan / 国旗など users enrich 世代 */
  uiGeneration: string;
};

/** API / クライアントキャッシュの世代キー（スナップショット再生成で変わる） */
export function buildRankingSnapshotGenerationKey(
  meta: RankingSnapshotGenerationMeta | null | undefined
): string | null {
  if (!meta || !Number.isFinite(meta.updatedAtMs) || meta.updatedAtMs <= 0) {
    return null;
  }
  return `nba:${meta.updatedAtMs}`;
}

export function buildRankingUiGenerationKey(
  updatedAtMs: number | null | undefined
): string | null {
  if (!updatedAtMs || !Number.isFinite(updatedAtMs) || updatedAtMs <= 0) {
    return null;
  }
  return `nba-ui:${updatedAtMs}`;
}

/** クライアントメモリ比較用（score|ui） */
export function rankingListCacheToken(keys: RankingListCacheKeys): string {
  return `${keys.generation}|${keys.uiGeneration}`;
}

/** token / 旧 score-only 文字列からスコア世代を取り出す */
export function scoreGenerationFromListToken(
  token: string | null | undefined
): string | null {
  if (!token) return null;
  const trimmed = token.trim();
  if (!trimmed) return null;
  const pipe = trimmed.indexOf("|");
  return pipe >= 0 ? trimmed.slice(0, pipe) : trimmed;
}

export function isNewerSnapshotGeneration(
  incoming: string | null | undefined,
  cached: string | null | undefined
): boolean {
  if (!incoming) return false;
  if (!cached) return false;
  return incoming !== cached;
}
