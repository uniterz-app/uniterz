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
  draftRound: number | null;
  draftNumber: number | null;
  position: string;
  firstName: string;
  lastName: string;
  jerseyNumber: string | null;
  height: string | null;
  weight: string | null;
  country: string | null;
  college: string | null;
};

export async function fetchBdlPlayerBasicInfo(
  bdlPlayerId: number
): Promise<BdlPlayerBasicInfo | null> {
  const res = await bdlNbaGetJson<
    BdlListResponse<{
      id?: number;
      first_name?: string;
      last_name?: string;
      draft_year?: number | null;
      draft_round?: number | null;
      draft_number?: number | null;
      position?: string | null;
      jersey_number?: string | number | null;
      height?: string | null;
      weight?: string | null;
      country?: string | null;
      college?: string | null;
    }>
  >("/nba/v1/players", { "player_ids[]": bdlPlayerId });
  const p = Array.isArray(res.data) ? res.data[0] : null;
  if (!p || typeof p.id !== "number") return null;
  const draft =
    typeof p.draft_year === "number" && Number.isFinite(p.draft_year)
      ? p.draft_year
      : null;
  const draftRound =
    typeof p.draft_round === "number" && Number.isFinite(p.draft_round)
      ? Math.trunc(p.draft_round)
      : null;
  const draftNumber =
    typeof p.draft_number === "number" && Number.isFinite(p.draft_number)
      ? Math.trunc(p.draft_number)
      : null;
  const jerseyRaw = p.jersey_number;
  const jerseyNumber =
    jerseyRaw == null || String(jerseyRaw).trim() === ""
      ? null
      : String(jerseyRaw).replace(/^#/, "").trim();
  return {
    id: p.id,
    draftYear: draft,
    draftRound,
    draftNumber,
    position: String(p.position ?? "").trim() || "—",
    firstName: String(p.first_name ?? "").trim(),
    lastName: String(p.last_name ?? "").trim(),
    jerseyNumber,
    height: String(p.height ?? "").trim() || null,
    weight: String(p.weight ?? "").trim() || null,
    country: String(p.country ?? "").trim() || null,
    college: String(p.college ?? "").trim() || null,
  };
}
