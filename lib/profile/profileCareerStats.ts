/**
 * プロフィール CAREER（予想者の履歴書）用の集計・表示モデル。
 * 公開プロフィールでも見える想定。
 */

import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export type ProfileCareerAwardHonor = {
  /** 集約キー（metric + rank） */
  key: string;
  /** 表示ラベル（言語済み） */
  label: string;
  count: number;
};

export type ProfileCareerStats = {
  /** 予測投稿数 */
  predictions: number | null;
  /** 参加年 */
  sinceYear: number | null;
  /** 参加日 YYYY/MM/DD（表示用） */
  sinceDate: string | null;
  /** 総合順位（現状はシーズン累計の近似） */
  allTimeRank: number | null;
  allTimeRankDenominator: number | null;
  /** 月次最高順位（未集約時 null） */
  bestMonthlyRank: number | null;
  /** 月次 Top10 回数（未集約時 null） */
  top10Finishes: number | null;
  /** 生涯獲得 Unit（未集約時 null。保有残高とは別） */
  totalUnitsEarned: number | null;
  /** 勝率 0..100 */
  winRatePct: number | null;
  /** 得意競技 */
  bestSport: string | null;
  /** 月次部門優勝などの集約 */
  awards: ProfileCareerAwardHonor[];
  /** 表示中シーズン（将来切替用。現状 all-time 固定） */
  seasonKey: "all-time" | string;
  /** スイッチャー候補（UI スタブ） */
  seasonOptions: readonly string[];
};

export type ProfileCareerBadgeLike = {
  id: string;
  title?: string;
};

const MONTHLY_BADGE_RE =
  /^monthly_(\d{4})_(\d{2})_(.+)_rank([123])$/i;

const METRIC_LABEL_JA: Record<string, string> = {
  win_rate: "WIN RATE",
  score_margin_accuracy: "スコア精度",
  prediction_accuracy: "PRECISION",
  calibration_accuracy: "CALIBRATION",
  upset: "UPSET",
  total_points: "SCORER",
  points: "SCORER",
  goal_scorer: "SCORER",
};

const METRIC_LABEL_EN: Record<string, string> = {
  win_rate: "WIN RATE",
  score_margin_accuracy: "SCORE",
  prediction_accuracy: "PRECISION",
  calibration_accuracy: "CALIBRATION",
  upset: "UPSET",
  total_points: "SCORER",
  points: "SCORER",
  goal_scorer: "SCORER",
};

function metricLabel(metric: string, language: "ja" | "en"): string {
  const key = metric.toLowerCase();
  const map = language === "ja" ? METRIC_LABEL_JA : METRIC_LABEL_EN;
  if (map[key]) return map[key];
  return metric.replace(/_/g, " ").toUpperCase();
}

/**
 * 月次ランク1バッジを部門ごとに集約（例: 月間 SCORER 1位 ×2）
 */
export function aggregateCareerAwardsFromBadges(
  badges: readonly ProfileCareerBadgeLike[],
  language: "ja" | "en"
): ProfileCareerAwardHonor[] {
  const counts = new Map<string, { metric: string; rank: number; count: number }>();

  for (const badge of badges) {
    const m = MONTHLY_BADGE_RE.exec(badge.id.trim());
    if (!m) continue;
    const metric = m[3] ?? "";
    const rank = Number(m[4]);
    if (!metric || !Number.isFinite(rank) || rank !== 1) continue;
    const key = `${metric}:rank${rank}`;
    const prev = counts.get(key);
    if (prev) prev.count += 1;
    else counts.set(key, { metric, rank, count: 1 });
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.metric.localeCompare(b.metric))
    .map((row) => {
      const metric = metricLabel(row.metric, language);
      const label =
        language === "ja"
          ? `月間 ${metric} ${row.rank}位`
          : `Monthly ${metric} #${row.rank}`;
      return {
        key: `${row.metric}:rank${row.rank}`,
        label,
        count: row.count,
      };
    });
}

export function profileCareerSinceYear(
  memberSinceMs: number | null | undefined
): number | null {
  if (memberSinceMs == null || !Number.isFinite(memberSinceMs)) return null;
  const d = new Date(memberSinceMs);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

/** CAREER SINCE 表示用 — 例: 2025/12/09 */
export function formatCareerSinceDate(
  memberSinceMs: number | null | undefined
): string | null {
  if (memberSinceMs == null || !Number.isFinite(memberSinceMs)) return null;
  const d = new Date(memberSinceMs);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export function buildProfileCareerStats(input: {
  language: "ja" | "en";
  posts?: number | null;
  winRate?: number | null;
  totalPointsRank?: number | null;
  totalPointsRankDenominator?: number | null;
  memberSinceMs?: number | null;
  badges?: readonly ProfileCareerBadgeLike[];
  /** 将来のシーズン切替。現状は all-time */
  seasonKey?: "all-time" | string;
}): ProfileCareerStats {
  const posts =
    typeof input.posts === "number" && Number.isFinite(input.posts)
      ? Math.max(0, Math.floor(input.posts))
      : null;
  const winRatePct =
    typeof input.winRate === "number" && Number.isFinite(input.winRate)
      ? Math.round(Math.max(0, Math.min(1, input.winRate)) * 1000) / 10
      : null;
  const allTimeRank =
    typeof input.totalPointsRank === "number" &&
    Number.isFinite(input.totalPointsRank) &&
    input.totalPointsRank > 0
      ? Math.floor(input.totalPointsRank)
      : null;
  const allTimeRankDenominator =
    typeof input.totalPointsRankDenominator === "number" &&
    Number.isFinite(input.totalPointsRankDenominator) &&
    input.totalPointsRankDenominator > 0
      ? Math.floor(input.totalPointsRankDenominator)
      : null;

  const seasonKey = input.seasonKey ?? "all-time";
  const current = CURRENT_NBA_SEASON_KEY;

  return {
    predictions: posts,
    sinceYear: profileCareerSinceYear(input.memberSinceMs),
    sinceDate: formatCareerSinceDate(input.memberSinceMs),
    allTimeRank,
    allTimeRankDenominator,
    bestMonthlyRank: null,
    top10Finishes: null,
    totalUnitsEarned: null,
    winRatePct,
    bestSport: posts != null && posts > 0 ? "NBA" : null,
    awards: aggregateCareerAwardsFromBadges(input.badges ?? [], input.language),
    seasonKey,
    seasonOptions: ["all-time", current] as const,
  };
}

export function formatCareerRank(rank: number | null): string {
  if (rank == null) return "—";
  return `#${rank.toLocaleString("en-US")}`;
}

export function formatCareerCount(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

export function formatCareerWinRate(pct: number | null): string {
  if (pct == null) return "—";
  return `${pct.toFixed(1)}%`;
}

export function formatCareerUnitsEarned(n: number | null): string {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("en-US")}`;
}
