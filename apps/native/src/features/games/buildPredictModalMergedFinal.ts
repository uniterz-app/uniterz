import {
  resolveResultCardBadge,
  type ResultOutcomeOnlyBadge,
} from "../../../../../lib/result/resultBadge";
import type { ResultCardBadge } from "../../../../../lib/result/resultGlass";
import type { WinStreakBadgeStyle } from "../../../../../lib/ui/winStreakBadge";
import type { GamesLanguage } from "./gamesI18n";
import {
  resolveWcGoalScorerResultNative,
  type WcGoalScorerPostLike,
  type WcGoalScorerResultInfo,
} from "../results/useWcGoalScorerResultNative";
import type { PkScore } from "../../../../../lib/games/pkScore";
import {
  buildResultStatMetricValues,
  extractResultSettlementBreakdown,
} from "../../../../../lib/result/buildResultStatRows";

export type PredictModalResultStatRow = {
  key: "upsetPoints" | "pointsV3";
  label: string;
  value: number;
  barMax: number;
  display: string;
  ratio: number;
  valueTone: "white" | "yellow" | "red";
};

export type PredictModalMergedFinalPreview = {
  finalScore: { home: number; away: number };
  predictedScore: { home: number; away: number };
  finalLabel: string;
  pkScore?: PkScore | null;
  badge: ResultCardBadge;
  outcomeBadge: ResultOutcomeOnlyBadge;
  showStreakBadge: boolean;
  stackBadges: boolean;
  streakBadge: WinStreakBadgeStyle | null;
  activeWinStreak: number;
  wcGoalScorer: WcGoalScorerResultInfo | null;
  statRows: PredictModalResultStatRow[];
};

function toNumber(v: unknown, fallback = 0) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (t !== "") {
      const n = Number(t);
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function isYellow10pt(v: unknown): boolean {
  const n = toNumber(v, NaN);
  return Number.isFinite(n) && n >= 7;
}

function isRedUpset(v: unknown): boolean {
  const n = toNumber(v, NaN);
  return Number.isFinite(n) && n >= 7;
}

type BuildParams = {
  league: string;
  language: GamesLanguage;
  finalScore: { home: number; away: number };
  predictedScore: { home: number; away: number };
  stats?: Record<string, unknown> | null;
  goalScorer?: unknown;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  finalOt?: boolean;
  pkScore?: PkScore | null;
};

/** Web `MatchCard` overlay + `ResultStatsRows` 相当の試合終了・予想済みプレビュー */
export function buildPredictModalMergedFinalPreview(
  params: BuildParams
): PredictModalMergedFinalPreview | null {
  const {
    league,
    language,
    finalScore,
    predictedScore,
    stats,
    goalScorer,
    homeTeamId,
    awayTeamId,
    finalOt = false,
    pkScore = null,
  } = params;
  const isEn = language === "en";

  const postLike: WcGoalScorerPostLike = {
    league,
    status: "final",
    home: { teamId: homeTeamId ?? null },
    away: { teamId: awayTeamId ?? null },
    result: finalScore,
    prediction: {
      score: predictedScore,
      goalScorer: goalScorer ?? null,
    },
    stats,
  };

  const {
    badge,
    outcomeBadge,
    showStreakBadge,
    stackBadges,
    streakBadge,
    activeWinStreak,
  } = resolveResultCardBadge(
    postLike as Parameters<typeof resolveResultCardBadge>[0],
    language
  );

  const wcGoalScorer = resolveWcGoalScorerResultNative(postLike);

  const breakdown = extractResultSettlementBreakdown(stats);
  const metricValues = buildResultStatMetricValues(breakdown);

  const labelFor = (key: "upsetPoints" | "pointsV3") => {
    if (key === "upsetPoints") return isEn ? "Upset Score" : "アップセット";
    return isEn ? "Total Score" : "総合得点";
  };

  const toneFor = (
    key: "upsetPoints" | "pointsV3",
    value: number
  ): PredictModalResultStatRow["valueTone"] => {
    if (key === "upsetPoints") {
      return breakdown.hadUpsetGame && isRedUpset(value) ? "red" : "white";
    }
    return isYellow10pt(value) ? "yellow" : "white";
  };

  const statRows: PredictModalResultStatRow[] = metricValues.map((m) => ({
    key: m.key,
    label: labelFor(m.key),
    value: m.value,
    barMax: m.barMax,
    display:
      m.displayValue == null
        ? "--"
        : `${(Math.round(m.displayValue * 10) / 10).toFixed(1)}`,
    ratio:
      m.key === "upsetPoints" && !breakdown.hadUpsetGame
        ? 0
        : m.barMax > 0
          ? clamp01(m.value / m.barMax)
          : 0,
    valueTone: toneFor(m.key, m.value),
  }));

  const finalLabel = `${isEn ? "Final" : "試合終了"}${finalOt ? " (OT)" : ""}`;

  return {
    finalScore,
    predictedScore,
    finalLabel,
    pkScore,
    badge,
    outcomeBadge,
    showStreakBadge,
    stackBadges,
    streakBadge,
    activeWinStreak,
    wcGoalScorer,
    statRows,
  };
}
