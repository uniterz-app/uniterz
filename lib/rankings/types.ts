// ========== ランキング期間 ==========
export type Period = "week" | "month";

// ========== リーグタブ ==========
export type LeagueTab = "nba" | "b1";

// ========== 指標 ==========
export type Metric =
  | "winRate"
  | "accuracy"
  | "avgPrecision"
  | "avgUpset"
  | "consistency";

// ========== ランキング行 ==========
export type RankingRow = {
  uid: string;
  handle: string; // ← これを追加
  displayName: string;
  photoURL?: string;

  posts: number;
  winRate?: number;
  accuracy?: number;
  avgPrecision?: number;
  avgUpset?: number;
  consistency?: number;
};

// ========== APIレスポンス ==========
export type RankingResponse = {
  rows: RankingRow[];
  nextCursor?: string;
};
