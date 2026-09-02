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
import { teamInjuryStatusToAvailability } from "@/lib/nba/teamInjuries/injuryStatusDisplay";
import { metricsFromSeason } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type {
  NbaTeamInjuryEntry,
  NbaTeamPayrollLine,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { nbaTwoWaySalaryForSeason } from "@/lib/nba/teamPayroll/mapBdlToTeamPayroll";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";
import { buildTeamHistoryFromCareerSeasons } from "@/lib/nba/playerDetail/buildTeamHistoryFromCareerSeasons";
import { buildPlayerSplitsFromGameLogs } from "@/lib/nba/playerDetail/buildPlayerSplitsFromGameLogs";
import { mergeCuratedPlayerAwards } from "@/lib/nba/playerAwards/nbaPlayerAwardSeasonWinners";
import type { NbaPlayerSeasonMetricCell } from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  formatPlayerLeaderValue,
  isPlayerAdvancedLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";

/** 試合ログ表は直近だけ。Home/Away・vs Opp はフル配列から集計 */
const GAME_LOG_UI_LIMIT = 20;

const SEASON_TO_LEADER: Partial<
  Record<NbaPlayerSeasonMetric["id"], NbaPlayerLeaderMetricId>
> = {
  pts: "pts",
  reb: "reb",
  ast: "ast",
  stl: "stl",
  blk: "blk",
  tov: "tov",
  min: "min",
  fg_pct: "fg_pct",
  fga: "fga",
  fg3_pct: "fg3_pct",
  fg3m: "fg3m",
  fg3a: "fg3a",
  ft_pct: "ft_pct",
};

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
    plusMinus: player.plusMinus ?? detail.season.plusMinus,
  };
  const seasonMetrics = metricsFromSeason(season);
  const draftYear =
    player.draftYear != null && Number.isFinite(player.draftYear)
      ? Math.trunc(player.draftYear)
      : detail.draftYear;
  const seasonStart = Number.parseInt(CURRENT_NBA_SEASON_KEY.slice(0, 4), 10);
  const experienceYears =
    draftYear != null && Number.isFinite(seasonStart)
      ? Math.max(0, seasonStart - draftYear)
      : detail.experienceYears;
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
    height: player.height?.trim() || detail.height,
    weight: player.weight?.trim() || detail.weight,
    college:
      player.college !== undefined ? player.college : detail.college,
    country:
      player.country !== undefined ? player.country : detail.country,
    draftYear,
    draftRound:
      player.draftRound != null && Number.isFinite(player.draftRound)
        ? Math.trunc(player.draftRound)
        : detail.draftRound,
    draftNumber:
      player.draftNumber != null && Number.isFinite(player.draftNumber)
        ? Math.trunc(player.draftNumber)
        : detail.draftNumber,
    experienceYears,
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
  const isTwoWay = line.isTwoWay === true;
  const salary = isTwoWay
    ? nbaTwoWaySalaryForSeason(CURRENT_NBA_SEASON_KEY)
    : Math.max(0, Math.round(line.salary || 0));
  return {
    contractType: isTwoWay ? "Two-Way" : "—",
    contractStatus: "Active",
    contractYears: 1,
    yearsRemaining: 1,
    freeAgencyYear: startYear + 1,
    freeAgencyType: null,
    averageSalary: salary,
    totalValue: salary,
    remainingGuaranteed: salary,
    notes: isTwoWay ? ["Two-Way Contract"] : [],
    seasons: [
      {
        season: startYear,
        baseSalary: salary,
        capHit: isTwoWay ? 0 : salary,
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
  const teamHistory = buildTeamHistoryFromCareerSeasons(careerSeasons.regular);
  return {
    ...detail,
    careerSeasons,
    ...(teamHistory.length > 0 ? { teamHistory } : {}),
  };
}

export function applyPlayerGameLogsToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  gameLogs: NbaPlayerGameLog[] | null | undefined
): NbaPlayerDetailPreview {
  if (!gameLogs || gameLogs.length === 0) return detail;
  const { venueSplits, vsOpponentSamples } =
    buildPlayerSplitsFromGameLogs(gameLogs);
  return {
    ...detail,
    gameLogs: gameLogs.slice(0, GAME_LOG_UI_LIMIT),
    venueSplits,
    vsOpponentSamples,
  };
}

export function applyPlayerShotZonesToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  shotZones: NbaPlayerShotZone[] | null | undefined
): NbaPlayerDetailPreview {
  if (!shotZones || shotZones.length === 0) return detail;
  return { ...detail, shotZones };
}

/** 選手単位メトリクス（全順位）で詳細の値・順位を上書き */
export function applyPlayerSeasonMetricsToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  metrics:
    | Partial<Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>>
    | null
    | undefined,
  gamesPlayed?: number | null
): NbaPlayerDetailPreview {
  if (!metrics || Object.keys(metrics).length === 0) return detail;

  const season = { ...detail.season };
  if (gamesPlayed != null && gamesPlayed > 0) {
    season.gamesPlayed = gamesPlayed;
  }
  const patch = (
    key: keyof typeof season,
    metric: NbaPlayerLeaderMetricId
  ) => {
    const cell = metrics[metric];
    if (cell) (season as Record<string, number>)[key] = cell.value;
  };
  patch("pts", "pts");
  patch("reb", "reb");
  patch("ast", "ast");
  patch("stl", "stl");
  patch("blk", "blk");
  patch("tov", "tov");
  patch("min", "min");
  patch("fgPct", "fg_pct");
  patch("fg3Pct", "fg3_pct");
  patch("ftPct", "ft_pct");
  patch("fga", "fga");
  patch("fg3m", "fg3m");
  patch("fg3a", "fg3a");

  const seasonMetrics = detail.seasonMetrics.map((m) => {
    const leaderId = SEASON_TO_LEADER[m.id];
    if (!leaderId) return m;
    const cell = metrics[leaderId];
    if (!cell) return m;
    return {
      ...m,
      value: cell.value,
      display: formatPlayerLeaderValue(leaderId, cell.value),
      leagueRank: cell.rank,
    };
  });

  const headlineMetrics = detail.headlineMetrics.map((m) => {
    const hit = seasonMetrics.find((x) => x.id === m.id);
    return hit ?? m;
  });

  const advancedMetrics = detail.advancedMetrics.map((m) => {
    if (!isPlayerAdvancedLeaderMetric(m.id)) return m;
    const cell = metrics[m.id];
    if (!cell) return m;
    return {
      ...m,
      value: cell.value,
      display: formatPlayerLeaderValue(m.id, cell.value),
      leagueRank: cell.rank,
    };
  });

  return {
    ...detail,
    season,
    seasonMetrics,
    headlineMetrics,
    advancedMetrics,
    leaderMetrics: metrics,
  };
}

export function availabilityFromInjury(
  entry: NbaTeamInjuryEntry | null | undefined
): NbaPlayerAvailability {
  if (!entry) return { status: "active", reason: null, returnEstimate: null };
  return {
    status: teamInjuryStatusToAvailability(entry.status),
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

/** ユーザー提供の賞データ（取込済み分）を awards に反映 */
export function applyCuratedPlayerAwardsToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  playerId?: string | null
): NbaPlayerDetailPreview {
  const id = String(playerId ?? detail.playerId ?? "").trim();
  if (!id) return detail;
  return {
    ...detail,
    awards: mergeCuratedPlayerAwards(detail.awards, id),
  };
}
