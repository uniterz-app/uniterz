import { buildGamePointsDistributionAgg } from "./gamePointsDistributionAgg";
import { computePostSettlement } from "./computePostSettlement";
import type { UpdatedUserStreakResult } from "./updateUserStreak";

/**
 * 既に取得済みの posts スナップから pointsV3 分布を構築（追加の posts クエリなし）。
 */
export function aggregateGamePointsDistributionFromPostsSnap({
  postsSnap,
  game,
  market,
  hadUpsetGame,
  streakResultMap,
}: {
  postsSnap: FirebaseFirestore.QuerySnapshot;
  game: {
    homeScore: number;
    awayScore: number;
    league?: string;
  };
  market: {
    majoritySide: string;
    majorityRatio: number;
    total: number;
  };
  hadUpsetGame: boolean;
  streakResultMap: Map<string, UpdatedUserStreakResult>;
}) {
  const scores: number[] = [];
  for (const doc of postsSnap.docs) {
    const p = doc.data();
    const { totalPoints } = computePostSettlement({
      p,
      game: {
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        league: game.league,
      },
      market,
      hadUpsetGame,
      streakResultMap,
    });
    scores.push(totalPoints);
  }
  return buildGamePointsDistributionAgg(scores);
}
