/**
 * ランキングバッジ ID の部門（Pick Up / PRO LEAGUE）。
 *
 * 新形式: `{division}_{本体}`
 *   pickup_weekly_2026-10-26_total_points_rank1
 *   pro_monthly_2026_11_win_rate_rank1
 *   pickup_po_2027_all_total_points_rank1
 * 旧形式（部門なし）は Pick Up として扱う。
 */

export type RankingBadgeDivision = "pickup" | "pro";

const DIVISION_PREFIX_RE = /^(pickup|pro)_(.+)$/i;

export function splitRankingBadgeId(badgeId: string): {
  division: RankingBadgeDivision;
  /** 部門プレフィックスを除いた ID（旧形式と同じ書式） */
  body: string;
  /** 旧形式（部門なし） */
  legacy: boolean;
} {
  const id = badgeId.trim();
  const m = DIVISION_PREFIX_RE.exec(id);
  if (m) {
    return {
      division: m[1]!.toLowerCase() as RankingBadgeDivision,
      body: m[2]!,
      legacy: false,
    };
  }
  return { division: "pickup", body: id, legacy: true };
}

/** ランキングスナップショットの division（standard=Pick Up / open=PRO LEAGUE） */
export function rankingBadgeSnapshotDivision(
  division: RankingBadgeDivision
): "standard" | "open" {
  return division === "pro" ? "open" : "standard";
}

export function buildPeriodRankingBadgeId(input: {
  division: RankingBadgeDivision;
  period: "weekly" | "monthly";
  /** weekly: YYYY-MM-DD / monthly: YYYY-MM */
  label: string;
  /** total_points / win_rate / upset / goal_scorer */
  metricSlug: string;
  /** rank1 / rank2 / rank3 / top10 など */
  rankSlug: string;
}): string {
  const labelPart =
    input.period === "monthly" ? input.label.replace("-", "_") : input.label;
  return `${input.division}_${input.period}_${labelPart}_${input.metricSlug}_${input.rankSlug}`;
}
