/**
 * ランキング一覧キャッシュ世代（超軽量）。
 * g= スコア snap / u= Pro Skin など chrome。
 */
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { loadRankingListCacheKeys } from "@/lib/rankings/server/loadRankingSnapshotGeneration";

export const runtime = "nodejs";

const getCachedKeys = unstable_cache(
  async () => loadRankingListCacheKeys(),
  ["ranking-snapshot-generation-v2"],
  {
    revalidate: 60,
    tags: ["cumulative-ranking", "period-ranking", "ranking-ui"],
  }
);

export async function GET() {
  try {
    const keys = await getCachedKeys();
    return NextResponse.json(
      {
        ok: true,
        generation: keys.generation,
        uiGeneration: keys.uiGeneration,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, max-age=0, s-maxage=15, stale-while-revalidate=60",
        },
      }
    );
  } catch (e: unknown) {
    console.error("[api/ranking-snapshot-generation]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
