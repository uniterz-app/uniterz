// 月次レポート dev プレビュー用モック（たたき台）。
// 分析カード群（レーダー等）は既存 ProAnalysisView をそのまま流用するため、
// ここでは「表紙」「月間ハイライト」「締め」のレポート固有データと、
// ProAnalysisView に渡すサンプル props をまとめる。

import type { AnalysisTypeId } from "@/shared/analysis/types";
import type { RadarAxisLevels } from "@/app/component/pro/analysis/radarLevelUtils";

/** 表紙（月間順位・前月比・称号） */
export type MonthlyReportCover = {
  league: "nba";
  /** 例 2026-01 */
  monthKey: string;
  participantCount: number;
  rank: number;
  prevRank: number | null;
  rankDeltaPlaces: number | null;
  topPercent: number | null;
  totalPoints: number;
  totalPosts: number;
  totalWins: number;
  analysisTypeId: AnalysisTypeId;
};

/** 月間ハイライト（ベスト試合・最多的中デー） */
export type MonthlyReportHighlights = {
  bestPick: {
    dateKey: string;
    home: { teamId: string; abbr: string; score: number };
    away: { teamId: string; abbr: string; score: number };
    myHome: number;
    myAway: number;
    points: number;
  } | null;
  /** 1日で最も稼いだ日 */
  bestDay: { dateKey: string; points: number; wins: number; posts: number } | null;
  longestWinStreak: number;
};

export function monthlyReportPreviewCover(): MonthlyReportCover {
  return {
    league: "nba",
    monthKey: "2026-01",
    participantCount: 412,
    rank: 8,
    prevRank: 15,
    rankDeltaPlaces: 7,
    topPercent: 1.9,
    totalPoints: 298.4,
    totalPosts: 38,
    totalWins: 24,
    analysisTypeId: "GIANT_SLAYER",
  };
}

export function monthlyReportPreviewHighlights(): MonthlyReportHighlights {
  return {
    bestPick: {
      dateKey: "2026-01-17",
      home: { teamId: "nba-lakers", abbr: "LAL", score: 112 },
      away: { teamId: "nba-celtics", abbr: "BOS", score: 108 },
      myHome: 110,
      myAway: 106,
      points: 9.5,
    },
    bestDay: { dateKey: "2026-01-24", points: 31.5, wins: 5, posts: 6 },
    longestWinStreak: 8,
  };
}

/** ProAnalysisView に渡すサンプル props（ProPreview と同じ形） */
export function monthlyReportPreviewAnalysisProps() {
  return {
    month: "2026-01",
    months: ["2026-01"],
    prevMonthSummary: {
      monthKey: "2025-12",
      stats: {
        raw: {
          posts: 38,
          wins: 24,
          winRate: 24 / 38,
          avgPrecision: 6.2,
          avgPointsV3: 7.85,
          scorePrecisionSum: 6.2 * 38,
          pointsSumV3: 7.85 * 38,
          basePointsSum: 240,
          upsetBonusSum: 42,
          streakBonusSum: 16.3,
          upsetPointsSum: 4.2,
          upsetHit: 5,
          pointsSumV3Rank: 12,
          leaguePosts: { nba: 25, bj: 13 },
        },
        percentiles: {
          winRate: 88,
          precision: 71,
          pointsV3: 79,
          upset: 58,
          volume: 92,
        },
      },
      olderStats: {
        raw: {
          posts: 29,
          wins: 16,
          winRate: 16 / 29,
          avgPrecision: 5.9,
          avgPointsV3: 6.4,
          scorePrecisionSum: 5.9 * 29,
          pointsSumV3: 6.4 * 29,
          basePointsSum: 168,
          upsetBonusSum: 12,
          streakBonusSum: 5.6,
          upsetPointsSum: 3.1,
          upsetHit: 3,
        },
        percentiles: {
          winRate: 72,
          precision: 65,
          pointsV3: 61,
          upset: 52,
          volume: 81,
        },
      },
    },
    prevMonthPointsSumBenchmarks: {
      mean: 172.4,
      median: 154.8,
      p90: 398.2,
      max: 881.0,
    },
    radar: {
      winRate: 8,
      precision: 6,
      upset: 8,
      volume: 7,
      streak: 7,
      upsetValid: true,
      radarEligible: true,
    },
    radarAxisLevels: {
      winRate: "S",
      precision: "M",
      upset: "S",
      volume: "M",
      streak: "S",
    } satisfies RadarAxisLevels,
    analysisTypeId: "GIANT_SLAYER" as AnalysisTypeId,
    streak: { maxWin: 8, maxLose: 3 },
    prevStreak: { maxWin: 4, maxLose: 5 },
    homeAway: {
      homeRate: 0.71,
      awayRate: 0.58,
      homeShare: 0.55,
      awayShare: 0.45,
    },
    marketBias: {
      favorableWinRate: 0.68,
      contrarianWinRate: 0.57,
      favorableShare: 0.62,
      contrarianShare: 0.38,
    },
    styleMapPoints: [
      { homeAwayBias: 0.35, marketBias: -0.2, winRate: 0.66, key: "2026-01" },
    ],
    teamAffinity: {
      strong: [
        { teamId: "lal", teamName: "Lakers", games: 8, winRate: 0.75 },
        { teamId: "bos", teamName: "Celtics", games: 6, winRate: 0.67 },
        { teamId: "mil", teamName: "Bucks", games: 5, winRate: 0.6 },
      ],
      weak: [
        { teamId: "den", teamName: "Nuggets", games: 7, winRate: 0.29 },
        { teamId: "mia", teamName: "Heat", games: 5, winRate: 0.4 },
        { teamId: "phx", teamName: "Suns", games: 4, winRate: 0.5 },
      ],
    },
  };
}
