/** プロフィール日次トレンド（API / チャート共通・admin に依存しない） */
export type ProfileDailyTrendRow = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  upsetPoints: number;
  winRate: number;
  /** WC の予想スコア完全一致数。NBA は常に 0。 */
  exactHitCount: number;
};
