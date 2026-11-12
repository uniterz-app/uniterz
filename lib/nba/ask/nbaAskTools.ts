/**
 * ASK のデータ読み取り。すべて Firestore スナップショットだけを読む（BDL は叩かない）。
 * 答えの組み立ては `nbaAskNbaAnswer`。ここは必要な列だけに絞った値を返す。
 */
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import {
  gameDocTeamContext,
  normalizeLiveGameStatsDoc,
  type LiveGameBoxPlayer,
} from "@/lib/games/liveGameStats";
import { getResolvedGameScore } from "@/lib/games/transform";
import { getTodayKeyInTimeZone, toDateKeyInTimeZone } from "@/lib/time/zonedTime";
import { shiftDateKeyInTimeZone } from "@/lib/games/gamesWindowRange";
import { isNbaPickupGame } from "@/lib/nba/isPickupGame";
import { nbaGameDocIdFromBdlId } from "@/lib/nba/bdl/mapBdlGameToNbaGameDoc";
import { CURRENT_NBA_SEASON_KEY, nbaLeagueStatsSeasonKeys } from "@/lib/rankings/nbaSeason";
import { TEAM_SHORT } from "@/lib/team-short";
import { searchNbaStatsIndex } from "@/lib/nba/nbaStatsSearch";
import { loadTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { loadTeamInjuriesSnapshot } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import type { NbaTeamInjuryDocTeam } from "@/lib/nba/teamInjuries/teamInjuryTypes";
import {
  NBA_TEAM_OFFSEASON_MOVES_COLLECTION,
  type NbaOffseasonMove,
  type NbaTeamOffseasonMovesDoc,
} from "@/lib/nba/offseasonMoves/offseasonMovesTypes";
import { NBA_CONFERENCE_STANDINGS_COLLECTION } from "@/lib/nba/standings/loadNbaConferenceStandings";
import { buildNbaStandingsTeamRecordMap } from "@/lib/nba/standings/buildNbaStandingsTeamRecordMap";
import type { NbaConferenceStandingsRow } from "@/lib/nba/nbaConferenceStandings";
import { displayNbaRoundLabel } from "@/lib/games/displayNbaRoundLabel";
import { formatTeamRecordWithRank, isPreseasonPhase } from "@/lib/teamRecordDisplay";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";
import { loadPlayerGameLogsSnapshot } from "@/lib/nba/playerGameLogs/loadPlayerGameLogsSnapshot";
import { loadPlayerShotZonesSnapshot } from "@/lib/nba/playerShotZones/loadPlayerShotZonesSnapshot";
import { loadPlayerContractSnapshot } from "@/lib/nba/playerContract/loadPlayerContractSnapshot";
import { loadPlayerCareerSeasonsSnapshot } from "@/lib/nba/playerCareerSeasons/loadPlayerCareerSeasonsSnapshot";
import { loadPlayerDisciplineSlice, loadTeamDisciplineSlice } from "@/lib/nba/discipline/nbaDisciplineSnapshot";
import { loadTeamShapeRecordsBundle } from "@/lib/nba/teamShapes/loadTeamShapeRecords";
import { selectTeamShapeEdges } from "@/lib/nba/teamShapes/selectTeamShapeEdges";
import { resolveTeamShapeLabel } from "@/lib/nba/teamShapes/shapeDefs";
import { loadDailyLeadersAdmin } from "@/lib/nba/dailyLeaders/loadDailyLeadersAdmin";
import type { DailyLeaderStatKey } from "@/lib/nba/dailyLeaders/buildDailyLeaders";
import {
  formatCareerSeasonLabel,
  formatContractSeasonLabel,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import { loadPlayerStatLeadersSnapshot } from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import { loadLeagueTeamStatsSnapshot } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import {
  leagueMetricDef,
  metricValue,
  type NbaLeagueTeamStatMetric,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { GAME_PRO_INSIGHT_FIELDS, loadGameProInsight } from "@/lib/nba/insights/gameProInsightStore";
import { sanitizeProInsightNarrativeForDisplay } from "@/lib/predict/validateProInsightNarrative";
import type { ProInsightNarrativeBrief } from "@/lib/predict/proInsightNarrativeTypes";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { loadGameDayIndex } from "@/lib/games/server/gameDayIndexAdmin";
import { resolveLatestNbaSlateDateKey } from "@/lib/games/latestNbaSlate";
import {
  loadDailyScoreLeadersAdmin,
  selectDailyScoreBoardRows,
} from "@/lib/rankings/dailyScoreLeaders/loadDailyScoreLeadersAdmin";

/** NBA の試合日（スレート）は米国東部の暦日。ユーザーに見せる日付は表示タイムゾーンで出す */
const NBA_SLATE_TIME_ZONE = "America/New_York";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

type RosterTeams = Record<string, NbaTeamRosterDocTeam>;

/** ロスター doc は大きいので、同じサーバーインスタンス内では 10 分使い回す */
let rosterCache: { at: number; teams: RosterTeams } | null = null;
const ROSTER_CACHE_MS = 10 * 60 * 1000;

export async function loadRosters(db: Firestore): Promise<RosterTeams> {
  if (rosterCache && Date.now() - rosterCache.at < ROSTER_CACHE_MS) return rosterCache.teams;
  const payload = await loadTeamRostersSnapshot(db, CURRENT_NBA_SEASON_KEY);
  rosterCache = { at: Date.now(), teams: payload.bundle.teams ?? {} };
  return rosterCache.teams;
}

export function abbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/i, "")).toUpperCase();
}

/** 試合一覧カードの戦績行。今季スナップショットが無いチームは (0-0) */
let standingsRecordCache: {
  at: number;
  map: ReturnType<typeof buildNbaStandingsTeamRecordMap>;
} | null = null;

async function loadStandingsRecords(db: Firestore) {
  if (standingsRecordCache && Date.now() - standingsRecordCache.at < ROSTER_CACHE_MS) {
    return standingsRecordCache.map;
  }
  try {
    const snap = await db.collection(NBA_CONFERENCE_STANDINGS_COLLECTION).doc(CURRENT_NBA_SEASON_KEY).get();
    const board = readStandingsBoard(snap.data());
    const map = board ? buildNbaStandingsTeamRecordMap(board) : {};
    standingsRecordCache = { at: Date.now(), map };
    return map;
  } catch {
    return standingsRecordCache?.map ?? {};
  }
}

function recordLine(
  map: ReturnType<typeof buildNbaStandingsTeamRecordMap>,
  teamId: string,
  seasonPhase: unknown
): string {
  const row = map[teamId];
  if (!row) return "(0-0)";
  return formatTeamRecordWithRank(row, "nba", { hideRank: isPreseasonPhase(seasonPhase) });
}

function startOf(data: Record<string, unknown>): Date | null {
  const t = data.startAtJst as { toDate?: () => Date } | undefined;
  return t?.toDate?.() ?? null;
}

/** today / tomorrow / yesterday を、ユーザーの暦日に直す */
export function resolveAskDate(raw: string, timeZone: string): string | null {
  const q = raw.trim().toLowerCase();
  const today = getTodayKeyInTimeZone(timeZone);
  if (!q || q === "today") return today;
  if (q === "tomorrow") return shiftDateKeyInTimeZone(today, timeZone, 1);
  if (q === "yesterday") return shiftDateKeyInTimeZone(today, timeZone, -1);
  return DATE_RE.test(q) ? q : null;
}

function kickoffLabel(data: Record<string, unknown>, timeZone: string): string {
  const start = startOf(data);
  if (!start) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(start);
}

/** 試合一覧カード・スコアに要る項目。liveStats は phase だけ（box は 1 試合 6KB あるので要るときだけ） */
const GAME_LIST_FIELDS = [
  "startAtJst",
  "home",
  "away",
  "homeTeamId",
  "awayTeamId",
  "score",
  "homeScore",
  "awayScore",
  "finalScore",
  "result",
  "final",
  "postponed",
  "seasonPhase",
  "roundLabel",
  "isPickup",
  "pickupWeekKey",
  "liveStats.phase",
] as const;

/** 表示タイムゾーンの暦日に始まる試合（試合一覧の日付と同じ切り方） */
export async function loadGamesOnDate(
  db: Firestore,
  dateKey: string,
  timeZone: string,
  opts: { box?: boolean; proInsight?: boolean } = {}
) {
  const m = DATE_RE.exec(dateKey);
  if (!m) return null;
  // どのタイムゾーンの 1 日も UTC 当日 0 時の前後 14 時間以内に収まる。広めに取り、暦日で絞る
  const utcMidnight = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const hour = 3600 * 1000;
  const fields: string[] = [
    ...GAME_LIST_FIELDS.filter((f) => !(opts.box && f === "liveStats.phase")),
    ...(opts.box ? ["liveStats"] : []),
    ...(opts.proInsight ? GAME_PRO_INSIGHT_FIELDS : []),
  ];
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", GAME_SCHEDULE_SEASON)
    .where("startAtJst", ">=", Timestamp.fromMillis(utcMidnight - 15 * hour))
    .where("startAtJst", "<", Timestamp.fromMillis(utcMidnight + 39 * hour))
    .orderBy("startAtJst", "asc")
    .limit(60)
    .select(...fields)
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
    .filter(({ data }) => {
      const start = startOf(data);
      return start ? toDateKeyInTimeZone(start, timeZone) === dateKey : false;
    });
}

/** 選手の試合ログ（BDL 試合 ID）→ 表示タイムゾーンの日付 */
export async function gameDateKeysByBdlId(
  db: Firestore,
  bdlGameIds: string[],
  timeZone: string
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (bdlGameIds.length === 0) return out;
  const snaps = await db.getAll(
    ...bdlGameIds.map((id) => db.collection("games").doc(nbaGameDocIdFromBdlId(Number(id)))),
    { fieldMask: ["startAtJst"] }
  );
  snaps.forEach((snap, i) => {
    const start = snap.exists ? startOf(snap.data() as Record<string, unknown>) : null;
    if (start) out.set(bdlGameIds[i]!, toDateKeyInTimeZone(start, timeZone));
  });
  return out;
}

function boxLine(p: LiveGameBoxPlayer) {
  return {
    name: `${p.firstName} ${p.lastName}`.trim(),
    min: p.min,
    pts: p.pts,
    reb: p.reb,
    ast: p.ast,
    stl: p.stl,
    blk: p.blk,
    tov: p.tov,
    fg: p.fg,
    fg3: p.fg3,
    ft: p.ft,
    pm: p.plusMinus,
  };
}

function gameStatus(data: Record<string, unknown>, phase: string | null): string {
  if (data.postponed === true) return "postponed";
  if (phase === "final" || data.final === true) return "final";
  if (phase === "live") return "live";
  return "scheduled";
}

const PRO_LEAGUE_TOP_N = 8;

function textOf(value: UiStrings | null | undefined, language: string): string {
  if (!value) return "";
  return L(resolveLocalizedLang(language), value).trim();
}

function teamQueryHit(teamId: string, teamName: string, query: string): boolean {
  const q = query.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (q.length < 2) return false;
  const short = abbr(teamId).toLowerCase();
  if (short === q) return true;
  const tokens = teamName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.some((token) => token === q || (q.length >= 4 && token.startsWith(q)));
}

type ResolvedTeam = { teamId: string; name: string };

async function resolveTeam(
  db: Firestore,
  query: string
): Promise<ResolvedTeam | { error: string; teams: { id: string; name: string }[] }> {
  const rosters = await loadRosters(db);
  const hits = Object.values(rosters).filter((t) => teamQueryHit(t.teamId, t.teamName, query));
  if (hits.length === 1) {
    const t = hits[0]!;
    return { teamId: t.teamId, name: t.teamName };
  }
  if (hits.length === 0) return { error: "team not found", teams: [] };
  return {
    error: "specify one team",
    teams: hits.slice(0, 8).map((t) => ({ id: abbr(t.teamId), name: t.teamName })),
  };
}

let injuryCache: { at: number; teams: Record<string, NbaTeamInjuryDocTeam> } | null = null;
let movesCache: {
  at: number;
  teams: NbaTeamOffseasonMovesDoc["teams"];
} | null = null;

async function loadInjuryTeams(
  db: Firestore,
  season = CURRENT_NBA_SEASON_KEY
): Promise<Record<string, NbaTeamInjuryDocTeam>> {
  if (season === CURRENT_NBA_SEASON_KEY && injuryCache && Date.now() - injuryCache.at < ROSTER_CACHE_MS) {
    return injuryCache.teams;
  }
  const payload = await loadTeamInjuriesSnapshot(db, season);
  if (season === CURRENT_NBA_SEASON_KEY) {
    injuryCache = { at: Date.now(), teams: payload.bundle.teams };
  }
  return payload.bundle.teams;
}

/** チャットが聞いてよい選手リーダー指標。ショットゾーンや契約は含めない */
const DAILY_LEADER_METRICS = ["pts", "reb", "ast", "stl", "blk", "fg3m"] as const;
/** チームは1指標だけ。失点と DEF は低い方が上位 */
const TEAM_STAT_METRICS = ["ppg", "papg", "pace", "netrtg", "ortg", "drtg", "diff"] as const;

/** 2020-21 から今季まで。空なら今季。範囲外はエラー */
function askSeason(raw: unknown): string | { error: string } {
  const season = String(raw ?? "").trim();
  if (!season) return CURRENT_NBA_SEASON_KEY;
  if (!nbaLeagueStatsSeasonKeys().includes(season)) return { error: "season out of range" };
  return season;
}

async function loadMovesTeams(
  db: Firestore
): Promise<NbaTeamOffseasonMovesDoc["teams"]> {
  if (movesCache && Date.now() - movesCache.at < ROSTER_CACHE_MS) return movesCache.teams;
  const snap = await db
    .collection(NBA_TEAM_OFFSEASON_MOVES_COLLECTION)
    .doc(CURRENT_NBA_SEASON_KEY)
    .get();
  const teams =
    (snap.data() as Partial<NbaTeamOffseasonMovesDoc> | undefined)?.teams ?? {};
  movesCache = { at: Date.now(), teams };
  return teams;
}

const MOVE_CAP = 12;

function compactMove(move: NbaOffseasonMove) {
  return {
    name: `${move.firstName} ${move.lastName}`.trim(),
    kind: move.kind,
    other: move.otherTeamId ? abbr(move.otherTeamId) : null,
  };
}

export function readStandingsBoard(
  raw: unknown
): { east: NbaConferenceStandingsRow[]; west: NbaConferenceStandingsRow[] } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const board = (
    o.board && typeof o.board === "object" ? o.board : o
  ) as Record<string, unknown>;
  if (!Array.isArray(board.east) || !Array.isArray(board.west)) return null;
  return {
    east: board.east as NbaConferenceStandingsRow[],
    west: board.west as NbaConferenceStandingsRow[],
  };
}

function compactStanding(row: NbaConferenceStandingsRow) {
  const streak = row.streak?.count
    ? `${row.streak.kind}${row.streak.count}`
    : null;
  return {
    team: abbr(row.teamId),
    rank: row.rank,
    w: row.wins,
    l: row.losses,
    streak,
  };
}

/** トークンを抑えるため、枠ごとの本文とマッチアップ表の要点だけ */
function compactProInsight(brief: ProInsightNarrativeBrief, language: string) {
  return {
    away: abbr(brief.awayTeamId),
    home: abbr(brief.homeTeamId),
    sections: brief.sections.map((sec) => ({
      kind: sec.kind,
      lines: sec.items
        .map((item) => textOf(item.body, language))
        .filter(Boolean)
        .slice(0, 2),
      ...(sec.table
        ? {
            table: sec.table.rows.slice(0, 5).map((row) => ({
              label: textOf(row.label, language),
              edge: abbr(row.edgeTeamId),
              away: `${row.away.value} #${row.away.rank}`,
              home: `${row.home.value} #${row.home.rank}`,
            })),
          }
        : {}),
    })),
  };
}

export async function runNbaAskTool(
  db: Firestore,
  name: string,
  args: Record<string, unknown>,
  language: string,
  timeZone: string
): Promise<unknown> {
  const str = (v: unknown) => String(v ?? "").trim();

  if (name === "search_players") {
    const q = str(args.name).slice(0, 60);
    if (!q) return { error: "name required" };
    const rosters = await loadRosters(db);
    const hits = searchNbaStatsIndex(q, "player", 6, { rosters }).slice(0, 8);
    return {
      players: hits.map((h) => ({
        id: h.id,
        name: h.matchText ?? h.name,
        team: h.abbr,
      })),
    };
  }

  if (name === "get_games_on_date") {
    const date = resolveAskDate(str(args.date), timeZone);
    if (!date) return { error: "date must be today, tomorrow, yesterday, or YYYY-MM-DD" };
    const games = await loadGamesOnDate(db, date, timeZone);
    if (!games) return { error: "invalid date" };
    const pickupOnly = args.pickup_only === true || args.pickup_only === "true";
    const listed = games.filter(({ data }) => !pickupOnly || isNbaPickupGame(data));
    if (listed.length === 0) {
      return {
        found: false,
        webOk: false,
        date,
        pickupOnly,
        note: pickupOnly ? "No PICK UP game on this date" : "No game on this date",
      };
    }
    const records = await loadStandingsRecords(db);
    return {
      found: true,
      webOk: false,
      date,
      pickupOnly,
      games: listed.slice(0, 15).map(({ id, data }) => {
        const ctx = gameDocTeamContext(data);
        const live = normalizeLiveGameStatsDoc(data.liveStats);
        const score = getResolvedGameScore(data);
        const status = gameStatus(data, live?.phase ?? null);
        return {
          id,
          away: abbr(ctx.awayTeamId),
          home: abbr(ctx.homeTeamId),
          awayTeamId: ctx.awayTeamId,
          homeTeamId: ctx.homeTeamId,
          awayRecord: recordLine(records, ctx.awayTeamId, data.seasonPhase),
          homeRecord: recordLine(records, ctx.homeTeamId, data.seasonPhase),
          start: kickoffLabel(data, timeZone),
          pickup: isNbaPickupGame(data),
          score: score ? `${score.away}-${score.home}` : null,
          scoreHome: score && status !== "scheduled" ? score.home : null,
          scoreAway: score && status !== "scheduled" ? score.away : null,
          status,
          round: displayNbaRoundLabel(typeof data.roundLabel === "string" ? data.roundLabel : ""),
        };
      }),
    };
  }

  if (name === "get_player_game") {
    const playerId = str(args.player_id);
    const date = str(args.date);
    if (!playerId || !DATE_RE.test(date)) return { error: "player_id and date required" };
    const games = await loadGamesOnDate(db, date, timeZone, { box: true });
    if (!games) return { error: "invalid date" };
    for (const { id, data } of games) {
      const live = normalizeLiveGameStatsDoc(data.liveStats);
      if (!live) continue;
      const ctx = gameDocTeamContext(data);
      const sides = [
        { players: live.box.home, team: ctx.homeTeamId, opp: ctx.awayTeamId, home: true },
        { players: live.box.away, team: ctx.awayTeamId, opp: ctx.homeTeamId, home: false },
      ];
      for (const side of sides) {
        const p = side.players.find((x) => x.playerId === playerId);
        if (!p) continue;
        const score = getResolvedGameScore(data);
        return {
          found: true,
          gameId: id,
          date,
          team: abbr(side.team),
          opponent: abbr(side.opp),
          home: side.home,
          score: score ? `${abbr(ctx.awayTeamId)} ${score.away}-${score.home} ${abbr(ctx.homeTeamId)}` : null,
          status: gameStatus(data, live.phase),
          line: boxLine(p),
        };
      }
    }
    return { found: false, date, note: "No box score for this player on that date" };
  }

  if (name === "get_player_recent_games") {
    const playerId = str(args.player_id);
    if (!playerId) return { error: "player_id required" };
    const n = Math.min(10, Math.max(1, Number(args.last_n) || 5));
    const season = askSeason(args.season);
    if (typeof season !== "string") return season;
    const logs = await loadPlayerGameLogsSnapshot(db, season, playerId);
    if (logs.gameLogs.length === 0) {
      return { found: false, season: logs.season, note: "No game log" };
    }
    const recent = logs.gameLogs.slice(0, n);
    const dates = await gameDateKeysByBdlId(
      db,
      recent.map((g) => g.gameId).filter((id) => /^\d+$/.test(id)),
      timeZone
    );
    return {
      season: logs.season,
      games: recent.map((g) => ({
        date: dates.get(g.gameId) ?? null,
        opp: `${g.home ? "vs" : "@"} ${g.oppAbbr}`,
        result: g.result,
        min: g.min,
        pts: g.pts,
        reb: g.reb,
        ast: g.ast,
        stl: g.stl,
        blk: g.blk,
        fg: `${g.fgm}-${g.fga}`,
        fg3: `${g.fg3m}-${g.fg3a}`,
        ft: `${g.ftm}-${g.fta}`,
      })),
    };
  }

  if (name === "get_player_season_averages") {
    const playerId = str(args.player_id);
    if (!playerId) return { error: "player_id required" };
    const rosters = await loadRosters(db);
    for (const team of Object.values(rosters)) {
      const p = team.players.find((x) => String(x.id) === playerId);
      if (!p) continue;
      return {
        name: `${p.firstName} ${p.lastName}`.trim(),
        team: abbr(team.teamId),
        position: p.position,
        gp: p.gp,
        mpg: p.mpg,
        ppg: p.ppg,
        rpg: p.rpg ?? null,
        apg: p.apg ?? null,
        spg: p.spg ?? null,
        bpg: p.bpg ?? null,
        tpg: p.tpg ?? null,
        fgPct: p.fgPct ?? null,
        fg3Pct: p.fg3Pct ?? null,
      };
    }
    return { found: false };
  }

  if (name === "get_team_moves" || name === "get_team_injuries") {
    const team = await resolveTeam(db, str(args.team));
    if (!("teamId" in team)) return team;
    if (name === "get_team_moves") {
      const all = await loadMovesTeams(db);
      const row = all[team.teamId];
      return {
        team: abbr(team.teamId),
        note: "Season roster IN/OUT versus last season. Not moves from today.",
        liveNews: false,
        incoming: (row?.incoming ?? []).slice(0, MOVE_CAP).map(compactMove),
        outgoing: (row?.outgoing ?? []).slice(0, MOVE_CAP).map(compactMove),
      };
    }
    const season = askSeason(args.season);
    if (typeof season !== "string") return season;
    const injuries = await loadInjuryTeams(db, season);
    return {
      season,
      team: abbr(team.teamId),
      players: (injuries[team.teamId] ?? []).slice(0, MOVE_CAP).map((p) => ({
        name: p.name,
        status: p.status,
        reason: p.reason,
      })),
    };
  }

  if (name === "get_standings") {
    const season = askSeason(args.season);
    if (typeof season !== "string") return season;
    const snap = await db
      .collection(NBA_CONFERENCE_STANDINGS_COLLECTION)
      .doc(season)
      .get();
    const board = readStandingsBoard(snap.data());
    if (!board) return { found: false, note: "Standings snapshot is not ready" };
    const teamQ = str(args.team);
    if (teamQ) {
      const team = await resolveTeam(db, teamQ);
      if (!("teamId" in team)) return team;
      const row = [...board.east, ...board.west].find((r) => r.teamId === team.teamId);
      if (!row) return { found: false };
      return { season, conference: row.conference, ...compactStanding(row) };
    }
    const side = str(args.conference).toLowerCase();
    const rowsOf = (rows: NbaConferenceStandingsRow[]) =>
      (side === "east" || side === "west" ? rows : rows.slice(0, 8)).map(compactStanding);
    if (side === "east") return { season, east: rowsOf(board.east) };
    if (side === "west") return { season, west: rowsOf(board.west) };
    return {
      season,
      east: rowsOf(board.east),
      west: rowsOf(board.west),
      note: "Top 8 each. Pass conference=east or west for the full side.",
    };
  }

  if (name === "get_pro_insight") {
    const date = str(args.date);
    const team = str(args.team);
    if (!DATE_RE.test(date)) return { error: "date must be YYYY-MM-DD" };
    const games = await loadGamesOnDate(db, date, timeZone, { proInsight: true });
    if (!games) return { error: "invalid date" };
    const listed = games.map(({ id, data }) => {
      const ctx = gameDocTeamContext(data);
      return { id, data, ctx };
    });
    const matched = team
      ? listed.filter(
          (g) =>
            teamQueryHit(g.ctx.awayTeamId, g.ctx.awayName, team) ||
            teamQueryHit(g.ctx.homeTeamId, g.ctx.homeName, team)
        )
      : listed;
    if (matched.length !== 1) {
      return {
        date,
        games: (matched.length > 0 ? matched : listed).map((g) => ({
          gameId: g.id,
          away: abbr(g.ctx.awayTeamId),
          home: abbr(g.ctx.homeTeamId),
        })),
        note: "Specify team to load one game's Pro Insight",
      };
    }
    const game = matched[0]!;
    const stored = await loadGameProInsight(db, game.id, game.data);
    const brief = sanitizeProInsightNarrativeForDisplay(stored.proInsightNarrative);
    if (!brief) {
      return {
        found: false,
        date,
        away: abbr(game.ctx.awayTeamId),
        home: abbr(game.ctx.homeTeamId),
        note: "Pro Insight is not ready for this game",
      };
    }
    return { found: true, date, ...compactProInsight(brief, language) };
  }

  if (name === "get_pro_league_leaders") {
    const index = await loadGameDayIndex(db, {
      league: "nba",
      season: GAME_SCHEDULE_SEASON,
    });
    const dateKey = resolveLatestNbaSlateDateKey(index.startMs);
    const payload = await loadDailyScoreLeadersAdmin(db, {
      dateKey,
      timeZone: NBA_SLATE_TIME_ZONE,
    });
    const rows = await selectDailyScoreBoardRows(payload.boards.open, "open", db);
    const slateStarts = index.startMs.filter(
      (ms) => toDateKeyInTimeZone(new Date(ms), NBA_SLATE_TIME_ZONE) === payload.dateKey
    );
    return {
      date: slateStarts.length
        ? toDateKeyInTimeZone(new Date(Math.min(...slateStarts)), timeZone)
        : payload.dateKey,
      complete: payload.complete,
      leaders: rows.slice(0, PRO_LEAGUE_TOP_N).map((r) => ({
        rank: r.rank,
        name: r.displayName,
        points: r.points,
        wins: r.wins,
      })),
    };
  }

  if (name === "get_player_leaders") {
    const metric = str(args.metric) as NbaPlayerLeaderMetricId;
    if (!/^[a-z0-9_]{2,24}$/.test(metric)) return { error: "metric required" };
    const season = askSeason(args.season);
    if (typeof season !== "string") return season;
    const windowName = str(args.season_type) === "playoffs" ? "playoffs" : "season";
    const payload = await loadPlayerStatLeadersSnapshot(db, season);
    const rows = payload.bundle[windowName]?.[metric] ?? [];
    if (rows.length === 0) return { found: false, season, metric, note: "No leader snapshot" };
    const ranked = rows.slice(0, 8).map((row, index) => ({
      rank: index + 1,
      name: row.playerName,
      team: abbr(row.teamId),
      value: row.value,
    }));
    const teamQ = str(args.team);
    let teamRow: { rank: number; name: string; team: string; value: number } | null = null;
    if (teamQ) {
      const team = await resolveTeam(db, teamQ);
      if ("teamId" in team) {
        const index = rows.findIndex((row) => row.teamId === team.teamId);
        const row = index >= 0 ? rows[index] : undefined;
        if (row) {
          teamRow = {
            rank: index + 1,
            name: row.playerName,
            team: abbr(row.teamId),
            value: row.value,
          };
        }
      }
    }
    return {
      found: true,
      season,
      metric,
      seasonType: windowName,
      leader: ranked[0],
      leaders: ranked.slice(0, 5),
      ...(teamRow ? { team: teamRow } : {}),
    };
  }

  if (name === "get_team_stat") {
    const metric = str(args.metric) as NbaLeagueTeamStatMetric;
    if (!TEAM_STAT_METRICS.includes(metric as (typeof TEAM_STAT_METRICS)[number])) {
      return { error: "metric required" };
    }
    const season = askSeason(args.season);
    if (typeof season !== "string") return season;
    const windowName = str(args.season_type) === "playoffs" ? "playoffs" : "season";
    const payload = await loadLeagueTeamStatsSnapshot(db, season);
    const higherFirst = leagueMetricDef(metric).higherIsBetter;
    const worstFirst = str(args.order) === "worst";
    const rows = [...(payload.bundle[windowName] ?? [])].sort((a, b) => {
      const delta = metricValue(b, metric) - metricValue(a, metric);
      return higherFirst ? delta : -delta;
    });
    if (rows.length === 0) return { found: false, season, metric, note: "No team stat snapshot" };
    const pack = (row: (typeof rows)[number], rank: number) => ({
      rank,
      team: abbr(row.teamId),
      value: metricValue(row, metric),
    });
    const leader = pack(rows[0]!, 1);
    const teamQ = str(args.team);
    let teamRow: ReturnType<typeof pack> | null = null;
    if (teamQ) {
      const team = await resolveTeam(db, teamQ);
      if ("teamId" in team) {
        const index = rows.findIndex((row) => row.teamId === team.teamId);
        if (index >= 0) teamRow = pack(rows[index]!, index + 1);
      }
    }
    return {
      found: true,
      season,
      metric,
      seasonType: windowName,
      leader,
      ...(teamRow
        ? { team: teamRow }
        : worstFirst
          ? { worst: rows.slice(-5).reverse().map((row, index) => pack(row, rows.length - index)) }
          : { top: rows.slice(0, 5).map((row, index) => pack(row, index + 1)) }),
    };
  }

  if (name === "get_player_shot_zones") {
    const playerId = str(args.player_id);
    if (!playerId) return { error: "player_id required" };
    const season = askSeason(args.season);
    if (typeof season !== "string") return season;
    const payload = await loadPlayerShotZonesSnapshot(db, season, playerId);
    if (payload.shotZones.length === 0) {
      return { found: false, webOk: false, season, note: "No shot zone snapshot" };
    }
    return {
      found: true,
      webOk: false,
      season,
      zones: payload.shotZones.map((z) => ({
        zone: z.label || z.short,
        fgPct: z.fgPct,
        fga: z.fga,
      })),
    };
  }

  if (name === "get_player_contract") {
    const playerId = str(args.player_id);
    if (!playerId) return { error: "player_id required" };
    const season = askSeason(args.season);
    if (typeof season !== "string") return season;
    const payload = await loadPlayerContractSnapshot(db, season, playerId);
    const contract = payload.contract;
    if (!contract) return { found: false, webOk: false, season, note: "No contract snapshot" };
    return {
      found: true,
      webOk: false,
      season,
      yearsRemaining: contract.yearsRemaining,
      freeAgencyYear: contract.freeAgencyYear,
      freeAgencyType: contract.freeAgencyType,
      averageSalary: contract.averageSalary,
      seasons: contract.seasons.slice(0, 6).map((row) => ({
        season: formatContractSeasonLabel(row.season),
        salary: row.baseSalary,
        team: row.teamAbbr,
        ...(row.option ? { option: row.option } : {}),
      })),
      ...(contract.deadSalary
        ? {
            deadSalary: {
              team: contract.deadSalary.teamAbbr,
              salary: contract.deadSalary.salary,
              season: formatContractSeasonLabel(contract.deadSalary.season),
            },
          }
        : {}),
    };
  }

  if (name === "get_player_career") {
    const playerId = str(args.player_id);
    if (!playerId) return { error: "player_id required" };
    const payload = await loadPlayerCareerSeasonsSnapshot(db, playerId);
    const windowName = str(args.season_type) === "playoffs" ? "playoffs" : "regular";
    let rows = [...payload.careerSeasons[windowName]].sort((a, b) => b.seasonStart - a.seasonStart);
    const seasonKey = str(args.season);
    if (seasonKey) {
      const start = Number.parseInt(seasonKey.slice(0, 4), 10);
      rows = rows.filter((row) => row.seasonStart === start);
    }
    rows = rows.slice(0, 8);
    if (rows.length === 0) {
      return { found: false, webOk: false, note: "No career snapshot" };
    }
    return {
      found: true,
      webOk: false,
      name: payload.playerName,
      perGame: true,
      seasonType: windowName,
      seasons: rows.map((row) => ({
        season: formatCareerSeasonLabel(row.seasonStart),
        team: row.teamAbbr,
        gp: row.games,
        pts: row.pts,
        reb: row.reb,
        ast: row.ast,
      })),
    };
  }

  if (name === "get_team_shapes") {
    const team = await resolveTeam(db, str(args.team));
    if (!("teamId" in team)) return team;
    const season = askSeason(args.season);
    if (typeof season !== "string") return season;
    const bundle = await loadTeamShapeRecordsBundle(db, season);
    const record = bundle?.teams[team.teamId];
    const edges = selectTeamShapeEdges(record);
    if (!record || edges.length === 0) {
      return { found: false, webOk: false, season, note: "No shape meets the screen cutoff yet" };
    }
    const lang = resolveLocalizedLang(language);
    return {
      found: true,
      webOk: false,
      season,
      team: abbr(team.teamId),
      record: `${record.overall.wins}-${record.overall.losses}`,
      shapes: edges.map((edge) => ({
        kind: edge.kind === "strength" ? "strong" : "weak",
        label: resolveTeamShapeLabel(edge.split.shapeId, lang),
        w: edge.split.when.wins,
        l: edge.split.when.losses,
        games: edge.split.games,
      })),
    };
  }

  if (name === "get_discipline") {
    const season = askSeason(args.season);
    if (typeof season !== "string") return season;
    const phase = str(args.season_type) === "playoffs" ? "playoffs" : "regular";
    const playerId = str(args.player_id);
    const teamQ = str(args.team);
    if (!playerId && !teamQ) return { error: "player_id or team required" };
    if (playerId) {
      const slice = await loadPlayerDisciplineSlice(db, season, playerId);
      if (!slice) return { found: false, webOk: false, season, note: "No discipline snapshot" };
      const counts = slice[phase];
      return {
        found: true,
        webOk: false,
        season,
        seasonType: phase,
        tech: counts.tech,
        flag: counts.flag,
        eject: counts.eject,
        suspensions: counts.susp,
        fineUsd: counts.fines,
      };
    }
    const team = await resolveTeam(db, teamQ);
    if (!("teamId" in team)) return team;
    const slice = await loadTeamDisciplineSlice(db, season, team.teamId);
    if (!slice) return { found: false, webOk: false, season, note: "No discipline snapshot" };
    const counts = slice[phase];
    const players = (slice.players ?? [])
      .map((p) => {
        const row = p[phase];
        return { name: p.name, tech: row.tech, flag: row.flag, eject: row.eject };
      })
      .filter((p) => p.tech + p.flag + p.eject > 0)
      .sort((a, b) => b.tech + b.flag + b.eject - (a.tech + a.flag + a.eject))
      .slice(0, 5);
    return {
      found: true,
      webOk: false,
      season,
      seasonType: phase,
      team: abbr(team.teamId),
      tech: counts.tech,
      flag: counts.flag,
      eject: counts.eject,
      suspensions: counts.susp,
      fineUsd: counts.fines,
      ...(players.length > 0 ? { players } : {}),
    };
  }

  if (name === "get_daily_leaders") {
    const metric = (str(args.metric) || "pts") as DailyLeaderStatKey;
    if (!DAILY_LEADER_METRICS.includes(metric as (typeof DAILY_LEADER_METRICS)[number])) {
      return { error: "metric required" };
    }
    let date = str(args.date);
    if (!date) {
      const index = await loadGameDayIndex(db, { league: "nba", season: GAME_SCHEDULE_SEASON });
      date = resolveLatestNbaSlateDateKey(index.startMs);
    }
    if (!DATE_RE.test(date)) return { error: "date must be YYYY-MM-DD" };
    const payload = await loadDailyLeadersAdmin(db, { dateKey: date, timeZone: NBA_SLATE_TIME_ZONE });
    const leaders = (payload.boards[metric] ?? []).slice(0, 5).map((row, index) => ({
      rank: index + 1,
      name: `${row.firstName} ${row.lastName}`.trim(),
      team: row.teamAbbr,
      value: row.value,
    }));
    if (leaders.length === 0) return { found: false, webOk: false, date, metric, note: "No box scores that day" };
    return { found: true, webOk: false, date, metric, leaders };
  }

  return { error: `unknown tool ${name}` };
}
