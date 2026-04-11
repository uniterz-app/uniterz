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
  handle: string; // ← これを追加
  displayName: string;
  photoURL?: string;
  /** 累積ランキング API などで付与（未設定は free 扱い） */
  plan?: "free" | "pro";

  posts: number; // 期間内投稿数
  winRate?: number; // 0..1
  accuracy?: number;
  avgPrecision?: number;
  streak?: number;
};

// ========== APIレスポンス ==========
export type RankingResponse = {
  rows: RankingRow[];
  nextCursor?: string;
};
