export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import {
  loadTeamPayroll,
  loadTeamPayrollsSnapshot,
  normalizeTeamPayrollsSeasonKey,
} from "@/lib/nba/teamPayroll/loadTeamPayrollSnapshot";

/**
 * GET /api/nba/team-payroll?season=2026-27
 * GET /api/nba/team-payroll?season=2026-27&team=nba-thunder
 *
 * 認証不要。Firestore のチームペイロール共有スナップショット。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const season = normalizeTeamPayrollsSeasonKey(
      url.searchParams.get("season")
    );
    const team = (url.searchParams.get("team") ?? "").trim();
    const db = getAdminDb();

    if (team) {
      const payload = await loadTeamPayroll(db, season, team);
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": nbaStatsSnapshotCacheControl({
            source: payload.source,
            updatedAt: payload.updatedAt
              ? new Date(payload.updatedAt)
              : null,
          }),
        },
      });
    }

    const payload = await loadTeamPayrollsSnapshot(db, season);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": nbaStatsSnapshotCacheControl({
          source: payload.source,
          updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : null,
        }),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    console.error("[api/nba/team-payroll]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
