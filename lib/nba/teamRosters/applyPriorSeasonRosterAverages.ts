/**
 * 今季ロスター行に出場平均が無い選手だけ、前季ロスターの平均を playerId で載せる。
 * 開幕前（全 0）も、開幕直後でまだ出場していない選手も、TOP SCORER / ROSTER が昨季 PPG を出せる。
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

/** 前季平均を載せた行の GP は今季出場数ではないので 0 に戻す（既存スナップショット用） */
export function clearPriorSeasonGamesPlayed<T extends { gp?: number; averagesSeasonKey?: string }>(
  player: T
): T {
  if (
    typeof player.averagesSeasonKey === "string" &&
    player.averagesSeasonKey.trim() &&
    (player.gp ?? 0) !== 0
  ) {
    return { ...player, gp: 0 };
  }
  return player;
}

function mergePlayerAverages(
  current: NbaRosterPlayer,
  prior: NbaRosterPlayer | undefined,
  priorAveragesSeasonKey: string
): NbaRosterPlayer {
  if (!prior || playerHasSeasonAverages(current)) return current;
  if (!playerHasSeasonAverages(prior)) return current;
  return {
    ...current,
    averagesSeasonKey: priorAveragesSeasonKey,
    // GP は今季の出場数のまま（未出場は 0）。前季の試合数を載せると今季の GP に見える
    mpg: prior.mpg,
    ppg: prior.ppg,
    rpg: prior.rpg ?? current.rpg,
    oreb: prior.oreb ?? current.oreb,
    dreb: prior.dreb ?? current.dreb,
    apg: prior.apg ?? current.apg,
    spg: prior.spg ?? current.spg,
    bpg: prior.bpg ?? current.bpg,
    tpg: prior.tpg ?? current.tpg,
    pf: prior.pf ?? current.pf,
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
  prior: NbaTeamRosterDocTeam | null | undefined,
  priorAveragesSeasonKey: string
): NbaTeamRosterDocTeam {
  if (!prior?.players?.length) return current;
  const byId = new Map(
    prior.players.map((p) => [String(p.id), p] as const)
  );
  return {
    ...current,
    players: current.players.map((p) =>
      mergePlayerAverages(p, byId.get(String(p.id)), priorAveragesSeasonKey)
    ),
  };
}

export function mergePriorAveragesOntoRosterTeams(
  current: Record<string, NbaTeamRosterDocTeam>,
  prior: Record<string, NbaTeamRosterDocTeam>,
  priorAveragesSeasonKey: string
): Record<string, NbaTeamRosterDocTeam> {
  const out: Record<string, NbaTeamRosterDocTeam> = {};
  for (const [teamId, team] of Object.entries(current)) {
    out[teamId] = mergePriorAveragesOntoRosterTeam(
      team,
      prior[teamId],
      priorAveragesSeasonKey
    );
  }
  return out;
}
