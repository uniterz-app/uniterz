// types/prediction-post-v2.ts
export type PredictionPostV2 = {
  id: string;

  authorUid?: string | null;
  authorHandle?: string | null;
  author: {
    name: string;
    avatarUrl?: string;
  };

  createdAtText: string;
  createdAtMillis?: number;

  gameId?: string | null;
  game?: {
    league: "bj" | "nba";  // ← 修正ポイント
    home: string;
    away: string;
    status: "scheduled" | "live" | "final";
    finalScore?: { home: number; away: number };
  };

  prediction: {
    winner: "home" | "away";
    confidence: number;
    score: { home: number; away: number };
  };

  note?: string;

  likeCount?: number;
  saveCount?: number;

  stats?: {
    isWin: boolean | null;
    upsetScore: number | null;
  };
};
