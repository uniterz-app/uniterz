export type Period = "7d" | "30d" | "all";
export type LeagueTab = "all" | "b1" | "j1";
export type Metric = "units" | "winRate";

export type RankingRow = {
  uid: string;
  displayName: string;
  photoURL?: string;
  postsTotal: number;    // 通算
  posts: number;         // 期間内（確定のみ）
  hit: number;
  winRate: number;       // 0..1
  avgOdds: number;
  units: number;
  // しきい値バッジ（色付け用、UIで使う）
  badges?: { win?: any; odds?: any; units?: any };
};
export type RankingResponse = { rows: RankingRow[]; nextCursor?: string };
