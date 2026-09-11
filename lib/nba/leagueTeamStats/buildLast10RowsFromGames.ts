/**
 * シーズン `games` から各チーム last10（≤10 finals）を集計。
 *
 * - 実値: W–L / PPG / PAPG / diff（スコア）
 * - 3P%: liveStats.box の fg3 "m-a" をプール。無ければ teamStats.fg3（0–100）平均
 * - ORTG/DRTG/NET:
 *   1) liveStats.box から Dean Oliver 推定 poss（FGA+0.44*FTA−OREB+TOV）
 *   2) 無ければ PPG/PAPG ÷ season pace ×100 の代理
 *
 * 追加 BDL なし（既存 Firestore games / liveStats のみ → コスト $0）。
 */
import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
} from "../../../packages/shared/src/gameRow";
import { NBA_ALL_TEAM_IDS } from "@/lib/nba/teamGameLog/buildTeamGameLogsBundleFromGames";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import {
  attachLeagueTeamAdvanced,
  type NbaLeagueTeamStatRow,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";

type RawGame = Record<string, unknown> & { id?: string };

export type BuildLast10RowsOptions = {
  /** teamId → season pace（無ければ 100） */
  seasonPaceByTeamId?: Record<string, number> | Map<string, number>;
};

/** Dean Oliver 簡易推定（チーム合計） */
export function estimatePossessions(input: {
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

function paceFor(
  teamId: string,
  opts?: BuildLast10RowsOptions
): number {
  const map = opts?.seasonPaceByTeamId;
  if (!map) return 100;
  const raw = map instanceof Map ? map.get(teamId) : map[teamId];
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 80) {
    return raw;
  }
  return 100;
}

function teamIdOf(raw: RawGame, side: "home" | "away"): string {
  if (side === "home") {
    return String(
      raw.homeTeamId ??
        (raw.home as { teamId?: unknown } | undefined)?.teamId ??
        ""
    ).trim();
  }
  return String(
    raw.awayTeamId ??
      (raw.away as { teamId?: unknown } | undefined)?.teamId ??
      ""
  ).trim();
}

function isFinalGame(raw: RawGame): boolean {
  const status = resolveGameStatus(raw);
  if (status === "final") return true;
  if (raw.final === true) return true;
  const state = String(raw.status_state ?? raw.status ?? "").toLowerCase();
  return state === "final" || state === "ended";
}

function teamScoreInGame(
  raw: RawGame,
  teamId: string
): { teamScore: number; oppScore: number; isHome: boolean } | null {
  const homeId = teamIdOf(raw, "home");
  const awayId = teamIdOf(raw, "away");
  if (!homeId || !awayId) return null;
  const score = resolveGameScore(raw);
  if (!score) return null;
  if (teamId === homeId) {
    return { teamScore: score.home, oppScore: score.away, isHome: true };
  }
  if (teamId === awayId) {
    return { teamScore: score.away, oppScore: score.home, isHome: false };
  }
  return null;
}

function parseMakesAttempts(raw: unknown): { m: number; a: number } | null {
  if (typeof raw !== "string") return null;
  const m = raw.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return null;
  const made = Number(m[1]);
  const att = Number(m[2]);
  if (!Number.isFinite(made) || !Number.isFinite(att) || att < 0) return null;
  return { m: made, a: att };
}

function boxSideTotals(
  players: Array<Record<string, unknown>> | undefined
): {
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  reb: number;
  ast: number;
  tov: number;
} | null {
  if (!Array.isArray(players) || players.length === 0) return null;
  let fgm = 0;
  let fga = 0;
  let fg3m = 0;
  let fg3a = 0;
  let ftm = 0;
  let fta = 0;
  let oreb = 0;
  let reb = 0;
  let ast = 0;
  let tov = 0;
  let hasShot = false;
  for (const p of players) {
    const fg = parseMakesAttempts(p.fg);
    const fg3 = parseMakesAttempts(p.fg3);
    const ft = parseMakesAttempts(p.ft);
    if (fg) {
      fgm += fg.m;
      fga += fg.a;
      hasShot = true;
    }
    if (fg3) {
      fg3m += fg3.m;
      fg3a += fg3.a;
    }
    if (ft) {
      ftm += ft.m;
      fta += ft.a;
      hasShot = true;
    }
    if (typeof p.oreb === "number" && Number.isFinite(p.oreb)) oreb += p.oreb;
    if (typeof p.reb === "number" && Number.isFinite(p.reb)) reb += p.reb;
    if (typeof p.ast === "number" && Number.isFinite(p.ast)) ast += p.ast;
    if (typeof p.tov === "number" && Number.isFinite(p.tov)) tov += p.tov;
  }
  if (!hasShot || fga <= 0) return null;
  return { fgm, fga, fg3m, fg3a, ftm, fta, oreb, reb, ast, tov };
}

/**
 * 両サイドの推定 poss の平均（チーム公式に近い）。
 * box が片側でも欠けていれば null。
 */
function estimateGamePossessions(
  raw: RawGame
): { home: number; away: number; avg: number } | null {
  const live = raw.liveStats;
  if (!live || typeof live !== "object") return null;
  const box = (live as { box?: { home?: unknown[]; away?: unknown[] } }).box;
  const homeT = boxSideTotals(box?.home as Array<Record<string, unknown>>);
  const awayT = boxSideTotals(box?.away as Array<Record<string, unknown>>);
  if (!homeT || !awayT) return null;
  const home = estimatePossessions(homeT);
  const away = estimatePossessions(awayT);
  if (home < 60 || away < 60) return null;
  return { home, away, avg: (home + away) / 2 };
}

function boxSideFromGame(
  raw: RawGame,
  isHome: boolean
): ReturnType<typeof boxSideTotals> {
  const live = raw.liveStats;
  if (!live || typeof live !== "object") return null;
  const box = (live as { box?: { home?: unknown[]; away?: unknown[] } }).box;
  return boxSideTotals(
    (isHome ? box?.home : box?.away) as Array<Record<string, unknown>>
  );
}

/** liveStats から自サイドの 3P made/att（優先）または %（0–1） — box 無いときの補助 */
function fg3SampleFromGame(
  raw: RawGame,
  isHome: boolean
): { made: number; att: number } | { pct01: number } | null {
  const fromBox = boxSideFromGame(raw, isHome);
  if (fromBox && fromBox.fg3a > 0) {
    return { made: fromBox.fg3m, att: fromBox.fg3a };
  }
  const live = raw.liveStats;
  if (!live || typeof live !== "object") return null;
  const ls = live as Record<string, unknown>;
  const teamStats = ls.teamStats as
    | { home?: Record<string, unknown>; away?: Record<string, unknown> }
    | undefined;
  const sideStats = isHome ? teamStats?.home : teamStats?.away;
  const fg3 = sideStats?.fg3;
  if (typeof fg3 === "number" && Number.isFinite(fg3) && fg3 > 0) {
    return { pct01: fg3 > 1 ? fg3 / 100 : fg3 };
  }
  return null;
}

function emptyLast10Row(teamId: string): NbaLeagueTeamStatRow {
  const conference = nbaConferenceForTeam(teamId);
  const core = {
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
  };
  return attachLeagueTeamAdvanced(core, "last10");
}

function buildTeamLast10Row(
  teamId: string,
  finals: RawGame[],
  opts?: BuildLast10RowsOptions
): NbaLeagueTeamStatRow {
  const conference = nbaConferenceForTeam(teamId);
  if (!conference || finals.length === 0) {
    return emptyLast10Row(teamId);
  }

  let wins = 0;
  let losses = 0;
  let ptsFor = 0;
  let ptsAgainst = 0;
  let fg3Made = 0;
  let fg3Att = 0;
  const fg3PctSamples: number[] = [];

  let boxFgm = 0;
  let boxFga = 0;
  let boxFg3m = 0;
  let boxFg3a = 0;
  let boxFtm = 0;
  let boxFta = 0;
  let boxTov = 0;
  let boxGames = 0;

  let possPtsFor = 0;
  let possPtsAgainst = 0;
  let possSum = 0;
  let possGames = 0;

  for (const g of finals) {
    const scored = teamScoreInGame(g, teamId);
    if (!scored) continue;
    ptsFor += scored.teamScore;
    ptsAgainst += scored.oppScore;
    if (scored.teamScore > scored.oppScore) wins += 1;
    else losses += 1;

    const poss = estimateGamePossessions(g);
    if (poss) {
      possPtsFor += scored.teamScore;
      possPtsAgainst += scored.oppScore;
      possSum += poss.avg;
      possGames += 1;
    }

    const box = boxSideFromGame(g, scored.isHome);
    if (box) {
      boxFgm += box.fgm;
      boxFga += box.fga;
      boxFg3m += box.fg3m;
      boxFg3a += box.fg3a;
      boxFtm += box.ftm;
      boxFta += box.fta;
      boxTov += box.tov;
      boxGames += 1;
    } else {
      const fg3 = fg3SampleFromGame(g, scored.isHome);
      if (fg3) {
        if ("made" in fg3) {
          fg3Made += fg3.made;
          fg3Att += fg3.att;
        } else {
          fg3PctSamples.push(fg3.pct01);
        }
      }
    }
  }

  const games = wins + losses;
  if (games === 0) return emptyLast10Row(teamId);

  const winPct = wins / games;
  const ppg = ptsFor / games;
  const papg = ptsAgainst / games;
  const diff = ppg - papg;
  const paceSeason = paceFor(teamId, opts);

  let ortg: number;
  let drtg: number;
  let pace: number;
  if (possGames >= 2 && possSum > 0) {
    ortg = round1((possPtsFor / possSum) * 100);
    drtg = round1((possPtsAgainst / possSum) * 100);
    pace = round1(possSum / possGames);
  } else {
    ortg = round1((ppg / paceSeason) * 100);
    drtg = round1((papg / paceSeason) * 100);
    pace = round1(paceSeason);
  }
  const netrtg = round1(ortg - drtg);

  let fg3Pct = 0;
  let fg3a = 0;
  let efgPct = 0;
  let tovPct = 0;
  let fgPct = 0;
  let ftPct = 0;

  if (boxFga > 0) {
    fgPct = round3(boxFgm / boxFga);
    efgPct = round3((boxFgm + 0.5 * boxFg3m) / boxFga);
    if (boxFg3a > 0) {
      fg3Pct = round3(boxFg3m / boxFg3a);
      fg3a = round1(boxFg3a / Math.max(1, boxGames || games));
    }
    if (boxFta > 0) ftPct = round3(boxFtm / boxFta);
    const tovDen = boxFga + 0.44 * boxFta + boxTov;
    if (tovDen > 0) tovPct = round3(boxTov / tovDen);
  } else if (fg3Att > 0) {
    fg3Pct = round3(fg3Made / fg3Att);
    fg3a = round1(fg3Att / games);
  } else if (fg3PctSamples.length > 0) {
    fg3Pct = round3(
      fg3PctSamples.reduce((a, b) => a + b, 0) / fg3PctSamples.length
    );
  }

  const core = {
    teamId,
    teamName: NBA_TEAM_NAME_BY_ID[teamId] ?? teamId,
    conference,
    wins,
    losses,
    winPct: round3(winPct),
    ppg: round1(ppg),
    papg: round1(papg),
    diff: round1(diff),
    ortg,
    drtg,
    netrtg,
    pace,
    efgPct,
    fg3Pct,
    fg3a,
    tovPct,
    oppFgPct: 0,
    oppFg3Pct: 0,
    oppFtPct: 0,
    oppReb: 0,
    oppAst: 0,
    oppTov: 0,
    oppOreb: 0,
    oppEfgPct: 0,
  };
  const row = attachLeagueTeamAdvanced(core, "last10");
  return {
    ...row,
    ...(fgPct > 0 ? { fgPct } : null),
    ...(ftPct > 0 ? { ftPct } : null),
  };
}

/**
 * シーズン `games` 行から各チームの直近 ≤10 試合を集計した last10 行。
 */
export function buildLast10RowsFromGames(
  games: Array<Record<string, unknown> & { id?: string }>,
  opts?: BuildLast10RowsOptions
): NbaLeagueTeamStatRow[] {
  const finals = games
    .filter(isFinalGame)
    .filter((g) => {
      const phase = String(g.seasonPhase ?? "").toLowerCase();
      if (phase === "preseason") return false;
      return g.countsForRanking !== false;
    })
    .map((g) => ({
      raw: g,
      startAt: resolveGameStartAt(g)?.getTime() ?? 0,
    }))
    .sort((a, b) => a.startAt - b.startAt);

  const finalsByTeam = new Map<string, RawGame[]>();
  for (const teamId of NBA_ALL_TEAM_IDS) {
    finalsByTeam.set(teamId, []);
  }

  for (const { raw } of finals) {
    const homeId = teamIdOf(raw, "home");
    const awayId = teamIdOf(raw, "away");
    for (const id of [homeId, awayId]) {
      if (!id) continue;
      if (!finalsByTeam.has(id)) finalsByTeam.set(id, []);
      const list = finalsByTeam.get(id)!;
      list.push(raw);
      if (list.length > 10) list.shift();
    }
  }

  const rows: NbaLeagueTeamStatRow[] = [];
  for (const teamId of NBA_ALL_TEAM_IDS) {
    rows.push(
      buildTeamLast10Row(teamId, finalsByTeam.get(teamId) ?? [], opts)
    );
  }
  return rows;
}

/** season rows → pace map（last10 enrich 用） */
export function seasonPaceByTeamIdFromRows(
  seasonRows: Array<{ teamId: string; pace?: number | null }>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of seasonRows) {
    if (typeof r.pace === "number" && Number.isFinite(r.pace) && r.pace > 0) {
      out[r.teamId] = r.pace;
    }
  }
  return out;
}

/**
 * 既存 last10 行の ORTG/DRTG/NET/3P が空（0）のとき、games docs から埋める。
 * W–L/PPG は触らない（スナップショットの正を維持）。
 */
export function enrichLast10RatingsFromGameDocs(input: {
  last10Rows: NbaLeagueTeamStatRow[];
  seasonRows: Array<{ teamId: string; pace?: number | null }>;
  gameDocs: Array<{ id: string; data: Record<string, unknown> }>;
}): NbaLeagueTeamStatRow[] {
  const paceMap = seasonPaceByTeamIdFromRows(input.seasonRows);
  const rawGames: RawGame[] = input.gameDocs.map((d) => ({
    ...d.data,
    id: d.id,
  }));
  const rebuilt = buildLast10RowsFromGames(rawGames, {
    seasonPaceByTeamId: paceMap,
  });
  const byId = new Map(rebuilt.map((r) => [r.teamId, r]));

  return input.last10Rows.map((row) => {
    const fresh = byId.get(row.teamId);
    if (!fresh || fresh.wins + fresh.losses === 0) return row;
    const needsRating = !(row.ortg >= 80 && row.drtg >= 80);
    const needsFg3 = !(typeof row.fg3Pct === "number" && row.fg3Pct > 0);
    const preferFresh =
      needsRating ||
      (fresh.pace > 0 &&
        fresh.ortg >= 80 &&
        Math.abs(fresh.netrtg - row.netrtg) >= 0.5);
    if (!preferFresh && !needsFg3) return row;
    return {
      ...row,
      ...(preferFresh
        ? {
            ortg: fresh.ortg,
            drtg: fresh.drtg,
            netrtg: fresh.netrtg,
            pace: fresh.pace > 0 ? fresh.pace : row.pace,
            papg: fresh.papg > 0 ? fresh.papg : row.papg,
            diff: fresh.diff !== 0 ? fresh.diff : row.diff,
            efgPct: fresh.efgPct > 0 ? fresh.efgPct : row.efgPct,
            fg3Pct: fresh.fg3Pct > 0 ? fresh.fg3Pct : row.fg3Pct,
            tovPct: fresh.tovPct > 0 ? fresh.tovPct : row.tovPct,
            ...(typeof (fresh as { fgPct?: number }).fgPct === "number" &&
            (fresh as { fgPct: number }).fgPct > 0
              ? { fgPct: (fresh as { fgPct: number }).fgPct }
              : null),
            ...(typeof (fresh as { ftPct?: number }).ftPct === "number" &&
            (fresh as { ftPct: number }).ftPct > 0
              ? { ftPct: (fresh as { ftPct: number }).ftPct }
              : null),
          }
        : null),
      ...(needsFg3 && fresh.fg3Pct > 0
        ? { fg3Pct: fresh.fg3Pct, fg3a: fresh.fg3a }
        : null),
    };
  });
}
