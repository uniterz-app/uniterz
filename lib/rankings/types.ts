// ========== ランキング期間 ==========
export type Period = "day" | "week" | "month";

// ========== リーグタブ ==========
export type LeagueTab = "nba" | "b1";

// ========== 指標 ==========
export type Metric =
  | "winRate"
  | "avgPrecision"
  | "streak"
  
  

// ========== ランキング行 ==========
export type RankingRow = {
  uid: string;
  handle: string;
  displayName: string;
  photoURL?: string;

  posts: number;      // 期間内投稿数
  winRate?: number;   // 0..1
  avgPrecision?: number;
  streak?: number;
};

// ========== APIレスポンス ==========
export type RankingResponse = {
  rows: RankingRow[];
  nextCursor?: string;
};
