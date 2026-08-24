import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";
import { rememberBdlTeamId } from "@/lib/nba/bdl/bdlNbaTeamIdMap";

export type BdlTeamRef = {
  id: number;
  abbreviation?: string;
  full_name?: string;
  conference?: string;
  name?: string;
};

export type BdlTeamSeasonAverageRow = {
  team: BdlTeamRef;
  season?: number;
  season_type?: string;
  stats: Record<string, number | string | null | undefined>;
};

export async function fetchBdlTeamSeasonAverages(input: {
  seasonYear: number;
  category?: string;
  type: string;
}): Promise<BdlTeamSeasonAverageRow[]> {
  const category = input.category ?? "general";
  const rows = await bdlNbaGetAllPages<BdlTeamSeasonAverageRow>(
    `/nba/v1/team_season_averages/${category}`,
    {
      season: input.seasonYear,
      season_type: "regular",
      type: input.type,
    }
  );
  for (const row of rows) {
    if (row.team?.id != null) {
      rememberBdlTeamId(row.team.id, row.team.abbreviation);
    }
  }
  return rows;
}
