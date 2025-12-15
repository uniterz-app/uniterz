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
  handle: string;
  displayName: string;
  photoURL?: string;

  posts: number;      // 期間内投稿数
  winRate?: number;   // 0..1
  accuracy?: number;  // 0..100
  avgPrecision?: number;
  avgUpset?: number;
  consistency?: number;
};

// ========== APIレスポンス ==========
export type RankingResponse = {
  rows: RankingRow[];
  nextCursor?: string;
};
