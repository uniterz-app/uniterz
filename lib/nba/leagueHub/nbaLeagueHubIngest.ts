/**
 * 既存スナップショット（Firestore のみ）→ `nbaLeagueHub/{seasonKey}`。
 * 日次 / 試合後監視の最後（試合ログ更新後）に回す。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import type { NbaPlayerGameLog, NbaPlayerShotZone } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import { formatNbaPlayerListName } from "@/lib/nba/formatNbaPlayerListName";
import { NBA_TEAM_ROSTERS_COLLECTION } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { NBA_CONFERENCE_STANDINGS_COLLECTION } from "@/lib/nba/standings/loadNbaConferenceStandings";
import { NBA_TEAM_GAME_LOGS_COLLECTION } from "@/lib/nba/teamGameLog/teamGameLogTypes";
import { NBA_TEAM_SHAPE_RECORDS_COLLECTION } from "@/lib/nba/teamShapes/teamShapeTypes";
import { NBA_PLAYER_SHOT_ZONES_COLLECTION } from "@/lib/nba/playerShotZones/playerShotZonesTypes";
import { NBA_PLAYER_SEASON_METRICS_COLLECTION } from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import { NBA_PLAYER_GAME_LOGS_COLLECTION } from "@/lib/nba/playerGameLogs/playerGameLogsTypes";
import { NBA_PLAYER_CAREER_SEASONS_COLLECTION } from "@/lib/nba/playerCareerSeasons/playerCareerSeasonsTypes";
import { nbaLeagueStatsSeasonKeys, previousNbaSeasonKey } from "@/lib/rankings/nbaSeason";
import { loadNbaPlayerShotAreas } from "@/lib/nba/shotCharts/loadNbaPlayerShotAreas";
import { NBA_ACE_GUARD_COLLECTION } from "@/lib/nba/ingest/nbaMatchupIngest";
import { NBA_TEAM_PAYROLLS_COLLECTION } from "@/lib/nba/teamPayroll/loadTeamPayrollSnapshot";
import { parseHeightInches } from "@/lib/nba/leagueHub/buildLeagueHubTeamStyle";
import {
  careerBaseFromRows,
  type LeagueHubSeasonGame,
} from "@/lib/nba/leagueHub/buildLeagueHubExtras";
import { NBA_PLAYER_CONTRACTS_COLLECTION } from "@/lib/nba/playerContract/playerContractTypes";
import type { NbaPlayerCareerSeasonRow } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  buildNbaLeagueHub,
  type LeagueHubMetricsEntry,
  type LeagueHubRosterEntry,
  type LeagueHubStandingsEntry,
  type LeagueHubTeamLogEntry,
} from "@/lib/nba/leagueHub/buildNbaLeagueHub";
import {
  LEAGUE_HUB_POS_DEF_STATS,
  NBA_LEAGUE_HUB_CAREER_BASE_COLLECTION,
  NBA_LEAGUE_HUB_COLLECTION,
  type LeagueHubCareerBase,
  type LeagueHubLadderWeek,
  type LeagueHubPosDefStat,
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

/** "G-F" → [G, F]、"SG" → [G]。並びは元の順 */
function posGroups(position: unknown): LeagueHubRosterEntry["positions"] {
  const out: LeagueHubRosterEntry["positions"] = [];
  for (const token of String(position ?? "").toUpperCase().split(/[-/\s]+/)) {
    const c = token.endsWith("G") ? "G" : token.endsWith("F") ? "F" : token === "C" ? "C" : null;
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
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
        pos: posGroups(p.position)[0] ?? null,
        positions: posGroups(p.position),
        draftYear: num(p.draftYear),
        draftRound: num(p.draftRound),
        draftNumber: num(p.draftNumber),
        heightIn: parseHeightInches(p.height),
      });
    }
  }
  return out;
}

/** ペイロール doc は選手の契約込みで大きいので、チームの年俸総額だけ読む */
async function loadPayrolls(db: Firestore, seasonKey: string) {
  const out = new Map<string, number>();
  const snap = await db
    .collection(NBA_TEAM_PAYROLLS_COLLECTION)
    .where(FieldPath.documentId(), "==", seasonKey)
    .select(
      ...Object.keys(NBA_TEAM_NAME_BY_ID).map((id) => new FieldPath("teams", id, "totalSalary"))
    )
    .get();
  for (const [teamId, raw] of Object.entries(asObj(snap.docs[0]?.data().teams) ?? {})) {
    const total = num(asObj(raw)?.totalSalary);
    if (total != null && total > 0) out.set(teamId, total);
  }
  return out;
}

/** 前季は MIP の比較に使う指標だけ読む */
const PRIOR_SEASON_METRIC_FIELDS = ["gamesPlayed", "teamId", "metrics.pts", "metrics.pie", "metrics.min"];

async function loadMetrics(db: Firestore, seasonKey: string, fields?: string[]) {
  const out = new Map<string, LeagueHubMetricsEntry>();
  const col = db.collection(NBA_PLAYER_SEASON_METRICS_COLLECTION).doc(seasonKey).collection("players");
  const snap = await (fields ? col.select(...fields) : col).get();
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
        const stats: Partial<Record<LeagueHubPosDefStat, { value: number; rank: number }>> = {};
        for (const stat of LEAGUE_HUB_POS_DEF_STATS) {
          const c = asObj(asObj(groups[g])?.[stat]);
          const value = num(c?.value);
          const rank = num(c?.rank);
          if (value != null && rank != null) stats[stat] = { value, rank };
        }
        const { pts, ...rest } = stats;
        return pts ? { pts: pts.value, rank: pts.rank, stats: rest } : null;
      };
      posDef = { G: cell("G"), F: cell("F"), C: cell("C") };
    }
    let ptsTotal = 0;
    let games = 0;
    for (const side of ["home", "away"] as const) {
      const row = asObj(splits?.[side]);
      const g = (num(row?.wins) ?? 0) + (num(row?.losses) ?? 0);
      const pts = num(asObj(row?.avg)?.pts);
      if (g > 0 && pts != null) {
        ptsTotal += pts * g;
        games += g;
      }
    }
    out.set(d.id, {
      vsOver500: record(splits?.vsOver500),
      b2b: record(splits?.b2b),
      threeInFour: record(splits?.threeInFour),
      vsEast: record(splits?.vsEast),
      vsWest: record(splits?.vsWest),
      posDef,
      ppg: games > 0 ? ptsTotal / games : null,
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

/**
 * 前季までに NBA 出場がある選手 ID。
 * 2020-21〜前季の `nbaPlayerSeasonMetrics`（ID だけ）+ 候補に残った選手だけキャリア doc を確認。
 */
async function loadPriorPlayerIds(
  db: Firestore,
  seasonKey: string,
  currentIds: Iterable<string>,
  lastSeason: { key: string; ids: Iterable<string> }
): Promise<Set<string>> {
  const prior = nbaLeagueStatsSeasonKeys(seasonKey).filter(
    (k) => k !== seasonKey && k !== lastSeason.key
  );
  const snaps = await Promise.all(
    prior.map((k) =>
      db.collection(NBA_PLAYER_SEASON_METRICS_COLLECTION).doc(k).collection("players").select().get()
    )
  );
  const out = new Set<string>(lastSeason.ids);
  for (const snap of snaps) for (const d of snap.docs) out.add(d.id);

  const startYear = Number.parseInt(seasonKey.slice(0, 4), 10);
  const candidates = [...currentIds].filter((id) => !out.has(id));
  const refs = candidates.map((id) => db.collection(NBA_PLAYER_CAREER_SEASONS_COLLECTION).doc(id));
  for (let i = 0; i < refs.length; i += 200) {
    const docs = await db.getAll(...refs.slice(i, i + 200), { fieldMask: ["regular"] });
    for (const d of docs) {
      const regular = d.exists ? d.get("regular") : null;
      if (!Array.isArray(regular)) continue;
      const played = regular.some((row: unknown) => {
        const r = asObj(row);
        const start = num(r?.seasonStart);
        return start != null && start < startYear && (num(r?.games) ?? 0) > 0;
      });
      if (played) out.add(d.id);
    }
  }
  return out;
}

function toMs(v: unknown): number | null {
  if (typeof v === "number") return v;
  const o = v as { toMillis?: () => number } | null;
  return typeof o?.toMillis === "function" ? o.toMillis() : null;
}

/**
 * 今季の games を 1 回だけ読む（小さい項目だけ）。
 * - 試合ごとの先発（BDL game id → playerId）。live ingest が lineups から保存したものだけ
 * - レギュラーの対戦・スコア・UNITERZ の予想人数（同じ 2 チーム・同じ日の重複 doc はまとめる）
 */
async function loadSeasonGames(db: Firestore, seasonKey: string) {
  const starterIdsByGame = new Map<string, Set<string>>();
  const byMatch = new Map<string, LeagueHubSeasonGame & { pickTotal: number }>();
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", seasonKey)
    .select(
      "liveStarterIds",
      "homeTeamId",
      "awayTeamId",
      "final",
      "seasonPhase",
      "startAtJst",
      "homeScore",
      "awayScore",
      "marketPickCounts"
    )
    .get();
  for (const d of snap.docs) {
    const ids = d.get("liveStarterIds");
    const m = /^nba-bdl-(\d+)$/.exec(d.id);
    if (m && Array.isArray(ids) && ids.length > 0) {
      starterIdsByGame.set(m[1]!, new Set(ids.map(String)));
    }
    if (d.get("seasonPhase") !== "regular") continue;
    const homeTeamId = d.get("homeTeamId");
    const awayTeamId = d.get("awayTeamId");
    const startMs = toMs(d.get("startAtJst"));
    if (typeof homeTeamId !== "string" || typeof awayTeamId !== "string" || startMs == null) continue;
    const pc = asObj(d.get("marketPickCounts"));
    const home = num(pc?.home) ?? 0;
    const away = num(pc?.away) ?? 0;
    const game = {
      homeTeamId,
      awayTeamId,
      final: d.get("final") === true,
      homeScore: num(d.get("homeScore")),
      awayScore: num(d.get("awayScore")),
      picks: home + away > 0 ? { home, away } : null,
      pickTotal: home + away,
    };
    const key = `${homeTeamId}|${awayTeamId}|${Math.floor((startMs + 9 * 3_600_000) / 86_400_000)}`;
    const cur = byMatch.get(key);
    if (
      !cur ||
      (game.final && !cur.final) ||
      (game.final === cur.final && game.pickTotal > cur.pickTotal)
    ) {
      byMatch.set(key, game);
    }
  }
  const seasonGames: LeagueHubSeasonGame[] = [...byMatch.values()].map(
    ({ pickTotal: _t, ...g }) => g
  );
  return { starterIdsByGame, seasonGames };
}

/** 選手の今季年俸。契約 doc の年ごとの行だけ読む */
async function loadSalaries(db: Firestore, seasonKey: string) {
  const out = new Map<string, number>();
  const startYear = Number.parseInt(seasonKey.slice(0, 4), 10);
  const snap = await db
    .collection(NBA_PLAYER_CONTRACTS_COLLECTION)
    .doc(seasonKey)
    .collection("players")
    .select("contract.seasons")
    .get();
  for (const d of snap.docs) {
    const seasons = asObj(d.get("contract"))?.seasons ?? d.get("contract.seasons");
    if (!Array.isArray(seasons)) continue;
    const row = seasons.map(asObj).find((r) => num(r?.season) === startYear);
    const salary = num(row?.baseSalary) ?? num(row?.capHit);
    if (salary != null && salary > 0) out.set(d.id, salary);
  }
  return out;
}

/**
 * 前季までのレギュラー通算。過去季は変わらないので `nbaLeagueHubCareerBase/{season}` に残し、
 * まだ無い選手のキャリア doc だけ読み足す（キャリア doc が無い選手も記録して読み直さない）。
 */
async function loadCareerBase(
  db: Firestore,
  seasonKey: string,
  candidateIds: string[],
  persist: boolean
) {
  const ref = db.collection(NBA_LEAGUE_HUB_CAREER_BASE_COLLECTION).doc(seasonKey);
  const snap = await ref.get();
  const players = (asObj(snap.get("players")) ?? {}) as Record<string, LeagueHubCareerBase>;
  const none = new Set<string>(Array.isArray(snap.get("none")) ? snap.get("none") : []);
  const missing = candidateIds.filter((id) => !(id in players) && !none.has(id));
  if (missing.length > 0) {
    const startYear = Number.parseInt(seasonKey.slice(0, 4), 10);
    const refs = missing.map((id) => db.collection(NBA_PLAYER_CAREER_SEASONS_COLLECTION).doc(id));
    for (let i = 0; i < refs.length; i += 200) {
      const docs = await db.getAll(...refs.slice(i, i + 200), { fieldMask: ["regular"] });
      for (const d of docs) {
        const regular = d.exists ? d.get("regular") : null;
        if (!Array.isArray(regular)) {
          none.add(d.id);
          continue;
        }
        const base = careerBaseFromRows(regular as NbaPlayerCareerSeasonRow[], startYear);
        if (base.games > 0) players[d.id] = base;
        else none.add(d.id);
      }
    }
    if (persist) await ref.set({ players, none: [...none], updatedAtMs: Date.now() });
  }
  return new Map(Object.entries(players));
}

/** Firestore を読んで hub を組む。hub は書かない（`persistCareerBase` なら通算のキャッシュだけ書く） */
export async function loadAndBuildNbaLeagueHub(
  db: Firestore,
  input: { seasonKey: string; nowMs?: number; persistCareerBase?: boolean }
) {
  const { seasonKey } = input;
  const lastSeasonKey = previousNbaSeasonKey(seasonKey);
  const [
    roster,
    metrics,
    priorSeasonMetrics,
    shotZones,
    gameLogs,
    standings,
    teamLogs,
    closeRecords,
    { starterIdsByGame, seasonGames },
    payrollUsd,
    salaryUsd,
  ] = await Promise.all([
    loadRoster(db, seasonKey),
    loadMetrics(db, seasonKey),
    loadMetrics(db, lastSeasonKey, PRIOR_SEASON_METRIC_FIELDS),
    loadShotZones(db, seasonKey),
    loadGameLogs(db, seasonKey),
    loadStandings(db, seasonKey),
    loadTeamLogs(db, seasonKey),
    loadCloseRecords(db, seasonKey),
    loadSeasonGames(db, seasonKey),
    loadPayrolls(db, seasonKey),
    loadSalaries(db, seasonKey),
  ]);
  const [priorPlayerIds, prevSnap, shotAreasDoc] = await Promise.all([
    loadPriorPlayerIds(db, seasonKey, metrics.keys(), {
      key: lastSeasonKey,
      ids: priorSeasonMetrics.keys(),
    }),
    db.collection(NBA_LEAGUE_HUB_COLLECTION).doc(seasonKey).get(),
    loadNbaPlayerShotAreas(db, seasonKey),
  ]);
  // 通算の節目は前季までに出場があり、今季もある程度出ている選手だけ
  const careerCandidates = [...metrics]
    .filter(([id, e]) => {
      if (!priorPlayerIds.has(id) || e.gp <= 0) return false;
      const v = e.values;
      return (v.pts ?? 0) >= 8 || (v.reb ?? 0) >= 5 || (v.ast ?? 0) >= 3 || (v.fg3m ?? 0) >= 1;
    })
    .map(([id]) => id);
  const careerBase = await loadCareerBase(
    db,
    seasonKey,
    careerCandidates,
    input.persistCareerBase === true
  );
  const prevData = prevSnap.data();

  const aceSnap = await db.collection(NBA_ACE_GUARD_COLLECTION).doc(seasonKey).get();
  const aceRaw = aceSnap.data()?.players as
    | Record<string, { minutes?: number; suppress?: number }>
    | undefined;
  const aceGuard = new Map<string, { minutes: number; suppress: number }>();
  for (const [id, row] of Object.entries(aceRaw ?? {})) {
    if (typeof row?.minutes === "number" && typeof row.suppress === "number") {
      aceGuard.set(id, { minutes: row.minutes, suppress: row.suppress });
    }
  }

  return buildNbaLeagueHub({
    seasonKey,
    nowMs: input.nowMs ?? Date.now(),
    roster,
    payrollUsd,
    metrics,
    shotZones,
    shotAreas: shotAreasDoc?.players ?? null,
    gameLogs,
    standings,
    teamLogs,
    closeRecords,
    priorPlayerIds,
    priorSeasonMetrics,
    starterIdsByGame,
    seasonGames,
    salaryUsd,
    careerBase,
    aceGuard,
    previousLadders: prevData
      ? {
          ladderWeek: (prevData.ladderWeek as LeagueHubLadderWeek | undefined) ?? null,
          ladderPrev: (prevData.ladderPrev as LeagueHubLadderWeek | undefined) ?? null,
        }
      : null,
  });
}

export async function ingestNbaLeagueHub(
  db: Firestore,
  input: { seasonKey: string; nowMs?: number }
) {
  const { seasonKey } = input;
  const hub = await loadAndBuildNbaLeagueHub(db, { ...input, persistCareerBase: true });
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
    dpoy: hub.dpoy?.length ?? 0,
    sixth: hub.sixth?.length ?? 0,
    mip: hub.mip?.length ?? 0,
  };
}
