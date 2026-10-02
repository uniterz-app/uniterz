/**
 * 今季ロスター行に出場平均が無いとき、前季ロスターの平均を playerId で載せる。
 * ingest 前の Firestore（全 0）でも TOP SCORER / ROSTER が昨季 PPG を出せる。
 */
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import type { NbaTeamRosterDocTeam } from "./teamRosterTypes";

function playerHasSeasonAverages(p: NbaRosterPlayer): boolean {
  return (Number(p.gp) || 0) >= 1 || (Number(p.ppg) || 0) > 0;
}

/** バンドル内に出場平均が1人でもあれば今季データありとみなす */
export function rosterBundleHasSeasonAverages(
  teams: Record<string, NbaTeamRosterDocTeam>
): boolean {
  for (const team of Object.values(teams)) {
    for (const p of team.players) {
      if (playerHasSeasonAverages(p)) return true;
    }
  }
  return false;
}

function mergePlayerAverages(
  current: NbaRosterPlayer,
  prior: NbaRosterPlayer | undefined
): NbaRosterPlayer {
  if (!prior || playerHasSeasonAverages(current)) return current;
  if (!playerHasSeasonAverages(prior)) return current;
  return {
    ...current,
    gp: prior.gp,
    mpg: prior.mpg,
    ppg: prior.ppg,
    rpg: prior.rpg ?? current.rpg,
    apg: prior.apg ?? current.apg,
    spg: prior.spg ?? current.spg,
    bpg: prior.bpg ?? current.bpg,
    tpg: prior.tpg ?? current.tpg,
    fgPct: prior.fgPct ?? current.fgPct,
    fg3Pct: prior.fg3Pct ?? current.fg3Pct,
    ftPct: prior.ftPct ?? current.ftPct,
    fgm: prior.fgm ?? current.fgm,
    fga: prior.fga ?? current.fga,
    fg3m: prior.fg3m ?? current.fg3m,
    fg3a: prior.fg3a ?? current.fg3a,
    ftm: prior.ftm ?? current.ftm,
    fta: prior.fta ?? current.fta,
    plusMinus: prior.plusMinus ?? current.plusMinus,
  };
}

export function mergePriorAveragesOntoRosterTeam(
  current: NbaTeamRosterDocTeam,
  prior: NbaTeamRosterDocTeam | null | undefined
): NbaTeamRosterDocTeam {
  if (!prior?.players?.length) return current;
  const byId = new Map(
    prior.players.map((p) => [String(p.id), p] as const)
  );
  return {
    ...current,
    players: current.players.map((p) =>
      mergePlayerAverages(p, byId.get(String(p.id)))
    ),
  };
}

export function mergePriorAveragesOntoRosterTeams(
  current: Record<string, NbaTeamRosterDocTeam>,
  prior: Record<string, NbaTeamRosterDocTeam>
): Record<string, NbaTeamRosterDocTeam> {
  const out: Record<string, NbaTeamRosterDocTeam> = {};
  for (const [teamId, team] of Object.entries(current)) {
    out[teamId] = mergePriorAveragesOntoRosterTeam(team, prior[teamId]);
  }
  return out;
}
