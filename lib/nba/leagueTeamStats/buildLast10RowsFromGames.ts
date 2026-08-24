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

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
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
): { teamScore: number; oppScore: number } | null {
  const homeId = teamIdOf(raw, "home");
  const awayId = teamIdOf(raw, "away");
  if (!homeId || !awayId) return null;
  const score = resolveGameScore(raw);
  if (!score) return null;
  if (teamId === homeId) {
    return { teamScore: score.home, oppScore: score.away };
  }
  if (teamId === awayId) {
    return { teamScore: score.away, oppScore: score.home };
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
  finals: RawGame[]
): NbaLeagueTeamStatRow {
  const conference = nbaConferenceForTeam(teamId);
  if (!conference || finals.length === 0) {
    return emptyLast10Row(teamId);
  }

  let wins = 0;
  let losses = 0;
  let ptsFor = 0;
  let ptsAgainst = 0;

  for (const g of finals) {
    const scored = teamScoreInGame(g, teamId);
    if (!scored) continue;
    ptsFor += scored.teamScore;
    ptsAgainst += scored.oppScore;
    if (scored.teamScore > scored.oppScore) wins += 1;
    else losses += 1;
  }

  const games = wins + losses;
  if (games === 0) return emptyLast10Row(teamId);

  const winPct = wins / games;
  const ppg = ptsFor / games;
  const papg = ptsAgainst / games;
  const diff = ppg - papg;

  // スコア行から分かる実値だけ。ORTG/DRTG/PACE/効率系は仮値にしない（0 のまま）。
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

/**
 * シーズン `games` 行から各チームの直近 ≤10 試合を集計した last10 行。
 */
export function buildLast10RowsFromGames(
  games: Array<Record<string, unknown> & { id?: string }>
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
    rows.push(buildTeamLast10Row(teamId, finalsByTeam.get(teamId) ?? []));
  }
  return rows;
}
