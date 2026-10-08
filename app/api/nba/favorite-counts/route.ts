export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  isValidNbaFavoritePlayerId,
  isValidNbaFavoriteTeamId,
} from "@/lib/profile/nbaFavorites";
import {
  NBA_FAVORITE_COUNTS_CACHE_TAG,
  type NbaFavoriteCountKind,
} from "@/lib/nba/favoriteCounts";

async function countFavoritesAdmin(
  kind: NbaFavoriteCountKind,
  id: string
): Promise<number> {
  const users = getAdminDb().collection("users");
  const q =
    kind === "team"
      ? users.where("favoriteNbaTeamId", "==", id)
      : users.where("favoriteNbaPlayerIds", "array-contains", id);
  const snap = await q.count().get();
  return snap.data().count;
}

function loadCached(kind: NbaFavoriteCountKind, id: string): Promise<number> {
  return unstable_cache(
    () => countFavoritesAdmin(kind, id),
    ["nba-favorite-count", kind, id],
    { revalidate: 600, tags: [NBA_FAVORITE_COUNTS_CACHE_TAG] }
  )();
}

/** GET ?kind=team|player&id= → { count }。お気に入り保存時に tag で破棄 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const id = (url.searchParams.get("id") ?? "").trim();
  const valid =
    (kind === "team" && isValidNbaFavoriteTeamId(id)) ||
    (kind === "player" && isValidNbaFavoritePlayerId(id));
  if (!valid) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  try {
    const count = await loadCached(kind as NbaFavoriteCountKind, id);
    return NextResponse.json(
      { count },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("GET /api/nba/favorite-counts:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
