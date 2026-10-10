/**
 * BDL `/nba/v1/plays?game_id=`（play-by-play）と `/nba/v1/stats?game_ids[]=`（試合ごとの出場選手）。
 * サーバー専用。2020-21 以降の試合で取得できることを確認済み。
 */
import {
  bdlNbaGetAllPages,
  bdlNbaGetJson,
  type BdlListResponse,
} from "@/lib/nba/bdl/bdlNbaFetch";
import { rememberBdlTeamId } from "@/lib/nba/bdl/bdlNbaTeamIdMap";

export type BdlPlay = {
  game_id?: number;
  order?: number;
  type?: string | null;
  text?: string | null;
  period?: number | null;
  clock?: string | null;
  team?: { id?: number; abbreviation?: string | null } | null;
  participants?: number[] | null;
};

export async function fetchBdlPlaysForGame(gameId: number): Promise<BdlPlay[]> {
  const res = await bdlNbaGetJson<BdlListResponse<BdlPlay>>("/nba/v1/plays", {
    game_id: gameId,
  });
  return Array.isArray(res.data) ? res.data : [];
}

export type BdlGamePlayerRef = {
  playerId: string;
  firstName: string;
  lastName: string;
  /** app team id（`nba-lakers` 等） */
  teamId: string | null;
};

type BdlStatRowLite = {
  player?: { id?: number; first_name?: string; last_name?: string } | null;
  team?: { id?: number; abbreviation?: string | null } | null;
  game?: { id?: number } | null;
};

/** gameId → その試合の box に載った選手（DNP 含む。コーチは載らない） */
export async function fetchBdlGamePlayerRefs(
  gameIds: readonly number[]
): Promise<Map<number, BdlGamePlayerRef[]>> {
  const out = new Map<number, BdlGamePlayerRef[]>();
  if (gameIds.length === 0) return out;
  const rows = await bdlNbaGetAllPages<BdlStatRowLite>("/nba/v1/stats", {
    "game_ids[]": [...gameIds],
  });
  for (const row of rows) {
    const gid = row.game?.id;
    const pid = row.player?.id;
    if (typeof gid !== "number" || typeof pid !== "number") continue;
    const bdlTeamId = typeof row.team?.id === "number" ? row.team.id : null;
    const teamId =
      bdlTeamId != null
        ? rememberBdlTeamId(bdlTeamId, row.team?.abbreviation)
        : null;
    const list = out.get(gid) ?? [];
    if (list.some((p) => p.playerId === String(pid))) continue;
    list.push({
      playerId: String(pid),
      firstName: row.player?.first_name?.trim() ?? "",
      lastName: row.player?.last_name?.trim() ?? "",
      teamId,
    });
    out.set(gid, list);
  }
  return out;
}
