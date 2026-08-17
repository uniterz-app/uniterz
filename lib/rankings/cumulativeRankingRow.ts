// 累積ランキング（/api/cumulative-ranking/bulk）の行型。
// 旧 useRanking フック（単発 API）は削除済みで、型だけここに残す。

export type RankingRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan?: "free" | "pro";

  totalPosts: number;
  totalWins: number;
  winRate: number;

  totalPoints: number;
  totalPrecision: number;
  /** WC 完全的中（API totalExactHits） */
  totalExactHits?: number;
  totalUpset: number;
  totalGoalScorerHits?: number;
  currentStreak: number;
  activeWinStreak: number;

  rank: number;
};
