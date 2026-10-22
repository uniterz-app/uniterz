export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { loadLiveGameCardPatches } from "@/lib/games/server/loadLiveGameCardPatches";

const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
const MAX_IDS = 24;

/**
 * GET /api/games/live-cards?ids=a,b,c
 * 開始済みの試合のスコアだけ。試合一覧の窓は読み直さない。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ids = (url.searchParams.get("ids") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => ID_RE.test(id))
      .slice(0, MAX_IDS);
    if (ids.length === 0) {
      return NextResponse.json(
        { ok: false, error: "ids required" },
        { status: 400 }
      );
    }
    const sorted = [...ids].sort();
    const games = await unstable_cache(
      () => loadLiveGameCardPatches(getAdminDb(), sorted),
      ["games-live-cards", sorted.join(",")],
      { revalidate: 30, tags: ["games-live-cards"] }
    )();
    return NextResponse.json(
      { ok: true, games },
      {
        headers: {
          "Cache-Control": "public, s-maxage=20, stale-while-revalidate=20",
        },
      }
    );
  } catch (e: unknown) {
    console.error("[api/games/live-cards]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
