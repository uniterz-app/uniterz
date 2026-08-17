/**
 * ランキングバッジ ID → 参加者数の参照先。
 * 付与対象の「その回のランキング母数」を引く。
 */

export type BadgePeriodMetric =
  | "totalPoints"
  | "winRate"
  | "totalUpset"
  | "totalGoalScorerHits";

export type BadgeCohortSource =
  | {
      kind: "cumulative";
      /** 優先順。存在する最初の doc を使う */
      docIds: string[];
      /** スナップショットが無いときの cumulative_stats count() 用 */
      statsField?: string;
    }
  | {
      kind: "period";
      period: "weekly" | "monthly";
      label: string;
      metric: BadgePeriodMetric;
    };

const WEEKLY_RE = /^weekly_(\d{4}-\d{2}-\d{2})_(.+)_rank\d+$/i;
const MONTHLY_RE = /^monthly_(\d{4})_(\d{2})_(.+)_rank\d+$/i;
const PLAYIN_RE = /^playin_(\d{4})_total_points_/i;
const PO_ALL_RE = /^po_(\d{4})_all_total_points_/i;
const PO_ROUND_RE =
  /^po_(\d{4})_(1st_round|2nd_round|cf|finals)_total_points_/i;
const WC_RE =
  /^wc_(\d{4})_(group|gp|group_stage|qualifying|main|overall)_total_points_/i;

const PERIOD_METRIC_BY_SLUG: Record<string, BadgePeriodMetric> = {
  total_points: "totalPoints",
  totalpoints: "totalPoints",
  points: "totalPoints",
  win_rate: "winRate",
  winrate: "winRate",
  upset: "totalUpset",
  upset_rate: "totalUpset",
  total_upset: "totalUpset",
  goal_scorer: "totalGoalScorerHits",
  total_goal_scorer_hits: "totalGoalScorerHits",
};

function periodMetricFromSlug(slug: string): BadgePeriodMetric | null {
  const key = slug.trim().toLowerCase().replace(/-/g, "_");
  return PERIOD_METRIC_BY_SLUG[key] ?? null;
}

function poRoundSnapshotIds(round: string): string[] {
  const key =
    round === "1st_round"
      ? "r1"
      : round === "2nd_round"
        ? "r2"
        : round === "cf"
          ? "cf"
          : "finals";
  return [`playoffs_${key}_totalPoints`, `${key}_totalPoints`];
}

/** バッジ ID から参加者数の参照先。非ランキングは null */
export function resolveBadgeCohortSource(
  badgeId: string,
): BadgeCohortSource | null {
  const id = badgeId.trim();
  if (!id) return null;

  const weekly = WEEKLY_RE.exec(id);
  if (weekly) {
    const metric = periodMetricFromSlug(weekly[2] ?? "");
    if (!metric) return null;
    return { kind: "period", period: "weekly", label: weekly[1]!, metric };
  }

  const monthly = MONTHLY_RE.exec(id);
  if (monthly) {
    const metric = periodMetricFromSlug(monthly[3] ?? "");
    if (!metric) return null;
    return {
      kind: "period",
      period: "monthly",
      label: `${monthly[1]}-${monthly[2]}`,
      metric,
    };
  }

  if (PLAYIN_RE.test(id)) {
    return {
      kind: "cumulative",
      docIds: ["play_in_totalPoints", "playin_totalPoints"],
      statsField: "rankingByPhase.play_in.totalPosts",
    };
  }

  if (PO_ALL_RE.test(id)) {
    return {
      kind: "cumulative",
      docIds: ["playoffs_totalPoints"],
      statsField: "rankingByPhase.playoffs.totalPosts",
    };
  }

  const poRound = PO_ROUND_RE.exec(id);
  if (poRound) {
    const round = poRound[2]!;
    const key =
      round === "1st_round"
        ? "r1"
        : round === "2nd_round"
          ? "r2"
          : round === "cf"
            ? "cf"
            : "finals";
    return {
      kind: "cumulative",
      docIds: poRoundSnapshotIds(round),
      statsField: `rankingByPlayoffRound.${key}.totalPosts`,
    };
  }

  const wc = WC_RE.exec(id);
  if (wc) {
    const stage = (wc[2] ?? "").toLowerCase();
    const ids =
      stage === "main"
        ? ["wc_main_totalPoints"]
        : stage === "overall"
          ? ["wc_overall_totalPoints", "wc_totalPoints"]
          : ["wc_group_totalPoints", "wc_qualifying_totalPoints"];
    return { kind: "cumulative", docIds: ids };
  }

  return null;
}

export function formatBadgeParticipantCount(
  count: number,
  language: "ja" | "en",
): string {
  const n = Math.floor(count);
  if (language === "ja") return `${n.toLocaleString("ja-JP")}人`;
  return n.toLocaleString("en-US");
}

export function badgeParticipantLabel(language: "ja" | "en"): string {
  return language === "ja" ? "参加者" : "Participants";
}

export function readBadgeParticipantCount(badge: {
  participantCount?: unknown;
}): number | null {
  const n =
    typeof badge.participantCount === "number"
      ? badge.participantCount
      : Number(badge.participantCount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}
