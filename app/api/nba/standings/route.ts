export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  loadNbaConferenceStandings,
  nbaConferenceStandingsCacheControl,
  normalizeStandingsSeasonKey,
} from "@/lib/nba/standings/loadNbaConferenceStandings";

/**
 * GET /api/nba/standings?season=2025-26
 * Firestore `nbaStandings/{season}` の読み取り口（CDN / Native 用）。
 * データソースは Firestore。プロバイダ API は ingest が書いて、ここは読まない。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const season = normalizeStandingsSeasonKey(url.searchParams.get("season"));

    const cached = unstable_cache(
      async () => loadNbaConferenceStandings(getAdminDb(), season),
      ["nba-conference-standings", season],
      { revalidate: 120, tags: ["nba-standings", `nba-standings:${season}`] }
    );

    const payload = await cached();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": nbaConferenceStandingsCacheControl(),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    console.error("[api/nba/standings]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
