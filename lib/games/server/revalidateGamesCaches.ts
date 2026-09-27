/**
 * games 書き込み後に公開 API の unstable_cache を捨てる（Route Handler 内から呼ぶ）。
 * 時間切れ再取得を長めにして、Firestore 読みを「データが変わったときだけ」に寄せる。
 */
import { revalidateTag } from "next/cache";
import { normalizeLeague, type League } from "@/lib/leagues";

export function revalidateGamesWindowCache(league: League): void {
  revalidateTag(`games-window:${normalizeLeague(league)}`, {});
}

export function revalidateGameDayIndexCache(league: League, season: string): void {
  revalidateTag(`game-day-index:${normalizeLeague(league)}:${season}`, {});
}
