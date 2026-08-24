import {
  bdlStatNum,
  type BdlPlayerSeasonAverageRow,
} from "@/lib/nba/bdl/fetchBdlPlayerSeasonAverages";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** general/base season averages → playerId → MPG / GP */
export function buildPlayerMinutesMap(
  rows: BdlPlayerSeasonAverageRow[]
): Map<string, { mpg: number; gp: number }> {
  const map = new Map<string, { mpg: number; gp: number }>();
  for (const row of rows) {
    const playerId = String(row.player?.id ?? "").trim();
    if (!playerId) continue;
    const min = bdlStatNum(row.stats, "min");
    const gpRaw = bdlStatNum(row.stats, "gp", "games_played") ?? 0;
    const gp = Math.max(0, Math.round(gpRaw));
    const mpg =
      min != null && gp > 0 ? round1(min / gp) : min != null ? round1(min) : 0;
    map.set(playerId, { mpg, gp });
  }
  return map;
}

/** ロスター行に MPG / GP を載せる（無ければ 0 のまま） */
export function mergeMinutesOntoRosterPlayers(
  players: NbaRosterPlayer[],
  minutesMap: Map<string, { mpg: number; gp: number }>
): NbaRosterPlayer[] {
  return players.map((player) => {
    const key = String(player.id);
    const mins = minutesMap.get(key);
    if (!mins) return player;
    return { ...player, mpg: mins.mpg, gp: mins.gp };
  });
}

/** 書き込み前: MPG 降順（同率は GP 降順） */
export function sortRosterPlayersByMpg(
  players: NbaRosterPlayer[]
): NbaRosterPlayer[] {
  return [...players].sort((a, b) => {
    if (b.mpg !== a.mpg) return b.mpg - a.mpg;
    if (b.gp !== a.gp) return b.gp - a.gp;
    return String(a.lastName).localeCompare(String(b.lastName));
  });
}

/** チーム詳細 DEPTH 用 — MPG 上位（0 は除外） */
export function rosterDepthRows(
  players: NbaRosterPlayer[],
  limit = 10
): NbaRosterPlayer[] {
  return [...players]
    .filter((p) => p.mpg > 0)
    .sort((a, b) => b.mpg - a.mpg || b.gp - a.gp)
    .slice(0, limit);
}
