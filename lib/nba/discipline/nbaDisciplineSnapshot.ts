/**
 * Firestore:
 * - `nbaGameDiscipline/{bdlGameId}` 試合ごとのイベント（ingest が書く）
 * - `nbaDisciplineFines/{autoId}` 個別の罰金（NBA 公式発表を管理画面で手入力）
 * - `nbaDiscipline/{seasonKey}` 上 2 つのシーズン集計（公開 API はこれだけ読む）。
 *   FINES = テクニカル・退場の定額罰金（`nbaDisciplineFineSchedule`）
 *         + 出場停止で失った年俸（`nbaDisciplineSuspensionSalary`。NBA 発表分を手入力）+ 個別罰金
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  EMPTY_NBA_DISCIPLINE_COUNTS,
  type NbaDisciplineCounts,
  type NbaDisciplineDetailSlice,
  type NbaDisciplineFineDoc,
  type NbaDisciplineFineEntry,
  type NbaDisciplinePlayerEntry,
  type NbaDisciplineRanks,
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
import {
  ensureNbaPlayerSeasonSalaries,
  suspensionLostSalaryUsd,
  type NbaSuspensionForSalary,
} from "@/lib/nba/discipline/nbaDisciplineSuspensionSalary";

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
  return {
    tech: n(o.tech),
    flag: n(o.flag),
    eject: n(o.eject),
    susp: n(o.susp),
    fines: n(o.fines),
  };
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
  const touchTeam = (teamId: string, playerId: string, name: string) => {
    const team = (teams[teamId] ??= emptyTeam());
    const roster = (team.players ??= {});
    const tp = (roster[playerId] ??= {
      name: name || players[playerId]?.name || `Player ${playerId}`,
      regular: emptyCounts(),
      playoffs: emptyCounts(),
    });
    if (name && tp.name.startsWith("Player ")) tp.name = name;
    return { team, tp };
  };

  const rescindLeft = new Map<string, number>();
  for (const f of fines) {
    if (f.kind !== "rescind" || !f.rescindKind) continue;
    const key = `${f.playerId}|${f.date}|${f.rescindKind}`;
    rescindLeft.set(key, (rescindLeft.get(key) ?? 0) + 1);
  }
  const gameDocs = gamesSnap.docs.map((d) => {
    const g = d.data() as NbaGameDisciplineDoc;
    if (rescindLeft.size === 0) return g;
    const events = (g.events ?? []).filter((ev) => {
      const key = `${ev.p}|${g.date}|${ev.k}`;
      const left = rescindLeft.get(key) ?? 0;
      if (left <= 0) return true;
      rescindLeft.set(key, left - 1);
      return false;
    });
    return { ...g, events };
  });
  const scheduled = scheduledDisciplineFines(
    gameDocs.map((g) => ({
      date: g.date ?? "",
      seasonType: g.seasonType === "playoffs" ? "playoffs" : "regular",
      events: g.events ?? [],
    }))
  );
  for (const g of gameDocs) {
    const phase: NbaDisciplineSeasonType =
      g.seasonType === "playoffs" ? "playoffs" : "regular";
    const playIn = scheduled.playInDates.has(g.date ?? "");
    for (const ev of g.events ?? []) {
      const name = g.names?.[ev.p] ?? "";
      const entry = touchPlayer(ev.p, name, ev.t, g.date ?? "");
      const { team, tp } = touchTeam(ev.t, ev.p, name);
      if (playIn) continue;
      entry[phase][ev.k] += 1;
      team[phase][ev.k] += 1;
      tp[phase][ev.k] += 1;
    }
  }
  for (const fine of scheduled.fines) {
    players[fine.playerId]![fine.phase].fines += fine.amountUsd;
    const { team, tp } = touchTeam(fine.teamId, fine.playerId, "");
    team[fine.phase].fines += fine.amountUsd;
    tp[fine.phase].fines += fine.amountUsd;
  }

  const validFines = fines.filter(
    (f) => f.playerId && f.teamId && f.kind !== "rescind"
  );
  const suspensions: NbaSuspensionForSalary[] = validFines
    .filter((f) => f.kind === "suspension")
    .map((f) => ({
      id: f.id,
      playerId: f.playerId,
      date: f.date,
      games: f.games ?? 0,
      onCourt: f.onCourt === true,
      ...(f.salaryUsd && f.salaryUsd > 0 ? { salaryUsd: f.salaryUsd } : {}),
      ...(f.withholdingServices ? { withholdingServices: true } : {}),
      ...(f.totalGames && f.totalGames > 0 ? { totalGames: f.totalGames } : {}),
    }));
  let lostById = new Map<string, number>();
  if (suspensions.length > 0) {
    const salaries = await ensureNbaPlayerSeasonSalaries(
      db,
      seasonKey,
      suspensions.filter((s) => s.salaryUsd == null).map((s) => s.playerId)
    );
    lostById = suspensionLostSalaryUsd(
      seasonKey,
      suspensions,
      salaries,
      scheduled.regularSeasonDays
    );
  }
  const amountUpdates: Array<{ id: string; amountUsd: number }> = [];
  for (const fine of validFines) {
    const phase: NbaDisciplineSeasonType =
      fine.seasonType === "playoffs" ? "playoffs" : "regular";
    let amountUsd = fine.amountUsd;
    if (fine.kind === "suspension") {
      amountUsd = lostById.get(fine.id) ?? 0;
      if (amountUsd !== fine.amountUsd) amountUpdates.push({ id: fine.id, amountUsd });
    }
    const suspGames =
      fine.kind === "suspension" ? Math.max(0, Math.trunc(fine.games ?? 0)) : 0;
    const entry = touchPlayer(fine.playerId, fine.playerName, fine.teamId, fine.date);
    entry[phase].fines += amountUsd;
    entry[phase].susp += suspGames;
    const { team, tp } = touchTeam(fine.teamId, fine.playerId, fine.playerName);
    team[phase].fines += amountUsd;
    team[phase].susp += suspGames;
    tp[phase].fines += amountUsd;
    tp[phase].susp += suspGames;
  }
  for (const u of amountUpdates) {
    await db
      .collection(NBA_DISCIPLINE_FINES_COLLECTION)
      .doc(u.id)
      .update({ amountUsd: u.amountUsd });
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
    const roster: NonNullable<NbaDisciplineTeamEntry["players"]> = {};
    const rawRoster = (t.players ?? {}) as Record<string, Record<string, unknown>>;
    for (const [pid, p] of Object.entries(rawRoster)) {
      roster[pid] = {
        name: typeof p.name === "string" ? p.name : `Player ${pid}`,
        regular: parseCounts(p.regular),
        playoffs: parseCounts(p.playoffs),
      };
    }
    teams[id] = {
      regular: parseCounts(t.regular),
      playoffs: parseCounts(t.playoffs),
      players: roster,
    };
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
  return fines.filter((f) => f.kind !== "rescind").map((f) => ({
    playerId: f.playerId,
    playerName: f.playerName,
    amountUsd: f.amountUsd,
    date: f.date,
    reason: f.reason,
    ...(f.reasonI18n ? { reasonI18n: f.reasonI18n } : {}),
    seasonType: f.seasonType === "playoffs" ? "playoffs" : "regular",
    ...(f.kind === "suspension"
      ? { kind: "suspension" as const, games: f.games ?? 0 }
      : {}),
  }));
}

const RANK_KEYS: ReadonlyArray<keyof NbaDisciplineCounts> = [
  "tech",
  "flag",
  "eject",
  "susp",
  "fines",
];

function leagueRanks(
  all: readonly NbaDisciplineCounts[],
  mine: NbaDisciplineCounts
): NbaDisciplineRanks {
  const out: NbaDisciplineRanks = {};
  for (const key of RANK_KEYS) {
    if (mine[key] <= 0) continue;
    out[key] = all.filter((c) => c[key] > mine[key]).length + 1;
  }
  return out;
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
  const allTeams = Object.values(snapshot.teams);
  return {
    season: seasonKey,
    regular: team.regular,
    playoffs: team.playoffs,
    fines: finesForDetail(fines.filter((f) => f.teamId === teamId)),
    ranks: {
      regular: leagueRanks(allTeams.map((t) => t.regular), team.regular),
      playoffs: leagueRanks(allTeams.map((t) => t.playoffs), team.playoffs),
    },
    players: Object.entries(team.players ?? {}).map(([playerId, p]) => ({
      playerId,
      ...p,
    })),
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
  const regular = player?.regular ?? emptyCounts();
  const playoffs = player?.playoffs ?? emptyCounts();
  const allPlayers = Object.values(snapshot.players);
  return {
    season: seasonKey,
    regular,
    playoffs,
    fines: finesForDetail(fines.filter((f) => f.playerId === playerId)),
    ranks: {
      regular: leagueRanks(allPlayers.map((p) => p.regular), regular),
      playoffs: leagueRanks(allPlayers.map((p) => p.playoffs), playoffs),
    },
  };
}
