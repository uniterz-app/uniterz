/**
 * リーグ Team / Player スナップショット共通の CDN キャッシュ。
 * ingest は試合日 cron 想定 — 5分更新ではない。
 */
export type NbaStatsSnapshotSource =
  | "firestore"
  | "mock"
  | "empty"
  | "live";

/** NBA リーグ表の偽スタッツフォールバックは廃止。常に empty。 */
export function allowNbaStatsMockFallback(): boolean {
  return false;
}

export function nbaStatsSnapshotCacheControl(input: {
  source: NbaStatsSnapshotSource;
  updatedAt: Date | null;
}): string {
  if (input.source === "mock" || input.source === "empty") {
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
