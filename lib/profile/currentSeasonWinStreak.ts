import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { normalizeWinStreak } from "@/lib/ui/normalizeWinStreak";

/** user_stats_v2 / users / cumulative_stats に書く NBA 連勝のシーズンキー */
export const STREAK_SEASON_KEY_BASKETBALL_FIELD = "streakSeasonKeyBasketball";

/**
 * 現行 NBA シーズンの連勝だけ返す。
 * キー未設定・前シーズンの値は 0（26-27 に持ち越さない）。
 */
export function currentSeasonWinStreak(
  streak: unknown,
  streakSeasonKey: unknown,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): number {
  const n = normalizeWinStreak(streak);
  if (n <= 0) return 0;
  if (typeof streakSeasonKey !== "string" || streakSeasonKey !== seasonKey) {
    return 0;
  }
  return n;
}
