import type { NbaTeamGameLogSlice } from "@/lib/nba/teamGameLog/teamGameLogTypes";
import type { NbaConferenceStandingsBoard, NbaConferenceStandingsRow } from "@/lib/nba/nbaConferenceStandings";

/** 試合カード用 — 古い試合 → 新しい試合（最大5） */
export function recentFormFromTeamGameLog(
  log: NbaTeamGameLogSlice | undefined
): ("W" | "L")[] {
  if (!log?.recentGames?.length) return [];
  return [...log.recentGames]
    .slice(0, 5)
    .reverse()
    .map((g) => g.result);
}

/** BDL 本体は W–L / HOME / AWAY。L10・連勝・直近フォームは `games` 由来の team game logs */
export function enrichConferenceStandingsFromTeamGameLogs(
  board: NbaConferenceStandingsBoard,
  teamLogs: Record<string, NbaTeamGameLogSlice>
): NbaConferenceStandingsBoard {
  const enrichRow = (row: NbaConferenceStandingsRow): NbaConferenceStandingsRow => {
    const log = teamLogs[row.teamId];
    if (!log) return row;
    return {
      ...row,
      last10: { ...log.last10Record },
      streak: { ...log.streak },
      recentForm: recentFormFromTeamGameLog(log),
    };
  };

  return {
    east: board.east.map(enrichRow),
    west: board.west.map(enrichRow),
  };
}
