export const runtime = "nodejs";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import { ingestNbaDisciplineFromBdl } from "@/lib/nba/ingest/nbaDisciplineIngest";
import { revalidateNbaDisciplineApiCache } from "@/lib/nba/discipline/nbaDisciplineApiCache";

/**
 * POST /api/admin/nba-discipline-ingest
 * BDL play-by-play → `nbaGameDiscipline` → `nbaDiscipline/{seasonKey}`。
 * 認証: Admin UID または job secret。
 *
 * body: { seasonKey?: "2025-26", force?: boolean, maxGames?: number }
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as {
      seasonKey?: string;
      force?: boolean;
      maxGames?: number;
    };

    const result = await ingestNbaDisciplineFromBdl(getAdminDb(), {
      seasonKey:
        typeof body.seasonKey === "string" && body.seasonKey.trim()
          ? body.seasonKey.trim()
          : undefined,
      force: body.force === true,
      maxGames: typeof body.maxGames === "number" ? body.maxGames : undefined,
    });
    revalidateNbaDisciplineApiCache();

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-discipline-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
