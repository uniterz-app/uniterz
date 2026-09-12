/**
 * `/api/nba/standings` のクライアント共有キャッシュ。
 * 順位表パネル・マッチカード・（旧）個別 fetch が同じ 1 本を使う。
 */
import type { NbaConferenceStandingsApiPayload } from "@/lib/nba/standings/nbaConferenceStandingsTypes";
import {
  createSnapshotFetchCache,
  NBA_SNAPSHOT_CACHE_TTL_MS,
} from "@/lib/nba/snapshotFetchCache";

export const nbaStandingsSnapshotCache =
  createSnapshotFetchCache<NbaConferenceStandingsApiPayload>(
    NBA_SNAPSHOT_CACHE_TTL_MS
  );
