import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import {
  NBA_CONFERENCE_TEAM_IDS,
  type NbaConferenceId,
} from "@/lib/nba/nbaConferenceTeams";
import type {
  NbaConferenceStandingsBoard,
  NbaConferenceStandingsRow,
} from "@/lib/nba/nbaConferenceStandings";

/** BDL standings が空の開幕前 — 30 チーム · 0-0 · カンファレンス内 rank は teamId 昇順 */
export function buildPreseasonConferenceStandingsBoard(
  seasonKey: string
): NbaConferenceStandingsBoard {
  const buildSide = (conference: NbaConferenceId): NbaConferenceStandingsRow[] => {
    const ids = [...NBA_CONFERENCE_TEAM_IDS[conference]].sort((a, b) =>
      a.localeCompare(b)
    );
    return ids.map((teamId, index) => ({
      teamId,
      teamName: NBA_TEAM_NAME_BY_ID[teamId] ?? teamId,
      conference,
      rank: index + 1,
      wins: 0,
      losses: 0,
      winPct: 0,
      streak: { kind: "W" as const, count: 0 },
      last10: { wins: 0, losses: 0 },
      home: { wins: 0, losses: 0 },
      away: { wins: 0, losses: 0 },
      recentForm: [],
    }));
  };

  return {
    east: buildSide("east"),
    west: buildSide("west"),
  };
}

export function preseasonStandingsAsOfLabel(seasonKey: string): string {
  return `PRESEASON · ${seasonKey}`;
}
