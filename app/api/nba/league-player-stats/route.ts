export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { playerStatLeadersCacheControl } from "@/lib/nba/playerStatLeaders/playerStatLeadersCacheControl";
import {
  loadPlayerStatLeadersSnapshot,
  normalizePlayerStatLeadersSeasonKey,
} from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";

/**
 * GET /api/nba/league-player-stats?season=2025-26
 * 認証不要。Firestore 共有スナップショット。
 * オフシーズンは薄い「来季キー」doc をスキップして前季へ落ちる。
 * HTTP Cache-Control のみ（unstable_cache は薄い doc を掴み続けるため使わない）。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const season = normalizePlayerStatLeadersSeasonKey(
      url.searchParams.get("season")
    );

    const payload = await loadPlayerStatLeadersSnapshot(getAdminDb(), season);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": playerStatLeadersCacheControl({
          source: payload.source,
          updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : null,
        }),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    console.error("[api/nba/league-player-stats]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
