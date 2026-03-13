import type { League } from "@/lib/leagues";

export type PredictionPostV2 = {
  id: string;

  /* ------------------------
     Author Info
  ------------------------ */
  authorUid?: string | null;
  authorHandle?: string | null;
  author?: {
    name: string;
    handle?: string | null;
    avatarUrl?: string;
  } | null;

  /* ------------------------
     Timestamps
  ------------------------ */
  createdAtText: string;
  createdAtMillis?: number | null;
  startAtMillis?: number | null;

  /* ------------------------
     Game Core Info
  ------------------------ */
  gameId: string;
  league: League;
  status: "scheduled" | "live" | "final";

  /* ------------------------
     Team Info
  ------------------------ */
  home: {
    name: string;
    teamId: string;
    number?: number;
    record?: { w: number; l?: number; d?: number };
  };

  away: {
    name: string;
    teamId: string;
    number?: number;
    record?: { w: number; l?: number; d?: number };
  };

  /* ------------------------
     Final Score
  ------------------------ */
  result?: {
    home: number;
    away: number;
  } | null;

  /* ------------------------
     Market Meta（finalizePostで保存）
  ------------------------ */
  marketMeta?: {
    majoritySide: "home" | "away" | "draw";
    majorityRatio: number; // 0〜1
  } | null;

  /* ------------------------
     Legacy Game Block (optional)
  ------------------------ */
  game?: {
    league: League;
    home: string;
    away: string;
    status: "scheduled" | "live" | "final";
    finalScore?: { home: number; away: number };
  } | null;

  /* ------------------------
     Prediction
  ------------------------ */
  prediction: {
    winner: "home" | "away" | "draw";
    confidence: number;
    score: { home: number; away: number };
  };

  note?: string;

  /* ------------------------
     Interaction
  ------------------------ */
  likeCount?: number;
  saveCount?: number;

  /* ------------------------
     Stats (V2 – finalizePost準拠)
  ------------------------ */
  stats?: {
    /* 基本 */
    isWin: boolean | null;
    hadUpsetGame?: boolean;

    /* 精度系 */
    scoreError?: number | null;
    brier?: number | null;
    scorePrecision?: number | null;
    scorePrecisionDetail?: {
      homePt: number;
      awayPt: number;
      diffPt: number;
    } | null;

    /* マーケット */
    marketCount?: number | null;
    marketMajority?: "home" | "away" | "draw" | null;
    isMajorityPick?: boolean;
    marketBias?: number | null;

    /* Upset */
    upsetHit?: boolean;
    upsetPoints?: number | null;

    /* V3 総合得点 */
    pointsV3?: number | null;
    pointsV3Detail?: {
      winnerCorrect: boolean;
      winPoints: number;
      diffPoints: number;
      totalPoints: number;
      upsetBonus: number;
      diffError: number | null;
      totalError: number | null;
    } | null;

    /* ランキング */
    rankingReady?: boolean;
    rankingFactor?: 0 | 1;
  } | null;
};