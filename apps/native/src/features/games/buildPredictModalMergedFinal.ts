import { resolveResultCardBadge } from "../../../../../lib/result/resultBadge";
import type { ResultCardBadge } from "../../../../../lib/result/resultGlass";
import type { WinStreakBadgeStyle } from "../../../../../lib/ui/winStreakBadge";
import type { GamesLanguage } from "./gamesI18n";
import {
  resolveWcGoalScorerResultNative,
  type WcGoalScorerPostLike,
  type WcGoalScorerResultInfo,
} from "../results/useWcGoalScorerResultNative";

export type PredictModalResultStatRow = {
  key: "scorePrecision" | "upsetPoints" | "pointsV3";
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
  badge: ResultCardBadge;
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

  const { badge, streakBadge, activeWinStreak } = resolveResultCardBadge(
    postLike as Parameters<typeof resolveResultCardBadge>[0],
    language
  );

  const wcGoalScorer = resolveWcGoalScorerResultNative(postLike);

  const hadUpsetGame = Boolean(stats?.hadUpsetGame);
  const scorePrecision = toNumber(stats?.scorePrecision, 0);
  const upsetPoints = toNumber(stats?.upsetPoints, 0);
  const pointsV3 = toNumber(stats?.pointsV3, 0);
  const showScorePrecision = league !== "wc";

  const statRows: PredictModalResultStatRow[] = [
    ...(showScorePrecision
      ? [
          {
            key: "scorePrecision" as const,
            label: isEn ? "Score Precision" : "スコア精度",
            value: scorePrecision,
            barMax: 10,
            display: scorePrecision.toFixed(1),
            ratio: clamp01(scorePrecision / 10),
            valueTone: isYellow10pt(stats?.scorePrecision)
              ? ("yellow" as const)
              : ("white" as const),
          },
        ]
      : []),
    {
      key: "upsetPoints",
      label: isEn ? "Upset Score" : "アップセット",
      value: upsetPoints,
      barMax: 10,
      display: hadUpsetGame
        ? `${(Math.round(upsetPoints * 10) / 10).toFixed(1)}`
        : "--",
      ratio:
        hadUpsetGame && upsetPoints > 0 ? clamp01(upsetPoints / 10) : 0,
      valueTone:
        hadUpsetGame && isRedUpset(stats?.upsetPoints)
          ? "red"
          : "white",
    },
    {
      key: "pointsV3",
      label: isEn ? "Total Score" : "総合得点",
      value: pointsV3,
      barMax: 10,
      display: `${(Math.round(pointsV3 * 10) / 10).toFixed(1)}`,
      ratio: clamp01(pointsV3 / 10),
      valueTone: isYellow10pt(stats?.pointsV3) ? "yellow" : "white",
    },
  ];

  const finalLabel = `${isEn ? "Final" : "試合終了"}${finalOt ? " (OT)" : ""}`;

  return {
    finalScore,
    predictedScore,
    finalLabel,
    badge,
    streakBadge,
    activeWinStreak,
    wcGoalScorer,
    statRows,
  };
}
