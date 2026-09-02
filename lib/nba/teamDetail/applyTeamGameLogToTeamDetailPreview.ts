import type { NbaTeamGameLogSlice } from "@/lib/nba/teamGameLog/teamGameLogTypes";
import type { NbaTeamDetailPreview } from "@/lib/predict/nbaTeamDetailPreviewMocks";

function winPct(wins: number, losses: number): number {
  const n = wins + losses;
  if (n <= 0) return 0;
  return wins / n;
}

/** 試合ログ — form / H2H / カンファレンス split / 日程。season W-L は standings 優先 */
export function applyTeamGameLogToTeamDetailPreview(
  detail: NbaTeamDetailPreview,
  log: NbaTeamGameLogSlice,
  options: { includeSeasonRecord?: boolean } = {}
): NbaTeamDetailPreview {
  const includeSeason = options.includeSeasonRecord ?? false;
  return {
    ...detail,
    recentGames: log.recentGames,
    upcomingGames: log.upcomingGames,
    headToHead: log.headToHead,
    conferenceSplit: log.conferenceSplit,
    ...(includeSeason
      ? {
          last10Record: { ...log.last10Record },
          streak: { ...log.streak },
          homeAwaySplit: {
            home: { ...log.homeAwaySplit.home },
            away: { ...log.homeAwaySplit.away },
          },
          season: {
            wins: log.seasonRecord.wins,
            losses: log.seasonRecord.losses,
            winPct: winPct(log.seasonRecord.wins, log.seasonRecord.losses),
          },
        }
      : null),
  };
}
