/**
 * ランキング区分。
 * - standard: 通常（将来はピックアップ試合のみ）。全員参加可
 * - open: PRO LEAGUE（全試合対象）。Pro 限定参加・閲覧
 *
 * ピックアップ制導入前は点数源は standard / open とも同一（全試合）。
 * 差は「掲載が Pro のみか」と「閲覧ゲート」にある。
 */

export type RankingDivision = "standard" | "open";

/** NBA サイドメニューの枝（レギュラー / プレーオフ）。PRO LEAGUE は Regular 内タブ。 */
export type NbaRankingBoard = "regular" | "playoffs" | "open";

export function isRankingDivision(v: unknown): v is RankingDivision {
  return v === "standard" || v === "open";
}

export function isNbaRankingBoard(v: unknown): v is NbaRankingBoard {
  return v === "regular" || v === "playoffs" || v === "open";
}

export function parseRankingDivision(raw: string | null | undefined): RankingDivision {
  return raw === "open" ? "open" : "standard";
}

export function divisionFromNbaBoard(board: NbaRankingBoard): RankingDivision {
  return board === "open" ? "open" : "standard";
}

/** period_ranking_snapshots の doc id */
export function periodRankingSnapshotDocId(opts: {
  division: RankingDivision;
  period: "weekly" | "monthly";
  label: string;
  metric: string;
}): string {
  const prefix = opts.division === "open" ? "nba_open" : "nba";
  return `${prefix}_${opts.period}_${opts.label}_${opts.metric}`;
}

/** period_ranking_snapshots.periodKey */
export function periodRankingPeriodKey(
  division: RankingDivision,
  period: "weekly" | "monthly"
): string {
  return division === "open" ? `nba_open_${period}` : `nba_${period}`;
}

/** cumulative_ranking_snapshots の PRO LEAGUE シーズン doc id */
export function nbaSeasonOpenSnapshotDocId(
  seasonKey: string,
  metric: string
): string {
  return `s${seasonKey}_open_${metric}`;
}
