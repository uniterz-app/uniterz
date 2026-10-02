import type {
  NbaRosterPlayer,
  NbaRosterReport,
  NbaRosterTeamBlock,
} from "@/lib/predict/nbaRoster";
import { getNbaTeamNicknameById } from "@/lib/nba-team-names";
import type { NbaTeamRosterDocTeam } from "./teamRosterTypes";

function toTeamBlock(
  side: "home" | "away",
  teamId: string,
  snap: NbaTeamRosterDocTeam | null | undefined
): NbaRosterTeamBlock {
  const players: NbaRosterPlayer[] = snap?.players ?? [];
  return {
    teamId,
    teamName:
      snap?.teamName ??
      getNbaTeamNicknameById(teamId) ??
      teamId,
    side,
    seed: null,
    activeCount: players.length,
    rosterCount: players.length,
    players,
  };
}

/** Firestore / API のチーム別ロスターから予想 ROSTER レポートを組む */
export function buildMatchupRosterReport(
  homeTeamId: string,
  awayTeamId: string,
  home: NbaTeamRosterDocTeam | null | undefined,
  away: NbaTeamRosterDocTeam | null | undefined
): NbaRosterReport | null {
  if (!homeTeamId || !awayTeamId) return null;
  if (!home && !away) return null;
  return {
    home: toTeamBlock("home", homeTeamId, home),
    away: toTeamBlock("away", awayTeamId, away),
  };
}
