// types/prediction-post-v2.ts
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

  // Firestore 上では top-level に league と status が存在している
  league: League;
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
     Stats (V2)
  ------------------------ */
stats?: {
  isWin: boolean | null;

  hadUpsetGame?: boolean; // ← 追加

  scoreError?: number | null;
  brier?: number | null;

  rankingReady?: boolean;
  rankingFactor?: 0 | 1;

  marketCount?: number | null;
  marketBias?: number | null;

  upsetScore: number | null; // 使ってないなら後で削除可

  scorePrecision?: number | null;
  scorePrecisionDetail?: {
    homePt: number;
    awayPt: number;
    diffPt: number;
  } | null;
} | null;
};
