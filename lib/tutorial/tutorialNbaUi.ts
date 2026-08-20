/**
 * チュートリアル練習 — 本番 UI コンポーネントへ渡すモックデータ生成
 *
 * リザルトは本番と同様 `buildResultCardFaceModel` / `buildResultDetailViewModel`
 * が読む settle 埋め込み形（marketMeta・scoreRel・pointsV3Detail 等）を返す。
 */

import type { MatchCardProps } from "@/app/component/games/MatchCard";
import type { Profile } from "@/app/component/profile/useProfile";
import type { RankingRowWithCountry } from "@/lib/rankings/rankingMetrics";
import type { ResultCardFaceMarketInput } from "@/lib/result/buildResultCardFace";
import { resolveResultScoreRelative } from "@/lib/result/resultScoreRelative";
import type { PostWithMillis } from "@/lib/result/result-page-data";
import type { GamePointsDistributionV1 } from "@/lib/results/gamePointsDistribution";
import type {
  GamePointsSummaryV1,
  GamePointsTopEntryV1,
} from "@/lib/results/gamePointsSummary";
import {
  gradeTutorialNbaPick,
  TUTORIAL_NBA_MOCK_GAME,
  type TutorialGrade,
  type TutorialPredictPick,
} from "@/lib/tutorial/tutorialNbaMock";

const game = TUTORIAL_NBA_MOCK_GAME;

/** 図解・プレビュー用の固定予想（Lakers 勝ち寄り・最多得点者あり） */
export function buildTutorialDemoPick(): TutorialPredictPick {
  return {
    winner: "away",
    scoreHome: 106,
    scoreAway: 110,
    goalScorer: {
      playerId: "tutorial-lebron",
      teamId: game.away.teamId,
      name: "LeBron James",
    },
  };
}

/** 予想前の試合カード（scheduled） */
export function buildTutorialMatchCardProps(_opts?: {
  language?: "ja" | "en";
}): MatchCardProps {
  return {
    id: game.id,
    league: "nba",
    season: "2025-26",
    seasonPhase: "regular",
    roundLabel: "REGULAR SEASON",
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
    marketBias: { homePct: 36, awayPct: 64 },
    homeRecord: { wins: 48, losses: 20, rank: 2 },
    awayRecord: { wins: 42, losses: 26, rank: 6 },
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

/** チュートリアル用リザルト投稿 ID（一覧差し込み・ハイライト用） */
export const TUTORIAL_RESULT_POST_ID = "tutorial-post-1";

/**
 * __DEV__ リザルトカード詳細プレビュー用 ID。
 * チュートリアルの保存ピックに依存せず、常に固定モックを返す。
 */
export const RESULT_DETAIL_DESIGN_PREVIEW_POST_ID =
  "__dev_result_detail_preview__";

/** 詳細の市場バー用（0–1）。カード面は asMarketPct で 0–100 に正規化 */
export function buildTutorialResultMarket(): ResultCardFaceMarketInput & {
  homeRate: number;
  awayRate: number;
  total: number;
} {
  return {
    homeRate: 0.36,
    awayRate: 0.64,
    homePct: 36,
    awayPct: 64,
    total: 128,
  };
}

/**
 * 詳細の中央値・相対ラベル・Top10 用サマリ。
 * `buildTutorialPointsDistribution` と同じ母集団イメージ。
 */
export function buildTutorialPointsSummary(
  myPoints: number
): GamePointsSummaryV1 {
  const pts = Number.isFinite(myPoints) ? myPoints : 0;
  const max = Math.max(10.0, pts);
  const top: GamePointsTopEntryV1[] = [
    {
      rank: 1,
      postId: "tutorial-top-1",
      uid: "u1",
      handle: "ace_shot",
      displayName: "ace_shot",
      photoURL: null,
      isPro: true,
      points: max,
    },
    {
      rank: 2,
      postId: TUTORIAL_RESULT_POST_ID,
      uid: "you",
      handle: "you",
      displayName: "you",
      photoURL: null,
      isPro: false,
      points: pts,
    },
    {
      rank: 3,
      postId: "tutorial-top-3",
      uid: "u3",
      handle: "court_king",
      displayName: "court_king",
      photoURL: null,
      isPro: false,
      points: Math.max(0, Math.min(pts - 0.4, 7.5)),
    },
  ];
  return {
    v: 1,
    n: 128,
    median: 6.1,
    max,
    p95: 8.5,
    p90: 7.2,
    top,
    updatedAtMillis: Date.now(),
  };
}

/** Native / Web 詳細 VM 向けオプション */
export function buildTutorialResultDetailOptions(myPoints: number) {
  const match = buildTutorialMatchCardProps();
  return {
    market: buildTutorialResultMarket(),
    pointsSummary: buildTutorialPointsSummary(myPoints),
    leadingScorers: game.leadingScorers,
    topScorerCandidates: match.topScorerCandidates,
  };
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

/** 詳細プレビュー用の固定予想（的中寄り） */
export function buildResultDetailDesignPreviewPick(): TutorialPredictPick {
  const winner = game.finalHome >= game.finalAway ? "home" : "away";
  const leading = game.leadingScorers[0];
  return {
    winner,
    scoreHome: game.finalHome + (winner === "home" ? -3 : 3),
    scoreAway: game.finalAway + (winner === "away" ? -2 : 2),
    goalScorer: leading
      ? {
          playerId: leading.playerId,
          teamId: leading.teamId,
          name: leading.name,
        }
      : null,
  };
}

export function buildTutorialResultPost(
  pick: TutorialPredictPick,
  grade?: TutorialGrade | null
): PostWithMillis {
  /** 保存済み grade が古い形でも、常に pick から再採点する */
  const settled = gradeTutorialNbaPick(game, pick);
  void grade;
  const now = Date.now();
  const d = settled.pointsV3Detail;
  const hit = settled.outcome === "hit";
  /** 練習初回は連勝 1。HIT 時のみバッジ経路に乗せる */
  const activeWinStreak = hit ? 1 : 0;
  const pointsSummary = buildTutorialPointsSummary(settled.points);
  const scoreRel = hit
    ? resolveResultScoreRelative(settled.points, pointsSummary)
    : ("none" as const);

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
    /** `roundLabelFromPost` → REGULAR SEASON */
    seasonPhase: "regular",
    seasonRound: "REGULAR SEASON",
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
    /** Lakers（AWAY）寄り — settle 埋め込みと同じ形 */
    marketMeta: {
      majoritySide: "away",
      majorityRatio: 0.64,
      homePct: 36,
      awayPct: 64,
    },
    authorUid: "you",
    authorHandle: "you",
    author: { name: "You", handle: "you" },
    stats: {
      isWin: hit,
      hadUpsetGame: false,
      scoreError:
        Math.abs(pick.scoreHome - game.finalHome) +
        Math.abs(pick.scoreAway - game.finalAway),
      scorePrecision: settled.scorePrecision,
      scorePrecisionDetail: settled.scorePrecisionDetail,
      exactMatch: settled.scoreExact,
      upsetHit: false,
      upsetPoints: 0,
      goalScorerBonus: settled.goalScorerBonus,
      pointsV3: settled.points,
      scoreRel,
      pointsV3Detail: {
        winnerCorrect: d.winnerCorrect,
        winPoints: d.winPoints,
        diffPoints: d.diffPoints,
        totalPoints: d.totalPoints,
        basePoints: d.basePoints,
        upsetBonus: d.upsetBonus,
        streakBonus: d.streakBonus,
        goalScorerBonus: d.goalScorerBonus,
        activeWinStreak,
        diffError: d.diffError,
        totalError: d.totalError,
        exactMatch: d.exactMatch,
      },
      rankingReady: true,
      rankingFactor: 1,
    },
  } as PostWithMillis;
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
    planProBgVariant: "beast-titanium",
    countryCode: "JP",
    memberSinceMs: Date.now(),
    unitBalance: 0,
    profileViewCount: null,
  };
}

export function tutorialGradeFromPick(pick: TutorialPredictPick): TutorialGrade {
  return gradeTutorialNbaPick(game, pick);
}
