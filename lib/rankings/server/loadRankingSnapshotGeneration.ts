import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  buildRankingSnapshotGenerationKey,
  buildRankingUiGenerationKey,
  RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK,
  RANKING_UI_GENERATION_STATIC_FALLBACK,
  type RankingListCacheKeys,
  type RankingSnapshotGenerationMeta,
} from "@/lib/rankings/rankingSnapshotGeneration";

export {
  RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK,
  RANKING_UI_GENERATION_STATIC_FALLBACK,
};

type GenerationDoc = {
  nba?: RankingSnapshotGenerationMeta;
  nbaUi?: { updatedAtMs?: unknown };
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

function uiMsFromBlock(raw: unknown): number | null {
  if (!raw || typeof raw !== "object") return null;
  const ms = Number((raw as { updatedAtMs?: unknown }).updatedAtMs);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return ms;
}

/**
 * cumulative_ranking_snapshots/_generation から一覧キャッシュ世代を取得。
 * TTL は短め。revalidate / UI bump 時は clear する。
 */
const GENERATION_MEM_TTL_MS = 30 * 1000;
let generationMemCache: { keys: RankingListCacheKeys; at: number } | null =
  null;
let generationInflight: Promise<RankingListCacheKeys> | null = null;

export function clearRankingSnapshotGenerationMemCache(): void {
  generationMemCache = null;
  generationInflight = null;
}

function keysFromDoc(d: GenerationDoc | undefined): RankingListCacheKeys {
  const meta = metaFromBlock(d?.nba);
  const generation =
    buildRankingSnapshotGenerationKey(meta) ??
    RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK;
  const uiGeneration =
    buildRankingUiGenerationKey(uiMsFromBlock(d?.nbaUi)) ??
    RANKING_UI_GENERATION_STATIC_FALLBACK;
  return { generation, uiGeneration };
}

export async function loadRankingListCacheKeys(): Promise<RankingListCacheKeys> {
  const now = Date.now();
  if (
    generationMemCache &&
    now - generationMemCache.at < GENERATION_MEM_TTL_MS
  ) {
    return generationMemCache.keys;
  }
  if (generationInflight) return generationInflight;

  generationInflight = (async () => {
    try {
      const snap = await getAdminDb()
        .collection("cumulative_ranking_snapshots")
        .doc("_generation")
        .get();
      const keys = snap.exists
        ? keysFromDoc(snap.data() as GenerationDoc)
        : {
            generation: RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK,
            uiGeneration: RANKING_UI_GENERATION_STATIC_FALLBACK,
          };
      generationMemCache = { keys, at: Date.now() };
      return keys;
    } catch {
      if (generationMemCache) return generationMemCache.keys;
      return {
        generation: RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK,
        uiGeneration: RANKING_UI_GENERATION_STATIC_FALLBACK,
      };
    } finally {
      generationInflight = null;
    }
  })();

  return generationInflight;
}

/** @deprecated 互換 — score 世代のみ */
export async function loadRankingSnapshotGenerationKey(): Promise<string> {
  const keys = await loadRankingListCacheKeys();
  return keys.generation;
}

/** Pro Skin / プロフィール chrome 変更時。CDN `u=` を進める */
export async function bumpRankingUiGeneration(): Promise<{
  updatedAtMs: number;
}> {
  const updatedAtMs = Date.now();
  await getAdminDb()
    .collection("cumulative_ranking_snapshots")
    .doc("_generation")
    .set(
      {
        updatedAt: FieldValue.serverTimestamp(),
        nbaUi: { updatedAtMs },
      },
      { merge: true }
    );
  clearRankingSnapshotGenerationMemCache();
  return { updatedAtMs };
}
