import type { League } from "@/lib/leagues";
import { teamColorsB1 } from "./teams-b1";
import { teamColorsJ1 } from "./teams-j1";
import { teamColorsNBA } from "./teams-nba";

export function getTeamPrimaryColor(
  league: League,
  teamName: string | null | undefined
): string {
  if (!teamName) return "#ffffff";

  switch (league) {
    case "bj":
      return teamColorsB1[teamName]?.primary ?? "#ffffff";

    case "j1":
      return teamColorsJ1[teamName]?.primary ?? "#ffffff";

    case "nba":
      return teamColorsNBA[teamName]?.primary ?? "#ffffff";

    default:
      return "#ffffff";
  }
}
