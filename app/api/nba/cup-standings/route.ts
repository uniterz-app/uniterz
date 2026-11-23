export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getNbaPublicReadDb } from "@/lib/nba/nbaPublicReadDb";
import {
  loadNbaCupStandings,
  nbaCupStandingsCacheControl,
  normalizeCupStandingsSeasonKey,
} from "@/lib/nba/cupStandings/loadNbaCupStandings";

/**
 * GET /api/nba/cup-standings?season=2026-27
 * Firestore `nbaCupStandings/{season}` のみ（BDL ライブなし）。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const season = normalizeCupStandingsSeasonKey(url.searchParams.get("season"));

    const cached = unstable_cache(
      async () => loadNbaCupStandings(getNbaPublicReadDb(), season),
      ["nba-cup-standings", season],
      { revalidate: 120, tags: ["nba-cup-standings", `nba-cup-standings:${season}`] }
    );

    const payload = await cached();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": nbaCupStandingsCacheControl(),
      },
    });
  } catch (e: unknown) {
    console.error("[api/nba/cup-standings]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
