/** team-game-logs スナップショットの upcoming 行から、指定試合の Matchup Difficulty を引く */
import type { NbaTeamGameLogSlice } from "@/lib/nba/teamGameLog/teamGameLogTypes";
import type { NbaUpcomingMatchupDifficulty } from "@/lib/nba/matchupDifficulty/upcomingMatchupDifficulty";

const MATCH_TOLERANCE_MS = 6 * 60 * 60 * 1000;

export function upcomingDifficultyForGame(
  logs: Record<string, NbaTeamGameLogSlice>,
  teamId: string,
  oppTeamId: string,
  isHome: boolean,
  tipAtMs: number
): NbaUpcomingMatchupDifficulty | null {
  const rows = logs[teamId]?.upcomingGames ?? [];
  // startMs の無い古い行は同カードの別日（例: プレシーズンに開幕後の対戦）を拾うので使わない
  const row = rows.find(
    (g) =>
      g.oppTeamId === oppTeamId &&
      g.home === isHome &&
      g.startMs != null &&
      Math.abs(g.startMs - tipAtMs) <= MATCH_TOLERANCE_MS
  );
  return row?.difficulty ?? null;
}
