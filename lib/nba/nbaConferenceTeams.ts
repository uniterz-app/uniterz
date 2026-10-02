/**
 * NBA カンファレンス別チーム（各 15）。
 * ソース: `NBA_DIVISION_TEAM_IDS`
 */

import { NBA_DIVISION_TEAM_IDS } from "@/lib/nba/nbaTeamMapCoords";

export type NbaConferenceId = "east" | "west";

export const NBA_EAST_TEAM_IDS: readonly string[] = [
  ...NBA_DIVISION_TEAM_IDS.atlantic,
  ...NBA_DIVISION_TEAM_IDS.central,
  ...NBA_DIVISION_TEAM_IDS.southeast,
] as const;

export const NBA_WEST_TEAM_IDS: readonly string[] = [
  ...NBA_DIVISION_TEAM_IDS.northwest,
  ...NBA_DIVISION_TEAM_IDS.pacific,
  ...NBA_DIVISION_TEAM_IDS.southwest,
] as const;

export const NBA_CONFERENCE_TEAM_IDS: Record<
  NbaConferenceId,
  readonly string[]
> = {
  east: NBA_EAST_TEAM_IDS,
  west: NBA_WEST_TEAM_IDS,
};

export const NBA_STANDINGS_RANKS = 15;

export function isNbaConferenceTeam(
  conference: NbaConferenceId,
  teamId: string
): boolean {
  return NBA_CONFERENCE_TEAM_IDS[conference].includes(teamId);
}

export function nbaConferenceForTeam(
  teamId: string
): NbaConferenceId | null {
  if (NBA_EAST_TEAM_IDS.includes(teamId)) return "east";
  if (NBA_WEST_TEAM_IDS.includes(teamId)) return "west";
  return null;
}
