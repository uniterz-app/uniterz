import type { NbaLeagueTeamStatsSnapshotSource } from "./leagueTeamStatsTypes";

/**
 * 全ユーザー共有 CDN キャッシュ。
 * ingest は試合日 cron 想定 — 5分更新ではない。
 */
export function leagueTeamStatsCacheControl(input: {
  source: NbaLeagueTeamStatsSnapshotSource;
  updatedAt: Date | null;
}): string {
  if (input.source === "mock") {
    return "public, s-maxage=60, stale-while-revalidate=300";
  }
  const ageMs = input.updatedAt
    ? Date.now() - input.updatedAt.getTime()
    : Number.POSITIVE_INFINITY;
  const recent = ageMs < 6 * 60 * 60 * 1000;
  if (recent) {
    return "public, s-maxage=1800, stale-while-revalidate=7200";
  }
  return "public, s-maxage=3600, stale-while-revalidate=86400";
}
