/**
 * Roster / Payroll / Injury スナップショット → プレイヤー詳細。
 * クライアントは BDL を叩かない。
 */
import { TEAM_SHORT } from "@/lib/team-short";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import type {
  NbaPlayerAvailability,
  NbaPlayerContractSummary,
  NbaPlayerDetailPreview,
  NbaPlayerGameLog,
  NbaPlayerSeasonMetric,
  NbaPlayerShotZone,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import { metricsFromSeason } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type {
  NbaTeamInjuryEntry,
  NbaTeamPayrollLine,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";

export type PlayerRosterHit = {
  teamId: string;
  teamName: string;
  player: NbaRosterPlayer;
};

export function findPlayerOnRosters(
  teams: Record<string, NbaTeamRosterDocTeam>,
  playerId: string
): PlayerRosterHit | null {
  const want = String(playerId).trim();
  if (!want) return null;
  for (const team of Object.values(teams)) {
    const player = team.players.find((p) => String(p.id) === want);
    if (!player) continue;
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      player,
    };
  }
  return null;
}

function pct01(raw: number | undefined): number {
  if (raw == null || !Number.isFinite(raw)) return 0;
  return raw > 1 ? raw / 100 : raw;
}

function headlineFrom(
  seasonMetrics: NbaPlayerSeasonMetric[]
): NbaPlayerSeasonMetric[] {
  return (["pts", "reb", "ast"] as const)
    .map((id) => seasonMetrics.find((m) => m.id === id))
    .filter((m): m is NbaPlayerSeasonMetric => Boolean(m));
}

/** Roster の試合平均で season / グリッドを埋める（Top30 外でも可） */
export function applyRosterToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  hit: PlayerRosterHit
): NbaPlayerDetailPreview {
  const { player, teamId, teamName } = hit;
  const season: NbaPlayerDetailPreview["season"] = {
    ...detail.season,
    gamesPlayed: Math.max(0, Math.round(player.gp || 0)),
    min: player.mpg || 0,
    pts: player.ppg || 0,
    reb: player.rpg ?? 0,
    ast: player.apg ?? 0,
    stl: player.spg ?? 0,
    blk: player.bpg ?? 0,
    tov: player.tpg ?? 0,
    fgPct: pct01(player.fgPct),
    fg3Pct: pct01(player.fg3Pct),
    ftPct: pct01(player.ftPct),
    fga: player.fga ?? detail.season.fga,
    fg3m: player.fg3m ?? detail.season.fg3m,
    fg3a: player.fg3a ?? detail.season.fg3a,
  };
  const seasonMetrics = metricsFromSeason(season);
  return {
    ...detail,
    firstName: player.firstName || detail.firstName,
    lastName: player.lastName || detail.lastName,
    jerseyNumber: (player.jerseyNumber ?? detail.jerseyNumber) || "—",
    position: player.position || detail.position,
    teamId,
    teamAbbr: TEAM_SHORT[teamId] ?? detail.teamAbbr,
    teamName: NBA_TEAM_NAME_BY_ID[teamId] ?? teamName ?? detail.teamName,
    conference: nbaConferenceForTeam(teamId) ?? detail.conference,
    season,
    seasonMetrics,
    headlineMetrics: headlineFrom(seasonMetrics),
  };
}

export function contractFromPayrollLine(
  line: NbaTeamPayrollLine,
  teamId: string
): NbaPlayerContractSummary {
  const startYear = Number.parseInt(CURRENT_NBA_SEASON_KEY.slice(0, 4), 10);
  const salary = Math.max(0, Math.round(line.salary || 0));
  return {
    contractType: "—",
    contractStatus: "Active",
    contractYears: 1,
    yearsRemaining: 1,
    freeAgencyYear: startYear + 1,
    freeAgencyType: null,
    averageSalary: salary,
    totalValue: salary,
    remainingGuaranteed: salary,
    notes: [],
    seasons: [
      {
        season: startYear,
        baseSalary: salary,
        capHit: salary,
        salaryRank: 0,
        teamId,
        teamAbbr: TEAM_SHORT[teamId] ?? "NBA",
        option: null,
      },
    ],
  };
}

/** チームペイロール1行だけのフォールバック（複数年 API 失敗時） */
export function applyPayrollLineToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  line: NbaTeamPayrollLine | null | undefined,
  teamId: string
): NbaPlayerDetailPreview {
  if (!line) return detail;
  return { ...detail, contract: contractFromPayrollLine(line, teamId) };
}

export function applyPlayerContractToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  contract: NbaPlayerContractSummary | null | undefined
): NbaPlayerDetailPreview {
  if (!contract || contract.seasons.length === 0) return detail;
  return { ...detail, contract };
}

export function applyPlayerCareerSeasonsToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  careerSeasons:
    | {
        regular: NbaPlayerDetailPreview["careerSeasons"]["regular"];
        playoffs: NbaPlayerDetailPreview["careerSeasons"]["playoffs"];
      }
    | null
    | undefined
): NbaPlayerDetailPreview {
  if (!careerSeasons) return detail;
  if (
    careerSeasons.regular.length === 0 &&
    careerSeasons.playoffs.length === 0
  ) {
    return detail;
  }
  return { ...detail, careerSeasons };
}

export function applyPlayerGameLogsToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  gameLogs: NbaPlayerGameLog[] | null | undefined
): NbaPlayerDetailPreview {
  if (!gameLogs || gameLogs.length === 0) return detail;
  return { ...detail, gameLogs };
}

export function applyPlayerShotZonesToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  shotZones: NbaPlayerShotZone[] | null | undefined
): NbaPlayerDetailPreview {
  if (!shotZones || shotZones.length === 0) return detail;
  return { ...detail, shotZones };
}

export function availabilityFromInjury(
  entry: NbaTeamInjuryEntry | null | undefined
): NbaPlayerAvailability {
  if (!entry) return { status: "active", reason: null, returnEstimate: null };
  return {
    status: entry.status === "out" ? "out" : "gtd",
    reason: entry.reason,
    returnEstimate: entry.returnEstimate,
  };
}

export function applyInjuryToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  entry: NbaTeamInjuryEntry | null | undefined
): NbaPlayerDetailPreview {
  return { ...detail, availability: availabilityFromInjury(entry) };
}
