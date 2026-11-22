export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";
import {
  isPublicGameDocId,
  loadPublicGameDocs,
  PUBLIC_GAME_DOCS_MAX,
} from "@/lib/games/server/loadPublicGameDoc";

/**
 * GET /api/games/docs?ids=a,b,c
 * リザルト一覧の market / PK 補完。最大 30 件・slim のみ。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ids = (url.searchParams.get("ids") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(isPublicGameDocId)
      .slice(0, PUBLIC_GAME_DOCS_MAX);
    if (ids.length === 0) {
      return NextResponse.json(
        { ok: false, error: "ids required" },
        { status: 400 }
      );
    }

    const key = [...ids].sort().join(",");
    const games = await unstable_cache(
      () => loadPublicGameDocs(getAdminDb(), ids, "slim"),
      ["games-docs", key],
      {
        revalidate: 120,
        tags: ["games-doc", "games-window", "games-window:nba"],
      }
    )();

    return NextResponse.json(
      { ok: true, games },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180",
        },
      }
    );
  } catch (e: unknown) {
    return clientErrorResponse(e, "GET /api/games/docs");
  }
}
