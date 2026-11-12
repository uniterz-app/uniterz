/**
 * BDL lineup_stats → `nbaLineupSeason/{season}`。
 * オンは本人が入った 5 人組、オフは同じチームのそれ以外。得失点はポゼッションで重み付け。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlLineupStats } from "@/lib/nba/bdl/fetchBdlLineupStats";
import { appTeamIdFromBdlTeamId } from "@/lib/nba/bdl/bdlNbaTeamIdMap";

export const NBA_LINEUP_SEASON_COLLECTION = "nbaLineupSeason";

export type NbaLineupOnOff = {
  onNet: number;
  offNet: number;
  onMin: number;
  offMin: number;
};

export type NbaLineupUnit = {
  ids: string[];
  min: number;
  net: number;
  off: number;
  def: number;
  /** 一緒に出ていたあいだの得失点 */
  pm: number;
  /** この組が出た試合数。同じ試合の別の5人組は1試合 */
  games: number;
};

export type NbaLineupBoard = {
  size: 2 | 3 | 4 | 5;
  most: NbaLineupUnit[];
  best: NbaLineupUnit[];
  worst: NbaLineupUnit[];
};

const LINEUP_SIZES = [5, 4, 3, 2] as const;
/** これより短い組は、数分の偏りでネットが振れる */
const MIN_MINUTES: Record<(typeof LINEUP_SIZES)[number], number> = {
  5: 10,
  4: 40,
  3: 80,
  2: 150,
};
const MOST_LIMIT = 10;
const BOARD_LIMIT = 5;

function combinations(ids: string[], size: number): string[][] {
  const out: string[][] = [];
  const pick = (start: number, acc: string[]) => {
    if (acc.length === size) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i < ids.length; i++) {
      acc.push(ids[i]!);
      pick(i + 1, acc);
      acc.pop();
    }
  };
  pick(0, []);
  return out;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export async function ingestNbaLineupsFromBdl(
  db: Firestore,
  input: { seasonKey?: string } = {}
): Promise<{ seasonKey: string; stints: number; players: number; teams: number }> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const rows = await fetchBdlLineupStats({
    seasonYear: bdlSeasonYearFromSeasonKey(seasonKey),
    seasonType: "regular",
  });

  type Bucket = { netPoss: number; offPoss: number; defPoss: number; poss: number; min: number };
  const blank = (): Bucket => ({ netPoss: 0, offPoss: 0, defPoss: 0, poss: 0, min: 0 });
  const add = (b: Bucket, min: number, net: number, off: number, def: number, poss: number) => {
    b.min += min;
    b.poss += poss;
    b.netPoss += net * poss;
    b.offPoss += off * poss;
    b.defPoss += def * poss;
  };
  const teamAll = new Map<string, Bucket>();
  const playerOn = new Map<string, Bucket>();
  const units = new Map<string, Bucket & { teamId: string; ids: string[]; games: Set<number> }>();

  let stints = 0;
  for (const row of rows) {
    const teamId = appTeamIdFromBdlTeamId(row.team_id);
    const ids = (row.player_ids ?? []).map(String).filter(Boolean);
    const min = row.stats?.min ?? 0;
    const poss = row.stats?.poss ?? 0;
    const net = row.stats?.net_rating ?? 0;
    const off = row.stats?.off_rating ?? 0;
    const def = row.stats?.def_rating ?? 0;
    if (!teamId || ids.length !== 5 || min <= 0 || poss <= 0) continue;
    stints += 1;
    const team = teamAll.get(teamId) ?? blank();
    add(team, min, net, off, def, poss);
    teamAll.set(teamId, team);
    for (const id of ids) {
      const on = playerOn.get(id) ?? blank();
      add(on, min, net, off, def, poss);
      playerOn.set(id, on);
    }
    const key = `${teamId}:${[...ids].sort().join("-")}`;
    const unit = units.get(key) ?? { ...blank(), teamId, ids: [...ids].sort(), games: new Set<number>() };
    add(unit, min, net, off, def, poss);
    unit.games.add(row.game_id);
    units.set(key, unit);
  }

  const rate = (sum: number, poss: number) => (poss > 0 ? round1(sum / poss) : 0);
  const netOf = (b: Bucket) => rate(b.netPoss, b.poss);
  const players: Record<string, NbaLineupOnOff> = {};
  for (const [id, on] of playerOn) {
    let teamId = "";
    for (const unit of units.values()) {
      if (unit.ids.includes(id)) {
        teamId = unit.teamId;
        break;
      }
    }
    const team = teamAll.get(teamId);
    if (!team) continue;
    const off: Bucket = {
      netPoss: team.netPoss - on.netPoss,
      offPoss: team.offPoss - on.offPoss,
      defPoss: team.defPoss - on.defPoss,
      poss: team.poss - on.poss,
      min: team.min - on.min,
    };
    if (on.min < 20 || off.min < 20) continue;
    players[id] = {
      onNet: netOf(on),
      offNet: netOf(off),
      onMin: round1(on.min),
      offMin: round1(off.min),
    };
  }

  const grouped = new Map<string, Bucket & { teamId: string; ids: string[]; games: Set<number> }>();
  for (const unit of units.values()) {
    for (const size of LINEUP_SIZES) {
      for (const ids of combinations(unit.ids, size)) {
        const key = `${unit.teamId}:${ids.join("-")}`;
        const group = grouped.get(key) ?? { ...blank(), teamId: unit.teamId, ids, games: new Set<number>() };
        for (const gameId of unit.games) group.games.add(gameId);
        add(
          group,
          unit.min,
          unit.poss > 0 ? unit.netPoss / unit.poss : 0,
          unit.poss > 0 ? unit.offPoss / unit.poss : 0,
          unit.poss > 0 ? unit.defPoss / unit.poss : 0,
          unit.poss
        );
        grouped.set(key, group);
      }
    }
  }

  const byTeam = new Map<string, Map<number, NbaLineupUnit[]>>();
  for (const group of grouped.values()) {
    const size = group.ids.length as (typeof LINEUP_SIZES)[number];
    if (group.min < MIN_MINUTES[size]) continue;
    const list = byTeam.get(group.teamId) ?? new Map<number, NbaLineupUnit[]>();
    const rows = list.get(size) ?? [];
    rows.push({
      ids: group.ids,
      min: round1(group.min),
      net: netOf(group),
      off: rate(group.offPoss, group.poss),
      def: rate(group.defPoss, group.poss),
      pm: Math.round(group.netPoss / 100),
      games: group.games.size,
    });
    list.set(size, rows);
    byTeam.set(group.teamId, list);
  }
  const teams: Record<string, { lineups: NbaLineupUnit[]; boards: NbaLineupBoard[] }> = {};
  for (const [teamId, sizes] of byTeam) {
    const five = [...(sizes.get(5) ?? [])].sort((a, b) => b.min - a.min);
    const boards: NbaLineupBoard[] = [];
    for (const size of LINEUP_SIZES) {
      const rows = [...(sizes.get(size) ?? [])].sort((a, b) => b.net - a.net || b.min - a.min);
      if (rows.length === 0) continue;
      const best = rows.slice(0, BOARD_LIMIT);
      const bestKeys = new Set(best.map((row) => row.ids.join("-")));
      const worst = [...rows]
        .reverse()
        .filter((row) => !bestKeys.has(row.ids.join("-")))
        .slice(0, BOARD_LIMIT);
      const most = [...rows].sort((a, b) => b.min - a.min || b.net - a.net).slice(0, MOST_LIMIT);
      boards.push({ size, most, best, worst });
    }
    teams[teamId] = { lineups: five.slice(0, 5), boards };
  }

  await db.collection(NBA_LINEUP_SEASON_COLLECTION).doc(seasonKey).set({
    seasonKey,
    players,
    teams,
    stints,
    builtAtMs: Date.now(),
  });
  return { seasonKey, stints, players: Object.keys(players).length, teams: Object.keys(teams).length };
}
