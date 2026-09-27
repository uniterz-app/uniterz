/**
 * ランキングバッジ ID → 参加者数の参照先。
 * 参加者 = その回・その部門で 1 回以上投稿した人数（順位表の掲載条件や付与人数ではない）。
 */

import { DATE_LOCALE } from "@/lib/i18n/language";
import {
  rankingBadgeSnapshotDivision,
  splitRankingBadgeId,
} from "@/lib/badges/rankingBadgeId";
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";

export type BadgePeriodMetric =
  | "totalPoints"
  | "winRate"
  | "totalUpset"
  | "totalGoalScorerHits";

export type BadgeCohortSource =
  | {
      kind: "cumulative";
      /** バッジの年（po_2026_* → 2026）。アーカイブ doc の特定用 */
      year: number;
      /** 優先順。存在する最初の doc を使う */
      docIds: string[];
      /** スナップショットが無いときの cumulative_stats count() 用 */
      statsField?: string;
    }
  | {
      kind: "period";
      division: "standard" | "open";
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
  if (!badgeId.trim()) return null;
  const { division: badgeDivision, body: id } = splitRankingBadgeId(badgeId);
  const division = rankingBadgeSnapshotDivision(badgeDivision);

  const weekly = WEEKLY_RE.exec(id);
  if (weekly) {
    const metric = periodMetricFromSlug(weekly[2] ?? "");
    if (!metric) return null;
    return {
      kind: "period",
      division,
      period: "weekly",
      label: weekly[1]!,
      metric,
    };
  }

  const monthly = MONTHLY_RE.exec(id);
  if (monthly) {
    const metric = periodMetricFromSlug(monthly[3] ?? "");
    if (!metric) return null;
    return {
      kind: "period",
      division,
      period: "monthly",
      label: `${monthly[1]}-${monthly[2]}`,
      metric,
    };
  }

  // プレーイン / PO / WC の累計スナップショットは部門を持たない（Pick Up 相当のみ）
  if (division === "open") return null;

  const playin = PLAYIN_RE.exec(id);
  if (playin) {
    return {
      kind: "cumulative",
      year: Number(playin[1]),
      docIds: ["play_in_totalPoints", "playin_totalPoints"],
      statsField: "rankingByPhase.play_in.totalPosts",
    };
  }

  const poAll = PO_ALL_RE.exec(id);
  if (poAll) {
    return {
      kind: "cumulative",
      year: Number(poAll[1]),
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
      year: Number(poRound[1]),
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
    return { kind: "cumulative", year: Number(wc[1]), docIds: ids };
  }

  return null;
}

export function formatBadgeParticipantCount(
  count: number,
  language: LocalizedLang | string,
): string {
  const lang = resolveLocalizedLang(language);
  const n = Math.floor(count);
  const formatted = n.toLocaleString(DATE_LOCALE[lang]);
  if (lang === "ja") return `${formatted}人`;
  if (lang === "ko") return `${formatted}명`;
  if (lang === "zh") return `${formatted}人`;
  return formatted;
}

export function badgeParticipantLabel(language: LocalizedLang | string): string {
  return L(resolveLocalizedLang(language), {
    ja: "参加者",
    en: "Participants",
    ko: "참가자",
    zh: "参与者",
    es: "Participantes",
    pt: "Participantes",
    fr: "Participants",
  });
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
