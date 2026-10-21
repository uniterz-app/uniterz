/**
 * 開幕直後は今季のリーグ表に出場済みチームしか居ない。
 * 未出場チームは前期の行で埋め、順位は 30 チームで付ける。
 */
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";

export function leagueTeamRowHasPlayed(row: NbaLeagueTeamStatRow): boolean {
  return (row.wins ?? 0) + (row.losses ?? 0) > 0;
}

const NBA_TEAM_COUNT = 30;

/** 今季未出場のチームが残っているか */
export function leagueTeamRowsNeedPrior(
  currentRows: NbaLeagueTeamStatRow[]
): boolean {
  return currentRows.filter(leagueTeamRowHasPlayed).length < NBA_TEAM_COUNT;
}

export function mergePriorSeasonTeamRows(
  currentRows: NbaLeagueTeamStatRow[],
  priorRows: NbaLeagueTeamStatRow[]
): NbaLeagueTeamStatRow[] {
  const played = new Map(
    currentRows.filter(leagueTeamRowHasPlayed).map((r) => [r.teamId, r])
  );
  const out: NbaLeagueTeamStatRow[] = [];
  const seen = new Set<string>();
  for (const prior of priorRows) {
    out.push(played.get(prior.teamId) ?? prior);
    seen.add(prior.teamId);
  }
  for (const row of played.values()) {
    if (!seen.has(row.teamId)) out.push(row);
  }
  return out;
}
