export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";
import { getNbaPublicReadDb } from "@/lib/nba/nbaPublicReadDb";
import { loadNbaLeagueHubSnapshot } from "@/lib/nba/leagueHub/loadNbaLeagueHubSnapshot";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * GET /api/nba/league-hub
 * 順位ページ LEAGUE タブ。常に今季。Firestore `nbaLeagueHub` を読むだけ。
 */
export async function GET() {
  try {
    const payload = await loadNbaLeagueHubSnapshot(getNbaPublicReadDb(), CURRENT_NBA_SEASON_KEY);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
      },
    });
  } catch (e) {
    return clientErrorResponse(e, "GET /api/nba/league-hub");
  }
}
