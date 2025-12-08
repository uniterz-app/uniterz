// types/prediction-post-v2.ts

export type PredictionPostV2 = {
  id: string;

  /* ------------------------
     Author Info
  ------------------------ */
  authorUid?: string | null;
  authorHandle?: string | null;
  author?: {
    name: string;
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

  // Firestore 上では top-level に league と status が存在している
  league: "bj" | "j1" | "nba";
  status: "scheduled" | "live" | "final";

  /* ------------------------
     Team Info (Firestore準拠)
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
     Optional old game block
     (互換性のため残すが基本使わない)
  ------------------------ */
  game?: {
    league: "bj" | "j1" | "nba";
    home: string;
    away: string;
    status: "scheduled" | "live" | "final";
    finalScore?: { home: number; away: number };
  } | null;

  /* ------------------------
     Prediction
  ------------------------ */
  prediction: {
    winner: "home" | "away";
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
     Stats (V2)
  ------------------------ */
  stats?: {
    isWin: boolean | null;

    scoreError?: number | null;
    brier?: number | null;

    rankingReady?: boolean;
    rankingFactor?: 0 | 1;

    marketCount?: number | null;
    marketBias?: number | null;

    upsetScore: number | null;

    scorePrecision?: number | null;
    scorePrecisionDetail?: {
      homePt: number;
      awayPt: number;
      diffPt: number;
    } | null;
  } | null;
};
