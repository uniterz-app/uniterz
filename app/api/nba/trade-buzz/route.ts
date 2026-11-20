export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";
import { getNbaPublicReadDb } from "@/lib/nba/nbaPublicReadDb";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  loadNbaTradeBuzzSnapshot,
  publicNbaTradeBuzzMeta,
  publicNbaTradeBuzzPayload,
} from "@/lib/nba/tradeBuzz/nbaTradeBuzzSnapshot";

const CDN =
  "public, s-maxage=60, stale-while-revalidate=300";

function etagOf(updatedAtMs: number | null): string {
  return updatedAtMs != null && updatedAtMs > 0 ? `"${updatedAtMs}"` : '"0"';
}

/**
 * GET /api/nba/trade-buzz
 * GET /api/nba/trade-buzz?meta=1  — 黄色い点用（updatedAtMs だけ）
 * Firestore 1 doc。読みは unstable_cache（書き込みで tag 破棄）。CDN 60 秒。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const metaOnly = url.searchParams.get("meta") === "1";
    const doc = await loadNbaTradeBuzzSnapshot(
      getNbaPublicReadDb(),
      CURRENT_NBA_SEASON_KEY
    );
    const meta = publicNbaTradeBuzzMeta(doc);
    const etag = etagOf(meta.updatedAtMs);
    const headers = { "Cache-Control": CDN, ETag: etag };
    if (req.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304, headers });
    }
    const body = metaOnly ? meta : publicNbaTradeBuzzPayload(doc);
    return NextResponse.json(body, { headers });
  } catch (e) {
    return clientErrorResponse(e, "GET /api/nba/trade-buzz");
  }
}
