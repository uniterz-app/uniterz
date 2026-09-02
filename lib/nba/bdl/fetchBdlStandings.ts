/**
 * BDL `/nba/v1/standings` — シーズン順位（GOAT）。
 */
import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";

export type BdlStandingsTeam = {
  id?: number;
  abbreviation?: string;
  city?: string;
  name?: string;
  full_name?: string;
  conference?: string;
  division?: string;
};

export type BdlStandingsRow = {
  team?: BdlStandingsTeam | null;
  season?: number;
  wins?: number | null;
  losses?: number | null;
  conference_rank?: number | null;
  division_rank?: number | null;
  conference_record?: string | null;
  division_record?: string | null;
  home_record?: string | null;
  road_record?: string | null;
};

export async function fetchBdlStandings(input: {
  seasonYear: number;
}): Promise<BdlStandingsRow[]> {
  return bdlNbaGetAllPages<BdlStandingsRow>("/nba/v1/standings", {
    season: input.seasonYear,
  });
}
