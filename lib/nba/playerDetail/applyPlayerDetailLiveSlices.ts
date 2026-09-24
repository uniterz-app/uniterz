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
import { isCuratedTwoWayPlayer } from "@/lib/nba/contracts/nbaTwoWayPlayersBySeason";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";
import { buildTeamHistoryFromCareerSeasons } from "@/lib/nba/playerDetail/buildTeamHistoryFromCareerSeasons";
import { buildPlayerSplitsFromGameLogs } from "@/lib/nba/playerDetail/buildPlayerSplitsFromGameLogs";
import { mergeCuratedPlayerAwards } from "@/lib/nba/playerAwards/nbaPlayerAwardSeasonWinners";
import {
  CAREER_CHAMPIONSHIP_AWARD_ID,
  countCareerChampionships,
} from "@/lib/nba/playerAwards/playerCareerSeasonAwards";
import { NBA_PLAYER_AWARD_LABEL_BY_ID } from "@/lib/nba/playerAwards/nbaPlayerAwardCatalog";
import type { NbaPlayerAward } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
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
  fta: "fta",
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
    fta: player.fta ?? detail.season.fta,
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
  teamId: string,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): NbaPlayerContractSummary {
  const startYear = Number.parseInt(seasonKey.slice(0, 4), 10);
  const cash =
    line.baseSalary != null && line.baseSalary > 0
      ? Math.round(line.baseSalary)
      : Math.max(0, Math.round(line.salary || 0));
  /**
   * Two-Way の正は curated。
   * `isNonGuaranteed === false` かつ isTwoWay は ingest が明示したときのみ。
   * 旧 `$0→isTwoWay` ヒューリスティック（isNonGuaranteed 未設定）は Exhibit 10 扱い。
   */
  const tw =
    isCuratedTwoWayPlayer(line.playerId, seasonKey) ||
    (line.isTwoWay === true && line.isNonGuaranteed === false);
  const isNonGuaranteed = !tw && (line.isNonGuaranteed === true || cash <= 0);
  const salary = tw
    ? nbaTwoWaySalaryForSeason(seasonKey)
    : isNonGuaranteed
      ? 0
      : cash;
  return {
    contractType: tw ? "Two-Way" : isNonGuaranteed ? "Exhibit 10" : "—",
    contractStatus: "Active",
    contractYears: 1,
    yearsRemaining: 1,
    freeAgencyYear: startYear + 1,
    freeAgencyType: null,
    averageSalary: salary,
    totalValue: salary,
    remainingGuaranteed: tw || isNonGuaranteed ? 0 : salary,
    notes: tw
      ? ["Two-Way Contract"]
      : isNonGuaranteed
        ? ["Exhibit 10 / non-guaranteed"]
        : [],
    seasons: [
      {
        season: startYear,
        baseSalary: salary,
        capHit: tw || isNonGuaranteed ? 0 : salary,
        salaryRank: 0,
        teamId,
        teamAbbr: TEAM_SHORT[teamId] ?? "NBA",
        option: line.option ?? null,
      },
    ],
  };
}

/** 複数年契約もペイロール行も無いがロスターにいる（キャンプ／非保証など） */
export function contractFromRosterPresence(
  teamId: string,
  player: Pick<NbaRosterPlayer, "id" | "position">,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): NbaPlayerContractSummary {
  const startYear = Number.parseInt(seasonKey.slice(0, 4), 10);
  const pos = String(player.position ?? "").toLowerCase();
  const isTwoWay =
    isCuratedTwoWayPlayer(player.id, seasonKey) ||
    pos.includes("two-way") ||
    pos.includes("2-way");
  const salary = isTwoWay ? nbaTwoWaySalaryForSeason(seasonKey) : 0;
  return {
    contractType: isTwoWay ? "Two-Way" : "Exhibit 10",
    contractStatus: "Active",
    contractYears: 1,
    yearsRemaining: 1,
    freeAgencyYear: startYear + 1,
    freeAgencyType: null,
    averageSalary: salary,
    totalValue: salary,
    remainingGuaranteed: 0,
    notes: isTwoWay
      ? ["Two-Way Contract"]
      : ["Exhibit 10 / non-guaranteed"],
    seasons: [
      {
        season: startYear,
        baseSalary: salary,
        capHit: 0,
        salaryRank: 0,
        teamId,
        teamAbbr: TEAM_SHORT[teamId] ?? "NBA",
        option: null,
      },
    ],
  };
}

/** 詳細に採用できる複数年契約か（満了・空 seasons は不可） */
export function isUsablePlayerContract(
  contract: NbaPlayerContractSummary | null | undefined
): boolean {
  if (!contract || contract.seasons.length === 0) return false;
  if (contract.yearsRemaining <= 0) return false;
  const status = String(contract.contractStatus ?? "").toLowerCase();
  if (status.includes("expired")) return false;
  return true;
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
  if (!contract) return detail;
  const hasSeasons = contract.seasons.length > 0;
  const hasDead = (contract.deadSalary?.salary ?? 0) > 0;
  if (!hasSeasons && !hasDead) return detail;
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
    | undefined,
  bio?: {
    playerName?: string | null;
    position?: string | null;
    jerseyNumber?: string | null;
    height?: string | null;
    weight?: string | null;
    country?: string | null;
    college?: string | null;
    draftYear?: number | null;
    draftRound?: number | null;
    draftNumber?: number | null;
  } | null
): NbaPlayerDetailPreview {
  if (!careerSeasons) return detail;
  if (
    careerSeasons.regular.length === 0 &&
    careerSeasons.playoffs.length === 0
  ) {
    return detail;
  }
  const teamHistory = buildTeamHistoryFromCareerSeasons(careerSeasons.regular);
  let next: NbaPlayerDetailPreview = {
    ...detail,
    careerSeasons,
    ...(teamHistory.length > 0 ? { teamHistory } : {}),
  };

  if (bio) {
    const name = String(bio.playerName ?? "").trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      next = {
        ...next,
        firstName: parts[0] ?? next.firstName,
        lastName:
          parts.length > 1 ? parts.slice(1).join(" ") : next.lastName,
      };
    }
    if (bio.position?.trim()) next = { ...next, position: bio.position.trim() };
    if (bio.jerseyNumber?.trim()) {
      next = { ...next, jerseyNumber: bio.jerseyNumber.replace(/^#/, "") };
    }
    if (bio.height?.trim()) next = { ...next, height: bio.height.trim() };
    if (bio.weight?.trim()) next = { ...next, weight: bio.weight.trim() };
    if (bio.country?.trim()) next = { ...next, country: bio.country.trim() };
    if (bio.college !== undefined) {
      const college = String(bio.college ?? "").trim();
      next = { ...next, college: college || null };
    }
    if (bio.draftYear != null && Number.isFinite(bio.draftYear)) {
      next = { ...next, draftYear: Math.trunc(bio.draftYear) };
    }
    if (bio.draftRound != null && Number.isFinite(bio.draftRound)) {
      next = { ...next, draftRound: Math.trunc(bio.draftRound) };
    }
    if (bio.draftNumber != null && Number.isFinite(bio.draftNumber)) {
      next = { ...next, draftNumber: Math.trunc(bio.draftNumber) };
    }
  }

  const seasonStart = Number.parseInt(CURRENT_NBA_SEASON_KEY.slice(0, 4), 10);
  if (
    next.draftYear != null &&
    Number.isFinite(next.draftYear) &&
    Number.isFinite(seasonStart)
  ) {
    next = {
      ...next,
      experienceYears: Math.max(0, seasonStart - next.draftYear),
    };
  } else if (careerSeasons.regular.length > 0) {
    next = {
      ...next,
      experienceYears: careerSeasons.regular.length,
    };
  }

  return next;
}

/**
 * 今季ロスターにいない選手（引退・FA 等）。
 * leaders / career から名前・最終所属を埋め、availability を retired にする。
 * 今季スタッツ・injury は空のまま（空 NO DATA を無理に出さない前提は UI 側）。
 */
export function applyOffRosterPlayerToPlayerDetail(
  detail: NbaPlayerDetailPreview,
  opts?: {
    fromLeaders?: {
      playerName: string;
      teamId: string;
      conference?: NbaPlayerDetailPreview["conference"];
    } | null;
    /** career / league-stats / awards 由来の氏名 */
    playerName?: string | null;
  }
): NbaPlayerDetailPreview {
  const fromLeaders = opts?.fromLeaders ?? null;
  let next: NbaPlayerDetailPreview = {
    ...detail,
    availability: {
      status: "retired",
      reason: null,
      returnEstimate: null,
    },
  };

  const nameHint =
    fromLeaders?.playerName?.trim() ||
    String(opts?.playerName ?? "").trim() ||
    "";
  if (nameHint) {
    const parts = nameHint.split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? detail.firstName;
    const lastName =
      parts.length > 1 ? parts.slice(1).join(" ") : detail.lastName;
    next = { ...next, firstName, lastName };
  }

  const historyTeam = detail.teamHistory?.[detail.teamHistory.length - 1];
  const teamId =
    (detail.teamId || "").trim() ||
    fromLeaders?.teamId?.trim() ||
    historyTeam?.teamId ||
    "";
  if (teamId) {
    next = {
      ...next,
      teamId,
      teamAbbr: TEAM_SHORT[teamId] ?? historyTeam?.teamAbbr ?? next.teamAbbr,
      teamName: NBA_TEAM_NAME_BY_ID[teamId] ?? next.teamName,
      conference:
        fromLeaders?.conference ??
        nbaConferenceForTeam(teamId) ??
        next.conference,
    };
  }

  // 空の "—" 名前だけだと開けても読めないので、最低限 playerId を残す
  if (
    (next.firstName === "—" || !next.firstName.trim()) &&
    (next.lastName === "—" || !next.lastName.trim())
  ) {
    next = {
      ...next,
      firstName: "Player",
      lastName: next.playerId,
    };
  }

  // 引退勢の象徴背番号（BDL の最終所属番号より優先）
  const iconicJersey: Record<string, string> = {
    "472": "0", // Russell Westbrook
    "367": "3", // Chris Paul
  };
  const iconic = iconicJersey[next.playerId];
  if (iconic) next = { ...next, jerseyNumber: iconic };

  return next;
}

/**
 * キャリア ingest 前のトレードで、経歴の最終 stint が旧チームのまま残るのをロスターで補正。
 */
export function syncTeamHistoryWithCurrentRoster(
  detail: NbaPlayerDetailPreview,
  hit: PlayerRosterHit
): NbaPlayerDetailPreview {
  const teamId = hit.teamId.trim();
  if (!teamId) return detail;
  const teamAbbr = TEAM_SHORT[teamId] ?? detail.teamAbbr;
  const seasonStart = Number.parseInt(CURRENT_NBA_SEASON_KEY.slice(0, 4), 10);
  if (!Number.isFinite(seasonStart)) return detail;

  const history = detail.teamHistory ?? [];
  if (history.length === 0) {
    return {
      ...detail,
      teamHistory: [
        { teamId, teamAbbr, fromSeason: seasonStart, toSeason: null },
      ],
    };
  }

  const last = history[history.length - 1]!;
  if (last.teamId === teamId) return detail;

  const closedTo = last.toSeason ?? Math.max(last.fromSeason, seasonStart - 1);
  return {
    ...detail,
    teamHistory: [
      ...history.slice(0, -1),
      { ...last, toSeason: closedTo },
      { teamId, teamAbbr, fromSeason: seasonStart, toSeason: null },
    ],
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
  patch("fta", "fta");

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
  const awards = mergeChampionshipIntoAwards(
    mergeCuratedPlayerAwards(detail.awards, id),
    detail.careerSeasons
  );
  return {
    ...detail,
    awards,
  };
}

/**
 * Champion 回数はレギュラー／プレーオフ在籍の和集合。
 * プレーオフ未出場でも優勝チームに在籍していれば数える（例: Kevon Looney）。
 */
function mergeChampionshipIntoAwards(
  awards: NbaPlayerAward[],
  careerSeasons: NbaPlayerDetailPreview["careerSeasons"] | null | undefined
): NbaPlayerAward[] {
  const rows = [
    ...(careerSeasons?.regular ?? []),
    ...(careerSeasons?.playoffs ?? []),
  ];
  const count = countCareerChampionships(rows);
  const without = awards.filter((a) => a.id !== CAREER_CHAMPIONSHIP_AWARD_ID);
  if (count <= 0) return without;
  const champ: NbaPlayerAward = {
    id: CAREER_CHAMPIONSHIP_AWARD_ID,
    label: NBA_PLAYER_AWARD_LABEL_BY_ID.championship,
    count,
  };
  return [champ, ...without];
}
