/**
 * プレイヤー詳細の寄せ読み（Firestore のみ）。
 * 公開 API /api/nba/player-detail が使う。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { resolveNbaStatsDisplaySeasonKey, resolveNbaRosterInjuryDisplaySeasonKey } from "@/lib/nba/resolveNbaStatsDisplaySeason";
import { loadPlayerRosterHit } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { loadTeamInjury } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import { loadPlayerContract } from "@/lib/nba/playerDetail/loadPlayerContract";
import { loadPlayerCareerSeasons } from "@/lib/nba/playerDetail/loadPlayerCareerSeasons";
import { loadPlayerGameLogs } from "@/lib/nba/playerDetail/loadPlayerGameLogs";
import { loadPlayerShotZones } from "@/lib/nba/playerDetail/loadPlayerShotZones";
import { loadPlayerSeasonMetricsSnapshot } from "@/lib/nba/playerSeasonMetrics/loadPlayerSeasonMetricsSnapshot";
import type { NbaPlayerRosterHitApiPayload } from "@/lib/nba/teamRosters/teamRosterTypes";
import type { NbaTeamInjuryApiPayload } from "@/lib/nba/teamInjuries/teamInjuryTypes";
import type { NbaPlayerContractApiPayload } from "@/lib/nba/playerContract/playerContractTypes";
import type { NbaPlayerCareerSeasonsApiPayload } from "@/lib/nba/playerCareerSeasons/playerCareerSeasonsTypes";
import type { NbaPlayerGameLogsApiPayload } from "@/lib/nba/playerGameLogs/playerGameLogsTypes";
import type { NbaPlayerShotZonesApiPayload } from "@/lib/nba/playerShotZones/playerShotZonesTypes";
import type { NbaPlayerSeasonMetricsApiPayload } from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import { loadOffRosterIdentityFromLeagueStats } from "@/lib/nba/playerDetail/loadOffRosterIdentityFromLeagueStats";
import type { OffRosterPlayerIdentity } from "@/lib/nba/playerDetail/resolveOffRosterPlayerIdentity";
import { loadTeamPayroll } from "@/lib/nba/teamPayroll/loadTeamPayrollSnapshot";
import {
  contractFromPayrollLine,
  contractFromRosterPresence,
  isUsablePlayerContract,
} from "@/lib/nba/playerDetail/applyPlayerDetailLiveSlices";
import { playerIdLookupSet } from "@/lib/nba/playerIdAliases";
import { isCuratedTwoWayPlayer } from "@/lib/nba/contracts/nbaTwoWayPlayersBySeason";
import {
  curatedDeadSalaryForPlayer,
  isCuratedExhibit10Player,
} from "@/lib/nba/teamPayroll/nbaCuratedDeadMoney";
import { TEAM_SHORT } from "@/lib/team-short";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import type { NbaPlayerContractSummary } from "@/lib/predict/nbaPlayerDetailPreviewMocks";

export type NbaPlayerDetailApiPayload = {
  ok: true;
  season: string;
  playerId: string;
  roster: NbaPlayerRosterHitApiPayload;
  injury: NbaTeamInjuryApiPayload | null;
  contract: NbaPlayerContractApiPayload;
  careerSeasons: NbaPlayerCareerSeasonsApiPayload;
  gameLogs: NbaPlayerGameLogsApiPayload;
  shotZones: NbaPlayerShotZonesApiPayload;
  seasonMetrics: NbaPlayerSeasonMetricsApiPayload;
  /** ロスター外の氏名・最終所属（リーグ表 players から） */
  offRosterIdentity: OffRosterPlayerIdentity | null;
  source: NbaStatsSnapshotSource;
  updatedAt: string | null;
};

function newestIso(...vals: Array<string | null | undefined>): string | null {
  let best: string | null = null;
  let bestMs = -1;
  for (const v of vals) {
    if (!v) continue;
    const ms = Date.parse(v);
    if (!Number.isFinite(ms)) continue;
    if (ms > bestMs) {
      bestMs = ms;
      best = v;
    }
  }
  return best;
}

export async function loadPlayerDetailBundle(
  db: Firestore,
  opts: { playerId: string; seasonKey?: string }
): Promise<NbaPlayerDetailApiPayload> {
  const playerId = String(opts.playerId ?? "").trim();
  const preferred = opts.seasonKey ?? CURRENT_NBA_SEASON_KEY;
  const [statsDisplay, liveDisplay] = await Promise.all([
    resolveNbaStatsDisplaySeasonKey(db, preferred),
    resolveNbaRosterInjuryDisplaySeasonKey(db, preferred),
  ]);
  const statsSeason = statsDisplay.seasonKey;
  const liveSeason = liveDisplay.seasonKey;

  const roster = await loadPlayerRosterHit(db, liveSeason, playerId);
  const teamId = roster.hit?.teamId ?? "";
  const offRoster = !roster.hit;

  const [
    injury,
    contractRaw,
    careerSeasons,
    gameLogs,
    shotZones,
    seasonMetrics,
    offRosterIdentity,
    payroll,
  ] = await Promise.all([
    teamId
      ? loadTeamInjury(db, liveSeason, teamId)
      : Promise.resolve(null as NbaTeamInjuryApiPayload | null),
    offRoster
      ? loadPlayerContract(db, { playerId, seasonKey: liveSeason }).catch(
          () =>
            ({
              ok: true as const,
              season: liveSeason,
              playerId,
              contract: null,
              source: "empty" as const,
              updatedAt: null,
            }) satisfies NbaPlayerContractApiPayload
        )
      : loadPlayerContract(db, { playerId, seasonKey: liveSeason }),
    loadPlayerCareerSeasons(db, {
      playerId,
      seasonKey: liveSeason,
    }),
    offRoster
      ? Promise.resolve({
          ok: true as const,
          season: statsSeason,
          playerId,
          gameLogs: [],
          source: "empty" as const,
          updatedAt: null,
        } satisfies NbaPlayerGameLogsApiPayload)
      : loadPlayerGameLogs(db, { playerId, seasonKey: statsSeason }),
    offRoster
      ? Promise.resolve({
          ok: true as const,
          season: statsSeason,
          playerId,
          shotZones: [],
          source: "empty" as const,
          updatedAt: null,
        } satisfies NbaPlayerShotZonesApiPayload)
      : loadPlayerShotZones(db, { playerId, seasonKey: statsSeason }),
    offRoster
      ? Promise.resolve({
          ok: true as const,
          season: statsSeason,
          playerId,
          teamId: null,
          gamesPlayed: 0,
          metrics: {},
          source: "empty" as const,
          updatedAt: null,
        } satisfies NbaPlayerSeasonMetricsApiPayload)
      : loadPlayerSeasonMetricsSnapshot(db, statsSeason, playerId),
    offRoster
      ? loadOffRosterIdentityFromLeagueStats(db, playerId)
      : Promise.resolve(null),
    teamId
      ? loadTeamPayroll(db, liveSeason, teamId)
      : Promise.resolve(null),
  ]);

  let contract = contractRaw;
  const curatedTw =
    Boolean(roster.hit) && isCuratedTwoWayPlayer(playerId, liveSeason);
  const curatedE10 =
    Boolean(roster.hit) && isCuratedExhibit10Player(playerId, liveSeason);
  if (
    roster.hit &&
    (curatedTw || curatedE10 || !isUsablePlayerContract(contractRaw.contract))
  ) {
    const aliases = new Set(playerIdLookupSet(playerId));
    const line =
      payroll?.payroll?.lines.find((l) =>
        aliases.has(String(l.playerId ?? "").trim())
      ) ?? null;
    if (line || curatedTw || curatedE10) {
      const resolvedLine = line ?? {
        playerId,
        name: `${roster.hit.player.firstName} ${roster.hit.player.lastName}`.trim(),
        salary: 0,
        share: 0,
        isTwoWay: curatedTw,
        isNonGuaranteed: curatedE10 || !curatedTw,
      };
      contract = {
        ok: true,
        season: liveSeason,
        playerId,
        contract: contractFromPayrollLine(resolvedLine, teamId, liveSeason),
        source:
          line && payroll?.source === "firestore"
            ? "firestore"
            : roster.source,
        updatedAt: (line ? payroll?.updatedAt : null) ?? roster.updatedAt,
      };
    } else {
      contract = {
        ok: true,
        season: liveSeason,
        playerId,
        contract: contractFromRosterPresence(
          teamId,
          roster.hit.player,
          liveSeason
        ),
        source: roster.source,
        updatedAt: roster.updatedAt,
      };
    }
  }

  if (contract.contract) {
    contract = {
      ...contract,
      contract: attachCuratedDeadSalary(
        contract.contract,
        liveSeason,
        playerId
      ),
    };
  } else {
    const deadOnly = buildDeadOnlyContractShell(liveSeason, playerId);
    if (deadOnly) {
      contract = {
        ok: true,
        season: liveSeason,
        playerId,
        contract: deadOnly,
        source: "firestore",
        updatedAt: null,
      };
    }
  }

  const sources = [
    roster.source,
    injury?.source,
    contract.source,
    careerSeasons.source,
    gameLogs.source,
    shotZones.source,
    seasonMetrics.source,
  ];
  const source: NbaStatsSnapshotSource = sources.some((s) => s === "firestore")
    ? "firestore"
    : "empty";

  return {
    ok: true,
    season: statsSeason,
    playerId,
    roster,
    injury,
    contract,
    careerSeasons,
    gameLogs,
    shotZones,
    seasonMetrics,
    offRosterIdentity,
    source,
    updatedAt: newestIso(
      roster.updatedAt,
      injury?.updatedAt,
      contract.updatedAt,
      careerSeasons.updatedAt,
      gameLogs.updatedAt,
      shotZones.updatedAt,
      seasonMetrics.updatedAt
    ),
  };
}

function attachCuratedDeadSalary(
  contract: NbaPlayerContractSummary,
  seasonKey: string,
  playerId: string
): NbaPlayerContractSummary {
  const hit = curatedDeadSalaryForPlayer(seasonKey, playerId);
  if (!hit) {
    if (contract.deadSalary == null) return contract;
    const { deadSalary: _drop, ...rest } = contract;
    return rest;
  }
  const startYear = Number.parseInt(seasonKey.slice(0, 4), 10);
  return {
    ...contract,
    deadSalary: {
      teamId: hit.teamId,
      teamAbbr: TEAM_SHORT[hit.teamId] ?? "NBA",
      salary: hit.line.capHit,
      season: Number.isFinite(startYear) ? startYear : 0,
      ...(hit.line.throughSeasonKey
        ? { throughSeasonKey: hit.line.throughSeasonKey }
        : {}),
      ...(hit.line.noteJa ? { noteJa: hit.line.noteJa } : {}),
      ...(hit.line.noteEn ? { noteEn: hit.line.noteEn } : {}),
    },
  };
}

/** 現行契約なし・デッドのみ（オフロスターのストレッチ等） */
function buildDeadOnlyContractShell(
  seasonKey: string,
  playerId: string
): NbaPlayerContractSummary | null {
  const hit = curatedDeadSalaryForPlayer(seasonKey, playerId);
  if (!hit) return null;
  const startYear = Number.parseInt(seasonKey.slice(0, 4), 10);
  return {
    contractType: "—",
    contractStatus: "Dead Salary",
    contractYears: 0,
    yearsRemaining: 0,
    freeAgencyYear: 0,
    freeAgencyType: null,
    averageSalary: 0,
    totalValue: 0,
    remainingGuaranteed: 0,
    notes: [],
    seasons: [],
    deadSalary: {
      teamId: hit.teamId,
      teamAbbr: TEAM_SHORT[hit.teamId] ?? "NBA",
      salary: hit.line.capHit,
      season: Number.isFinite(startYear) ? startYear : 0,
      ...(hit.line.throughSeasonKey
        ? { throughSeasonKey: hit.line.throughSeasonKey }
        : {}),
      ...(hit.line.noteJa ? { noteJa: hit.line.noteJa } : {}),
      ...(hit.line.noteEn ? { noteEn: hit.line.noteEn } : {}),
    },
  };
}
