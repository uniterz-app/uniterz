/**
 * チュートリアル練習用 — NBA モック試合データ。
 * 本番 API は叩かず、クライアント完結で HIT / MISS を判定する。
 * チーム ID・名称は本番 Schedule（nba-* / NBA_TEAM_NAME_BY_ID）に合わせる。
 * 総合得点・スコア精度は finalizePost / calcPointsV3 / calcScorePrecision と同系。
 */

import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import {
  calcNbaTopScorerBonus,
  NBA_TOP_SCORER_BONUS_POINTS,
  type NbaTopScorerPick,
} from "@/lib/nba/topScorer";
import { teamColorsNBA } from "@/lib/teams-nba";

export type TutorialNbaSide = {
  /** 本番 Firestore / カラー辞書と同じ ID（例: nba-celtics） */
  teamId: string;
  abbr: string;
  /** カード表示用（本番と同じ英語正式名） */
  name: string;
  /** 練習オーバーレイ等の日本語短名 */
  nameJa: string;
  nameEn: string;
  /** ユニフォーム primary（teams-nba 準拠） */
  colorHex: string;
};

export type TutorialNbaMockGame = {
  id: string;
  league: "nba";
  tipOffLabel: string;
  tipOffLabelEn: string;
  home: TutorialNbaSide;
  away: TutorialNbaSide;
  /** 試合終了後の確定スコア（答え合わせ用） */
  finalHome: number;
  finalAway: number;
  /**
   * 試合の最多得点者（モック確定）。
   * 得点者ボーナス採点用。
   */
  leadingScorers: Array<{
    playerId: string;
    teamId: string;
    points: number;
    name: string;
  }>;
};

export type TutorialPredictPick = {
  winner: "home" | "away";
  scoreHome: number;
  scoreAway: number;
  /** NBA 最多得点者予想（任意・的中で +2） */
  goalScorer?: NbaTopScorerPick | null;
};

export type TutorialScorePrecisionDetail = {
  homePt: number;
  awayPt: number;
  diffPt: number;
};

export type TutorialPointsV3Detail = {
  winnerCorrect: boolean;
  winPoints: number;
  diffPoints: number;
  totalPoints: number;
  basePoints: number;
  upsetBonus: number;
  streakBonus: number;
  goalScorerBonus: number;
  diffError: number;
  totalError: number;
  exactMatch: boolean;
};

export type TutorialGrade = {
  winnerHit: boolean;
  scoreExact: boolean;
  /** 勝敗的中なら HIT（スコア完全一致はボーナス表示） */
  outcome: "hit" | "miss";
  /** 総合得点（基本点 + ボーナス） */
  points: number;
  scorePrecision: number;
  scorePrecisionDetail: TutorialScorePrecisionDetail;
  pointsV3Detail: TutorialPointsV3Detail;
  goalScorerBonus: number;
};

const CELTICS_ID = "nba-celtics";
const LAKERS_ID = "nba-lakers";

const round1 = (v: number) => Math.round(v * 10) / 10;

/** 誤差 0→1, 1〜11 で線形減衰, 12+ → 0（functions scorePrecisionRules と同じ） */
function gradientScore(diff: number, zeroAt: number): number {
  if (diff <= 0) return 1;
  if (diff >= zeroAt) return 0;
  return 1 - diff / zeroAt;
}

/** 本番 calcScorePrecision（basketball）相当 */
export function calcTutorialNbaScorePrecision(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): TutorialScorePrecisionDetail & { totalPt: number } {
  const diffHome = Math.abs(predictedHome - actualHome);
  const diffAway = Math.abs(predictedAway - actualAway);
  const diff = Math.abs(
    predictedHome - predictedAway - (actualHome - actualAway)
  );
  const homePt = round1(gradientScore(diffHome, 12) * 3);
  const awayPt = round1(gradientScore(diffAway, 12) * 3);
  const diffPt = round1(gradientScore(diff, 12) * 4);
  const total = homePt + awayPt + diffPt;
  return {
    homePt,
    awayPt,
    diffPt,
    totalPt: Math.min(10, round1(total)),
  };
}

function lerpByRange(
  value: number,
  min: number,
  max: number,
  start: number,
  end: number
) {
  if (value <= min) return start;
  if (value >= max) return end;
  const t = (value - min) / (max - min);
  return start + (end - start) * t;
}

function calcDiffPointsGradient(diffError: number) {
  if (diffError <= 0) return 4;
  if (diffError <= 3) return lerpByRange(diffError, 0, 3, 4, 3);
  if (diffError <= 6) return lerpByRange(diffError, 3, 6, 3, 2);
  if (diffError <= 10) return lerpByRange(diffError, 6, 10, 2, 1);
  if (diffError <= 14) return lerpByRange(diffError, 10, 14, 1, 0);
  return 0;
}

/** 本番 calcPointsV3（NBA）相当 — 勝者外れは基本点 0 */
function calcTutorialNbaBasePoints(opts: {
  predHome: number;
  predAway: number;
  finalHome: number;
  finalAway: number;
}): {
  points: number;
  basePoints: number;
  winnerCorrect: boolean;
  winPoints: number;
  diffPoints: number;
  totalPoints: number;
  diffError: number;
  totalError: number;
} {
  const { predHome, predAway, finalHome, finalAway } = opts;
  const finalDiff = finalHome - finalAway;
  const predDiff = predHome - predAway;
  const winnerCorrect =
    (finalDiff > 0 && predDiff > 0) || (finalDiff < 0 && predDiff < 0);
  const diffError = Math.abs(finalDiff - predDiff);
  const totalError = Math.abs(finalHome + finalAway - (predHome + predAway));

  if (!winnerCorrect) {
    return {
      points: 0,
      basePoints: 0,
      winnerCorrect: false,
      winPoints: 0,
      diffPoints: 0,
      totalPoints: 0,
      diffError,
      totalError,
    };
  }

  const winPoints = 4;
  const diffPoints = round1(calcDiffPointsGradient(diffError));
  let totalPoints = 0;
  if (totalError <= 3) totalPoints = 2;
  else if (totalError <= 7) totalPoints = 1;

  const basePoints = round1(winPoints + diffPoints + totalPoints);
  return {
    points: basePoints,
    basePoints,
    winnerCorrect: true,
    winPoints,
    diffPoints,
    totalPoints,
    diffError,
    totalError,
  };
}

/** 練習用の1試合（Lakers @ Celtics）— 本番チーム ID / 名称 / カラー */
export const TUTORIAL_NBA_MOCK_GAME: TutorialNbaMockGame = {
  id: "tutorial-nba-lal-bos",
  league: "nba",
  tipOffLabel: "本日 9:00 tip-off（練習用）",
  tipOffLabelEn: "Today 9:00 tip-off (practice)",
  home: {
    teamId: CELTICS_ID,
    abbr: "BOS",
    name: NBA_TEAM_NAME_BY_ID[CELTICS_ID] ?? "Boston Celtics",
    nameJa: "セルティックス",
    nameEn: "Celtics",
    colorHex: teamColorsNBA[CELTICS_ID]?.primary ?? "#BC9A5C",
  },
  away: {
    teamId: LAKERS_ID,
    abbr: "LAL",
    name: NBA_TEAM_NAME_BY_ID[LAKERS_ID] ?? "Los Angeles Lakers",
    nameJa: "レイカーズ",
    nameEn: "Lakers",
    colorHex: teamColorsNBA[LAKERS_ID]?.primary ?? "#DFFE00",
  },
  finalHome: 108,
  finalAway: 112,
  leadingScorers: [
    {
      playerId: "tutorial-lebron",
      teamId: LAKERS_ID,
      points: 32,
      name: "LeBron James",
    },
  ],
};

export function tutorialNbaFinalWinner(
  game: TutorialNbaMockGame
): "home" | "away" {
  return game.finalHome > game.finalAway ? "home" : "away";
}

export function gradeTutorialNbaPick(
  game: TutorialNbaMockGame,
  pick: TutorialPredictPick
): TutorialGrade {
  const actual = tutorialNbaFinalWinner(game);
  const winnerHit = pick.winner === actual;
  const scoreExact =
    pick.scoreHome === game.finalHome && pick.scoreAway === game.finalAway;

  const precision = calcTutorialNbaScorePrecision(
    pick.scoreHome,
    pick.scoreAway,
    game.finalHome,
    game.finalAway
  );

  const base = calcTutorialNbaBasePoints({
    predHome: pick.scoreHome,
    predAway: pick.scoreAway,
    finalHome: game.finalHome,
    finalAway: game.finalAway,
  });

  const goalScorerBonus = calcNbaTopScorerBonus(
    "nba",
    { goalScorer: pick.goalScorer ?? null },
    game.leadingScorers
  );

  /** 得点者ボーナスは勝者外れでも別枠加点（本番 finalize と同系） */
  const points = round1(base.points + goalScorerBonus);

  return {
    winnerHit,
    scoreExact,
    outcome: winnerHit ? "hit" : "miss",
    points,
    scorePrecision: precision.totalPt,
    scorePrecisionDetail: {
      homePt: precision.homePt,
      awayPt: precision.awayPt,
      diffPt: precision.diffPt,
    },
    goalScorerBonus,
    pointsV3Detail: {
      winnerCorrect: base.winnerCorrect,
      winPoints: base.winPoints,
      diffPoints: base.diffPoints,
      totalPoints: base.totalPoints,
      basePoints: base.basePoints,
      upsetBonus: 0,
      streakBonus: 0,
      goalScorerBonus,
      diffError: base.diffError,
      totalError: base.totalError,
      exactMatch: scoreExact,
    },
  };
}

/** 説明用ヒント（基本の勝敗点 + 得点者ボーナス上限） */
export const TUTORIAL_NBA_HIT_POINTS_HINT = 4 + NBA_TOP_SCORER_BONUS_POINTS;

/** 練習ツアーのフェーズ */
export type TutorialPracticePhase =
  | "welcome"
  | "tapCard"
  | "predictGuide"
  | "predictInput"
  | "resolving"
  | "result"
  | "rankings"
  | "groups"
  | "profile"
  | "done";

export const TUTORIAL_PRACTICE_PHASE_ORDER: readonly TutorialPracticePhase[] = [
  "welcome",
  "tapCard",
  "predictGuide",
  "predictInput",
  "resolving",
  "result",
  "rankings",
  "groups",
  "profile",
  "done",
] as const;
