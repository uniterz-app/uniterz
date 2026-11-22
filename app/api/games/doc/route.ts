export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";
import {
  isPublicGameDocId,
  loadPublicGameDoc,
  type PublicGameDocView,
} from "@/lib/games/server/loadPublicGameDoc";

/**
 * GET /api/games/doc?id=&view=slim|full&peers=0
 * Native / リザルトが games をクライアント SDK で全項目読む代わり。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const gameId = (url.searchParams.get("id") ?? "").trim();
    if (!isPublicGameDocId(gameId)) {
      return NextResponse.json(
        { ok: false, error: "id required" },
        { status: 400 }
      );
    }
    const viewRaw = (url.searchParams.get("view") ?? "slim").trim();
    const view: PublicGameDocView = viewRaw === "full" ? "full" : "slim";
    const includePeers = url.searchParams.get("peers") !== "0";

    const payload = await unstable_cache(
      () =>
        loadPublicGameDoc(getAdminDb(), gameId, { view, includePeers }),
      ["games-doc", gameId, view, includePeers ? "peers" : "nopeers"],
      {
        revalidate: 120,
        tags: ["games-doc", `games-doc:${gameId}`, "games-window", "games-window:nba"],
      }
    )();

    if (!payload.found) {
      return NextResponse.json(
        { ok: false, error: "game not found" },
        { status: 404 }
      );
    }

    const live =
      payload.game &&
      String(payload.game.status ?? "").toLowerCase().includes("progress");
    const cacheControl = live
      ? "public, s-maxage=30, stale-while-revalidate=60"
      : "public, s-maxage=120, stale-while-revalidate=300";

    return NextResponse.json(payload, {
      headers: { "Cache-Control": cacheControl },
    });
  } catch (e: unknown) {
    return clientErrorResponse(e, "GET /api/games/doc");
  }
}
