// NBA ランキングのシーズンキー（例: "2026-27"）。
// functions/src/rankings/nbaSeason.ts と同期すること。

/**
 * 日付（JST）からシーズンキーを導出する。
 * NBA は 10月開幕〜6月終了なので、7月以降 = 次シーズン扱い
 * （例: 2026-07 → "2026-27"、2027-04 → "2026-27"）。
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

/** `"2026-27"` → `"26-27"` */
export function nbaSeasonShortLabel(seasonKey: string): string {
  if (/^\d{4}-\d{2}$/.test(seasonKey)) {
    return `${seasonKey.slice(2, 4)}-${seasonKey.slice(5)}`;
  }
  return seasonKey.replace(/^20/, "").replace("-20", "-");
}

/** `"2026-27"` → `"2025-26"`（オフシーズン表示フォールバック用） */
export function previousNbaSeasonKey(seasonKey: string): string {
  const start = Number.parseInt(seasonKey.slice(0, 4), 10);
  if (!Number.isFinite(start)) return seasonKey;
  const prevStart = start - 1;
  return `${prevStart}-${String((prevStart + 1) % 100).padStart(2, "0")}`;
}

/** リーグ表の年切替で出す最古シーズン（含む） */
export const NBA_LEAGUE_STATS_OLDEST_SEASON_KEY = "2020-21";

/**
 * 今季から最古までのシーズン数（今季含む）。
 * 例: CURRENT=`2026-27`, oldest=`2020-21` → 7
 */
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

/**
 * 今季から遡るシーズンキー（新しい順）。
 * 例: from=`2026-27`, count=7 → `2026-27` … `2020-21`
 */
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

/** リーグ表ナビ用: CURRENT から `2020-21` まで */
export function nbaLeagueStatsSeasonKeys(
  fromSeasonKey: string = CURRENT_NBA_SEASON_KEY
): string[] {
  return nbaSeasonKeysLookingBack(
    fromSeasonKey,
    nbaLeagueStatsSeasonLookbackCount(fromSeasonKey)
  );
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

/** NBA プレーオフ期（4–6月 JST）— Kinetik の primary タブ判定 */
export function isNbaPlayoffsCalendarWindow(d: Date = new Date()): boolean {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const m = j.getUTCMonth() + 1;
  return m >= 4 && m <= 6;
}

/** Kinetik SEASON / PLAYOFF の既定タブ（プレーオフ期は PLAYOFF 優先） */
export function preferredNbaKinetikPeriod(
  d?: Date
): "season" | "playoffs" {
  return isNbaPlayoffsCalendarWindow(d ?? new Date()) ? "playoffs" : "season";
}
