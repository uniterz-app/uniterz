/**
 * 期間窓のリーグ表行。試合スコア + box（+ teamStats の PAINT / FB）から集計。
 * clutch / playtype / tracking / hustle / discipline / clean / ショットゾーンは箱から出さない。
 */
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import type { NbaTeamGameLogBoxTotals } from "@/lib/nba/teamGameLog/teamGameLogDetail";
import {
  attachLeagueTeamAdvanced,
  type NbaLeagueTeamStatRow,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";

export type LeagueTeamBoxGame = {
  teamScore: number;
  oppScore: number;
  result?: "W" | "L";
  box?: NbaTeamGameLogBoxTotals | null;
  oppBox?: NbaTeamGameLogBoxTotals | null;
  paint?: number | null;
  fb?: number | null;
  oppPaint?: number | null;
  oppFb?: number | null;
  /** box が無い試合の 3P 補助（last10 ingest） */
  fg3Fallback?: { made: number; att: number } | { pct01: number };
};

export function estimateTeamPossessions(input: {
  fga: number;
  fta: number;
  oreb: number;
  tov: number;
}): number {
  return input.fga + 0.44 * input.fta - input.oreb + input.tov;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function emptyRow(teamId: string): NbaLeagueTeamStatRow {
  const conference = nbaConferenceForTeam(teamId);
  return attachLeagueTeamAdvanced(
    {
      teamId,
      teamName: NBA_TEAM_NAME_BY_ID[teamId] ?? teamId,
      conference: conference ?? "west",
      wins: 0,
      losses: 0,
      winPct: 0,
      ppg: 0,
      papg: 0,
      diff: 0,
      ortg: 0,
      drtg: 0,
      netrtg: 0,
      pace: 0,
      efgPct: 0,
      fg3Pct: 0,
      fg3a: 0,
      tovPct: 0,
      oppFgPct: 0,
      oppFg3Pct: 0,
      oppFtPct: 0,
      oppReb: 0,
      oppAst: 0,
      oppTov: 0,
      oppOreb: 0,
      oppEfgPct: 0,
    },
    "last10"
  );
}

function addBox(
  acc: NbaTeamGameLogBoxTotals,
  src: NbaTeamGameLogBoxTotals
): void {
  acc.fgm += src.fgm;
  acc.fga += src.fga;
  acc.fg3m += src.fg3m;
  acc.fg3a += src.fg3a;
  acc.ftm += src.ftm;
  acc.fta += src.fta;
  acc.reb += src.reb;
  acc.oreb += src.oreb;
  acc.ast += src.ast;
  acc.stl += src.stl;
  acc.blk += src.blk;
  acc.tov += src.tov;
  acc.pf += src.pf;
}

function emptyBox(): NbaTeamGameLogBoxTotals {
  return {
    fgm: 0,
    fga: 0,
    fg3m: 0,
    fg3a: 0,
    ftm: 0,
    fta: 0,
    reb: 0,
    oreb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    pf: 0,
  };
}

export function aggregateLeagueTeamRowFromBoxGames(input: {
  teamId: string;
  games: readonly LeagueTeamBoxGame[];
  seasonPace?: number;
}): NbaLeagueTeamStatRow {
  const { teamId, games } = input;
  if (games.length === 0) return emptyRow(teamId);

  let wins = 0;
  let pts = 0;
  let oppPts = 0;

  const own = emptyBox();
  const opp = emptyBox();
  let boxGames = 0;
  let boxPts = 0;
  let boxOppPts = 0;

  let possPts = 0;
  let possOppPts = 0;
  let possSum = 0;
  let possGames = 0;

  let fg3Made = 0;
  let fg3Att = 0;
  const fg3PctSamples: number[] = [];

  let paint = 0;
  let paintGames = 0;
  let fb = 0;
  let fbGames = 0;
  let oppPaint = 0;
  let oppPaintGames = 0;
  let oppFb = 0;
  let oppFbGames = 0;

  for (const g of games) {
    pts += g.teamScore;
    oppPts += g.oppScore;
    const won =
      g.result === "W" || (g.result !== "L" && g.teamScore > g.oppScore);
    if (won) wins += 1;

    const box = g.box ?? null;
    const oppBox = g.oppBox ?? null;
    if (box && oppBox && box.fga > 0 && oppBox.fga > 0) {
      addBox(own, box);
      addBox(opp, oppBox);
      boxGames += 1;
      boxPts += g.teamScore;
      boxOppPts += g.oppScore;
      const ownPoss = estimateTeamPossessions(box);
      const oppPoss = estimateTeamPossessions(oppBox);
      if (ownPoss >= 60 && oppPoss >= 60) {
        possPts += g.teamScore;
        possOppPts += g.oppScore;
        possSum += (ownPoss + oppPoss) / 2;
        possGames += 1;
      }
    } else if (g.fg3Fallback) {
      const fb3 = g.fg3Fallback;
      if ("made" in fb3) {
        fg3Made += fb3.made;
        fg3Att += fb3.att;
      } else {
        fg3PctSamples.push(fb3.pct01);
      }
    }

    if (typeof g.paint === "number" && Number.isFinite(g.paint)) {
      paint += g.paint;
      paintGames += 1;
    }
    if (typeof g.fb === "number" && Number.isFinite(g.fb)) {
      fb += g.fb;
      fbGames += 1;
    }
    if (typeof g.oppPaint === "number" && Number.isFinite(g.oppPaint)) {
      oppPaint += g.oppPaint;
      oppPaintGames += 1;
    }
    if (typeof g.oppFb === "number" && Number.isFinite(g.oppFb)) {
      oppFb += g.oppFb;
      oppFbGames += 1;
    }
  }

  const n = games.length;
  const losses = n - wins;
  const ppg = pts / n;
  const papg = oppPts / n;
  const seasonPace =
    typeof input.seasonPace === "number" &&
    Number.isFinite(input.seasonPace) &&
    input.seasonPace >= 80
      ? input.seasonPace
      : 100;

  let ortg: number;
  let drtg: number;
  let pace: number;
  if (possGames >= 2 && possSum > 0) {
    ortg = round1((possPts / possSum) * 100);
    drtg = round1((possOppPts / possSum) * 100);
    pace = round1(possSum / possGames);
  } else {
    ortg = round1((ppg / seasonPace) * 100);
    drtg = round1((papg / seasonPace) * 100);
    pace = round1(seasonPace);
  }

  let efgPct = 0;
  let fg3Pct = 0;
  let fg3a = 0;
  let tovPct = 0;
  let fgPct = 0;
  let ftPct = 0;
  let tsPct = 0;
  let ftaRate = 0;
  let orebPct = 0;
  let oppEfgPct = 0;
  let oppTovPct = 0;
  let oppFtaRate = 0;
  let oppOrebPct = 0;
  let oppFgPct = 0;
  let oppFg3Pct = 0;
  let oppFtPct = 0;
  let oppReb = 0;
  let oppAst = 0;
  let oppTov = 0;
  let oppOreb = 0;
  let pts3 = 0;
  let ptsFt = 0;
  let pctPts3 = 0;
  let pctPtsFt = 0;
  let pctPtsPaint = 0;
  let pctPtsFb = 0;
  let oppPctPtsPaint = 0;
  let oppPctPtsFb = 0;

  if (boxGames > 0 && own.fga > 0) {
    fgPct = round3(own.fgm / own.fga);
    efgPct = round3((own.fgm + 0.5 * own.fg3m) / own.fga);
    if (own.fg3a > 0) {
      fg3Pct = round3(own.fg3m / own.fg3a);
      fg3a = round1(own.fg3a / boxGames);
    }
    if (own.fta > 0) ftPct = round3(own.ftm / own.fta);
    const tsDen = 2 * (own.fga + 0.44 * own.fta);
    if (tsDen > 0) tsPct = round3(boxPts / tsDen);
    ftaRate = round3(own.fta / own.fga);
    const tovDen = own.fga + 0.44 * own.fta + own.tov;
    if (tovDen > 0) tovPct = round3(own.tov / tovDen);
    pts3 = round1((3 * own.fg3m) / boxGames);
    ptsFt = round1(own.ftm / boxGames);
    if (boxPts > 0) {
      pctPts3 = round3((3 * own.fg3m) / boxPts);
      pctPtsFt = round3(own.ftm / boxPts);
    }

    if (opp.fga > 0) {
      oppFgPct = round3(opp.fgm / opp.fga);
      oppEfgPct = round3((opp.fgm + 0.5 * opp.fg3m) / opp.fga);
      oppFtaRate = round3(opp.fta / opp.fga);
    }
    if (opp.fg3a > 0) oppFg3Pct = round3(opp.fg3m / opp.fg3a);
    if (opp.fta > 0) oppFtPct = round3(opp.ftm / opp.fta);
    const oppTovDen = opp.fga + 0.44 * opp.fta + opp.tov;
    if (oppTovDen > 0) oppTovPct = round3(opp.tov / oppTovDen);
    const ownDreb = Math.max(0, own.reb - own.oreb);
    const oppDreb = Math.max(0, opp.reb - opp.oreb);
    const orebDen = own.oreb + oppDreb;
    if (orebDen > 0) orebPct = round3(own.oreb / orebDen);
    const oppOrebDen = opp.oreb + ownDreb;
    if (oppOrebDen > 0) oppOrebPct = round3(opp.oreb / oppOrebDen);
    oppReb = round1(opp.reb / boxGames);
    oppAst = round1(opp.ast / boxGames);
    oppTov = round1(opp.tov / boxGames);
    oppOreb = round1(opp.oreb / boxGames);
  } else if (fg3Att > 0) {
    fg3Pct = round3(fg3Made / fg3Att);
    fg3a = round1(fg3Att / n);
  } else if (fg3PctSamples.length > 0) {
    fg3Pct = round3(
      fg3PctSamples.reduce((a, b) => a + b, 0) / fg3PctSamples.length
    );
  }

  const row = emptyRow(teamId);
  return {
    ...row,
    wins,
    losses,
    winPct: round3(wins / n),
    ppg: round1(ppg),
    papg: round1(papg),
    diff: round1(ppg - papg),
    ortg,
    drtg,
    netrtg: round1(ortg - drtg),
    pace,
    efgPct,
    fg3Pct,
    fg3a,
    tovPct,
    oppFgPct,
    oppFg3Pct,
    oppFtPct,
    oppReb,
    oppAst,
    oppTov,
    oppOreb,
    oppEfgPct,
    ...(fgPct > 0 ? { fgPct } : null),
    ...(ftPct > 0 ? { ftPct } : null),
    ...(tsPct > 0 ? { tsPct } : null),
    ...(ftaRate > 0 ? { ftaRate } : null),
    ...(orebPct > 0 ? { orebPct } : null),
    ...(oppTovPct > 0 ? { oppTovPct } : null),
    ...(oppFtaRate > 0 ? { oppFtaRate } : null),
    ...(oppOrebPct > 0 ? { oppOrebPct } : null),
    ...(pts3 > 0 ? { pts3 } : null),
    ...(ptsFt > 0 ? { ptsFt } : null),
    ...(pctPts3 > 0 ? { pctPts3 } : null),
    ...(pctPtsFt > 0 ? { pctPtsFt } : null),
    ...(paintGames > 0
      ? (() => {
          const ptsPaint = round1(paint / paintGames);
          if (ppg > 0) pctPtsPaint = round3(ptsPaint / ppg);
          return {
            ptsPaint,
            ...(pctPtsPaint > 0 ? { pctPtsPaint } : null),
          };
        })()
      : null),
    ...(fbGames > 0
      ? (() => {
          const ptsFb = round1(fb / fbGames);
          if (ppg > 0) pctPtsFb = round3(ptsFb / ppg);
          return {
            ptsFb,
            ...(pctPtsFb > 0 ? { pctPtsFb } : null),
          };
        })()
      : null),
    ...(oppPaintGames > 0
      ? (() => {
          const oppPtsPaint = round1(oppPaint / oppPaintGames);
          if (papg > 0) oppPctPtsPaint = round3(oppPtsPaint / papg);
          return {
            oppPtsPaint,
            ...(oppPctPtsPaint > 0 ? { oppPctPtsPaint } : null),
          };
        })()
      : null),
    ...(oppFbGames > 0
      ? (() => {
          const oppPtsFb = round1(oppFb / oppFbGames);
          if (papg > 0) oppPctPtsFb = round3(oppPtsFb / papg);
          return {
            oppPtsFb,
            ...(oppPctPtsFb > 0 ? { oppPctPtsFb } : null),
          };
        })()
      : null),
    ...(oppFgPct > 0 ? { fgPctAllowed: oppFgPct } : null),
    ...(oppFg3Pct > 0 ? { fg3PctAllowed: oppFg3Pct } : null),
    ...(oppReb > 0 ? { rebAllowed: oppReb } : null),
    ...(oppAst > 0 ? { astAllowed: oppAst } : null),
    ...(oppTov > 0 ? { tovForced: oppTov } : null),
    ...(boxGames > 0
      ? (() => {
          const pts2 = round1((2 * Math.max(0, own.fgm - own.fg3m)) / boxGames);
          const pctPts2 = boxPts > 0 ? round3(pts2 / (boxPts / boxGames)) : 0;
          const dreb = Math.max(0, own.reb - own.oreb);
          return {
            pts2,
            ...(pctPts2 > 0 ? { pctPts2 } : null),
            reb: round1(own.reb / boxGames),
            oreb: round1(own.oreb / boxGames),
            dreb: round1(dreb / boxGames),
            ast: round1(own.ast / boxGames),
            blk: round1(own.blk / boxGames),
          };
        })()
      : withDerivedTwoPointScoring({
          ppg: round1(ppg),
          pts3,
          ptsFt,
        })),
  };
}

export function withDerivedTwoPointScoring<
  T extends { ppg: number; pts3?: number; ptsFt?: number; pts2?: number; pctPts2?: number },
>(row: T): T {
  if (typeof row.pts2 === "number" && Number.isFinite(row.pts2) && row.pts2 > 0) {
    return row;
  }
  const pts3 = typeof row.pts3 === "number" && Number.isFinite(row.pts3) ? row.pts3 : 0;
  const ptsFt = typeof row.ptsFt === "number" && Number.isFinite(row.ptsFt) ? row.ptsFt : 0;
  const pts2 = round1(Math.max(0, row.ppg - pts3 - ptsFt));
  if (pts2 <= 0) return row;
  const pctPts2 = row.ppg > 0 ? round3(pts2 / row.ppg) : 0;
  return { ...row, pts2, pctPts2 };
}
