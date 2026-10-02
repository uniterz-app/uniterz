// functions/src/rankings/nbaSeason.ts
// NBA ランキングのシーズンキー（例: "2026-27"）。
// 26-27 以降はシーズンごとに独立したバケット（rankingBySeason.<key>）に累積し、
// スナップショット doc は `s<key>_<metric>` に書く。過去シーズンのリセットは不要。
// Next 側の lib/rankings/nbaSeason.ts と同期すること。

/**
 * 日付（JST）からシーズンキーを導出する。
 * NBA は 10月開幕〜6月終了なので、7月以降 = 次シーズン扱い
 * （例: 2026-10 → "2026-27"、2027-04 → "2026-27"）。
 */
export function nbaSeasonKeyFromDateJST(d: Date): string {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = j.getUTCMonth() + 1;
  const startYear = m >= 7 ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** ランキング一覧・snapshotRanks が参照する現行シーズン（日付から自動導出） */
export const CURRENT_NBA_SEASON_KEY = nbaSeasonKeyFromDateJST(new Date());

/** `"2026-27"` → `"2025-26"`（オフシーズン表示フォールバック用） */
export function previousNbaSeasonKey(seasonKey: string): string {
  const start = Number.parseInt(seasonKey.slice(0, 4), 10);
  if (!Number.isFinite(start)) return seasonKey;
  const prevStart = start - 1;
  return `${prevStart}-${String((prevStart + 1) % 100).padStart(2, "0")}`;
}

/** リーグ表の年切替で出す最古シーズン（含む）。Next と同期 */
export const NBA_LEAGUE_STATS_OLDEST_SEASON_KEY = "2020-21";

export function nbaLeagueStatsSeasonLookbackCount(
  fromSeasonKey: string = CURRENT_NBA_SEASON_KEY,
  oldestSeasonKey: string = NBA_LEAGUE_STATS_OLDEST_SEASON_KEY
): number {
  const fromStart = Number.parseInt(fromSeasonKey.slice(0, 4), 10);
  const oldestStart = Number.parseInt(oldestSeasonKey.slice(0, 4), 10);
  if (!Number.isFinite(fromStart) || !Number.isFinite(oldestStart)) return 1;
  return Math.max(1, fromStart - oldestStart + 1);
}

/** @deprecated 名前互換。実体は `nbaLeagueStatsSeasonLookbackCount()` */
export const NBA_LEAGUE_STATS_SEASON_LOOKBACK =
  nbaLeagueStatsSeasonLookbackCount();

export function nbaSeasonKeysLookingBack(
  fromSeasonKey: string = CURRENT_NBA_SEASON_KEY,
  count: number = nbaLeagueStatsSeasonLookbackCount(fromSeasonKey)
): string[] {
  const n = Math.max(1, Math.floor(count));
  const out: string[] = [];
  let key = fromSeasonKey.trim() || CURRENT_NBA_SEASON_KEY;
  for (let i = 0; i < n; i++) {
    out.push(key);
    key = previousNbaSeasonKey(key);
  }
  return out;
}

/** cumulative_ranking_snapshots の doc id（例: s2026-27_totalPoints） */
export function nbaSeasonSnapshotDocId(
  seasonKey: string,
  metric: string
): string {
  return `s${seasonKey}_${metric}`;
}

/** 無差別級シーズン（例: s2026-27_open_totalPoints） */
export function nbaSeasonOpenSnapshotDocId(
  seasonKey: string,
  metric: string
): string {
  return `s${seasonKey}_open_${metric}`;
}

export type NbaSeasonPhase =
  | "preseason"
  | "regular"
  | "play_in"
  | "playoffs"
  | null;

export function normalizeNbaSeasonPhase(v: unknown): NbaSeasonPhase {
  if (
    v === "preseason" ||
    v === "regular" ||
    v === "play_in" ||
    v === "playoffs"
  ) {
    return v;
  }
  return null;
}

/**
 * NBA ランキング日次・累積バケットキー。
 * regular / 未設定 → rankingBySeason、playoffs → rankingByNbaPlayoffs、
 * play_in / preseason → どちらもなし。
 */
export function resolveNbaRankingBucketKeys(
  leagueKey: string | null,
  forRanking: boolean,
  at: Date,
  seasonPhase: NbaSeasonPhase
): { nbaSeasonKey: string | null; nbaPlayoffsSeasonKey: string | null } {
  if (!forRanking || leagueKey !== "nba") {
    return { nbaSeasonKey: null, nbaPlayoffsSeasonKey: null };
  }
  const key = nbaSeasonKeyFromDateJST(at);
  if (seasonPhase === "playoffs") {
    return { nbaSeasonKey: null, nbaPlayoffsSeasonKey: key };
  }
  if (seasonPhase === "play_in" || seasonPhase === "preseason") {
    return { nbaSeasonKey: null, nbaPlayoffsSeasonKey: null };
  }
  return { nbaSeasonKey: key, nbaPlayoffsSeasonKey: null };
}

/** NBA プレーオフ期（4–6月 JST）— lib/rankings/nbaSeason.ts と同期 */
export function isNbaPlayoffsCalendarWindow(d: Date = new Date()): boolean {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const m = j.getUTCMonth() + 1;
  return m >= 4 && m <= 6;
}

export function preferredNbaKinetikPeriod(
  d?: Date
): "season" | "playoffs" {
  return isNbaPlayoffsCalendarWindow(d ?? new Date()) ? "playoffs" : "season";
}
