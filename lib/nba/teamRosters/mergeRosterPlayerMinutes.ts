import {
  bdlStatNum,
  type BdlPlayerSeasonAverageRow,
} from "@/lib/nba/bdl/fetchBdlPlayerSeasonAverages";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function rate01(raw: number | null): number {
  if (raw == null || !Number.isFinite(raw)) return 0;
  // BDL は 0–1 か 0–100 の両方がありうる
  return raw > 1 ? raw / 100 : raw;
}

/** general/base season averages → プレイヤー詳細・ロスター用フル平均 */
export type NbaRosterSeasonAverages = {
  gp: number;
  mpg: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  tpg: number;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  plusMinus: number;
};

/** @deprecated 名前互換 — 実体はフル平均マップ */
export function buildPlayerMinutesMap(
  rows: BdlPlayerSeasonAverageRow[]
): Map<string, { mpg: number; gp: number }> {
  const full = buildPlayerSeasonAveragesMap(rows);
  const map = new Map<string, { mpg: number; gp: number }>();
  for (const [id, a] of full) {
    map.set(id, { mpg: a.mpg, gp: a.gp });
  }
  return map;
}

export function buildPlayerSeasonAveragesMap(
  rows: BdlPlayerSeasonAverageRow[]
): Map<string, NbaRosterSeasonAverages> {
  const map = new Map<string, NbaRosterSeasonAverages>();
  for (const row of rows) {
    const playerId = String(row.player?.id ?? "").trim();
    if (!playerId) continue;
    const gpRaw = bdlStatNum(row.stats, "gp", "games_played", "games") ?? 0;
    const gp = Math.max(0, Math.round(gpRaw));
    const minTotal = bdlStatNum(row.stats, "min", "minutes");
    // BDL base の min は試合平均のことが多い。gp で割ると壊れないよう、
    // 値が大きすぎるときだけ合計とみなす。
    let mpg = 0;
    if (minTotal != null) {
      if (gp > 0 && minTotal > 48 * 1.5) {
        mpg = round1(minTotal / gp);
      } else {
        mpg = round1(minTotal);
      }
    }

    const pts = bdlStatNum(row.stats, "pts", "points") ?? 0;
    const reb = bdlStatNum(row.stats, "reb", "rebound", "rebounds") ?? 0;
    const ast = bdlStatNum(row.stats, "ast", "assists") ?? 0;
    const stl = bdlStatNum(row.stats, "stl", "steals") ?? 0;
    const blk = bdlStatNum(row.stats, "blk", "blocks") ?? 0;
    const tov = bdlStatNum(row.stats, "tov", "turnover", "turnovers") ?? 0;
    const fgm = bdlStatNum(row.stats, "fgm") ?? 0;
    const fga = bdlStatNum(row.stats, "fga") ?? 0;
    const fg3m = bdlStatNum(row.stats, "fg3m") ?? 0;
    const fg3a = bdlStatNum(row.stats, "fg3a") ?? 0;
    const ftm = bdlStatNum(row.stats, "ftm") ?? 0;
    const fta = bdlStatNum(row.stats, "fta") ?? 0;
    const plusMinus =
      bdlStatNum(row.stats, "plus_minus", "plusMinus") ?? 0;

    map.set(playerId, {
      gp,
      mpg,
      ppg: round1(pts),
      rpg: round1(reb),
      apg: round1(ast),
      spg: round1(stl),
      bpg: round1(blk),
      tpg: round1(tov),
      fgPct: rate01(bdlStatNum(row.stats, "fg_pct", "fgPct")),
      fg3Pct: rate01(bdlStatNum(row.stats, "fg3_pct", "fg3Pct")),
      ftPct: rate01(bdlStatNum(row.stats, "ft_pct", "ftPct")),
      fgm: round1(fgm),
      fga: round1(fga),
      fg3m: round1(fg3m),
      fg3a: round1(fg3a),
      ftm: round1(ftm),
      fta: round1(fta),
      plusMinus: round1(plusMinus),
    });
  }
  return map;
}

/** ロスター行にシーズン平均を載せる（無ければ 0 のまま） */
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

export function mergeSeasonAveragesOntoRosterPlayers(
  players: NbaRosterPlayer[],
  averagesMap: Map<string, NbaRosterSeasonAverages>
): NbaRosterPlayer[] {
  return players.map((player) => {
    const key = String(player.id);
    const a = averagesMap.get(key);
    if (!a) return player;
    return {
      ...player,
      gp: a.gp,
      mpg: a.mpg,
      ppg: a.ppg,
      rpg: a.rpg,
      apg: a.apg,
      spg: a.spg,
      bpg: a.bpg,
      tpg: a.tpg,
      fgPct: a.fgPct,
      fg3Pct: a.fg3Pct,
      ftPct: a.ftPct,
      fgm: a.fgm,
      fga: a.fga,
      fg3m: a.fg3m,
      fg3a: a.fg3a,
      ftm: a.ftm,
      fta: a.fta,
      plusMinus: a.plusMinus,
    };
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

export function playerAveragesRowsHavePlayed(
  rows: BdlPlayerSeasonAverageRow[]
): boolean {
  return rows.some((row) => {
    const gp = bdlStatNum(row.stats, "gp", "games_played", "games");
    return gp != null && gp >= 1;
  });
}
