/**
 * チーム詳細の寄せ読み（Firestore のみ）。
 * 公開 API /api/nba/team-detail が使う。
 *
 * クライアントは 1 fetch。CDN も team+season の 1 URL に集約。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY, previousNbaSeasonKey } from "@/lib/rankings/nbaSeason";
import { loadTeamRosterSlice } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { buildMatchupRosterReport } from "@/lib/nba/teamRosters/buildMatchupRosterReport";
import { loadTeamPayroll } from "@/lib/nba/teamPayroll/loadTeamPayrollSnapshot";
import { loadTeamGameLog } from "@/lib/nba/teamGameLog/loadTeamGameLog";
import { loadTeamInjury } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import { loadNbaConferenceStandings } from "@/lib/nba/standings/loadNbaConferenceStandings";
import { findNbaConferenceStandingsRow } from "@/lib/nba/standings/findNbaConferenceStandingsRow";
import { loadTeamSeasonRecordsApiPayload } from "@/lib/nba/insights/loadTeamSeasonRecordsApi";
import { loadTeamAceOutRecordsApiPayload } from "@/lib/nba/insights/loadAceOutRecordsApi";
import { loadTeamShapeRecordsApiPayload } from "@/lib/nba/teamShapes/loadTeamShapeRecordsApi";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import type { NbaRosterTeamBlock } from "@/lib/predict/nbaRoster";
import type {
  NbaTeamInjuryEntry,
  NbaTeamPayroll,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaConferenceStandingsRow } from "@/lib/nba/nbaConferenceStandings";
import type { NbaTeamGameLogSlice } from "@/lib/nba/teamGameLog/teamGameLogTypes";
import type { NbaTeamAceOutRecord } from "@/lib/nba/insights/aceOutRecordTypes";
import type { NbaTeamStrengthSplit } from "@/lib/nba/insights/fetchTeamStrengthSplitClient";
import type { NbaTeamDetailShapeEdges } from "@/lib/nba/teamShapes/fetchTeamShapeEdgesClient";

export type NbaTeamDetailApiPayload = {
  ok: true;
  season: string;
  teamId: string;
  rosterBlock: NbaRosterTeamBlock | null;
  payroll: NbaTeamPayroll | null;
  gameLog: NbaTeamGameLogSlice | null;
  standingsRow: NbaConferenceStandingsRow | null;
  injuries: NbaTeamInjuryEntry[];
  strengthSplit: NbaTeamStrengthSplit;
  aceOut: NbaTeamAceOutRecord | null;
  shapeEdges: NbaTeamDetailShapeEdges;
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

function emptyStrength(): NbaTeamStrengthSplit {
  return {
    vsOver500: { wins: 0, losses: 0 },
    vsUnder500: { wins: 0, losses: 0 },
  };
}

function emptyShapeEdges(season: string): NbaTeamDetailShapeEdges {
  return { season, fromPriorSeason: false, edges: [] };
}

function edgesFromShapePayload(
  payload: Awaited<ReturnType<typeof loadTeamShapeRecordsApiPayload>>,
  teamId: string,
  season: string,
  fromPriorSeason: boolean
): NbaTeamDetailShapeEdges {
  const row = payload.teams.find((t) => t.teamId === teamId);
  if (!row?.edges?.length) return emptyShapeEdges(season);
  return {
    season,
    fromPriorSeason,
    edges: row.edges.map((e) => ({
      kind: e.kind,
      shapeId: e.shapeId,
      labelEn: e.labelEn,
      labelJa: e.labelJa,
      conditionEn: e.conditionEn,
      conditionJa: e.conditionJa,
      when: e.when,
      games: e.games,
      winPct: e.winPct,
      deltaWinPct: e.deltaWinPct,
    })),
  };
}

async function loadShapeEdgesWithPriorFallback(
  db: Firestore,
  season: string,
  teamId: string
): Promise<{
  shapeEdges: NbaTeamDetailShapeEdges;
  source: NbaStatsSnapshotSource;
  updatedAt: string | null;
}> {
  const current = await loadTeamShapeRecordsApiPayload(db, season, teamId);
  const currentEdges = edgesFromShapePayload(current, teamId, season, false);
  if (currentEdges.edges.length > 0) {
    return {
      shapeEdges: currentEdges,
      source: current.source === "firestore" ? "firestore" : "empty",
      updatedAt:
        typeof current.builtAtMs === "number" && current.builtAtMs > 0
          ? new Date(current.builtAtMs).toISOString()
          : null,
    };
  }

  const prior = previousNbaSeasonKey(season);
  const priorPayload = await loadTeamShapeRecordsApiPayload(db, prior, teamId);
  const priorEdges = edgesFromShapePayload(priorPayload, teamId, prior, true);
  return {
    shapeEdges: priorEdges,
    source: priorPayload.source === "firestore" ? "firestore" : "empty",
    updatedAt:
      typeof priorPayload.builtAtMs === "number" && priorPayload.builtAtMs > 0
        ? new Date(priorPayload.builtAtMs).toISOString()
        : null,
  };
}

export async function loadTeamDetailBundle(
  db: Firestore,
  opts: { teamId: string; seasonKey?: string }
): Promise<NbaTeamDetailApiPayload> {
  const teamId = String(opts.teamId ?? "").trim();
  const season = (opts.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();

  const [
    rosterSlice,
    payrollPayload,
    gameLogPayload,
    standingsPayload,
    injuryPayload,
    seasonRecords,
    aceOutPayload,
    shapes,
  ] = await Promise.all([
    loadTeamRosterSlice(db, season, teamId),
    loadTeamPayroll(db, season, teamId),
    loadTeamGameLog(db, season, teamId),
    loadNbaConferenceStandings(db, season),
    loadTeamInjury(db, season, teamId),
    loadTeamSeasonRecordsApiPayload(db, season),
    loadTeamAceOutRecordsApiPayload(db, season),
    loadShapeEdgesWithPriorFallback(db, season, teamId),
  ]);

  let rosterBlock: NbaRosterTeamBlock | null = null;
  const team = rosterSlice.team;
  if (team) {
    const report = buildMatchupRosterReport(teamId, teamId, team, team);
    rosterBlock = report?.home ?? null;
  }

  const standingsRow = findNbaConferenceStandingsRow(
    standingsPayload.board,
    teamId
  );

  const seasonRow = seasonRecords.teams.find((t) => t.teamId === teamId);
  const strengthSplit: NbaTeamStrengthSplit = seasonRow
    ? {
        vsOver500: {
          wins: seasonRow.vsOver500?.wins ?? 0,
          losses: seasonRow.vsOver500?.losses ?? 0,
        },
        vsUnder500: {
          wins: seasonRow.vsUnder500?.wins ?? 0,
          losses: seasonRow.vsUnder500?.losses ?? 0,
        },
      }
    : emptyStrength();

  const aceRow = aceOutPayload.teams.find((t) => t.teamId === teamId) ?? null;

  const sources: Array<NbaStatsSnapshotSource | string | undefined> = [
    rosterSlice.source,
    payrollPayload.source,
    gameLogPayload.source,
    standingsPayload.source === "firestore" ? "firestore" : "empty",
    injuryPayload.source,
    seasonRecords.source,
    aceOutPayload.source,
    shapes.source,
  ];
  const source: NbaStatsSnapshotSource = sources.some((s) => s === "firestore")
    ? "firestore"
    : "empty";

  return {
    ok: true,
    season,
    teamId,
    rosterBlock,
    payroll: payrollPayload.payroll,
    gameLog: gameLogPayload.log,
    standingsRow,
    injuries: injuryPayload.injuries ?? [],
    strengthSplit,
    aceOut: aceRow,
    shapeEdges: shapes.shapeEdges,
    source,
    updatedAt: newestIso(
      rosterSlice.updatedAt,
      payrollPayload.updatedAt,
      gameLogPayload.updatedAt,
      standingsPayload.updatedAt,
      injuryPayload.updatedAt,
      seasonRecords.updatedAt,
      aceOutPayload.updatedAt,
      shapes.updatedAt
    ),
  };
}
