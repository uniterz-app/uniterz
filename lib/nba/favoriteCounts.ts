/**
 * チーム / 選手詳細のお気に入り数（`/api/nba/favorite-counts`）。
 * チーム = `users.favoriteNbaTeamId ==`、選手 = `users.favoriteNbaPlayerIds array-contains`。
 */
export const NBA_FAVORITE_COUNTS_CACHE_TAG = "nba-favorite-counts";

export type NbaFavoriteCountKind = "team" | "player";

export async function fetchNbaFavoriteCount(
  apiBase: string,
  kind: NbaFavoriteCountKind,
  id: string
): Promise<number | null> {
  const qs = new URLSearchParams({ kind, id });
  const res = await fetch(
    `${apiBase.replace(/\/$/, "")}/api/nba/favorite-counts?${qs.toString()}`
  );
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as { count?: unknown } | null;
  return typeof json?.count === "number" && Number.isFinite(json.count)
    ? Math.max(0, Math.floor(json.count))
    : null;
}

/** 1234 → 1.2K */
export function formatNbaFavoriteCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k < 10 ? k.toFixed(1).replace(/\.0$/, "") : Math.floor(k)}K`;
  }
  const m = n / 1_000_000;
  return `${m < 10 ? m.toFixed(1).replace(/\.0$/, "") : Math.floor(m)}M`;
}
