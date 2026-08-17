import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  loadSeasonStandingsDoc,
  resolveSeasonStandingsForSubmit,
  upsertSeasonStandingsDoc,
} from "@/lib/predict/seasonStandingsServer";

export const runtime = "nodejs";

function seasonFromQuery(req: Request): string {
  const url = new URL(req.url);
  const raw = url.searchParams.get("season")?.trim() ?? "";
  return raw || CURRENT_NBA_SEASON_KEY;
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/** 自分の提出済み順位予想 */
export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const season = seasonFromQuery(req);
    const prediction = await loadSeasonStandingsDoc(getAdminDb(), uid, season);
    return NextResponse.json({
      ok: true,
      season,
      prediction,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return unauthorized();
    }
    console.error("GET /api/me/season-standings:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

/** 完全提出（本人1通 upsert） */
export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const season =
      typeof body.season === "string" && body.season.trim()
        ? body.season.trim()
        : CURRENT_NBA_SEASON_KEY;

    const resolved = resolveSeasonStandingsForSubmit({
      season,
      east: body.east,
      west: body.west,
    });
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    await upsertSeasonStandingsDoc(getAdminDb(), uid, resolved.prediction);

    return NextResponse.json({
      ok: true,
      season: resolved.prediction.season,
      prediction: resolved.prediction,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return unauthorized();
    }
    console.error("POST /api/me/season-standings:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
