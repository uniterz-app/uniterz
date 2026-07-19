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

/** cumulative_ranking_snapshots の doc id（例: s2026-27_totalPoints） */
export function nbaSeasonSnapshotDocId(
  seasonKey: string,
  metric: string
): string {
  return `s${seasonKey}_${metric}`;
}
