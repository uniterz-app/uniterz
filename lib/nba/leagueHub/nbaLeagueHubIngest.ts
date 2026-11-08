/**
 * 既存スナップショット（Firestore のみ）→ `nbaLeagueHub/{seasonKey}`。
 * 日次 / 試合後監視の最後（試合ログ更新後）に回す。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NbaPlayerGameLog, NbaPlayerShotZone } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import { formatNbaPlayerListName } from "@/lib/nba/formatNbaPlayerListName";
import { NBA_TEAM_ROSTERS_COLLECTION } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { NBA_CONFERENCE_STANDINGS_COLLECTION } from "@/lib/nba/standings/loadNbaConferenceStandings";
import { NBA_TEAM_GAME_LOGS_COLLECTION } from "@/lib/nba/teamGameLog/teamGameLogTypes";
import { NBA_TEAM_SHAPE_RECORDS_COLLECTION } from "@/lib/nba/teamShapes/teamShapeTypes";
import { NBA_PLAYER_SHOT_ZONES_COLLECTION } from "@/lib/nba/playerShotZones/playerShotZonesTypes";
import { NBA_PLAYER_SEASON_METRICS_COLLECTION } from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import { NBA_PLAYER_GAME_LOGS_COLLECTION } from "@/lib/nba/playerGameLogs/playerGameLogsTypes";
import {
  buildNbaLeagueHub,
  type LeagueHubMetricsEntry,
  type LeagueHubRosterEntry,
  type LeagueHubStandingsEntry,
  type LeagueHubTeamLogEntry,
} from "@/lib/nba/leagueHub/buildNbaLeagueHub";
import {
  NBA_LEAGUE_HUB_COLLECTION,
  type LeagueHubPositionDefense,
  type LeagueHubRecord,
} from "@/lib/nba/leagueHub/leagueHubTypes";

type Obj = Record<string, unknown>;

function asObj(v: unknown): Obj | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function record(v: unknown): LeagueHubRecord | null {
  const o = asObj(v);
  const w = num(o?.wins);
  const l = num(o?.losses);
  return w != null && l != null ? { wins: w, losses: l } : null;
}

function posGroup(position: unknown): LeagueHubRosterEntry["pos"] {
  const c = String(position ?? "").trim().charAt(0).toUpperCase();
  return c === "G" || c === "F" || c === "C" ? c : null;
}

async function loadRoster(db: Firestore, seasonKey: string) {
  const out = new Map<string, LeagueHubRosterEntry>();
  const snap = await db.collection(NBA_TEAM_ROSTERS_COLLECTION).doc(seasonKey).get();
  const teams = asObj(snap.data()?.teams) ?? {};
  for (const [teamId, raw] of Object.entries(teams)) {
    const players = Array.isArray(asObj(raw)?.players) ? (asObj(raw)!.players as Obj[]) : [];
    for (const p of players) {
      const id = String(p.id ?? "").trim();
      if (!id) continue;
      const full = `${String(p.firstName ?? "")} ${String(p.lastName ?? "")}`.trim();
      out.set(id, {
        name: formatNbaPlayerListName(full, id),
        teamId,
        pos: posGroup(p.position),
        draftYear: num(p.draftYear),
      });
    }
  }
  return out;
}

async function loadMetrics(db: Firestore, seasonKey: string) {
  const out = new Map<string, LeagueHubMetricsEntry>();
  const snap = await db
    .collection(NBA_PLAYER_SEASON_METRICS_COLLECTION)
    .doc(seasonKey)
    .collection("players")
    .get();
  for (const d of snap.docs) {
    const data = d.data();
    const values: Record<string, number> = {};
    for (const [k, cell] of Object.entries(asObj(data.metrics) ?? {})) {
      const v = num(asObj(cell)?.value);
      if (v != null) values[k] = v;
    }
    out.set(d.id, {
      teamId: typeof data.teamId === "string" ? data.teamId : null,
      gp: num(data.gamesPlayed) ?? 0,
      values,
    });
  }
  return out;
}

async function loadShotZones(db: Firestore, seasonKey: string) {
  const out = new Map<string, NbaPlayerShotZone[]>();
  const snap = await db
    .collection(NBA_PLAYER_SHOT_ZONES_COLLECTION)
    .doc(seasonKey)
    .collection("players")
    .get();
  for (const d of snap.docs) {
    const zones = d.data().shotZones;
    if (Array.isArray(zones)) out.set(d.id, zones as NbaPlayerShotZone[]);
  }
  return out;
}

async function loadGameLogs(db: Firestore, seasonKey: string) {
  const out = new Map<string, { teamId: string | null; logs: NbaPlayerGameLog[] }>();
  const snap = await db
    .collection(NBA_PLAYER_GAME_LOGS_COLLECTION)
    .doc(seasonKey)
    .collection("players")
    .get();
  for (const d of snap.docs) {
    const data = d.data();
    out.set(d.id, {
      teamId: typeof data.teamId === "string" ? data.teamId : null,
      logs: Array.isArray(data.gameLogs) ? (data.gameLogs as NbaPlayerGameLog[]) : [],
    });
  }
  return out;
}

async function loadStandings(db: Firestore, seasonKey: string): Promise<LeagueHubStandingsEntry[]> {
  const snap = await db.collection(NBA_CONFERENCE_STANDINGS_COLLECTION).doc(seasonKey).get();
  const board = asObj(snap.data()?.board) ?? {};
  const rows = [
    ...(Array.isArray(board.east) ? (board.east as Obj[]) : []),
    ...(Array.isArray(board.west) ? (board.west as Obj[]) : []),
  ];
  return rows
    .map((r): LeagueHubStandingsEntry | null => {
      const teamId = typeof r.teamId === "string" ? r.teamId : "";
      if (!teamId) return null;
      const streak = asObj(r.streak);
      const kind = streak?.kind === "W" || streak?.kind === "L" ? streak.kind : null;
      const count = num(streak?.count);
      return {
        teamId,
        wins: num(r.wins) ?? 0,
        losses: num(r.losses) ?? 0,
        streak: kind && count ? { kind, count } : null,
        last10: record(r.last10),
        home: record(r.home),
        away: record(r.away),
      };
    })
    .filter((r): r is LeagueHubStandingsEntry => r != null);
}

async function loadTeamLogs(db: Firestore, seasonKey: string) {
  const out = new Map<string, LeagueHubTeamLogEntry>();
  const snap = await db
    .collection(NBA_TEAM_GAME_LOGS_COLLECTION)
    .doc(seasonKey)
    .collection("teams")
    .select("splits", "positionDefense")
    .get();
  for (const d of snap.docs) {
    const data = d.data();
    const splits = asObj(data.splits);
    const groups = asObj(asObj(data.positionDefense)?.groups);
    let posDef: LeagueHubPositionDefense | null = null;
    if (groups) {
      const cell = (g: string) => {
        const pts = asObj(asObj(groups[g])?.pts);
        const value = num(pts?.value);
        const rank = num(pts?.rank);
        return value != null && rank != null ? { pts: value, rank } : null;
      };
      posDef = { G: cell("G"), F: cell("F"), C: cell("C") };
    }
    out.set(d.id, {
      vsOver500: record(splits?.vsOver500),
      b2b: record(splits?.b2b),
      posDef,
    });
  }
  return out;
}

async function loadCloseRecords(db: Firestore, seasonKey: string) {
  const out = new Map<string, LeagueHubRecord>();
  const snap = await db.collection(NBA_TEAM_SHAPE_RECORDS_COLLECTION).doc(seasonKey).get();
  for (const [teamId, raw] of Object.entries(asObj(snap.data()?.teams) ?? {})) {
    const when = record(asObj(asObj(asObj(raw)?.shapes)?.margin_abs_le_5)?.when);
    if (when) out.set(teamId, when);
  }
  return out;
}

export async function ingestNbaLeagueHub(
  db: Firestore,
  input: { seasonKey: string; nowMs?: number }
) {
  const { seasonKey } = input;
  const [roster, metrics, shotZones, gameLogs, standings, teamLogs, closeRecords] =
    await Promise.all([
      loadRoster(db, seasonKey),
      loadMetrics(db, seasonKey),
      loadShotZones(db, seasonKey),
      loadGameLogs(db, seasonKey),
      loadStandings(db, seasonKey),
      loadTeamLogs(db, seasonKey),
      loadCloseRecords(db, seasonKey),
    ]);

  const hub = buildNbaLeagueHub({
    seasonKey,
    nowMs: input.nowMs ?? Date.now(),
    roster,
    metrics,
    shotZones,
    gameLogs,
    standings,
    teamLogs,
    closeRecords,
  });

  await db
    .collection(NBA_LEAGUE_HUB_COLLECTION)
    .doc(seasonKey)
    .set({ ...hub, updatedAt: FieldValue.serverTimestamp() });

  return {
    ok: true,
    seasonKey,
    players: hub.players.length,
    teams: hub.teams.length,
    zones: hub.zones.filter((z) => z.byPct.length > 0).length,
    week: hub.week ? `${hub.week.startLabel}-${hub.week.endLabel}` : null,
    mvp: hub.mvp.length,
    rookies: hub.rookies.length,
  };
}
