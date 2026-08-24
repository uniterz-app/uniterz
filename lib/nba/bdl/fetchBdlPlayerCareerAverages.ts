/**
 * BDL 個人 season averages（regular / playoffs）— キャリア表用。
 * クライアントは叩かない（API / load 経由）。
 */
import {
  bdlNbaGetJson,
  type BdlListResponse,
} from "@/lib/nba/bdl/bdlNbaFetch";

export type BdlPlayerCareerAverageRow = {
  player?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    position?: string | null;
    draft_year?: number | null;
  };
  season?: number;
  season_type?: string;
  stats?: Record<string, number | string | null | undefined>;
};

export type BdlPlayerCareerSeasonType = "regular" | "playoffs";

export function bdlCareerStatNum(
  stats: Record<string, number | string | null | undefined> | undefined,
  ...keys: string[]
): number {
  if (!stats) return 0;
  for (const k of keys) {
    const v = stats[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

/** 1 シーズン・1 season_type の general/base 平均 */
export async function fetchBdlPlayerCareerAverageForSeason(input: {
  bdlPlayerId: number;
  seasonYear: number;
  seasonType: BdlPlayerCareerSeasonType;
}): Promise<BdlPlayerCareerAverageRow | null> {
  const seasonType =
    input.seasonType === "playoffs" ? "playoffs" : "regular";
  const res = await bdlNbaGetJson<BdlListResponse<BdlPlayerCareerAverageRow>>(
    "/nba/v1/season_averages/general",
    {
      "player_ids[]": input.bdlPlayerId,
      season: input.seasonYear,
      season_type: seasonType,
      type: "base",
    }
  );
  const row = Array.isArray(res.data) ? res.data[0] : null;
  if (!row) return null;
  const gp = bdlCareerStatNum(
    row.stats,
    "gp",
    "games_played",
    "game_played"
  );
  if (gp <= 0) return null;
  return row;
}

export type BdlPlayerBasicInfo = {
  id: number;
  draftYear: number | null;
  position: string;
};

export async function fetchBdlPlayerBasicInfo(
  bdlPlayerId: number
): Promise<BdlPlayerBasicInfo | null> {
  const res = await bdlNbaGetJson<
    BdlListResponse<{
      id?: number;
      draft_year?: number | null;
      position?: string | null;
    }>
  >("/nba/v1/players", { "player_ids[]": bdlPlayerId });
  const p = Array.isArray(res.data) ? res.data[0] : null;
  if (!p || typeof p.id !== "number") return null;
  const draft =
    typeof p.draft_year === "number" && Number.isFinite(p.draft_year)
      ? p.draft_year
      : null;
  return {
    id: p.id,
    draftYear: draft,
    position: String(p.position ?? "").trim() || "—",
  };
}
