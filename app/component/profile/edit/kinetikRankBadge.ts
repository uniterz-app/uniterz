import {
  getKinetikStreakTier,
  isKinetikWinStreakActive,
} from "./kinetikStreakFx";

export type KinetikRankBadgeTier =
  | "legend"
  | "elite"
  | "pro"
  | "analyst"
  | "rising";

export type KinetikRankBadgeResult = {
  tier: KinetikRankBadgeTier;
  label: string;
  /** 上位何%か（Rising は null） */
  topPercent: number | null;
  /** a11y / title 用 */
  description: string;
};

/** 順位を「大幅に」上げたとみなす最低上昇幅 */
export const KINETIK_RISING_MIN_DELTA = 5;

const TIER_LABEL: Record<KinetikRankBadgeTier, string> = {
  legend: "LEGEND",
  elite: "ELITE",
  pro: "PRO",
  analyst: "ANALYST",
  rising: "RISING",
};

const TIER_TOP_PERCENT: Partial<Record<KinetikRankBadgeTier, number>> = {
  legend: 1,
  elite: 5,
  pro: 10,
  analyst: 25,
};

export function normalizeTotalPointsRank(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return null;
  }
  return Math.floor(value);
}

export function normalizeRankDenominator(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return null;
  }
  return Math.floor(value);
}

export function normalizeRankDeltaPlaces(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value === 0) {
    return null;
  }
  return Math.trunc(value);
}

/** 順位から上位何%か（小さいほど上位） */
export function computeTopPercentile(
  rank: number,
  denominator: number
): number {
  const safeRank = Math.max(1, Math.floor(rank));
  const safeDenom = Math.max(1, Math.floor(denominator));
  return (safeRank / safeDenom) * 100;
}

/** 上位%表示 — 小数第3位まで（末尾ゼロは省略） */
export function formatKinetikTopPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 1000) / 1000;
  return rounded.toFixed(3).replace(/\.?0+$/, "");
}

export function getKinetikRankBadgeTierFromTopPercent(
  topPercent: number
): Exclude<KinetikRankBadgeTier, "rising"> | null {
  if (topPercent <= 1) return "legend";
  if (topPercent <= 5) return "elite";
  if (topPercent <= 10) return "pro";
  if (topPercent <= 25) return "analyst";
  return null;
}

export function isKinetikRisingBadge(rankDeltaPlaces: unknown): boolean {
  const delta = normalizeRankDeltaPlaces(rankDeltaPlaces);
  return delta != null && delta >= KINETIK_RISING_MIN_DELTA;
}

function tierDescription(
  tier: KinetikRankBadgeTier,
  language: "ja" | "en",
  topPercent: number | null,
  rankDeltaPlaces: number | null
): string {
  if (tier === "rising") {
    const n = rankDeltaPlaces ?? 0;
    return language === "ja"
      ? `順位を${n}位上げた`
      : `Moved up ${n} places`;
  }

  const pct = topPercent ?? TIER_TOP_PERCENT[tier] ?? null;
  const pctLabel = pct != null ? formatKinetikTopPercent(pct) : null;
  if (language === "ja") {
    if (pctLabel != null) return `総合得点 上位${pctLabel}%`;
    return TIER_LABEL[tier];
  }
  if (pctLabel != null) return `Top ${pctLabel}% total points`;
  return TIER_LABEL[tier];
}

/** タグタップ時に表示する説明文 */
export function getKinetikRankBadgeExplanation(
  badge: KinetikRankBadgeResult,
  language: "ja" | "en"
): string {
  const pct =
    badge.topPercent ??
    (badge.tier !== "rising" ? TIER_TOP_PERCENT[badge.tier] ?? null : null);

  if (badge.tier === "rising") {
    return language === "ja"
      ? `${badge.label}\n\n前回のランキング更新（日本時間 16:00）から 5 位以上順位を上げたときに付与されます。\n\n${badge.description}`
      : `${badge.label}\n\nAwarded when you climb at least 5 places since the last ranking update (16:00 JST).\n\n${badge.description}`;
  }

  const pctLabel = pct != null ? formatKinetikTopPercent(pct) : null;

  if (language === "ja") {
    const pctLine =
      pctLabel != null
        ? `総合得点ランキングの上位 ${pctLabel}% 以内`
        : "";
    const body = [
      pctLine,
      "日本時間 16:00 に更新される累積ランキングの順位に基づく称号です。",
    ]
      .filter(Boolean)
      .join("\n\n");
    return `${badge.label}\n${body}`;
  }

  const pctLine =
    pctLabel != null
      ? `You are in the top ${pctLabel}% of total points.`
      : "";
  const body = [
    pctLine,
    "Based on the cumulative ranking updated daily at 16:00 JST.",
  ]
    .filter(Boolean)
    .join("\n\n");
  return `${badge.label}\n${body}`;
}

function buildResult(
  tier: KinetikRankBadgeTier,
  language: "ja" | "en",
  topPercent: number | null,
  rankDeltaPlaces: number | null
): KinetikRankBadgeResult {
  return {
    tier,
    label: TIER_LABEL[tier],
    topPercent: tier === "rising" ? null : topPercent,
    description: tierDescription(tier, language, topPercent, rankDeltaPlaces),
  };
}

/**
 * 総合得点順位（上位%）と順位変動から Kinetik バッジを決定。
 * 上位25%以内のティアを優先し、該当がなければ Rising を表示。
 */
export function resolveKinetikRankBadge(input: {
  totalPointsRank?: number | null;
  totalPointsRankDenominator?: number | null;
  rankDeltaPlaces?: number | null;
  language?: "ja" | "en";
}): KinetikRankBadgeResult | null {
  const language = input.language ?? "ja";
  const rank = normalizeTotalPointsRank(input.totalPointsRank);
  const denominator = normalizeRankDenominator(
    input.totalPointsRankDenominator
  );
  const rankDelta = normalizeRankDeltaPlaces(input.rankDeltaPlaces);

  if (rank != null && denominator != null) {
    const topPercent = computeTopPercentile(rank, denominator);
    const tier = getKinetikRankBadgeTierFromTopPercent(topPercent);
    if (tier) {
      return buildResult(tier, language, topPercent, rankDelta);
    }
  }

  if (isKinetikRisingBadge(rankDelta)) {
    return buildResult("rising", language, null, rankDelta);
  }

  return null;
}

/** メニューボタン枠色: 1–3位は専用色、4位以降はティア色 */
export type KinetikMenuAccentKey =
  | "rank-1"
  | "rank-2"
  | "rank-3"
  | KinetikRankBadgeTier
  | "default";

export function resolveKinetikMenuAccent(input: {
  totalPointsRank?: number | null;
  rankBadge: KinetikRankBadgeResult | null;
}): KinetikMenuAccentKey {
  const rank = normalizeTotalPointsRank(input.totalPointsRank);
  if (rank === 1) return "rank-1";
  if (rank === 2) return "rank-2";
  if (rank === 3) return "rank-3";
  if (input.rankBadge) return input.rankBadge.tier;
  return "default";
}

/** カード枠・四隅: 連勝中は streak 色、それ以外はメニューbtn と同じ */
export type KinetikProfileAccentKey =
  | KinetikMenuAccentKey
  | "streak-1"
  | "streak-2"
  | "streak-3"
  | "streak-4";

export function resolveKinetikProfileAccent(input: {
  streak: number;
  totalPointsRank?: number | null;
  rankBadge: KinetikRankBadgeResult | null;
}): KinetikProfileAccentKey {
  if (isKinetikWinStreakActive(input.streak)) {
    const tier = getKinetikStreakTier(input.streak);
    return `streak-${tier}` as KinetikProfileAccentKey;
  }

  return resolveKinetikMenuAccent({
    totalPointsRank: input.totalPointsRank,
    rankBadge: input.rankBadge,
  });
}
