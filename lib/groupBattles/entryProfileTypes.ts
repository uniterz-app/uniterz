/**
 * スクワッドバトル ENTRY 用プロフィール（クライアント共有型）
 */

export type GroupBattleEntryProfile = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan: "free" | "pro";
  /** 現行シーズン cumulative totalPoints（= pointsSumV3 相当） */
  points: number;
  /** UI 用パーセント 0–100 */
  winRate: number;
  activeWinStreak: number;
  totalPosts: number;
  /** period_ranking_snapshots ranks（standard / totalPoints） */
  thisWeekRank: number | null;
  lastWeekRank: number | null;
  lastMonthRank: number | null;
};
