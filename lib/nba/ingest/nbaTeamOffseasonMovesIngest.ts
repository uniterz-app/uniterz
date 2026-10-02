/**
 * オフシーズンの動き（IN / OUT）→ Firestore `nbaTeamOffseasonMoves/{season}`。
 *
 * 1. 前季最終所属 `nbaPlayerSeasonFinalTeams/{prior}` — 無ければ（または refresh 時）BDL box から作る
 * 2. 今季ロスター + 今季ペイロール + curated デッドと突き合わせ（Firestore のみ）
 *
 * 日次ではロスター ingest の後に 2 だけ回る（前季分は一度作れば固定）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import { fetchBdlSeasonFinalPlayerTeamMap } from "@/lib/nba/bdl/fetchBdlSeasonPlayerTeamMap";
import { loadTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { loadTeamPayrollsSnapshot } from "@/lib/nba/teamPayroll/loadTeamPayrollSnapshot";
import { curatedDeadMoneyForTeam } from "@/lib/nba/teamPayroll/nbaCuratedDeadMoney";
import { buildTeamOffseasonMoves } from "@/lib/nba/offseasonMoves/buildTeamOffseasonMoves";
import {
  loadPlayerSeasonFinalTeams,
  writePlayerSeasonFinalTeams,
  writeTeamOffseasonMoves,
} from "@/lib/nba/offseasonMoves/loadOffseasonMovesSnapshot";
import type { NbaPlayerSeasonFinalTeam } from "@/lib/nba/offseasonMoves/offseasonMovesTypes";

export type NbaTeamOffseasonMovesIngestInput = {
  seasonKey?: string;
  /** 前季最終所属を BDL から取り直す */
  refreshPriorFinalTeams?: boolean;
};

export type NbaTeamOffseasonMovesIngestResult = {
  ok: true;
  seasonKey: string;
  priorSeasonKey: string;
  priorFinalSource: "firestore" | "bdl";
  priorPlayerCount: number;
  teamCount: number;
  incomingCount: number;
  outgoingCount: number;
};

async function loadOrBuildPriorFinal(
  db: Firestore,
  priorSeasonKey: string,
  refresh: boolean
): Promise<{
  players: Record<string, NbaPlayerSeasonFinalTeam>;
  source: "firestore" | "bdl";
}> {
  if (!refresh) {
    const existing = await loadPlayerSeasonFinalTeams(db, priorSeasonKey);
    if (existing && existing.playerCount > 0) {
      return { players: existing.players, source: "firestore" };
    }
  }
  const seasonYear = Number.parseInt(priorSeasonKey.slice(0, 4), 10);
  const map = await fetchBdlSeasonFinalPlayerTeamMap({ seasonYear });
  const players: Record<string, NbaPlayerSeasonFinalTeam> = {};
  for (const [id, row] of map) {
    players[id] = {
      teamId: row.teamId,
      firstName: row.firstName,
      lastName: row.lastName,
      lastGameDate: row.lastGameDate,
    };
  }
  if (Object.keys(players).length === 0) {
    throw new Error(`no BDL box rows for ${priorSeasonKey}`);
  }
  await writePlayerSeasonFinalTeams(
    db,
    priorSeasonKey,
    players,
    FieldValue.serverTimestamp()
  );
  return { players, source: "bdl" };
}

export async function ingestNbaTeamOffseasonMoves(
  db: Firestore,
  input: NbaTeamOffseasonMovesIngestInput = {}
): Promise<NbaTeamOffseasonMovesIngestResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const priorSeasonKey = previousNbaSeasonKey(seasonKey);

  const [prior, rosters, payrolls] = await Promise.all([
    loadOrBuildPriorFinal(db, priorSeasonKey, input.refreshPriorFinalTeams === true),
    loadTeamRostersSnapshot(db, seasonKey),
    loadTeamPayrollsSnapshot(db, seasonKey),
  ]);

  const currentRosters = rosters.bundle.teams;
  if (Object.keys(currentRosters).length === 0) {
    throw new Error(`no roster snapshot for ${seasonKey}`);
  }

  const salaryByPlayer = new Map<string, number>();
  for (const team of Object.values(payrolls.bundle.teams)) {
    for (const line of team.lines ?? []) {
      const cap = Number(line.capHit ?? line.salary) || 0;
      if (cap > 0) salaryByPlayer.set(String(line.playerId), cap);
    }
  }

  const deadTeamByPlayer = new Map<string, string>();
  for (const teamId of Object.keys(currentRosters)) {
    for (const line of curatedDeadMoneyForTeam(seasonKey, teamId)) {
      deadTeamByPlayer.set(String(line.playerId), teamId);
    }
  }

  const doc = buildTeamOffseasonMoves({
    seasonKey,
    priorSeasonKey,
    priorFinal: prior.players,
    currentRosters,
    salaryByPlayer,
    deadTeamByPlayer,
  });
  await writeTeamOffseasonMoves(db, doc, FieldValue.serverTimestamp());

  let incomingCount = 0;
  let outgoingCount = 0;
  for (const t of Object.values(doc.teams)) {
    incomingCount += t.incoming.length;
    outgoingCount += t.outgoing.length;
  }

  return {
    ok: true,
    seasonKey,
    priorSeasonKey,
    priorFinalSource: prior.source,
    priorPlayerCount: Object.keys(prior.players).length,
    teamCount: Object.keys(doc.teams).length,
    incomingCount,
    outgoingCount,
  };
}
