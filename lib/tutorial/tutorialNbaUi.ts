/**
 * チュートリアル練習 — 本番 UI コンポーネントへ渡すモックデータ生成
 */

import type { MatchCardProps } from "@/app/component/games/MatchCard";
import type { Profile } from "@/app/component/profile/useProfile";
import type { RankingRowWithCountry } from "@/lib/rankings/rankingMetrics";
import type { PostWithMillis } from "@/lib/result/result-page-data";
import type { GamePointsDistributionV1 } from "@/lib/results/gamePointsDistribution";
import {
  gradeTutorialNbaPick,
  TUTORIAL_NBA_MOCK_GAME,
  type TutorialGrade,
  type TutorialPredictPick,
} from "@/lib/tutorial/tutorialNbaMock";

const game = TUTORIAL_NBA_MOCK_GAME;

/** 予想前の試合カード（scheduled） */
export function buildTutorialMatchCardProps(_opts?: {
  language?: "ja" | "en";
}): MatchCardProps {
  return {
    id: game.id,
    league: "nba",
    season: "2025-26",
    seasonPhase: "regular",
    startAtJst: new Date(Date.now() + 2 * 60 * 60 * 1000),
    status: "scheduled",
    home: {
      name: game.home.name,
      teamId: game.home.teamId,
      colorHex: game.home.colorHex,
    },
    away: {
      name: game.away.name,
      teamId: game.away.teamId,
      colorHex: game.away.colorHex,
    },
    score: null,
    liveMeta: null,
    finalMeta: null,
    viewPredictionHref: "#",
    makePredictionHref: "#",
    dense: true,
    disableCardMotion: true,
    heavyListEntry: false,
    showMarketBias: true,
    marketBias: { homePct: 54, awayPct: 46 },
    homeRecord: { wins: 48, losses: 20 },
    awayRecord: { wins: 42, losses: 26 },
    topScorerCandidates: [
      {
        playerId: "tutorial-tatum",
        teamId: game.home.teamId,
        name: "Jayson Tatum",
        ppg: 27.2,
      },
      {
        playerId: "tutorial-brown",
        teamId: game.home.teamId,
        name: "Jaylen Brown",
        ppg: 23.1,
      },
      {
        playerId: "tutorial-lebron",
        teamId: game.away.teamId,
        name: "LeBron James",
        ppg: 24.8,
      },
      {
        playerId: "tutorial-ad",
        teamId: game.away.teamId,
        name: "Anthony Davis",
        ppg: 25.5,
      },
    ],
  };
}

/** リザルト詳細用（final）— 本番詳細オーバーレイと同じ MatchCard */
export function buildTutorialFinalMatchCardProps(opts?: {
  language?: "ja" | "en";
}): MatchCardProps {
  const base = buildTutorialMatchCardProps(opts);
  const tip = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return {
    ...base,
    startAtJst: tip,
    status: "final",
    score: { home: game.finalHome, away: game.finalAway },
    liveMeta: null,
    finalMeta: {},
  };
}

/** 詳細の市場バー用 */
export function buildTutorialResultMarket(): {
  homeRate: number;
  awayRate: number;
  total: number;
} {
  return { homeRate: 0.54, awayRate: 0.46, total: 128 };
}

/**
 * 得点分布チャート用モック。
 * ビン境界は Cloud Functions `gamePointsDistributionAgg` と同じ並び。
 * 外れ(0)が多く、的中帯は 5〜7 付近にピーク。
 */
export function buildTutorialPointsDistribution(): GamePointsDistributionV1 {
  const bins = [
    { lo: 0, hi: 0, count: 38 },
    { lo: 4, hi: 4.5, count: 7 },
    { lo: 4.5, hi: 5.5, count: 16 },
    { lo: 5.5, hi: 6.5, count: 22 },
    { lo: 6.5, hi: 7.5, count: 18 },
    { lo: 7.5, hi: 8.5, count: 11 },
    { lo: 8.5, hi: 10.02, count: 9 },
    { lo: 10.02, hi: 1e6, count: 3 },
  ];
  const n = bins.reduce((s, b) => s + b.count, 0);
  return {
    v: 1,
    bins,
    n,
    /** 的中帯寄りの中央値（0点多数でも中央は的中側に寄る想定） */
    median: 6.1,
    mean: 4.35,
    updatedAtMillis: Date.now(),
  };
}

/** チュートリアル用リザルト投稿 ID（一覧差し込み・ハイライト用） */
export const TUTORIAL_RESULT_POST_ID = "tutorial-post-1";

export function buildTutorialResultPost(
  pick: TutorialPredictPick,
  grade?: TutorialGrade | null
): PostWithMillis {
  /** 保存済み grade が古い形でも、常に pick から再採点する */
  const settled = gradeTutorialNbaPick(game, pick);
  void grade;
  const now = Date.now();
  const d = settled.pointsV3Detail;
  return {
    id: TUTORIAL_RESULT_POST_ID,
    createdAtText: "now",
    createdAtMillis: now,
    /** 確定扱い（`isFinalResultPost` は settledAt 必須） */
    startAtMillis: now - 3 * 60 * 60 * 1000,
    settledAtMillis: now,
    gameId: game.id,
    league: "nba",
    status: "final",
    home: {
      name: game.home.name,
      teamId: game.home.teamId,
      record: { w: 48, l: 20 },
    },
    away: {
      name: game.away.name,
      teamId: game.away.teamId,
      record: { w: 42, l: 26 },
    },
    result: {
      home: game.finalHome,
      away: game.finalAway,
    },
    prediction: {
      winner: pick.winner,
      score: { home: pick.scoreHome, away: pick.scoreAway },
      ...(pick.goalScorer ? { goalScorer: pick.goalScorer } : {}),
    },
    author: { name: "You", handle: "you" },
    stats: {
      isWin: settled.outcome === "hit",
      hadUpsetGame: false,
      scoreError:
        Math.abs(pick.scoreHome - game.finalHome) +
        Math.abs(pick.scoreAway - game.finalAway),
      scorePrecision: settled.scorePrecision,
      scorePrecisionDetail: settled.scorePrecisionDetail,
      exactMatch: settled.scoreExact,
      upsetHit: false,
      upsetPoints: 0,
      pointsV3: settled.points,
      pointsV3Detail: {
        winnerCorrect: d.winnerCorrect,
        winPoints: d.winPoints,
        diffPoints: d.diffPoints,
        totalPoints: d.totalPoints,
        basePoints: d.basePoints,
        upsetBonus: d.upsetBonus,
        streakBonus: d.streakBonus,
        goalScorerBonus: d.goalScorerBonus,
        diffError: d.diffError,
        totalError: d.totalError,
        exactMatch: d.exactMatch,
      },
      rankingReady: true,
      rankingFactor: 1,
    },
  };
}

export function buildTutorialRankingRows(
  grade: TutorialGrade | null
): RankingRowWithCountry[] {
  const youPts = grade?.outcome === "hit" ? 2322 : 2310;
  return [
    {
      uid: "u1",
      handle: "ace_shot",
      displayName: "ace_shot",
      photoURL: undefined,
      posts: 120,
      totalScore: 2480,
      winRate: 0.62,
      countryCode: "US",
    },
    {
      uid: "you",
      handle: "you",
      displayName: "you",
      photoURL: undefined,
      posts: 1,
      totalScore: youPts,
      winRate: grade?.outcome === "hit" ? 1 : 0,
      countryCode: "JP",
    },
    {
      uid: "u3",
      handle: "court_king",
      displayName: "court_king",
      photoURL: undefined,
      posts: 98,
      totalScore: 2105,
      winRate: 0.55,
      countryCode: "KR",
    },
  ];
}

export function buildTutorialProfile(): Profile {
  return {
    displayName: "You",
    handle: "you",
    bio: "",
    avatarUrl: "",
    counts: { posts: 1 },
    currentStreak: 1,
    maxStreak: 1,
    plan: "free",
    planProBgVariant: "atmos",
    countryCode: "JP",
    memberSinceMs: Date.now(),
    unitBalance: 0,
  };
}

export function tutorialGradeFromPick(pick: TutorialPredictPick): TutorialGrade {
  return gradeTutorialNbaPick(game, pick);
}
