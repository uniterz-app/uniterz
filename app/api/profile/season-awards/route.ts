import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadSeasonAwardsDoc } from "@/lib/predict/seasonAwardsServer";

export const runtime = "nodejs";

function isValidUid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 128 &&
    !value.includes("/")
  );
}

/** 任意ユーザーの提出済みアワード予想（公開読取） */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const uid = url.searchParams.get("uid")?.trim() ?? "";
    if (!isValidUid(uid)) {
      return NextResponse.json({ error: "invalid_uid" }, { status: 400 });
    }
    const season =
      url.searchParams.get("season")?.trim() || CURRENT_NBA_SEASON_KEY;

    const loaded = await loadSeasonAwardsDoc(getAdminDb(), uid, season);
    return NextResponse.json({
      ok: true,
      uid,
      season,
      prediction: loaded?.prediction ?? null,
      candidates: loaded?.candidates ?? [],
    });
  } catch (e: unknown) {
    console.error("GET /api/profile/season-awards:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
