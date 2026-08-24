import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";

export type BdlPlayerSeasonAverageRow = {
  player: {
    id: number;
    first_name?: string;
    last_name?: string;
  };
  season?: number;
  season_type?: string;
  stats: Record<string, number | string | null | undefined>;
};

export async function fetchBdlPlayerSeasonAverages(input: {
  seasonYear: number;
  category?: string;
  type?: string;
}): Promise<BdlPlayerSeasonAverageRow[]> {
  const category = input.category ?? "general";
  const query: Record<string, string | number | undefined | null> = {
    season: input.seasonYear,
    season_type: "regular",
  };
  if (input.type != null && input.type !== "") {
    query.type = input.type;
  }
  return bdlNbaGetAllPages<BdlPlayerSeasonAverageRow>(
    `/nba/v1/season_averages/${category}`,
    query
  );
}

export function bdlStatNum(
  stats: Record<string, number | string | null | undefined> | undefined,
  ...keys: string[]
): number | null {
  if (!stats) return null;
  for (const k of keys) {
    const v = stats[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}
