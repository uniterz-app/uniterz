import { estimatePossessions } from "@/lib/nba/cleanRatings/computeNbaCleanRatings";
import { scheduledDisciplineFines } from "@/lib/nba/discipline/nbaDisciplineFineSchedule";
import { bdlGameIdFromLogId } from "@/lib/nba/leagueWindows/bdlGameIdFromLog";
import type { WindowGameKit, WindowGameKitIndex } from "@/lib/nba/leagueWindows/windowGameKits";
import type { NbaPbpBox, NbaPbpPlaytypePts, NbaPbpTrack, NbaPbpHustle } from "@/lib/nba/pbpExtras/nbaPbpExtrasTypes";
import type { NbaShotAreaCounts } from "@/lib/nba/shotCharts/shotChartTypes";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import {
  isPlayerAdvancedLeaderMetric,
  type NbaPlayerLeaderMetricId,
  type NbaPlayerStatLeaderRow,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { playerAdvancedMetricDef } from "@/lib/predict/nbaPlayerStatLeadersAdvanced";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";

const BOARD_LIMIT = 30;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function rating(pts: number, poss: number): number {
  return poss > 0 ? round1((pts / poss) * 100) : 0;
}

export type WindowLogRef = {
  gameId?: string;
};

function kitsForLogs(
  logs: readonly WindowLogRef[],
  index: WindowGameKitIndex
): WindowGameKit[] {
  const out: WindowGameKit[] = [];
  for (const log of logs) {
    const id = bdlGameIdFromLogId(log.gameId);
    if (!id) continue;
    const kit = index.get(id);
    if (kit) out.push(kit);
  }
  return out;
}

function addBox(acc: NbaPbpBox, src: NbaPbpBox): void {
  acc.pts += src.pts;
  acc.fgm += src.fgm;
  acc.fga += src.fga;
  acc.fg3m += src.fg3m;
  acc.fg3a += src.fg3a;
  acc.fta += src.fta;
  acc.oreb += src.oreb;
  acc.tov += src.tov;
}

function addPlaytype(acc: NbaPbpPlaytypePts, src: NbaPbpPlaytypePts): void {
  acc.iso += src.iso;
  acc.pnrBh += src.pnrBh;
  acc.pnrRoll += src.pnrRoll;
  acc.spotup += src.spotup;
  acc.trans += src.trans;
  acc.cut += src.cut;
  acc.post += src.post;
}

function addTrack(acc: NbaPbpTrack, src: NbaPbpTrack): void {
  acc.drives += src.drives;
  acc.drivePts += src.drivePts;
  acc.pullupFgm += src.pullupFgm;
  acc.pullupFga += src.pullupFga;
  acc.pullupPts += src.pullupPts;
  acc.cnsFgm += src.cnsFgm;
  acc.cnsFga += src.cnsFga;
  acc.cnsPts += src.cnsPts;
}

function addHustle(acc: NbaPbpHustle, src: NbaPbpHustle): void {
  acc.charges += src.charges;
  acc.looseBalls += src.looseBalls;
  acc.deflections += src.deflections;
}

function emptyPlaytype(): NbaPbpPlaytypePts {
  return { iso: 0, pnrBh: 0, pnrRoll: 0, spotup: 0, trans: 0, cut: 0, post: 0 };
}
function emptyTrack(): NbaPbpTrack {
  return {
    drives: 0,
    drivePts: 0,
    pullupFgm: 0,
    pullupFga: 0,
    pullupPts: 0,
    cnsFgm: 0,
    cnsFga: 0,
    cnsPts: 0,
  };
}
function emptyHustle(): NbaPbpHustle {
  return { charges: 0, looseBalls: 0, deflections: 0 };
}
function emptyBox(): NbaPbpBox {
  return { pts: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, fta: 0, oreb: 0, tov: 0 };
}

function perGame(sum: number, games: number): number {
  return games > 0 ? round1(sum / games) : 0;
}

function pct(made: number, att: number): number {
  return att > 0 ? round3(made / att) : 0;
}

function teamSide(kit: WindowGameKit, teamId: string): "home" | "away" | null {
  if (kit.homeTeamId === teamId) return "home";
  if (kit.awayTeamId === teamId) return "away";
  return null;
}

export function enrichTeamWindowRowFromKits(
  row: NbaLeagueTeamStatRow,
  logs: readonly WindowLogRef[],
  index: WindowGameKitIndex
): NbaLeagueTeamStatRow {
  const kits = kitsForLogs(logs, index);
  if (kits.length === 0) return row;
  const games = row.wins + row.losses;
  const n = Math.max(1, games);

  let cleanPts = 0;
  let cleanOpp = 0;
  let cleanPoss = 0;
  let allPts = 0;
  let allOpp = 0;
  let allPoss = 0;
  let clutchPts = 0;
  let clutchOpp = 0;
  let clutchFgm = 0;
  let clutchFga = 0;
  let clutchPoss = 0;
  const playtype = emptyPlaytype();
  const track = emptyTrack();
  const hustle = emptyHustle();
  let tech = 0;
  let flag = 0;
  let eject = 0;
  let rimMade = 0;
  let rimAtt = 0;
  let c3Made = 0;
  let c3Att = 0;

  for (const kit of kits) {
    const side = teamSide(kit, row.teamId);
    if (kit.clean && side) {
      const own = kit.clean[side];
      const opp = kit.clean[side === "home" ? "away" : "home"];
      const cPoss = (estimatePossessions(own.clean) + estimatePossessions(opp.clean)) / 2;
      const aPoss = (estimatePossessions(own.all) + estimatePossessions(opp.all)) / 2;
      cleanPts += own.clean.pts;
      cleanOpp += opp.clean.pts;
      cleanPoss += cPoss;
      allPts += own.all.pts;
      allOpp += opp.all.pts;
      allPoss += aPoss;
    }
    if (kit.extras && side) {
      const sl = kit.extras[side];
      clutchPts += sl.clutch.pts;
      clutchOpp += sl.clutch.oppPts;
      clutchFgm += sl.clutch.fgm;
      clutchFga += sl.clutch.fga;
      clutchPoss += estimatePossessions(sl.clutch);
      addPlaytype(playtype, sl.playtype);
      addTrack(track, sl.track);
      addHustle(hustle, sl.hustle);
    }
    if (kit.discipline) {
      for (const ev of kit.discipline.events ?? []) {
        if (ev.t !== row.teamId) continue;
        if (ev.k === "tech") tech += 1;
        else if (ev.k === "flag") flag += 1;
        else if (ev.k === "eject") eject += 1;
      }
    }
    if (kit.shots?.agg && side) {
      for (const [pid, areas] of Object.entries(kit.shots.agg)) {
        const t = kit.extras?.players[pid]?.t;
        if (t !== row.teamId) continue;
        const rim = areas.restricted;
        if (rim) {
          rimMade += rim[0];
          rimAtt += rim[1];
        }
        for (const key of ["left_corner_3", "right_corner_3"] as const) {
          const z = areas[key];
          if (!z) continue;
          c3Made += z[0];
          c3Att += z[1];
        }
      }
    }
  }

  const next: NbaLeagueTeamStatRow = { ...row };
  if (cleanPoss > 0 && allPoss > 0 && row.ortg > 0 && row.drtg > 0) {
    const pbpCleanOrtg = rating(cleanPts, cleanPoss);
    const pbpCleanDrtg = rating(cleanOpp, cleanPoss);
    const pbpAllOrtg = rating(allPts, allPoss);
    const pbpAllDrtg = rating(allOpp, allPoss);
    next.cleanOrtg = round1(row.ortg + (pbpCleanOrtg - pbpAllOrtg));
    next.cleanDrtg = round1(row.drtg + (pbpCleanDrtg - pbpAllDrtg));
    next.cleanNet = round1(next.cleanOrtg - next.cleanDrtg);
  } else if (cleanPoss > 0) {
    next.cleanOrtg = rating(cleanPts, cleanPoss);
    next.cleanDrtg = rating(cleanOpp, cleanPoss);
    next.cleanNet = round1(next.cleanOrtg - next.cleanDrtg);
  }
  if (clutchPoss > 0) {
    next.clutchOrtg = rating(clutchPts, clutchPoss);
    next.clutchDrtg = rating(clutchOpp, clutchPoss);
    next.clutchNet = round1(next.clutchOrtg - next.clutchDrtg);
  }
  if (clutchFga > 0) next.clutchEfg = pct(clutchFgm, clutchFga);
  next.isoPts = perGame(playtype.iso, n);
  next.pnrBhPts = perGame(playtype.pnrBh, n);
  next.pnrRollPts = perGame(playtype.pnrRoll, n);
  next.spotupPts = perGame(playtype.spotup, n);
  next.transPts = perGame(playtype.trans, n);
  next.cutPts = perGame(playtype.cut, n);
  next.postPts = perGame(playtype.post, n);
  next.drives = perGame(track.drives, n);
  next.drivePts = perGame(track.drivePts, n);
  if (track.pullupFga > 0) next.pullupFgPct = pct(track.pullupFgm, track.pullupFga);
  next.pullupPts = perGame(track.pullupPts, n);
  if (track.cnsFga > 0) next.cnsFgPct = pct(track.cnsFgm, track.cnsFga);
  next.cnsPts = perGame(track.cnsPts, n);
  next.charges = perGame(hustle.charges, n);
  next.looseBalls = perGame(hustle.looseBalls, n);
  next.deflections = perGame(hustle.deflections, n);
  next.techFouls = tech;
  next.flagrantFouls = flag;
  next.ejections = eject;
  const fines = scheduledDisciplineFines(
    kits
      .filter((k) => k.discipline)
      .map((k) => ({
        date: k.discipline!.date,
        seasonType: k.discipline!.seasonType,
        events: k.discipline!.events ?? [],
      }))
  );
  next.finesUsd = Math.round(
    fines.fines.filter((f) => f.teamId === row.teamId).reduce((s, f) => s + f.amountUsd, 0)
  );
  if (rimAtt > 0) next.rimFgPct = pct(rimMade, rimAtt);
  if (c3Att > 0) next.corner3Pct = pct(c3Made, c3Att);
  return next;
}

type PlayerAcc = {
  teamId: string;
  name: string;
  gp: number;
  clutch: NbaPbpBox;
  playtype: NbaPbpPlaytypePts;
  track: NbaPbpTrack;
  hustle: NbaPbpHustle;
  tech: number;
  flag: number;
  eject: number;
  fines: number;
  rimMade: number;
  rimAtt: number;
  c3Made: number;
  c3Att: number;
};

function addArea(acc: PlayerAcc, areas: NbaShotAreaCounts | undefined): void {
  if (!areas) return;
  const rim = areas.restricted;
  if (rim) {
    acc.rimMade += rim[0];
    acc.rimAtt += rim[1];
  }
  for (const key of ["left_corner_3", "right_corner_3"] as const) {
    const z = areas[key];
    if (!z) continue;
    acc.c3Made += z[0];
    acc.c3Att += z[1];
  }
}

function fillMetric(
  board: Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>,
  metric: NbaPlayerLeaderMetricId,
  rows: NbaPlayerStatLeaderRow[],
  higherIsBetter: boolean
): void {
  board[metric] = [...rows]
    .sort((a, b) =>
      higherIsBetter ? b.value - a.value : a.value - b.value
    )
    .slice(0, BOARD_LIMIT);
}

function toRow(
  playerId: string,
  acc: PlayerAcc,
  value: number
): NbaPlayerStatLeaderRow {
  return {
    playerId,
    playerName: acc.name,
    teamId: acc.teamId,
    conference: nbaConferenceForTeam(acc.teamId) ?? "west",
    gamesPlayed: acc.gp,
    value,
  };
}

export function enrichPlayerWindowBoardFromKits(
  board: Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>,
  players: readonly {
    playerId: string;
    playerName: string;
    teamId: string;
    gameLogs: readonly WindowLogRef[];
  }[],
  index: WindowGameKitIndex
): Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]> {
  const accs = new Map<string, PlayerAcc>();
  for (const p of players) {
    const kits = kitsForLogs(p.gameLogs, index);
    if (kits.length === 0) continue;
    const acc: PlayerAcc = {
      teamId: p.teamId,
      name: p.playerName,
      gp: p.gameLogs.length,
      clutch: emptyBox(),
      playtype: emptyPlaytype(),
      track: emptyTrack(),
      hustle: emptyHustle(),
      tech: 0,
      flag: 0,
      eject: 0,
      fines: 0,
      rimMade: 0,
      rimAtt: 0,
      c3Made: 0,
      c3Att: 0,
    };
    for (const kit of kits) {
      const sl = kit.extras?.players[p.playerId];
      if (sl) {
        addBox(acc.clutch, sl.clutch);
        addPlaytype(acc.playtype, sl.playtype);
        addTrack(acc.track, sl.track);
        addHustle(acc.hustle, sl.hustle);
        if (sl.t) acc.teamId = sl.t;
      }
      if (kit.discipline) {
        for (const ev of kit.discipline.events ?? []) {
          if (ev.p !== p.playerId) continue;
          if (ev.k === "tech") acc.tech += 1;
          else if (ev.k === "flag") acc.flag += 1;
          else if (ev.k === "eject") acc.eject += 1;
        }
      }
      addArea(acc, kit.shots?.agg?.[p.playerId]);
    }
    const fines = scheduledDisciplineFines(
      kits
        .filter((k) => k.discipline)
        .map((k) => ({
          date: k.discipline!.date,
          seasonType: k.discipline!.seasonType,
          events: (k.discipline!.events ?? []).filter((e) => e.p === p.playerId),
        }))
    );
    acc.fines = Math.round(
      fines.fines
        .filter((f) => f.playerId === p.playerId)
        .reduce((s, f) => s + f.amountUsd, 0)
    );
    accs.set(p.playerId, acc);
  }
  if (accs.size === 0) return board;

  const next = { ...board };
  const entries = [...accs.entries()];
  const put = (
    metric: NbaPlayerLeaderMetricId,
    pick: (a: PlayerAcc) => number,
    minAbs = 1e-9
  ) => {
    const higher = isPlayerAdvancedLeaderMetric(metric)
      ? playerAdvancedMetricDef(metric).higherIsBetter
      : true;
    const rows = entries
      .map(([id, a]) => {
        const value = pick(a);
        return Math.abs(value) > minAbs ? toRow(id, a, value) : null;
      })
      .filter((r): r is NbaPlayerStatLeaderRow => r != null);
    if (rows.length) fillMetric(next, metric, rows, higher);
  };

  put("clutch_pts", (a) => perGame(a.clutch.pts, a.gp));
  const fgRows = entries
    .filter(([, a]) => a.clutch.fga >= Math.max(2, Math.ceil(a.gp * 0.4)))
    .map(([id, a]) => toRow(id, a, pct(a.clutch.fgm, a.clutch.fga)));
  if (fgRows.length) {
    fillMetric(next, "clutch_fg_pct", fgRows, true);
  }
  put("iso_pts", (a) => perGame(a.playtype.iso, a.gp));
  put("pnr_bh_pts", (a) => perGame(a.playtype.pnrBh, a.gp));
  put("pnr_roll_pts", (a) => perGame(a.playtype.pnrRoll, a.gp));
  put("spotup_pts", (a) => perGame(a.playtype.spotup, a.gp));
  put("trans_pts", (a) => perGame(a.playtype.trans, a.gp));
  put("cut_pts", (a) => perGame(a.playtype.cut, a.gp));
  put("post_pts", (a) => perGame(a.playtype.post, a.gp));
  put("drives", (a) => perGame(a.track.drives, a.gp));
  put("drive_pts", (a) => perGame(a.track.drivePts, a.gp));
  put("pullup_pts", (a) => perGame(a.track.pullupPts, a.gp));
  const pullupPct = entries
    .filter(([, a]) => a.track.pullupFga >= 3)
    .map(([id, a]) => toRow(id, a, pct(a.track.pullupFgm, a.track.pullupFga)));
  if (pullupPct.length) fillMetric(next, "pullup_fg_pct", pullupPct, true);
  put("cns_pts", (a) => perGame(a.track.cnsPts, a.gp));
  const cnsPct = entries
    .filter(([, a]) => a.track.cnsFga >= 3)
    .map(([id, a]) => toRow(id, a, pct(a.track.cnsFgm, a.track.cnsFga)));
  if (cnsPct.length) fillMetric(next, "cns_fg_pct", cnsPct, true);
  put("charges", (a) => perGame(a.hustle.charges, a.gp));
  put("loose_balls", (a) => perGame(a.hustle.looseBalls, a.gp));
  put("deflections", (a) => perGame(a.hustle.deflections, a.gp));
  put("technical_fouls", (a) => a.tech);
  put("flagrant_fouls", (a) => a.flag);
  put("ejections", (a) => a.eject);
  put("fines_usd", (a) => a.fines);
  const rimPct = entries
    .filter(([, a]) => a.rimAtt >= 4)
    .map(([id, a]) => toRow(id, a, pct(a.rimMade, a.rimAtt)));
  if (rimPct.length) fillMetric(next, "restricted_fg_pct", rimPct, true);
  put("restricted_pts", (a) => perGame(a.rimMade * 2, a.gp));
  const cornerPct = entries
    .filter(([, a]) => a.c3Att >= 3)
    .map(([id, a]) => toRow(id, a, pct(a.c3Made, a.c3Att)));
  if (cornerPct.length) fillMetric(next, "corner3_pct", cornerPct, true);
  put("corner3_pts", (a) => perGame(a.c3Made * 3, a.gp));
  return next;
}
