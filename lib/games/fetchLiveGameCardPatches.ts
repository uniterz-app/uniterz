/**
 * GET /api/games/live-cards — ライブ中の試合スコアだけ。
 */
import {
  type LiveGameCardPatch,
} from "@/lib/games/liveGameCardPatch";

export async function fetchLiveGameCardPatches(params: {
  ids: readonly string[];
  apiBaseUrl?: string | null;
}): Promise<LiveGameCardPatch[]> {
  const ids = [...new Set(params.ids.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return [];
  const base = (params.apiBaseUrl ?? "").replace(/\/$/, "");
  const qs = new URLSearchParams({ ids: ids.join(",") });
  const res = await fetch(`${base}/api/games/live-cards?${qs.toString()}`, {
    method: "GET",
    cache: "default",
  });
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    games?: LiveGameCardPatch[];
  } | null;
  if (!res.ok || !json?.ok || !Array.isArray(json.games)) return [];
  return json.games.filter(
    (game) => game && typeof game.id === "string" && game.id.length > 0
  );
}
