import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  loadSeasonAwardsDoc,
  resolveSeasonAwardsForSubmit,
  upsertSeasonAwardsDoc,
} from "@/lib/predict/seasonAwardsServer";

export const runtime = "nodejs";

function seasonFromQuery(req: Request): string {
  const url = new URL(req.url);
  const raw = url.searchParams.get("season")?.trim() ?? "";
  return raw || CURRENT_NBA_SEASON_KEY;
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/** 自分の提出済みアワード予想 */
export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const season = seasonFromQuery(req);
    const loaded = await loadSeasonAwardsDoc(getAdminDb(), uid, season);
    return NextResponse.json({
      ok: true,
      season,
      prediction: loaded?.prediction ?? null,
      candidates: loaded?.candidates ?? [],
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return unauthorized();
    }
    console.error("GET /api/me/season-awards:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

/** 完全提出（本人1通 upsert。締切未設定のため再提出可） */
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

    const resolved = resolveSeasonAwardsForSubmit({
      season,
      picksRaw: body.picks,
    });
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    await upsertSeasonAwardsDoc(
      getAdminDb(),
      uid,
      resolved.prediction,
      resolved.candidates
    );

    return NextResponse.json({
      ok: true,
      season: resolved.prediction.season,
      prediction: resolved.prediction,
      candidates: resolved.candidates,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return unauthorized();
    }
    console.error("POST /api/me/season-awards:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
