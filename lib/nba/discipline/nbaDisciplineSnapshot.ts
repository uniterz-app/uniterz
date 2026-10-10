/**
 * Firestore:
 * - `nbaGameDiscipline/{bdlGameId}` 試合ごとのイベント（ingest が書く）
 * - `nbaDisciplineFines/{autoId}` 個別の罰金（NBA 公式発表を管理画面で手入力）
 * - `nbaDiscipline/{seasonKey}` 上 2 つのシーズン集計（公開 API はこれだけ読む）。
 *   FINES = テクニカル・退場の定額罰金（`nbaDisciplineFineSchedule`）+ 手入力分
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  EMPTY_NBA_DISCIPLINE_COUNTS,
  type NbaDisciplineCounts,
  type NbaDisciplineDetailSlice,
  type NbaDisciplineFineDoc,
  type NbaDisciplineFineEntry,
  type NbaDisciplinePlayerEntry,
  type NbaDisciplineSeasonType,
  type NbaDisciplineSnapshot,
  type NbaDisciplineTeamEntry,
  type NbaGameDisciplineDoc,
} from "@/lib/nba/discipline/disciplineTypes";
import {
  NBA_PLAYER_SEASON_METRICS_COLLECTION,
  NBA_PLAYER_SEASON_METRICS_PLAYERS_SUB,
} from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import { scheduledDisciplineFines } from "@/lib/nba/discipline/nbaDisciplineFineSchedule";

export const NBA_GAME_DISCIPLINE_COLLECTION = "nbaGameDiscipline";
export const NBA_DISCIPLINE_FINES_COLLECTION = "nbaDisciplineFines";
export const NBA_DISCIPLINE_COLLECTION = "nbaDiscipline";

function emptyCounts(): NbaDisciplineCounts {
  return { ...EMPTY_NBA_DISCIPLINE_COUNTS };
}

function emptyTeam(): NbaDisciplineTeamEntry {
  return { regular: emptyCounts(), playoffs: emptyCounts() };
}

function parseCounts(raw: unknown): NbaDisciplineCounts {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const n = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : 0;
  return { tech: n(o.tech), flag: n(o.flag), eject: n(o.eject), fines: n(o.fines) };
}

export async function listDisciplineFines(
  db: Firestore,
  seasonKey: string
): Promise<NbaDisciplineFineEntry[]> {
  const snap = await db
    .collection(NBA_DISCIPLINE_FINES_COLLECTION)
    .where("seasonKey", "==", seasonKey)
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as NbaDisciplineFineDoc) }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAtMs - a.createdAtMs);
}

/** 試合イベント + 罰金 → `nbaDiscipline/{seasonKey}` を作り直す */
export async function rebuildNbaDisciplineSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaDisciplineSnapshot> {
  const [gamesSnap, fines] = await Promise.all([
    db
      .collection(NBA_GAME_DISCIPLINE_COLLECTION)
      .where("seasonKey", "==", seasonKey)
      .get(),
    listDisciplineFines(db, seasonKey),
  ]);

  const players: Record<string, NbaDisciplinePlayerEntry & { lastDate: string }> = {};
  const teams: Record<string, NbaDisciplineTeamEntry> = {};

  const touchPlayer = (
    playerId: string,
    name: string,
    teamId: string,
    date: string
  ) => {
    let entry = players[playerId];
    if (!entry) {
      entry = {
        name: name || `Player ${playerId}`,
        teamId,
        gamesPlayed: 0,
        regular: emptyCounts(),
        playoffs: emptyCounts(),
        lastDate: date,
      };
      players[playerId] = entry;
    }
    if (name && entry.name.startsWith("Player ")) entry.name = name;
    if (date >= entry.lastDate) {
      entry.lastDate = date;
      entry.teamId = teamId;
    }
    return entry;
  };

  const gameDocs = gamesSnap.docs.map((d) => d.data() as NbaGameDisciplineDoc);
  for (const g of gameDocs) {
    const phase: NbaDisciplineSeasonType =
      g.seasonType === "playoffs" ? "playoffs" : "regular";
    for (const ev of g.events ?? []) {
      const entry = touchPlayer(ev.p, g.names?.[ev.p] ?? "", ev.t, g.date ?? "");
      entry[phase][ev.k] += 1;
      const team = (teams[ev.t] ??= emptyTeam());
      team[phase][ev.k] += 1;
    }
  }

  const scheduled = scheduledDisciplineFines(
    gameDocs.map((g) => ({
      date: g.date ?? "",
      seasonType: g.seasonType === "playoffs" ? "playoffs" : "regular",
      events: g.events ?? [],
    }))
  );
  for (const fine of scheduled) {
    players[fine.playerId]![fine.phase].fines += fine.amountUsd;
    teams[fine.teamId]![fine.phase].fines += fine.amountUsd;
  }

  for (const fine of fines) {
    if (!fine.playerId || !fine.teamId) continue;
    const phase: NbaDisciplineSeasonType =
      fine.seasonType === "playoffs" ? "playoffs" : "regular";
    const entry = touchPlayer(fine.playerId, fine.playerName, fine.teamId, fine.date);
    entry[phase].fines += fine.amountUsd;
    const team = (teams[fine.teamId] ??= emptyTeam());
    team[phase].fines += fine.amountUsd;
  }

  const outPlayers: Record<string, NbaDisciplinePlayerEntry> = {};
  for (const [id, { lastDate: _lastDate, ...rest }] of Object.entries(players)) {
    outPlayers[id] = rest;
  }
  const ids = Object.keys(outPlayers);
  for (let i = 0; i < ids.length; i += 300) {
    const refs = ids.slice(i, i + 300).map((id) =>
      db
        .collection(NBA_PLAYER_SEASON_METRICS_COLLECTION)
        .doc(seasonKey)
        .collection(NBA_PLAYER_SEASON_METRICS_PLAYERS_SUB)
        .doc(id)
    );
    const docs = await db.getAll(...refs, { fieldMask: ["gamesPlayed"] });
    for (const d of docs) {
      const gp = d.get("gamesPlayed");
      if (typeof gp === "number" && outPlayers[d.id]) {
        outPlayers[d.id]!.gamesPlayed = gp;
      }
    }
  }

  const snapshot: NbaDisciplineSnapshot = {
    seasonKey,
    gameCount: gamesSnap.size,
    players: outPlayers,
    teams,
    builtAtMs: Date.now(),
  };
  await db.collection(NBA_DISCIPLINE_COLLECTION).doc(seasonKey).set(snapshot);
  return snapshot;
}

export async function loadNbaDisciplineSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaDisciplineSnapshot | null> {
  const snap = await db.collection(NBA_DISCIPLINE_COLLECTION).doc(seasonKey).get();
  if (!snap.exists) return null;
  const raw = snap.data() as Record<string, unknown>;
  const players: Record<string, NbaDisciplinePlayerEntry> = {};
  const rawPlayers = (raw.players ?? {}) as Record<string, Record<string, unknown>>;
  for (const [id, p] of Object.entries(rawPlayers)) {
    players[id] = {
      name: typeof p.name === "string" ? p.name : `Player ${id}`,
      teamId: typeof p.teamId === "string" ? p.teamId : "",
      gamesPlayed: typeof p.gamesPlayed === "number" ? p.gamesPlayed : 0,
      regular: parseCounts(p.regular),
      playoffs: parseCounts(p.playoffs),
    };
  }
  const teams: Record<string, NbaDisciplineTeamEntry> = {};
  const rawTeams = (raw.teams ?? {}) as Record<string, Record<string, unknown>>;
  for (const [id, t] of Object.entries(rawTeams)) {
    teams[id] = { regular: parseCounts(t.regular), playoffs: parseCounts(t.playoffs) };
  }
  return {
    seasonKey,
    gameCount: typeof raw.gameCount === "number" ? raw.gameCount : 0,
    players,
    teams,
    builtAtMs: typeof raw.builtAtMs === "number" ? raw.builtAtMs : 0,
  };
}

function finesForDetail(
  fines: readonly NbaDisciplineFineEntry[]
): NbaDisciplineDetailSlice["fines"] {
  return fines.map((f) => ({
    playerId: f.playerId,
    playerName: f.playerName,
    amountUsd: f.amountUsd,
    date: f.date,
    reason: f.reason,
    seasonType: f.seasonType === "playoffs" ? "playoffs" : "regular",
  }));
}

export async function loadTeamDisciplineSlice(
  db: Firestore,
  seasonKey: string,
  teamId: string
): Promise<NbaDisciplineDetailSlice | null> {
  const [snapshot, fines] = await Promise.all([
    loadNbaDisciplineSnapshot(db, seasonKey),
    listDisciplineFines(db, seasonKey),
  ]);
  if (!snapshot) return null;
  const team = snapshot.teams[teamId] ?? emptyTeam();
  return {
    season: seasonKey,
    regular: team.regular,
    playoffs: team.playoffs,
    fines: finesForDetail(fines.filter((f) => f.teamId === teamId)),
  };
}

export async function loadPlayerDisciplineSlice(
  db: Firestore,
  seasonKey: string,
  playerId: string
): Promise<NbaDisciplineDetailSlice | null> {
  const [snapshot, fines] = await Promise.all([
    loadNbaDisciplineSnapshot(db, seasonKey),
    listDisciplineFines(db, seasonKey),
  ]);
  if (!snapshot) return null;
  const player = snapshot.players[playerId];
  return {
    season: seasonKey,
    regular: player?.regular ?? emptyCounts(),
    playoffs: player?.playoffs ?? emptyCounts(),
    fines: finesForDetail(fines.filter((f) => f.playerId === playerId)),
  };
}
