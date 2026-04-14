/** プロフィール日次トレンド（API / チャート共通・admin に依存しない） */
export type ProfileDailyTrendRow = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  upsetPoints: number;
  winRate: number;
  scorePrecision: number;
};
