/**
 * ランキング一覧のキャッシュ世代。
 * - generation (g=): 16:00 スコア snap
 * - uiGeneration (u=): Pro Skin / plan / 国旗など users enrich
 * 日中は長寿命 CDN。世代が進んだときだけ URL が変わり取り直す。
 */
import {
  RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK,
  RANKING_UI_GENERATION_STATIC_FALLBACK,
  rankingListCacheToken,
  type RankingListCacheKeys,
} from "@/lib/rankings/rankingSnapshotGeneration";

export type { RankingListCacheKeys };
export { rankingListCacheToken };

const CLIENT_GEN_TTL_MS = 30_000;

let clientGenMem: { keys: RankingListCacheKeys; at: number } | null = null;
let clientGenInflight: Promise<RankingListCacheKeys> | null = null;

function generationUrl(apiBaseUrl?: string | null): string {
  const base = (apiBaseUrl ?? "").replace(/\/$/, "");
  return `${base}/api/ranking-snapshot-generation`;
}

const STATIC_KEYS: RankingListCacheKeys = {
  generation: RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK,
  uiGeneration: RANKING_UI_GENERATION_STATIC_FALLBACK,
};

/** 現在の一覧キャッシュキー。失敗時は static */
export async function fetchRankingListCacheKeys(
  apiBaseUrl?: string | null
): Promise<RankingListCacheKeys> {
  const now = Date.now();
  if (clientGenMem && now - clientGenMem.at < CLIENT_GEN_TTL_MS) {
    return clientGenMem.keys;
  }
  if (clientGenInflight) return clientGenInflight;

  clientGenInflight = (async () => {
    try {
      const res = await fetch(generationUrl(apiBaseUrl), {
        cache: "no-cache",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        generation?: string;
        uiGeneration?: string;
      };
      const generation =
        json?.ok && typeof json.generation === "string" && json.generation.trim()
          ? json.generation.trim()
          : RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK;
      const uiGeneration =
        json?.ok &&
        typeof json.uiGeneration === "string" &&
        json.uiGeneration.trim()
          ? json.uiGeneration.trim()
          : RANKING_UI_GENERATION_STATIC_FALLBACK;
      const keys = { generation, uiGeneration };
      clientGenMem = { keys, at: Date.now() };
      return keys;
    } catch {
      if (clientGenMem) return clientGenMem.keys;
      return STATIC_KEYS;
    } finally {
      clientGenInflight = null;
    }
  })();

  return clientGenInflight;
}

/**
 * @deprecated 互換 — token 文字列（score|ui）
 * 新規は fetchRankingListCacheKeys + rankingListCacheToken を使う
 */
export async function fetchRankingSnapshotGeneration(
  apiBaseUrl?: string | null
): Promise<string> {
  const keys = await fetchRankingListCacheKeys(apiBaseUrl);
  return rankingListCacheToken(keys);
}

/** bulk クエリに g= / u= を載せる（CDN キー分離） */
export function appendRankingListCacheParams(
  params: URLSearchParams,
  keys: RankingListCacheKeys
): void {
  const g = keys.generation.trim();
  if (g && g !== RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK) {
    params.set("g", g);
  }
  const u = keys.uiGeneration.trim();
  if (u && u !== RANKING_UI_GENERATION_STATIC_FALLBACK) {
    params.set("u", u);
  }
}

/** @deprecated 互換 — keys オブジェクトを渡す場合は appendRankingListCacheParams */
export function appendRankingSnapshotGenerationParam(
  params: URLSearchParams,
  generationOrToken: string | null | undefined
): void {
  const raw = typeof generationOrToken === "string" ? generationOrToken.trim() : "";
  if (!raw) return;
  if (raw.includes("|")) {
    const [generation, uiGeneration] = raw.split("|");
    appendRankingListCacheParams(params, {
      generation: generation || RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK,
      uiGeneration: uiGeneration || RANKING_UI_GENERATION_STATIC_FALLBACK,
    });
    return;
  }
  if (raw !== RANKING_SNAPSHOT_GENERATION_STATIC_FALLBACK) {
    params.set("g", raw);
  }
}

export function clearRankingSnapshotGenerationClientMem(): void {
  clientGenMem = null;
}
