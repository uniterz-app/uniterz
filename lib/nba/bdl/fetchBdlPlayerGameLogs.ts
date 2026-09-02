/**
 * BDL `/nba/v1/stats` — 1 選手・1 シーズンの試合ログ行。
 */
import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";
import type { BdlGame, BdlGameTeam } from "@/lib/nba/bdl/fetchBdlGames";

export type BdlPlayerGameLogStatRow = {
  min?: string | number | null;
  fgm?: number | null;
  fga?: number | null;
  fg3m?: number | null;
  fg3a?: number | null;
  ftm?: number | null;
  fta?: number | null;
  reb?: number | null;
  oreb?: number | null;
  dreb?: number | null;
  ast?: number | null;
  stl?: number | null;
  blk?: number | null;
  turnover?: number | null;
  pts?: number | null;
  plus_minus?: number | null;
  player?: { id?: number } | null;
  team?: BdlGameTeam | null;
  game?: Partial<BdlGame> & { id?: number } | null;
};

export function parseBdlStatMinutes(
  raw: string | number | null | undefined
): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw ?? "").trim();
  if (!s || s === "00" || s === "0" || s === "0:00") return 0;
  if (s.includes(":")) {
    const [m, sec] = s.split(":");
    const mm = Number(m);
    const ss = Number(sec);
    if (!Number.isFinite(mm)) return 0;
    return mm + (Number.isFinite(ss) ? ss / 60 : 0);
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchBdlPlayerGameLogs(input: {
  bdlPlayerId: number;
  seasonYear: number;
  seasonType?: "regular" | "playoffs";
}): Promise<BdlPlayerGameLogStatRow[]> {
  const seasonType = input.seasonType ?? "regular";
  return bdlNbaGetAllPages<BdlPlayerGameLogStatRow>("/nba/v1/stats", {
    "player_ids[]": input.bdlPlayerId,
    "seasons[]": input.seasonYear,
    season_type: seasonType === "playoffs" ? "playoffs" : "regular",
  });
}
