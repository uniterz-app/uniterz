/** user_badges の badgeId から週/月 / プレーイン・PO の順位を復元 */

export type CareerPeriodRankFromBadge = {
  period: "weekly" | "monthly";
  label: string;
  rank: number;
};

const MONTHLY_BADGE_RE =
  /^monthly_(\d{4})_(\d{2})_(.+)_rank([123])$/i;

const WEEKLY_BADGE_RE =
  /^weekly_(\d{4}-\d{2}-\d{2})_(.+)_rank([123])$/i;

/** playin_2026_total_points_rank1 / rank4_20 */
const PLAYIN_BADGE_RE =
  /^playin_(\d{4})_total_points_(?:rank(\d+)(?:_(\d+))?|top(\d+))$/i;

/**
 * po_2026_all_total_points_rank1
 * （ラウンド別 po_2026_1st_round_* 等は CAREER Best Monthly に使わない）
 */
const PO_ALL_BADGE_RE =
  /^po_(\d{4})_all_total_points_(?:rank(\d+)|top(\d+))$/i;

export function parseCareerPeriodRankFromBadgeId(
  badgeId: string
): CareerPeriodRankFromBadge | null {
  const id = badgeId.trim();
  if (!id) return null;

  const monthly = MONTHLY_BADGE_RE.exec(id);
  if (monthly) {
    const rank = Number(monthly[4]);
    if (!Number.isFinite(rank) || rank < 1) return null;
    return {
      period: "monthly",
      label: `${monthly[1]}-${monthly[2]}`,
      rank: Math.floor(rank),
    };
  }

  const weekly = WEEKLY_BADGE_RE.exec(id);
  if (weekly) {
    const rank = Number(weekly[3]);
    if (!Number.isFinite(rank) || rank < 1) return null;
    return {
      period: "weekly",
      label: weekly[1]!,
      rank: Math.floor(rank),
    };
  }

  const playin = PLAYIN_BADGE_RE.exec(id);
  if (playin) {
    const year = playin[1]!;
    const exact = playin[2] ? Number(playin[2]) : null;
    const rangeEnd = playin[3] ? Number(playin[3]) : null;
    const top = playin[4] ? Number(playin[4]) : null;
    let rank: number | null = null;
    if (exact != null && Number.isFinite(exact) && exact >= 1) {
      // rank4_20 → 保守的に 20（最高順位の上界）
      rank = rangeEnd != null && Number.isFinite(rangeEnd) ? rangeEnd : exact;
    } else if (top != null && Number.isFinite(top) && top >= 1) {
      rank = top;
    }
    if (rank == null || rank < 1) return null;
    return {
      period: "monthly",
      label: `${year}-playin`,
      rank: Math.floor(rank),
    };
  }

  const po = PO_ALL_BADGE_RE.exec(id);
  if (po) {
    const year = po[1]!;
    const exact = po[2] ? Number(po[2]) : null;
    const top = po[3] ? Number(po[3]) : null;
    const rank =
      exact != null && Number.isFinite(exact) && exact >= 1
        ? exact
        : top != null && Number.isFinite(top) && top >= 1
          ? top
          : null;
    if (rank == null) return null;
    return {
      period: "monthly",
      label: `${year}-playoffs`,
      rank: Math.floor(rank),
    };
  }

  return null;
}

/** 月次 totalPoints 系だけ CAREER に載せる */
export function badgeMetricCountsForCareerPeriodRank(metricSlug: string): boolean {
  const m = metricSlug.toLowerCase();
  if (m.includes("total_points") || m === "totalpoints") return true;
  if (m.includes("points") && !m.includes("goal")) return true;
  if (m === "scorer" || m.includes("goal_scorer")) return false;
  return m.includes("total");
}

export function parseCareerPeriodRankFromBadgeIdFiltered(
  badgeId: string
): CareerPeriodRankFromBadge | null {
  const id = badgeId.trim();
  const monthly = MONTHLY_BADGE_RE.exec(id);
  if (monthly) {
    const metric = monthly[3] ?? "";
    if (!badgeMetricCountsForCareerPeriodRank(metric)) return null;
    return parseCareerPeriodRankFromBadgeId(id);
  }
  return parseCareerPeriodRankFromBadgeId(id);
}
