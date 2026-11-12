/**
 * NBA の質問の答えを組む。数字はすべて Firestore スナップショットから（BDL・AI は使わない）。
 * 文は決まった型だけ。日本語以外は英語の型で返す。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY, previousNbaSeasonKey } from "@/lib/rankings/nbaSeason";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { Timestamp } from "firebase-admin/firestore";
import { gameDocTeamContext, normalizeLiveGameStatsDoc } from "@/lib/games/liveGameStats";
import { getResolvedGameScore } from "@/lib/games/transform";
import { toDateKeyInTimeZone } from "@/lib/time/zonedTime";
import { nbaGameDocIdFromBdlId } from "@/lib/nba/bdl/mapBdlGameToNbaGameDoc";
import { formatNbaPlayerListName } from "@/lib/nba/formatNbaPlayerListName";
import { loadPlayerGameLogsSnapshot } from "@/lib/nba/playerGameLogs/loadPlayerGameLogsSnapshot";
import { loadTeamGameLogDetail } from "@/lib/nba/teamGameLog/loadTeamGameLogDetail";
import { loadNbaLeagueHubSnapshot } from "@/lib/nba/leagueHub/loadNbaLeagueHubSnapshot";
import { loadTeamPayroll, loadTeamPayrollsSnapshot } from "@/lib/nba/teamPayroll/loadTeamPayrollSnapshot";
import { loadPlayerStatLeadersSnapshot } from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import { loadLeagueTeamStatsSnapshot } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import { leagueMetricDef, type NbaLeagueTeamStatMetric } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { loadPlayerSeasonMetricsSnapshot } from "@/lib/nba/playerSeasonMetrics/loadPlayerSeasonMetricsSnapshot";
import { getNbaTeamDraftCapital } from "@/lib/nba/draftPicks/nbaDraftCapitalData";
import {
  LEAGUE_HUB_PLAYER_SCATTER_PRESETS,
  LEAGUE_HUB_TEAM_ATTACK,
  LEAGUE_HUB_TEAM_CLUTCH,
  LEAGUE_HUB_TEAM_CONTEST,
  LEAGUE_HUB_TEAM_DRIVE_FINISH,
  LEAGUE_HUB_TEAM_HUSTLE,
  LEAGUE_HUB_TEAM_PASS_VALUE,
  LEAGUE_HUB_TEAM_REBOUND,
  LEAGUE_HUB_TEAM_SCREEN,
  LEAGUE_HUB_TEAM_SHOT_ALLOW,
  LEAGUE_HUB_TEAM_SHOT_CREATION,
  LEAGUE_HUB_TEAM_SHOT_DEFENSE,
  LEAGUE_HUB_TEAM_STRENGTH,
  LEAGUE_HUB_TEAM_TEMPO,
  LEAGUE_HUB_TEAM_THREE,
  LEAGUE_HUB_TEAM_TURNOVER,
  type LeagueHubScatterPreset,
} from "@/lib/nba/leagueHub/leagueHubScatterPresets";
import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { NBA_ASK_PLAYER_STAT_WORDS, NBA_ASK_TEAM_STAT_WORDS, nbaAskIsPctStat, nbaAskStatWord } from "./nbaAskStatWords";
import { NBA_CONFERENCE_STANDINGS_COLLECTION } from "@/lib/nba/standings/loadNbaConferenceStandings";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import {
  abbr,
  gameDateKeysByBdlId,
  loadRosters,
  readStandingsBoard,
  resolveAskDate,
  runNbaAskTool,
} from "./nbaAskTools";
import { gamesFromAskTool, type NbaAskBoard, type NbaAskGameCard } from "./nbaAskBoard";
import type { NbaAskDestinationId } from "./nbaAskDestinations";
import type { NbaAskIntent, NbaAskMetric } from "./nbaAskIntent";
import { pickNbaAskPlayer, resolveNbaAskPlayer, type NbaAskPlayerHit } from "./nbaAskPlayerResolve";
import { nbaAskTeamJaName, resolveNbaAskTeamId } from "./nbaAskTeamNames";
import { countryJa, injuryReasonJa, positionJa } from "./nbaAskJa";

export type NbaAskAnswer = {
  answer: string;
  board: NbaAskBoard | null;
  games: NbaAskGameCard[] | null;
  opens: NbaAskDestinationId[];
  /** スタッツの質問として数える（無料枠） */
  usedStats: boolean;
  promptTokens?: number;
  completionTokens?: number;
};

export type NbaAskNbaContext = {
  db: Firestore;
  language: string;
  timeZone: string;
  uid: string;
  /** 元の質問文（news の検索語が無いとき） */
  question: string;
};

/** 試合一覧（スケジュール）は無料枠を使い切っても答える */
export const NBA_ASK_SCHEDULE_QUERIES: ReadonlySet<string> = new Set(["games_on_date", "who_wins", "news", "unsupported"]);
export const NBA_ASK_PRO_QUERIES: ReadonlySet<string> = new Set(["pro_insight", "pro_league"]);

const ja = (lang: string) => lang === "ja";
const T = (lang: string, jaText: string, enText: string) => (ja(lang) ? jaText : enText);

function text(answer: string, usedStats = true): NbaAskAnswer {
  return { answer, board: null, games: null, opens: [], usedStats };
}

function boardAnswer(answer: string, board: NbaAskBoard, usedStats = true): NbaAskAnswer {
  return { answer, board, games: null, opens: [], usedStats };
}

const COLUMN: Record<string, { ja: string; en: string }> = {
  min: { ja: "出場分", en: "MIN" },
  pts: { ja: "得点", en: "PTS" },
  reb: { ja: "リバウンド", en: "REB" },
  ast: { ja: "アシスト", en: "AST" },
  stl: { ja: "スティール", en: "STL" },
  blk: { ja: "ブロック", en: "BLK" },
  tov: { ja: "ターンオーバー", en: "TOV" },
  fg3m: { ja: "3P成功", en: "3PM" },
  ppg: { ja: "得点", en: "PPG" },
  papg: { ja: "失点", en: "OPP PPG" },
  pace: { ja: "ペース", en: "PACE" },
  netrtg: { ja: "NET", en: "NET" },
  ortg: { ja: "OFF", en: "ORTG" },
  drtg: { ja: "DEF", en: "DRTG" },
  diff: { ja: "得失点差", en: "DIFF" },
  rank: { ja: "順位", en: "RANK" },
  w: { ja: "勝", en: "W" },
  l: { ja: "敗", en: "L" },
  salary: { ja: "年俸", en: "SALARY" },
  fgPct: { ja: "FG%", en: "FG%" },
  fga: { ja: "試投", en: "FGA" },
  tech: { ja: "テクニカル", en: "TECH" },
  flag: { ja: "フラグラント", en: "FLAG" },
  eject: { ja: "退場", en: "EJECT" },
  result: { ja: "結果", en: "RESULT" },
  score: { ja: "スコア", en: "SCORE" },
  remaining: { ja: "あと", en: "TO GO" },
  gamesAway: { ja: "試合", en: "GAMES" },
  points: { ja: "ポイント", en: "POINTS" },
};

const col = (lang: string, key: string) => (ja(lang) ? COLUMN[key]?.ja : COLUMN[key]?.en) ?? key;
const cols = (lang: string, keys: string[]) => keys.map((k) => col(lang, k));

function num(v: unknown): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  return Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1);
}

function pct(v: unknown): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  return `${(v > 1 ? v : v * 100).toFixed(1)}%`;
}

function signed(v: unknown): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  const s = num(v);
  return v > 0 ? `+${s}` : s;
}

function money(v: unknown): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString("en-US")}`;
}

/** 2026-11-10 → 11月10日 / Nov 10 */
function teamJa(teamId: string): string {
  return nbaAskTeamJaName(teamId) ?? abbr(teamId);
}

/** 略称（BOS）→ 日本語ではチーム名（セルティックス） */
function teamNameFromAbbr(code: string, lang: string): string {
  if (!ja(lang)) return code;
  const id = resolveNbaAskTeamId(code);
  return (id && nbaAskTeamJaName(id)) || code;
}

/** 文中の略称（DEN 100-110 HOU）をチーム名に */
function abbrsToJa(text: string, lang: string): string {
  if (!ja(lang)) return text;
  return text.replace(/\b[A-Z]{2,4}\b/g, (code) => {
    const id = resolveNbaAskTeamId(code);
    return (id && nbaAskTeamJaName(id)) || code;
  });
}

function vsLabel(home: boolean | undefined, oppAbbr: string, lang: string): string {
  return `${home ? "vs" : "@"} ${teamNameFromAbbr(oppAbbr, lang)}`;
}

function dateLabel(dateKey: string | null | undefined, lang: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey ?? ""));
  if (!m) return "";
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (ja(lang)) return `${month}月${day}日`;
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[month - 1]} ${day}`;
}

function shiftDateKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function resultWord(result: unknown, lang: string): string {
  if (result === "W") return T(lang, "勝ち", "W");
  if (result === "L") return T(lang, "負け", "L");
  return "";
}

function shortName(hit: { name: string; playerId: string }): string {
  return formatNbaPlayerListName(hit.name, hit.playerId);
}

function asRows(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v)
    ? v.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    : [];
}

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

// ---------------------------------------------------------------------------
// 誰・どのチーム
// ---------------------------------------------------------------------------

async function needPlayer(
  ctx: NbaAskNbaContext,
  intent: NbaAskIntent
): Promise<{ hit: NbaAskPlayerHit } | { reply: NbaAskAnswer }> {
  const lang = ctx.language;
  if (!intent.player) {
    return { reply: text(T(lang, "どの選手のことか、名前を入れてもう一度聞いてください。", "Which player? Ask again with the player's name."), false) };
  }
  const rosters = await loadRosters(ctx.db);
  const teamId = resolveNbaAskTeamId(intent.team);
  const found = pickNbaAskPlayer(rosters, intent.player, intent.player_written, teamId);
  if (found.kind === "one") return { hit: found.hit };
  if (found.kind === "many") {
    const list = found.hits.map((h) => `${h.name}（${ja(lang) ? teamJa(h.teamId) : abbr(h.teamId)}）`).join("、");
    return {
      reply: text(
        T(lang, `同じ名前の選手が複数います: ${list}。フルネームで聞いてください。`, `Several players match: ${list}. Ask with the full name.`),
        false
      ),
    };
  }
  return {
    reply: text(
      T(
        lang,
        `「${intent.player}」は今季のロスターに見つかりませんでした。答えられるのは今季 NBA に在籍している選手だけで、引退した選手や今季所属のない選手のデータはありません。`,
        `"${intent.player}" is not on a current roster. Only players on this season's rosters are covered; retired or unsigned players are not.`
      ),
      false
    ),
  };
}

function needTeam(ctx: NbaAskNbaContext, intent: NbaAskIntent): { teamId: string } | { reply: NbaAskAnswer } {
  const teamId = resolveNbaAskTeamId(intent.team);
  if (teamId) return { teamId };
  return {
    reply: text(T(ctx.language, "どのチームのことか、チーム名を入れてもう一度聞いてください。", "Which team? Ask again with the team name."), false),
  };
}

/** 過去季の指定。2020-21 より前は持っていない */
function seasonOf(intent: NbaAskIntent): string {
  const s = intent.season ?? "";
  return /^20\d{2}-\d{2}$/.test(s) ? s : CURRENT_NBA_SEASON_KEY;
}

// ---------------------------------------------------------------------------
// 選手
// ---------------------------------------------------------------------------

const FRESH_GAME_FIELDS = [
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
  "liveStats",
] as const;

type FreshLine = {
  dateKey: string;
  opp: string;
  home: boolean;
  score: string | null;
  won: boolean | null;
  live: boolean;
  line: {
    min: string;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
    fg: string;
    fg3: string;
    ft: string;
    pm: number | null;
  };
};

/**
 * 試合ログは試合後の取り込みで入る。終わった直後・試合中は、直近 30 時間の試合の box を見る
 * （まず開始時刻とチームだけ読み、その選手のチームの試合だけ box を読む）。
 */
async function freshBoxLine(
  ctx: NbaAskNbaContext,
  teamId: string,
  playerId: string,
  knownDocId: string | null
): Promise<FreshLine | null> {
  const now = Date.now();
  const hour = 3600 * 1000;
  const snap = await ctx.db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", GAME_SCHEDULE_SEASON)
    .where("startAtJst", ">=", Timestamp.fromMillis(now - 30 * hour))
    .where("startAtJst", "<", Timestamp.fromMillis(now))
    .orderBy("startAtJst", "desc")
    .limit(30)
    .select("home", "away", "homeTeamId", "awayTeamId", "liveStats.phase")
    .get();
  const mine = snap.docs.find((d) => {
    const ctxTeams = gameDocTeamContext(d.data() as Record<string, unknown>);
    const phase = (d.get("liveStats.phase") as unknown) ?? null;
    return (
      (ctxTeams.homeTeamId === teamId || ctxTeams.awayTeamId === teamId) &&
      (phase === "live" || phase === "final")
    );
  });
  if (!mine || mine.id === knownDocId) return null;
  const [full] = await ctx.db.getAll(ctx.db.collection("games").doc(mine.id), {
    fieldMask: [...FRESH_GAME_FIELDS],
  });
  const data = (full?.data() ?? null) as Record<string, unknown> | null;
  if (!data) return null;
  const live = normalizeLiveGameStatsDoc(data.liveStats);
  if (!live) return null;
  const teams = gameDocTeamContext(data);
  const isHome = teams.homeTeamId === teamId;
  const p = (isHome ? live.box.home : live.box.away).find((x) => x.playerId === playerId);
  if (!p) return null;
  const start = (data.startAtJst as { toDate?: () => Date } | undefined)?.toDate?.();
  const score = getResolvedGameScore(data);
  const mineScore = score ? (isHome ? score.home : score.away) : null;
  const oppScore = score ? (isHome ? score.away : score.home) : null;
  return {
    dateKey: start ? toDateKeyInTimeZone(start, ctx.timeZone) : "",
    opp: abbr(isHome ? teams.awayTeamId : teams.homeTeamId),
    home: isHome,
    score: mineScore != null && oppScore != null ? `${mineScore}-${oppScore}` : null,
    won: live.phase === "final" && mineScore != null && oppScore != null ? mineScore > oppScore : null,
    live: live.phase === "live",
    line: {
      min: String(p.min ?? ""),
      pts: p.pts,
      reb: p.reb,
      ast: p.ast,
      stl: p.stl,
      blk: p.blk,
      tov: p.tov,
      fg: String(p.fg ?? ""),
      fg3: String(p.fg3 ?? ""),
      ft: String(p.ft ?? ""),
      pm: typeof p.plusMinus === "number" ? p.plusMinus : null,
    },
  };
}

function gameLineNote(lang: string, l: FreshLine["line"]): string {
  return [
    l.min ? T(lang, `${l.min}分`, `${l.min} MIN`) : "",
    l.fg ? `FG ${l.fg}` : "",
    l.fg3 ? `3P ${l.fg3}` : "",
    l.ft ? `FT ${l.ft}` : "",
    `STL ${l.stl} BLK ${l.blk} TO ${l.tov}`,
    l.pm != null ? `+/- ${signed(l.pm)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

async function playerLastGame(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  let season = CURRENT_NBA_SEASON_KEY;
  let logs = await loadPlayerGameLogsSnapshot(ctx.db, season, hit.playerId);
  const latest = logs.gameLogs[0] ?? null;
  const knownDocId = latest && /^\d+$/.test(latest.gameId) ? nbaGameDocIdFromBdlId(Number(latest.gameId)) : null;
  const fresh = await freshBoxLine(ctx, hit.teamId, hit.playerId, knownDocId).catch(() => null);
  const who = `${hit.name}（${teamJa(hit.teamId)}）`;
  if (fresh) {
    const vs = vsLabel(fresh.home, fresh.opp, lang);
    const outcome = fresh.live
      ? T(lang, "試合中", "LIVE")
      : fresh.won == null
        ? ""
        : resultWord(fresh.won ? "W" : "L", lang);
    return boardAnswer(
      T(
        lang,
        `${who}の${fresh.live ? "今の試合" : "前回の試合"}: ${dateLabel(fresh.dateKey, lang)} ${vs} ${outcome} ${fresh.score ?? ""}`.trim(),
        `${hit.name} (${abbr(hit.teamId)}) ${fresh.live ? "live now" : "last game"}: ${dateLabel(fresh.dateKey, lang)} ${vs} ${outcome} ${fresh.score ?? ""}`.trim()
      ),
      {
        columns: cols(lang, ["pts", "reb", "ast"]),
        rows: [{ label: `${dateLabel(fresh.dateKey, lang)} ${vs}`, cells: [num(fresh.line.pts), num(fresh.line.reb), num(fresh.line.ast)] }],
        note: gameLineNote(lang, fresh.line),
      }
    );
  }
  if (!latest) {
    season = previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY);
    logs = await loadPlayerGameLogsSnapshot(ctx.db, season, hit.playerId);
  }
  const g = logs.gameLogs[0];
  if (!g) {
    return text(T(lang, `${who}の試合記録はまだありません。`, `No game log for ${hit.name} yet.`));
  }
  const dates = await gameDateKeysByBdlId(ctx.db, /^\d+$/.test(g.gameId) ? [g.gameId] : [], ctx.timeZone);
  const dk = dates.get(g.gameId) ?? null;
  const vs = vsLabel(g.home, g.oppAbbr, lang);
  const when = dk ? dateLabel(dk, lang) : g.dateLabel;
  const seasonNote = season !== CURRENT_NBA_SEASON_KEY ? T(lang, `（${season} シーズン）`, ` (${season})`) : "";
  return boardAnswer(
    T(
      lang,
      `${who}の前回の試合${seasonNote}: ${when} ${vs} ${resultWord(g.result, lang)}`,
      `${hit.name} (${abbr(hit.teamId)}) last game${seasonNote}: ${when} ${vs} ${resultWord(g.result, lang)}`
    ),
    {
      columns: cols(lang, ["pts", "reb", "ast"]),
      rows: [{ label: `${when} ${vs}`, cells: [num(g.pts), num(g.reb), num(g.ast)] }],
      note: gameLineNote(lang, {
        min: String(g.min ?? ""),
        pts: g.pts,
        reb: g.reb,
        ast: g.ast,
        stl: g.stl,
        blk: g.blk,
        tov: g.tov,
        fg: `${g.fgm}-${g.fga}`,
        fg3: `${g.fg3m}-${g.fg3a}`,
        ft: `${g.ftm}-${g.fta}`,
        pm: typeof g.plusMinus === "number" ? g.plusMinus : null,
      }),
    }
  );
}

async function playerGameOnDate(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const asked = resolveAskDate(intent.date ?? "", ctx.timeZone);
  if (!asked) return text(T(lang, "日付が読み取れませんでした。", "Couldn't read the date."), false);
  let date = asked;
  let r = asObj(await runNbaAskTool(ctx.db, "get_player_game", { player_id: hit.playerId, date }, lang, ctx.timeZone));
  if (!r || r.found !== true) {
    // 米国の夜の試合は東アジアでは翌日。米国の日付で聞かれたとき用
    const next = shiftDateKey(asked, 1);
    const r2 = asObj(await runNbaAskTool(ctx.db, "get_player_game", { player_id: hit.playerId, date: next }, lang, ctx.timeZone));
    if (r2 && r2.found === true) {
      r = r2;
      date = next;
    }
  }
  const line = asObj(r?.line);
  if (!r || r.found !== true || !line) {
    return text(T(lang, `${dateLabel(date, lang)}、${hit.name} の出場記録はありません。`, `${hit.name} has no box score on ${dateLabel(date, lang)}.`));
  }
  const vs = vsLabel(r.home === true, String(r.opponent ?? ""), lang);
  return boardAnswer(
    T(lang, `${hit.name}（${teamJa(hit.teamId)}）${dateLabel(date, lang)} ${vs} ${abbrsToJa(String(r.score ?? ""), lang)}`, `${hit.name} (${abbr(hit.teamId)}) ${dateLabel(date, lang)} ${vs} ${String(r.score ?? "")}`).trim(),
    {
      columns: cols(lang, ["pts", "reb", "ast"]),
      rows: [{ label: `${dateLabel(date, lang)} ${vs}`, cells: [num(line.pts), num(line.reb), num(line.ast)] }],
      note: gameLineNote(lang, {
        min: String(line.min ?? ""),
        pts: Number(line.pts),
        reb: Number(line.reb),
        ast: Number(line.ast),
        stl: Number(line.stl),
        blk: Number(line.blk),
        tov: Number(line.tov),
        fg: String(line.fg ?? ""),
        fg3: String(line.fg3 ?? ""),
        ft: String(line.ft ?? ""),
        pm: typeof line.pm === "number" ? line.pm : null,
      }),
    }
  );
}

async function playerRecentGames(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const n = intent.count ?? 5;
  let season = seasonOf(intent);
  let r = asObj(await runNbaAskTool(ctx.db, "get_player_recent_games", { player_id: hit.playerId, last_n: n, season }, lang, ctx.timeZone));
  if ((!r || r.found === false) && !intent.season) {
    season = previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY);
    r = asObj(await runNbaAskTool(ctx.db, "get_player_recent_games", { player_id: hit.playerId, last_n: n, season }, lang, ctx.timeZone));
  }
  const games = asRows(r?.games);
  if (games.length === 0) return text(T(lang, `${hit.name} の試合記録はまだありません。`, `No game log for ${hit.name} yet.`));
  const avg = (k: string) => games.reduce((s, g) => s + Number(g[k] ?? 0), 0) / games.length;
  return boardAnswer(
    T(
      lang,
      `${hit.name}（${teamJa(hit.teamId)}）直近${games.length}試合${season !== CURRENT_NBA_SEASON_KEY ? `（${season}）` : ""}: 平均 ${num(avg("pts"))}点 ${num(avg("reb"))}リバウンド ${num(avg("ast"))}アシスト`,
      `${hit.name} (${abbr(hit.teamId)}) last ${games.length}${season !== CURRENT_NBA_SEASON_KEY ? ` (${season})` : ""}: ${num(avg("pts"))} PTS ${num(avg("reb"))} REB ${num(avg("ast"))} AST`
    ),
    {
      columns: cols(lang, ["min", "pts", "reb", "ast"]),
      rows: games.map((g) => ({
        label: `${dateLabel(String(g.date ?? ""), lang)} ${abbrsToJa(String(g.opp ?? ""), lang)} ${ja(lang) ? (g.result === "W" ? "勝" : g.result === "L" ? "敗" : "") : String(g.result ?? "")}`.trim(),
        cells: [num(g.min), num(g.pts), num(g.reb), num(g.ast)],
      })),
    }
  );
}

async function playerSeason(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const p = hit.player;
  const season = p.averagesSeasonKey || CURRENT_NBA_SEASON_KEY;
  if (!p.gp) return text(T(lang, `${hit.name} はまだ出場がありません。`, `${hit.name} has not played yet.`));
  const note = [
    T(lang, `${p.gp}試合`, `${p.gp} GP`),
    T(lang, `${num(p.mpg)}分`, `${num(p.mpg)} MIN`),
    p.fgPct != null ? `FG ${pct(p.fgPct)}` : "",
    p.fg3Pct != null ? `3P ${pct(p.fg3Pct)}` : "",
    p.ftPct != null ? `FT ${pct(p.ftPct)}` : "",
    `STL ${num(p.spg)} BLK ${num(p.bpg)} TO ${num(p.tpg)}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const prior = season !== CURRENT_NBA_SEASON_KEY;
  const hits = SEASON_FOCUS.filter(([re]) => re.test(ctx.question));
  const focus = hits.length === 1 || (hits.length === 2 && hits[0]![2] !== "FG%" && hits[1]![2] === "FG%") ? hits[0] : undefined;
  let focusText = focus ? `${ja(lang) ? focus[1] : focus[2]} ${focus[3](p)}` : "";
  /** リーグ順位（と上級スタッツ）は全出場選手のメトリクス doc から */
  const word = nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, ctx.question);
  let countStat = false;
  if (word && !(hits.length >= 2 && !focus)) {
    countStat = /^(?:games_|double_|triple_)/.test(word.id);
    const c = countStat
      ? await countFromLogs(ctx, season, hit.playerId, word.id)
      : (await loadPlayerSeasonMetricsSnapshot(ctx.db, season, hit.playerId)).metrics[word.id as NbaPlayerLeaderMetricId];
    if (c && typeof c.value === "number") {
      const rank = c.rank ? T(lang, `・リーグ${c.rank}位`, `, #${c.rank} in the league`) : "";
      focusText = `${ja(lang) ? word.ja : word.en} ${statValueText(word.id, c.value)}${countStat ? T(lang, "回", "") : ""}${rank}`;
    } else countStat = false;
  }
  return boardAnswer(
    T(
      lang,
      `${hit.name}（${teamJa(hit.teamId)}）${season} の${focusText ? `${focusText}（${p.gp}試合${countStat ? "" : "の平均"}）` : "平均"}${prior ? "（今季はまだ出場なし）" : ""}`,
      `${hit.name} (${abbr(hit.teamId)}) ${season} ${focusText ? `${focusText} (${p.gp} games${countStat ? "" : ", average"})` : "averages"}${prior ? " (no games this season yet)" : ""}`
    ),
    {
      columns: cols(lang, ["pts", "reb", "ast"]),
      rows: [{ label: season, cells: [num(p.ppg), num(p.rpg), num(p.apg)] }],
      note,
    }
  );
}

/** 「ブロック何本」「FT%」など1項目だけ聞かれたら見出しに出す */
const SEASON_FOCUS: ReadonlyArray<[RegExp, string, string, (p: NbaRosterPlayer) => string]> = [
  [/フリースロー|\bFT/i, "FT成功率", "FT%", (p) => pct(p.ftPct)],
  [/スリー|3P|3ポイント|3pt|three/i, "3P成功率", "3P%", (p) => pct(p.fg3Pct)],
  [/FG|フィールドゴール|シュート率|成功率/i, "FG成功率", "FG%", (p) => pct(p.fgPct)],
  [/ブロック|\bblk|blocks?/i, "ブロックは1試合", "BLK", (p) => num(p.bpg)],
  [/スティール|\bstl|steals?/i, "スティールは1試合", "STL", (p) => num(p.spg)],
  [/ターンオーバー|\btov?\b|turnovers?/i, "ターンオーバーは1試合", "TOV", (p) => num(p.tpg)],
  [/リバウンド|\breb|rebounds?/i, "リバウンドは1試合", "REB", (p) => num(p.rpg)],
  [/アシスト|\bast|assists?/i, "アシストは1試合", "AST", (p) => num(p.apg)],
  [/得点|何点|\bpts|points?/i, "得点は1試合", "PTS", (p) => num(p.ppg)],
  [/出場時間|何分|minutes?/i, "出場時間（分）は1試合", "MIN", (p) => num(p.mpg)],
];

/** ダブルダブル・20点以上などの回数は試合ログから数える（メトリクス doc には無い）。順位はリーダー表に居るときだけ */
async function countFromLogs(ctx: NbaAskNbaContext, season: string, playerId: string, id: string): Promise<{ value: number; rank: number }> {
  const logs = (await loadPlayerGameLogsSnapshot(ctx.db, season, playerId)).gameLogs.filter((g) => g.min > 0);
  const tens = (g: (typeof logs)[number]) => [g.pts, g.reb, g.ast, g.stl, g.blk].filter((v) => v >= 10).length;
  const hit = (g: (typeof logs)[number]) =>
    id === "triple_doubles" ? tens(g) >= 3 : id === "double_doubles" ? tens(g) >= 2 : id === "games_30pts" ? g.pts >= 30 : g.pts >= 20;
  const leaders = (await loadPlayerStatLeadersSnapshot(ctx.db, season)).bundle.season?.[id as NbaPlayerLeaderMetricId] ?? [];
  const i = leaders.findIndex((r) => r.playerId === playerId);
  return { value: logs.filter(hit).length, rank: i >= 0 ? i + 1 : 0 };
}

async function playerLogs(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit, intent: NbaAskIntent) {
  let season = seasonOf(intent);
  let logs = (await loadPlayerGameLogsSnapshot(ctx.db, season, hit.playerId)).gameLogs;
  if (logs.length === 0 && !intent.season) {
    season = previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY);
    logs = (await loadPlayerGameLogsSnapshot(ctx.db, season, hit.playerId)).gameLogs;
  }
  return { season, logs: logs.filter((g) => g.min > 0) };
}

/** ホーム / アウェー、特定の相手との試合 */
async function playerSplits(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const { season, logs } = await playerLogs(ctx, hit, intent);
  if (logs.length === 0) return text(T(lang, `${hit.name} の試合記録はまだありません。`, `No game log for ${hit.name} yet.`));
  const oppId = resolveNbaAskTeamId(intent.opponent);
  const groups: Array<[string, typeof logs]> = oppId
    ? [[T(lang, `対${teamJa(oppId)}`, `vs ${abbr(oppId)}`), logs.filter((g) => g.oppTeamId === oppId)]]
    : [
        [T(lang, "ホーム", "Home"), logs.filter((g) => g.home)],
        [T(lang, "アウェー", "Away"), logs.filter((g) => !g.home)],
      ];
  const rows = groups
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => {
      const avg = (k: "pts" | "reb" | "ast") => list.reduce((sum, g) => sum + g[k], 0) / list.length;
      const fgm = list.reduce((sum, g) => sum + g.fgm, 0);
      const fga = list.reduce((sum, g) => sum + g.fga, 0);
      return { label: `${label} ${list.length}${T(lang, "試合", "G")}`, cells: [num(avg("pts")), num(avg("reb")), num(avg("ast")), fga ? pct(fgm / fga) : "—"] };
    });
  const seasonNote = season !== CURRENT_NBA_SEASON_KEY ? `（${season}）` : "";
  if (rows.length === 0) {
    return text(T(lang, `${hit.name} は${season}に${oppId ? `${teamJa(oppId)}との` : ""}試合がまだありません。`, `${hit.name} has no ${season} game${oppId ? ` vs ${abbr(oppId)}` : ""} yet.`));
  }
  return boardAnswer(
    oppId
      ? T(lang, `${hit.name} の${teamJa(oppId)}戦${seasonNote}`, `${hit.name} vs ${abbr(oppId)}${seasonNote}`)
      : T(lang, `${hit.name} のホームとアウェー${seasonNote}`, `${hit.name} home / away${seasonNote}`),
    { columns: cols(lang, ["pts", "reb", "ast", "fgPct"]), rows }
  );
}

/** 今季の最高記録 */
async function playerHighs(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const { season, logs } = await playerLogs(ctx, hit, intent);
  if (logs.length === 0) return text(T(lang, `${hit.name} の試合記録はまだありません。`, `No game log for ${hit.name} yet.`));
  const keys = ["pts", "reb", "ast", "fg3m", "stl", "blk"] as const;
  const rows = keys.map((k) => {
    const best = logs.reduce((a, b) => (b[k] > a[k] ? b : a));
    return { label: col(lang, k), cells: [num(best[k]), `${best.dateLabel} ${vsLabel(best.home, best.oppAbbr, lang)}`] };
  });
  return boardAnswer(
    T(lang, `${hit.name} の${season}シーズン最高（${logs.length}試合中）`, `${hit.name} ${season} season highs (${logs.length} games)`),
    { columns: T(lang, "記録|試合", "HIGH|GAME").split("|"), rows }
  );
}

function feetToCm(h: string | null | undefined): string {
  const m = /^(\d+)-(\d+)$/.exec(String(h ?? ""));
  if (!m) return "";
  return `${Math.round((Number(m[1]) * 12 + Number(m[2])) * 2.54)}cm`;
}

function lbsToKg(w: string | null | undefined): string {
  const n = Number(w);
  return Number.isFinite(n) && n > 0 ? `${Math.round(n * 0.4536)}kg` : "";
}

function playerProfile(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit): NbaAskAnswer {
  const lang = ctx.language;
  const p: NbaRosterPlayer = hit.player;
  const draft =
    p.draftYear && p.draftRound
      ? T(lang, `${p.draftYear}年 ${p.draftRound}巡目 ${p.draftNumber ?? "?"}位`, `${p.draftYear} R${p.draftRound} #${p.draftNumber ?? "?"}`)
      : p.draftYear === null || p.draftRound === null
        ? T(lang, "ドラフト外", "Undrafted")
        : "";
  const lines = [
    ja(lang)
      ? `${hit.name}（${teamJa(hit.teamId)}）${p.position ? `・${positionJa(p.position)}` : ""}${p.jerseyNumber ? `・背番号 ${p.jerseyNumber}` : ""}${p.isTwoWay ? "・ツーウェイ契約" : ""}`
      : `${hit.name} — ${abbr(hit.teamId)}${p.position ? ` / ${p.position}` : ""}${p.jerseyNumber ? ` / #${p.jerseyNumber}` : ""}${p.isTwoWay ? " / Two-Way" : ""}`,
    p.height || p.weight
      ? T(
          lang,
          `身長 ${feetToCm(p.height) || (p.height ?? "—")}・体重 ${lbsToKg(p.weight) || (p.weight ? `${p.weight}lb` : "—")}`,
          `Height ${p.height ?? "—"} · Weight ${p.weight ?? "—"} lb`
        )
      : "",
    p.country ? T(lang, `国籍 ${countryJa(p.country)}`, "") : "",
    p.college ? T(lang, `出身校・前所属 ${p.college}`, "") : "",
    !ja(lang) && (p.college || p.country) ? `From ${[p.college, p.country].filter(Boolean).join(" / ")}` : "",
    draft ? T(lang, `ドラフト ${draft}`, `Draft ${draft}`) : "",
  ].filter(Boolean);
  return text(lines.join("\n"));
}

async function playerCareer(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const r = asObj(
    await runNbaAskTool(ctx.db, "get_player_career", { player_id: hit.playerId, season_type: intent.playoffs ? "playoffs" : "season", ...(intent.season ? { season: intent.season } : {}) }, lang, ctx.timeZone)
  );
  const rows = asRows(r?.seasons);
  if (rows.length === 0) return text(T(lang, `${hit.name} のキャリア記録はまだありません。`, `No career data for ${hit.name}.`));
  return boardAnswer(
    T(lang, `${hit.name} のキャリア（${intent.playoffs ? "プレーオフ" : "レギュラーシーズン"}・1試合平均）`, `${hit.name} career (${intent.playoffs ? "playoffs" : "regular season"}, per game)`),
    {
      columns: cols(lang, ["pts", "reb", "ast"]),
      rows: rows.map((row) => ({ label: `${String(row.season ?? "")} ${String(row.team ?? "")}`.trim(), cells: [num(row.pts), num(row.reb), num(row.ast)] })),
    }
  );
}

async function playerContract(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const r = asObj(await runNbaAskTool(ctx.db, "get_player_contract", { player_id: hit.playerId }, lang, ctx.timeZone));
  const rows = asRows(r?.seasons);
  if (!r || r.found !== true || rows.length === 0) return text(T(lang, `${hit.name} の契約データはアプリにありません。`, `No contract data for ${hit.name} in the app.`));
  const fa = r.freeAgencyYear ? T(lang, `FA ${String(r.freeAgencyYear)}${r.freeAgencyType ? `（${String(r.freeAgencyType)}）` : ""}`, `FA ${String(r.freeAgencyYear)}${r.freeAgencyType ? ` (${String(r.freeAgencyType)})` : ""}`) : "";
  return boardAnswer(
    T(lang, `${hit.name}（${teamJa(hit.teamId)}）の契約`, `${hit.name} (${abbr(hit.teamId)}) contract`),
    {
      columns: cols(lang, ["salary"]),
      rows: rows.map((row) => ({ label: `${String(row.season ?? "")}${row.option ? ` ${String(row.option)}` : ""}`, cells: [money(row.salary)] })),
      ...(fa ? { note: fa } : {}),
    }
  );
}

async function playerShotZones(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const r = asObj(await runNbaAskTool(ctx.db, "get_player_shot_zones", { player_id: hit.playerId, season: seasonOf(intent) }, lang, ctx.timeZone));
  const zones = asRows(r?.zones);
  if (zones.length === 0) return text(T(lang, `${hit.name} のショットゾーンのデータはまだありません。`, `No shot zone data for ${hit.name} yet.`));
  return boardAnswer(T(lang, `${hit.name} のエリア別シュート（${String(r?.season ?? "")}）`, `${hit.name} shooting by zone (${String(r?.season ?? "")})`), {
    columns: cols(lang, ["fgPct", "fga"]),
    rows: zones.slice(0, 8).map((z) => ({ label: String(z.zone ?? ""), cells: [pct(z.fgPct), num(z.fga)] })),
  });
}

async function disciplineAnswer(ctx: NbaAskNbaContext, intent: NbaAskIntent, args: Record<string, unknown>, who: string): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const r = asObj(await runNbaAskTool(ctx.db, "get_discipline", { ...args, season: seasonOf(intent), season_type: intent.playoffs ? "playoffs" : "season" }, lang, ctx.timeZone));
  if (!r || r.found !== true) return text(T(lang, `${who} の規律データはまだありません。`, `No discipline data for ${who} yet.`));
  const players = asRows(r.players);
  const rows =
    players.length > 0
      ? players.map((p) => ({ label: String(p.name ?? ""), cells: [num(p.tech), num(p.flag), num(p.eject)] }))
      : [{ label: who, cells: [num(r.tech), num(r.flag), num(r.eject)] }];
  const note = [r.fineUsd ? T(lang, `罰金 ${money(r.fineUsd)}`, `Fines ${money(r.fineUsd)}`) : "", String(r.season ?? "")].filter(Boolean).join(" · ");
  return boardAnswer(
    T(lang, `${who}: テクニカル ${num(r.tech)}・フラグラント ${num(r.flag)}・退場 ${num(r.eject)}`, `${who}: ${num(r.tech)} techs, ${num(r.flag)} flagrants, ${num(r.eject)} ejections`),
    { columns: cols(lang, ["tech", "flag", "eject"]), rows, ...(note ? { note } : {}) }
  );
}

const MILESTONE_LABEL: Record<string, { ja: string; en: string }> = {
  pts: { ja: "通算得点", en: "career points" },
  reb: { ja: "通算リバウンド", en: "career rebounds" },
  ast: { ja: "通算アシスト", en: "career assists" },
  fg3m: { ja: "通算3P", en: "career threes" },
};

async function milestones(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  let rows = hub?.milestones ?? [];
  let who = "";
  if (intent.player) {
    const found = await needPlayer(ctx, intent);
    if ("reply" in found) return found.reply;
    rows = rows.filter((r) => r.playerId === found.hit.playerId);
    who = found.hit.name;
    if (rows.length === 0) {
      return text(T(lang, `${who} は、今季のペースで25試合以内に届く通算の節目がありません。`, `${who} has no career milestone within about 25 games at this pace.`));
    }
  }
  if (rows.length === 0) return text(T(lang, "近い節目のデータはまだありません。", "No milestone data yet."));
  const label = (stat: string) => (ja(lang) ? MILESTONE_LABEL[stat]?.ja : MILESTONE_LABEL[stat]?.en) ?? stat;
  return boardAnswer(
    T(lang, `${who ? `${who} の` : ""}近い通算の節目（今季のペースで何試合後か）`, `${who ? `${who}: ` : ""}upcoming career milestones (games at this season's pace)`),
    {
      columns: cols(lang, ["remaining", "gamesAway"]),
      rows: [...rows]
        .sort((a, b) => a.gamesAway - b.gamesAway)
        .slice(0, 8)
        .map((r) => ({
          label: `${who ? "" : `${r.name} `}${label(r.stat)} ${r.target.toLocaleString("en-US")}`,
          cells: [`${r.approx ? "~" : ""}${r.remaining}`, num(r.gamesAway)],
        })),
    }
  );
}

// ---------------------------------------------------------------------------
// チーム
// ---------------------------------------------------------------------------

async function teamRecentGames(ctx: NbaAskNbaContext, teamId: string, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const n = intent.count ?? 5;
  let season = seasonOf(intent);
  let detail = (await loadTeamGameLogDetail(ctx.db, season, teamId)).detail;
  if ((!detail || detail.games.length === 0) && !intent.season) {
    season = previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY);
    detail = (await loadTeamGameLogDetail(ctx.db, season, teamId)).detail;
  }
  const games = (detail?.games ?? []).slice(0, n);
  if (games.length === 0) return text(T(lang, `${teamJa(teamId)}の終了した試合はまだありません。`, `${abbr(teamId)} has no finished game yet.`));
  const ids = games.map((g) => g.gameId).filter((id): id is string => Boolean(id));
  const snaps = ids.length ? await ctx.db.getAll(...ids.map((id) => ctx.db.collection("games").doc(id)), { fieldMask: ["startAtJst"] }) : [];
  const dateById = new Map<string, string>();
  snaps.forEach((s) => {
    const d = (s.get("startAtJst") as { toDate?: () => Date } | undefined)?.toDate?.();
    if (d) dateById.set(s.id, toDateKeyInTimeZone(d, ctx.timeZone));
  });
  const label = (g: (typeof games)[number]) => `${(g.gameId && dateLabel(dateById.get(g.gameId), lang)) || g.dateLabel} ${vsLabel(g.home, g.oppAbbr, lang)}`;
  const first = games[0]!;
  const seasonNote = season !== CURRENT_NBA_SEASON_KEY ? `（${season}）` : "";
  const head =
    games.length === 1
      ? T(lang, `${teamJa(teamId)}の前回の試合${seasonNote}: ${label(first)} ${resultWord(first.result, lang)} ${first.teamScore}-${first.oppScore}`, `${abbr(teamId)} last game${seasonNote}: ${label(first)} ${first.result} ${first.teamScore}-${first.oppScore}`)
      : T(
          lang,
          `${teamJa(teamId)}の直近${games.length}試合${seasonNote}: ${games.filter((g) => g.result === "W").length}勝${games.filter((g) => g.result === "L").length}敗`,
          `${abbr(teamId)} last ${games.length}${seasonNote}: ${games.filter((g) => g.result === "W").length}-${games.filter((g) => g.result === "L").length}`
        );
  return boardAnswer(head, {
    columns: cols(lang, ["result", "score"]),
    rows: games.map((g) => ({ label: label(g), cells: [ja(lang) ? (g.result === "W" ? "勝" : "敗") : g.result, `${g.teamScore}-${g.oppScore}`] })),
  });
}

async function teamRecord(ctx: NbaAskNbaContext, teamId: string, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const season = seasonOf(intent);
  const snap = await ctx.db.collection(NBA_CONFERENCE_STANDINGS_COLLECTION).doc(season).get();
  const board = readStandingsBoard(snap.data());
  const row = board ? [...board.east, ...board.west].find((r) => r.teamId === teamId) : undefined;
  if (!row) return text(T(lang, `${teamJa(teamId)}の ${season} の順位データはまだありません。`, `No ${season} standings for ${abbr(teamId)} yet.`));
  const conf = row.conference === "east" ? T(lang, "東", "East") : T(lang, "西", "West");
  const streak = row.streak?.count ? T(lang, `${row.streak.count}${row.streak.kind === "W" ? "連勝" : "連敗"}中`, `${row.streak.kind}${row.streak.count}`) : "";
  const note = [
    streak,
    row.last10 ? T(lang, `直近10試合 ${row.last10.wins}-${row.last10.losses}`, `L10 ${row.last10.wins}-${row.last10.losses}`) : "",
    row.home ? T(lang, `ホーム ${row.home.wins}-${row.home.losses}`, `Home ${row.home.wins}-${row.home.losses}`) : "",
    row.away ? T(lang, `アウェー ${row.away.wins}-${row.away.losses}`, `Away ${row.away.wins}-${row.away.losses}`) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return boardAnswer(
    T(lang, `${teamJa(teamId)} ${season}: ${row.wins}勝${row.losses}敗・${conf}${row.rank}位`, `${abbr(teamId)} ${season}: ${row.wins}-${row.losses}, ${conf} #${row.rank}`),
    { columns: cols(lang, ["w", "l", "rank"]), rows: [{ label: abbr(teamId), cells: [String(row.wins), String(row.losses), String(row.rank)] }], ...(note ? { note } : {}) }
  );
}

async function teamRoster(ctx: NbaAskNbaContext, teamId: string): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const rosters = await loadRosters(ctx.db);
  const team = rosters[teamId];
  if (!team || team.players.length === 0) return text(T(lang, `${teamJa(teamId)}のロスターはまだありません。`, `No roster for ${abbr(teamId)} yet.`));
  const players = [...team.players].sort((a, b) => (b.ppg ?? 0) - (a.ppg ?? 0) || (b.gp ?? 0) - (a.gp ?? 0));
  const prior = (p: (typeof players)[number]) => Boolean(p.averagesSeasonKey && p.averagesSeasonKey !== CURRENT_NBA_SEASON_KEY);
  const anyPrior = players.slice(0, 12).some(prior);
  return boardAnswer(
    T(lang, `${teamJa(teamId)}のロスター ${players.length}人（得点の多い順）`, `${abbr(teamId)} roster, ${players.length} players (by points)`),
    {
      columns: cols(lang, ["pts", "reb", "ast"]),
      rows: players.slice(0, 12).map((p) => ({
        label: `${formatNbaPlayerListName(`${p.firstName} ${p.lastName}`.trim(), String(p.id))}${p.position ? ` ${p.position}` : ""}${prior(p) ? "*" : ""}`,
        cells: [num(p.ppg), num(p.rpg), num(p.apg)],
      })),
      ...(players.length > 12 || anyPrior
        ? {
            note: [
              players.length > 12 ? T(lang, `ほか ${players.length - 12}人`, `+${players.length - 12} more`) : "",
              anyPrior ? T(lang, "* は今季未出場で前季の平均", "* no games this season; last season's averages") : "",
            ]
              .filter(Boolean)
              .join(" · "),
          }
        : {}),
    }
  );
}

type HubLineup = { names?: string[]; min?: number; net?: number; pm?: number; games?: number };
type HubLineupBoard = { size?: number; most?: HubLineup[]; best?: HubLineup[]; worst?: HubLineup[] };

async function teamLineups(ctx: NbaAskNbaContext, teamId: string, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  const row = hub?.teams.find((t) => t.teamId === teamId) as
    | (Record<string, unknown> & { lineupBoards?: HubLineupBoard[]; lineups?: HubLineup[] })
    | undefined;
  const size = intent.lineup_size ?? 5;
  const order = intent.order ?? "best";
  const board = row?.lineupBoards?.find((b) => b.size === size);
  let list: HubLineup[] = (board?.[order] ?? []).slice(0, 5);
  if (list.length === 0 && size === 5 && order === "most") list = (row?.lineups ?? []).slice(0, 5);
  if (list.length === 0 && !row?.lineupBoards && !row?.lineups) {
    return text(T(lang, "ラインナップのデータはまだ集計していません。", "Lineup data isn't available yet."));
  }
  if (list.length === 0) {
    return text(
      T(lang, `${teamJa(teamId)}の${size}人ラインナップのデータはまだありません（一緒に出た時間が短い組は出していません）。`, `No ${size}-man lineup data for ${abbr(teamId)} yet.`)
    );
  }
  const what =
    order === "best"
      ? T(lang, "ネットレーティングが高い", "best net rating")
      : order === "worst"
        ? T(lang, "ネットレーティングが低い", "worst net rating")
        : T(lang, "一緒に出た時間が長い", "most minutes together");
  const lines = list.map((l, i) => {
    const stats = [
      l.net != null ? `NET ${signed(l.net)}` : "",
      l.min != null ? T(lang, `${num(l.min)}分`, `${num(l.min)} min`) : "",
      l.games != null ? T(lang, `${l.games}試合`, `${l.games} G`) : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return `${i + 1}. ${(l.names ?? []).join(" / ")}\n   ${stats}`;
  });
  return text(
    [
      T(lang, `${teamJa(teamId)} ${CURRENT_NBA_SEASON_KEY} の${size}人ラインナップ（${what}順）`, `${abbr(teamId)} ${CURRENT_NBA_SEASON_KEY} ${size}-man lineups (${what})`),
      ...lines,
      T(lang, "NET は 100 ポゼッションあたりの得失点差です。", "NET is point differential per 100 possessions."),
    ].join("\n")
  );
}

const INJURY_STATUS: Record<string, { ja: string; en: string }> = {
  out: { ja: "欠場", en: "Out" },
  doubtful: { ja: "出場は厳しい", en: "Doubtful" },
  questionable: { ja: "出場微妙", en: "Questionable" },
  probable: { ja: "出場見込み", en: "Probable" },
  "day-to-day": { ja: "様子見（デイ・トゥ・デイ）", en: "Day-to-day" },
};

function injuryStatusLabel(raw: unknown, lang: string): string {
  const key = String(raw ?? "").trim().toLowerCase();
  const hit = INJURY_STATUS[key];
  return hit ? (ja(lang) ? hit.ja : hit.en) : String(raw ?? "");
}

/** "Injury/Illness - Right Knee Arthroscopy (2026-11-12, DAL@MIN). Prior reporting…" → "Right Knee Arthroscopy" */
function injuryReasonShort(raw: unknown): string {
  const t = String(raw ?? "").trim();
  if (/^injury\/illness\s*-/i.test(t)) {
    const body = t.replace(/^injury\/illness\s*-\s*/i, "");
    return (body.split(/\s*\(\d{4}-\d{2}-\d{2}|\.\s*Prior reporting/i)[0] ?? body).trim().slice(0, 60);
  }
  // 速報の文（"Murphy (knee) is listed as out…"）は括弧の部位だけ
  const part = /^[^()]{1,40}\(([^)]{2,30})\)/.exec(t);
  return part ? part[1]!.trim() : "";
}

async function teamInjuries(ctx: NbaAskNbaContext, teamId: string, hit?: NbaAskPlayerHit): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const r = asObj(await runNbaAskTool(ctx.db, "get_team_injuries", { team: abbr(teamId) }, lang, ctx.timeZone));
  const players = asRows(r?.players);
  if (hit) {
    const last = (hit.player.lastName ?? "").toLowerCase();
    const initial = (hit.player.firstName ?? "").charAt(0).toLowerCase();
    const mine = players.find((p) => {
      const name = String(p.name ?? "").toLowerCase();
      return Boolean(last) && name.includes(last) && (!initial || name.startsWith(initial) || name.includes(` ${initial}`) || name.includes(hit.name.toLowerCase()));
    });
    if (!mine) {
      return text(T(lang, `${hit.name}（${teamJa(teamId)}）は今の故障者リストに載っていません。`, `${hit.name} (${abbr(teamId)}) is not on the current injury report.`));
    }
    const reason = injuryReasonShort(mine.reason);
    return text(
      T(
        lang,
        `${hit.name}（${teamJa(teamId)}）は故障者リストに載っています: ${injuryStatusLabel(mine.status, lang)}${reason ? `（${injuryReasonJa(reason)}）` : ""}`,
        `${hit.name} (${abbr(teamId)}) is on the injury report: ${injuryStatusLabel(mine.status, lang)}${reason ? ` (${reason})` : ""}`
      )
    );
  }
  if (players.length === 0) return text(T(lang, `${teamJa(teamId)}の故障者リストに載っている選手はいません。`, `No one is on the ${abbr(teamId)} injury report.`));
  return text(
    [
      T(lang, `${teamJa(teamId)}の故障者リスト`, `${abbr(teamId)} injury report`),
      ...players.map((p) => {
        const reason = injuryReasonShort(p.reason);
        return `・${String(p.name ?? "")} — ${injuryStatusLabel(p.status, lang)}${reason ? `（${ja(lang) ? injuryReasonJa(reason) : reason}）` : ""}`;
      }),
    ].join("\n")
  );
}

async function teamMoves(ctx: NbaAskNbaContext, teamId: string): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const r = asObj(await runNbaAskTool(ctx.db, "get_team_moves", { team: abbr(teamId) }, lang, ctx.timeZone));
  const inc = asRows(r?.incoming);
  const out = asRows(r?.outgoing);
  const fmt = (m: Record<string, unknown>, dir: "from" | "to") =>
    `${String(m.name ?? "")}${m.other ? T(lang, `（${teamNameFromAbbr(String(m.other), lang)}${dir === "from" ? "から" : "へ"}）`, ` (${dir} ${String(m.other)})`) : ""}`;
  if (inc.length === 0 && out.length === 0) return text(T(lang, `${teamJa(teamId)}の前季からの入れ替わりはありません。`, `No roster changes for ${abbr(teamId)} versus last season.`));
  return text(
    [
      T(lang, `${teamJa(teamId)}の前季からの入れ替わり`, `${abbr(teamId)} roster changes vs last season`),
      `IN: ${inc.length ? inc.map((m) => fmt(m, "from")).join("、") : "—"}`,
      `OUT: ${out.length ? out.map((m) => fmt(m, "to")).join("、") : "—"}`,
      T(lang, "今季のロスターと前季最後の所属の比較です（今日のトレード速報ではありません）。", "Compares this season's roster with last season's final teams (not a same-day wire)."),
    ].join("\n")
  );
}

const TEAM_STAT_FALLBACK: Record<string, string> = { ppg: "ppg", papg: "papg", pace: "pace", netrtg: "netrtg", ortg: "ortg", drtg: "drtg", diff: "diff" };
const RATING_SET = ["ortg", "drtg", "netrtg", "cleanNet", "cleanAdjNet"] as const;

function statValueText(id: string, v: unknown): string {
  return typeof v === "number" && Number.isFinite(v) ? (nbaAskIsPctStat(id) ? pct(v) : num(v)) : "—";
}

async function teamStat(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const word = nbaAskStatWord(NBA_ASK_TEAM_STAT_WORDS, ctx.question);
  const metric = word?.id ?? (intent.metric && TEAM_STAT_FALLBACK[intent.metric]) ?? "netrtg";
  const label = word ? (ja(lang) ? word.ja : word.en) : col(lang, metric);
  const teamId = resolveNbaAskTeamId(intent.team);
  const season = seasonOf(intent);
  const windowName = intent.playoffs ? "playoffs" : "season";
  const payload = await loadLeagueTeamStatsSnapshot(ctx.db, season);
  const bundle = payload.bundle;
  const all = bundle[windowName] ?? [];
  const valueOf = (row: (typeof all)[number], id: string) => (row as unknown as Record<string, unknown>)[id];
  const ranked = (id: string) => {
    /** ガベージ抜きなど、リーグ表にまだ定義が無い指標は無いものとして扱う */
    let higher: boolean;
    try {
      higher = leagueMetricDef(id as NbaLeagueTeamStatMetric).higherIsBetter;
    } catch {
      return [];
    }
    return all
      .filter((row) => typeof valueOf(row, id) === "number")
      .sort((a, b) => (Number(valueOf(b, id)) - Number(valueOf(a, id))) * (higher ? 1 : -1));
  };
  const rows = ranked(metric);
  if (rows.length === 0) return text(T(lang, `${label}のデータはまだありません（${season}）。`, `No ${label} data for ${season} yet.`));
  const total = rows.length;

  /** チーム名 +「レーティング」だけ → 攻守とガベージ抜きをまとめて */
  if (teamId && metric === "netrtg" && !/NET|ネット/i.test(ctx.question)) {
    const lines = RATING_SET.flatMap((id) => {
      const list = ranked(id);
      const i = list.findIndex((row) => row.teamId === teamId);
      if (i < 0) return [];
      const w = NBA_ASK_TEAM_STAT_WORDS.find((x) => x.id === id);
      return [{ label: (ja(lang) ? w?.ja : w?.en) ?? id, cells: [statValueText(id, valueOf(list[i]!, id)), `${i + 1}/${list.length}`] }];
    });
    if (lines.length === 0) return text(T(lang, `${teamJa(teamId)}のレーティングはまだありません。`, `No ratings for ${abbr(teamId)} yet.`));
    return boardAnswer(T(lang, `${teamJa(teamId)}のレーティング（${season}）`, `${abbr(teamId)} ratings (${season})`), {
      columns: T(lang, "値|順位", "VALUE|RANK").split("|"),
      rows: lines,
      note: T(lang, "ORTG = 100ポゼッションあたりの得点、DRTG = 失点（低いほど良い）、NET = その差。ガベージ抜きは大差がついた時間を除いた値です。", "Per 100 possessions. Lower DRTG is better. Garbage-time-free excludes blowout minutes."),
    });
  }

  const nameOf = (row: (typeof all)[number]) => (ja(lang) ? teamJa(row.teamId) : abbr(row.teamId));
  const pack = (row: (typeof all)[number], rank: number) => ({ label: nameOf(row), cells: [String(rank), statValueText(metric, valueOf(row, metric))] });
  const columns = [col(lang, "rank"), label];
  if (teamId) {
    const i = rows.findIndex((row) => row.teamId === teamId);
    if (i < 0) return text(T(lang, `${teamJa(teamId)}の${label}はまだありません。`, `No ${label} for ${abbr(teamId)} yet.`));
    const leader = rows[0]!;
    return boardAnswer(
      T(
        lang,
        `${teamJa(teamId)}の${label}: ${statValueText(metric, valueOf(rows[i]!, metric))}（${total}チーム中${i + 1}位）${i > 0 ? `。1位は${nameOf(leader)} ${statValueText(metric, valueOf(leader, metric))}` : ""}`,
        `${abbr(teamId)} ${label}: ${statValueText(metric, valueOf(rows[i]!, metric))} (#${i + 1} of ${total})${i > 0 ? `. Leader: ${abbr(leader.teamId)} ${statValueText(metric, valueOf(leader, metric))}` : ""}`
      ),
      { columns, rows: [pack(leader, 1), ...(i > 0 ? [pack(rows[i]!, i + 1)] : [])] }
    );
  }
  const worst = intent.order === "worst";
  const list = worst ? rows.slice(-5).reverse().map((row, k) => pack(row, total - k)) : rows.slice(0, 5).map((row, k) => pack(row, k + 1));
  const head = worst
    ? T(lang, `${season} の${label}がいちばん下位なのは${list[0]!.label}（${list[0]!.cells[1]}・${total}位）`, `${season} lowest in ${label}: ${list[0]!.label} (${list[0]!.cells[1]}, #${total})`)
    : T(lang, `${season} の${label}1位は${list[0]!.label}（${list[0]!.cells[1]}）`, `${season} ${label} leader: ${list[0]!.label} (${list[0]!.cells[1]})`);
  return boardAnswer(head, { columns, rows: list });
}

const SPLIT_LABEL: Record<string, { ja: string; en: string }> = {
  home: { ja: "ホーム", en: "Home" },
  away: { ja: "アウェー", en: "Away" },
  vsEast: { ja: "対東", en: "vs East" },
  vsWest: { ja: "対西", en: "vs West" },
  vsOver500: { ja: "対勝ち越しチーム", en: "vs .500+" },
  vsUnder500: { ja: "対負け越しチーム", en: "vs sub-.500" },
  b2b: { ja: "連戦2日目", en: "2nd of B2B" },
  threeInFour: { ja: "4日で3試合目", en: "3 in 4" },
};
const SPLIT_FOCUS: ReadonlyArray<[RegExp, string]> = [
  [/ホーム|home/i, "home"],
  [/アウェー|ロード|away|road/i, "away"],
  [/東|イースト|east/i, "vsEast"],
  [/西|ウエスト|ウェスト|west/i, "vsWest"],
  [/勝ち越し|強い(?:チーム|相手)|上位/, "vsOver500"],
  [/負け越し|弱い(?:チーム|相手)|下位/, "vsUnder500"],
  [/連戦|バック.?トゥ.?バック|b2b/i, "b2b"],
  [/3in4|4日で3/i, "threeInFour"],
];

/** ホーム / アウェー・対東西・対勝ち越し・連戦、または特定の相手との対戦成績 */
async function teamSplits(ctx: NbaAskNbaContext, teamId: string, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const season = seasonOf(intent);
  const detail = (await loadTeamGameLogDetail(ctx.db, season, teamId)).detail;
  if (!detail || detail.games.length === 0) return text(T(lang, `${teamJa(teamId)}の${season}の試合はまだありません。`, `${abbr(teamId)} has no ${season} game yet.`));
  const cells = (row: { wins: number; losses: number; avg: { pts: number; oppPts: number } | null }) => [
    `${row.wins}-${row.losses}`,
    num(row.avg?.pts),
    num(row.avg?.oppPts),
  ];
  const columns = T(lang, "勝敗|得点|失点", "W-L|PTS|OPP").split("|");
  const oppId = resolveNbaAskTeamId(intent.opponent);
  if (oppId) {
    const h = detail.headToHead.find((r) => r.oppTeamId === oppId);
    if (!h) return text(T(lang, `${teamJa(teamId)}は${season}に${teamJa(oppId)}とまだ対戦していません。`, `${abbr(teamId)} hasn't played ${abbr(oppId)} in ${season}.`));
    return boardAnswer(
      T(lang, `${teamJa(teamId)}の${teamJa(oppId)}戦（${season}）: ${h.wins}勝${h.losses}敗`, `${abbr(teamId)} vs ${abbr(oppId)} (${season}): ${h.wins}-${h.losses}`),
      { columns, rows: [{ label: T(lang, `対${teamJa(oppId)}`, `vs ${abbr(oppId)}`), cells: cells(h) }] }
    );
  }
  const focus = SPLIT_FOCUS.find(([re]) => re.test(ctx.question))?.[1];
  const keys = Object.keys(SPLIT_LABEL).filter((k) => detail.splits[k as keyof typeof detail.splits]);
  const rows = keys.map((k) => ({ label: (ja(lang) ? SPLIT_LABEL[k]?.ja : SPLIT_LABEL[k]?.en) ?? k, cells: cells(detail.splits[k as keyof typeof detail.splits]) }));
  const f = focus ? detail.splits[focus as keyof typeof detail.splits] : null;
  const fLabel = focus ? (ja(lang) ? SPLIT_LABEL[focus]?.ja : SPLIT_LABEL[focus]?.en) : "";
  return boardAnswer(
    f
      ? T(lang, `${teamJa(teamId)}の${fLabel}（${season}）: ${f.wins}勝${f.losses}敗・平均 ${num(f.avg?.pts)}点 / 失点 ${num(f.avg?.oppPts)}`, `${abbr(teamId)} ${fLabel} (${season}): ${f.wins}-${f.losses}, ${num(f.avg?.pts)} PTS / ${num(f.avg?.oppPts)} OPP`)
      : T(lang, `${teamJa(teamId)}の状況別の成績（${season}）`, `${abbr(teamId)} splits (${season})`),
    { columns, rows }
  );
}

/** ポジション別失点（相手の G / F / C が取った 1 試合平均と順位。1位 = いちばん抑えている） */
async function teamPositionDefense(ctx: NbaAskNbaContext, teamId: string, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const season = seasonOf(intent);
  const pd = (await loadTeamGameLogDetail(ctx.db, season, teamId)).detail?.positionDefense;
  if (!pd || pd.games === 0) return text(T(lang, `${teamJa(teamId)}のポジション別失点はまだありません。`, `No points-allowed-by-position data for ${abbr(teamId)} yet.`));
  const name = { G: T(lang, "ガード", "Guards"), F: T(lang, "フォワード", "Forwards"), C: T(lang, "センター", "Centers") } as const;
  const rows = (["G", "F", "C"] as const).map((g) => {
    const c = pd.groups[g].pts;
    return { label: name[g], cells: [num(c.value), num(c.leagueAvg), `${c.rank}/${pd.teams}`] };
  });
  const worst = (["G", "F", "C"] as const).reduce((a, b) => (pd.groups[b].pts.rank > pd.groups[a].pts.rank ? b : a));
  return boardAnswer(
    T(lang, `${teamJa(teamId)}がポジション別に許している得点（${season}・${pd.games}試合）。いちばん取られているのは${name[worst]}（${pd.groups[worst].pts.rank}位）`, `${abbr(teamId)} points allowed by position (${season}, ${pd.games} games). Weakest vs ${name[worst]}`),
    { columns: T(lang, "失点|リーグ平均|順位", "PTS|LEAGUE|RANK").split("|"), rows, note: T(lang, "相手のそのポジションの選手が取った1試合平均。順位1位がいちばん抑えています。", "Opposing players at each position, per game. Rank 1 allows the fewest.") }
  );
}

/** 今後 7 年のドラフト指名権（アプリのチーム詳細と同じデータ） */
function teamDraftPicks(ctx: NbaAskNbaContext, teamId: string): NbaAskAnswer {
  const lang = ctx.language;
  const d = getNbaTeamDraftCapital(teamId);
  const s = d.summary;
  const first = d.years[0]?.year;
  const last = d.years[d.years.length - 1]?.year;
  return boardAnswer(
    T(
      lang,
      `${teamJa(teamId)}の${first}〜${last}年のドラフト指名権: 1巡目 ${d.totalFirstRound}本（条件付き ${s.conditional1st}）・2巡目 ${d.totalSecondRound}本。スワップ権 ${s.swapRights}、放出済み ${s.outgoingPicks}本。`,
      `${abbr(teamId)} ${first}-${last} draft picks: ${d.totalFirstRound} firsts (${s.conditional1st} conditional), ${d.totalSecondRound} seconds. ${s.swapRights} swap rights, ${s.outgoingPicks} traded away.`
    ),
    {
      columns: T(lang, "1巡目|2巡目", "1ST|2ND").split("|"),
      rows: d.years.map((y) => ({ label: String(y.year), cells: [String(y.firstRoundCount), String(y.secondRoundCount)] })),
      note: T(lang, "条件付き（保護付き）の指名権も本数に含みます。詳しい条件はチーム詳細の指名権で見られます。", "Includes conditional (protected) picks. See the team detail for conditions."),
    }
  );
}

// ---------------------------------------------------------------------------
// オン / オフ・マッチアップ・スタイルマップ（LEAGUE タブの hub）
// ---------------------------------------------------------------------------

type HubMatchup = { playerId: string; name: string; teamId: string; minutes: number; fgPct: number; fgm: number; fga: number; usualFgPct?: number };
type HubPlayerExtra = {
  playerId: string;
  name: string;
  teamId: string;
  gp: number;
  min: number;
  m: Record<string, number | undefined>;
  onOff?: { onNet: number; offNet: number; onMin: number; offMin: number };
  matchups?: HubMatchup[];
  guardedBy?: HubMatchup[];
};

async function hubPlayers(ctx: NbaAskNbaContext): Promise<HubPlayerExtra[]> {
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  return (hub?.players ?? []) as unknown as HubPlayerExtra[];
}

const NO_HUB_PLAYER = (ctx: NbaAskNbaContext, hit: NbaAskPlayerHit) =>
  text(T(ctx.language, `${hit.name} は LEAGUE タブの集計（今季の出場時間が多い約220人）に入っていません。`, `${hit.name} is not in the LEAGUE tab pool (about 220 players by minutes).`));

/** コートにいるとき / いないときの NET（100 ポゼッションあたり）。チームなら差の大きい順 */
async function onOffAnswer(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const players = await hubPlayers(ctx);
  const note = T(lang, "NET = 100ポゼッションあたりの得点 − 失点。今季・レギュラーシーズン。", "NET = points scored minus allowed per 100 possessions. This regular season.");
  if (intent.player) {
    const found = await needPlayer(ctx, intent);
    if ("reply" in found) return found.reply;
    const p = players.find((x) => x.playerId === found.hit.playerId);
    if (!p) return NO_HUB_PLAYER(ctx, found.hit);
    if (!p.onOff) return text(T(lang, `${found.hit.name} のオン / オフはまだ集計がありません。`, `No on/off data for ${found.hit.name} yet.`));
    const o = p.onOff;
    return boardAnswer(
      T(lang, `${found.hit.name} がコートにいるとチームの NET は ${signed(o.onNet)}、いないと ${signed(o.offNet)}（差 ${signed(o.onNet - o.offNet)}）`, `${found.hit.name}: team NET ${signed(o.onNet)} on court, ${signed(o.offNet)} off (diff ${signed(o.onNet - o.offNet)})`),
      {
        columns: T(lang, "NET|出場分", "NET|MIN").split("|"),
        rows: [
          { label: T(lang, "コートにいる", "On"), cells: [signed(o.onNet), num(o.onMin)] },
          { label: T(lang, "ベンチ", "Off"), cells: [signed(o.offNet), num(o.offMin)] },
        ],
        note,
      }
    );
  }
  const t = needTeam(ctx, intent);
  if ("reply" in t) return t.reply;
  const list = players
    .filter((x) => x.teamId === t.teamId && x.onOff)
    .map((x) => ({ x, diff: x.onOff!.onNet - x.onOff!.offNet }))
    .sort((a, b) => b.diff - a.diff);
  if (list.length === 0) return text(T(lang, `${teamJa(t.teamId)}のオン / オフはまだ集計がありません。`, `No on/off data for ${abbr(t.teamId)} yet.`));
  return boardAnswer(
    T(lang, `${teamJa(t.teamId)}でコートにいると差がいちばん大きいのは ${list[0]!.x.name}（${signed(list[0]!.diff)}）`, `${abbr(t.teamId)} biggest on/off: ${list[0]!.x.name} (${signed(list[0]!.diff)})`),
    {
      columns: T(lang, "差|いる|いない", "DIFF|ON|OFF").split("|"),
      rows: list.slice(0, 8).map(({ x, diff }) => ({ label: x.name, cells: [signed(diff), signed(x.onOff!.onNet), signed(x.onOff!.offNet)] })),
      note,
    }
  );
}

/** 誰を守ったか / 誰に守られたか（時間の長い順）。2 人目の名前があればその組だけ */
async function matchupsAnswer(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const players = await hubPlayers(ctx);
  const p = players.find((x) => x.playerId === hit.playerId);
  if (!p) return NO_HUB_PLAYER(ctx, hit);
  const defended = p.matchups ?? [];
  const guardedBy = p.guardedBy ?? [];
  if (defended.length === 0 && guardedBy.length === 0) {
    return text(T(lang, `${hit.name} のマッチアップはまだ集計がありません。`, `No matchup data for ${hit.name} yet.`));
  }
  const row = (m: HubMatchup, mine: boolean) => ({
    label: `${mine ? T(lang, "守った", "DEF") : T(lang, "守られた", "OFF")} ${m.name}`,
    cells: [num(m.minutes), `${m.fgm}/${m.fga}`, pct(m.fgPct)],
  });
  const columns = T(lang, "分|成功/試投|FG%", "MIN|FGM/FGA|FG%").split("|");
  const note = T(lang, "守った = 相手がこの選手にマークされて打ったシュート。守られた = この選手のシュート。", "DEF = the opponent's shots while guarded by him. OFF = his own shots while guarded.");
  if (intent.player2) {
    const rosters = await loadRosters(ctx.db);
    const other = resolveNbaAskPlayer(rosters, intent.player2, null);
    if (other.kind === "one") {
      const id = other.hit.playerId;
      const d = defended.find((m) => m.playerId === id);
      const g = guardedBy.find((m) => m.playerId === id);
      if (!d && !g) {
        return text(T(lang, `${hit.name} と ${other.hit.name} のマッチアップは、上位の記録（時間の長い8人）に入っていません。`, `${hit.name} vs ${other.hit.name} is not among the top matchups.`));
      }
      return boardAnswer(T(lang, `${hit.name} と ${other.hit.name} のマッチアップ（今季）`, `${hit.name} vs ${other.hit.name} (this season)`), {
        columns,
        rows: [...(d ? [row(d, true)] : []), ...(g ? [row(g, false)] : [])],
        note,
      });
    }
  }
  return boardAnswer(T(lang, `${hit.name} のマッチアップ（今季・時間の長い順）`, `${hit.name} matchups (this season, by minutes)`), {
    columns,
    rows: [...defended.slice(0, 4).map((m) => row(m, true)), ...guardedBy.slice(0, 4).map((m) => row(m, false))],
    note,
  });
}

const TEAM_STYLE_PRESETS: readonly LeagueHubScatterPreset<string>[] = [
  LEAGUE_HUB_TEAM_STRENGTH,
  LEAGUE_HUB_TEAM_CLUTCH,
  LEAGUE_HUB_TEAM_THREE,
  LEAGUE_HUB_TEAM_ATTACK,
  LEAGUE_HUB_TEAM_SHOT_CREATION,
  LEAGUE_HUB_TEAM_PASS_VALUE,
  LEAGUE_HUB_TEAM_DRIVE_FINISH,
  LEAGUE_HUB_TEAM_SCREEN,
  LEAGUE_HUB_TEAM_TEMPO,
  LEAGUE_HUB_TEAM_SHOT_DEFENSE,
  LEAGUE_HUB_TEAM_HUSTLE,
  LEAGUE_HUB_TEAM_CONTEST,
  LEAGUE_HUB_TEAM_SHOT_ALLOW,
  LEAGUE_HUB_TEAM_REBOUND,
  LEAGUE_HUB_TEAM_TURNOVER,
] as readonly LeagueHubScatterPreset<string>[];

type StylePoint = { id: string; name: string; x: number; y: number };

/** アプリの図と同じく、点の平均で 4 つに分ける。invert の軸は低い方が良い側 */
function quadrantOf(preset: LeagueHubScatterPreset<string>, points: StylePoint[], target: StylePoint) {
  const ax = points.reduce((s, p) => s + p.x, 0) / points.length;
  const ay = points.reduce((s, p) => s + p.y, 0) / points.length;
  const right = preset.x.invert ? target.x < ax : target.x > ax;
  const up = preset.y.invert ? target.y < ay : target.y > ay;
  const key = up ? (right ? "tr" : "tl") : right ? "br" : "bl";
  /** 平均からどれだけ離れているか（目立つ図から並べる） */
  const sx = Math.sqrt(points.reduce((s, p) => s + (p.x - ax) ** 2, 0) / points.length) || 1;
  const sy = Math.sqrt(points.reduce((s, p) => s + (p.y - ay) ** 2, 0) / points.length) || 1;
  return { key, quadrant: preset.quadrants[key], far: Math.abs(target.x - ax) / sx + Math.abs(target.y - ay) / sy };
}

/** スタイルマップ。選手 / チームならどの図のどこにいるか、どちらも無ければ質問に出た区分（例: エリートシューター）の顔ぶれ */
async function styleMapAnswer(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const L = (c: { ja: string; en: string }) => (ja(lang) ? c.ja : c.en);
  const note = T(lang, "順位ページの LEAGUE タブのスタイルマップと同じ分け方です（図の点の平均で4つに分けています）。", "Same split as the LEAGUE tab style maps (by the average of the plotted points).");
  const teamId = !intent.player ? resolveNbaAskTeamId(intent.team) : null;

  if (teamId) {
    const season = CURRENT_NBA_SEASON_KEY;
    const payload = await loadLeagueTeamStatsSnapshot(ctx.db, season);
    const rows = payload.bundle.season ?? [];
    const val = (r: (typeof rows)[number], m: string) => {
      const v = (r as unknown as Record<string, unknown>)[m];
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    };
    const out = TEAM_STYLE_PRESETS.flatMap((preset) => {
      const points = rows.flatMap((r) => {
        const x = val(r, preset.x.metric);
        const y = val(r, preset.y.metric);
        return x == null || y == null ? [] : [{ id: r.teamId, name: r.teamId, x, y }];
      });
      const me = points.find((pt) => pt.id === teamId);
      return me && points.length >= 10 ? [{ preset, ...quadrantOf(preset, points, me) }] : [];
    });
    if (out.length === 0) return text(T(lang, `${teamJa(teamId)}のスタイルマップはまだ出せません。`, `No style map data for ${abbr(teamId)} yet.`));
    out.sort((a, b) => b.far - a.far);
    return boardAnswer(T(lang, `${teamJa(teamId)}のプレースタイル（特徴が強い順）: ${L(out[0]!.quadrant)}`, `${abbr(teamId)} play style (most distinctive first): ${L(out[0]!.quadrant)}`), {
      columns: T(lang, "タイプ", "TYPE").split("|"),
      rows: out.slice(0, 8).map((o) => ({ label: L(o.preset.label), cells: [L(o.quadrant)] })),
      note,
    });
  }

  const players = await hubPlayers(ctx);
  if (players.length === 0) return text(T(lang, "スタイルマップのデータはまだありません。", "Style map data isn't available yet."));
  const top30 = (preset: (typeof LEAGUE_HUB_PLAYER_SCATTER_PRESETS)[number]) =>
    players
      .filter((p) => p.m[preset.x.metric] != null && p.m[preset.y.metric] != null)
      .sort((a, b) => (b.m[preset.volume] ?? -1) - (a.m[preset.volume] ?? -1) || b.gp * b.min - a.gp * a.min)
      .slice(0, 30)
      .map((p) => ({ id: p.playerId, name: p.name, x: p.m[preset.x.metric]!, y: p.m[preset.y.metric]! }));

  if (intent.player) {
    const found = await needPlayer(ctx, intent);
    if ("reply" in found) return found.reply;
    if (!players.some((p) => p.playerId === found.hit.playerId)) return NO_HUB_PLAYER(ctx, found.hit);
    const out = LEAGUE_HUB_PLAYER_SCATTER_PRESETS.flatMap((preset) => {
      const points = top30(preset);
      const me = points.find((pt) => pt.id === found.hit.playerId);
      return me ? [{ preset, ...quadrantOf(preset, points, me) }] : [];
    });
    if (out.length === 0) {
      return text(T(lang, `${found.hit.name} はどのスタイルマップでも上位30人に入っていません。`, `${found.hit.name} is not in the top 30 of any style map.`));
    }
    out.sort((a, b) => b.far - a.far);
    return boardAnswer(T(lang, `${found.hit.name} のプレースタイル（特徴が強い順）: ${L(out[0]!.quadrant)}`, `${found.hit.name} play style (most distinctive first): ${L(out[0]!.quadrant)}`), {
      columns: T(lang, "タイプ", "TYPE").split("|"),
      rows: out.slice(0, 8).map((o) => ({ label: L(o.preset.label), cells: [L(o.quadrant)] })),
      note,
    });
  }

  /** 「エリートシューターは誰」のように区分の名前で聞かれたとき */
  for (const preset of LEAGUE_HUB_PLAYER_SCATTER_PRESETS) {
    for (const key of ["tr", "tl", "br", "bl"] as const) {
      const q = preset.quadrants[key];
      if (!ctx.question.includes(q.ja) && !ctx.question.toLowerCase().includes(q.en.toLowerCase())) continue;
      const points = top30(preset);
      const inQuad = points.filter((pt) => quadrantOf(preset, points, pt).key === key).sort((a, b) => quadrantOf(preset, points, b).far - quadrantOf(preset, points, a).far);
      return boardAnswer(T(lang, `「${q.ja}」（${preset.label.ja}の図）に入る選手`, `"${q.en}" players (${preset.label.en} map)`), {
        columns: [L(preset.x.label), L(preset.y.label)],
        rows: inQuad.slice(0, 8).map((pt) => ({ label: pt.name, cells: [preset.x.format === "pct" ? pct(pt.x) : num(pt.x), preset.y.format === "pct" ? pct(pt.y) : num(pt.y)] })),
        note,
      });
    }
  }
  return text(
    T(lang, "スタイルマップは順位ページの LEAGUE タブにあります。選手名かチーム名を付けて「〇〇のプレースタイル」と聞くと、どのタイプか答えます。", "Style maps are in the LEAGUE tab of the standings page. Ask \"<player or team> play style\" to hear which type they are."),
    false
  );
}

async function teamPayroll(ctx: NbaAskNbaContext, teamId: string): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const r = await loadTeamPayroll(ctx.db, CURRENT_NBA_SEASON_KEY, teamId);
  const p = r.payroll;
  if (!p || p.lines.length === 0) return text(T(lang, `${teamJa(teamId)}の年俸データはまだありません。`, `No payroll data for ${abbr(teamId)} yet.`));
  const lines = [...p.lines].sort((a, b) => b.salary - a.salary);
  const top = lines[0]!;
  const tax = p.taxSpace != null && p.taxSpace < 0 ? T(lang, "ぜいたく税ラインを超えています", "over the luxury tax line") : T(lang, "ぜいたく税ラインの下です", "under the luxury tax line");
  return boardAnswer(
    T(
      lang,
      `${teamJa(teamId)}（${r.season}）の年俸総額は ${money(p.totalSalary)}（リーグ${p.leagueRank}位・${tax}）。いちばん高いのは ${top.name} の ${money(top.salary)} です。`,
      `${abbr(teamId)} ${r.season} payroll: ${money(p.totalSalary)} (#${p.leagueRank} in the league, ${tax}). Highest paid: ${top.name} at ${money(top.salary)}.`
    ),
    {
      columns: cols(lang, ["salary"]),
      rows: lines.slice(0, 8).map((l) => ({ label: l.name, cells: [money(l.salary)] })),
    }
  );
}

const TEAM_PAYROLL_WORDS = /チーム|球団|総額|ペイロール|payroll|team/i;

/** リーグ全体の年俸順位（全チームのペイロールから。Two-Way は除く）。「18位は」なら前後も出す */
async function salaryRanking(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const teamId = resolveNbaAskTeamId(intent.team);
  if (teamId && !intent.player) return teamPayroll(ctx, teamId);
  const payload = await loadTeamPayrollsSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY);
  const teams = Object.entries(payload.bundle.teams);
  if (teams.length === 0) return text(T(lang, "年俸のデータはまだありません。", "Salary data isn't available yet."));
  const asked = Number(/(\d{1,3})\s*(?:位|th|st|nd|rd)/i.exec(ctx.question)?.[1] ?? 0);
  const around = <R,>(list: R[], at: number) => (at > 0 ? list.slice(Math.max(0, at - 3), at + 2) : list.slice(0, 10));
  const note = T(lang, `${payload.season}・キャップヒット（Two-Way 契約は除く）`, `${payload.season} cap hits (two-way contracts excluded)`);

  if (!intent.player && TEAM_PAYROLL_WORDS.test(ctx.question)) {
    const list = teams.map(([id, p]) => ({ id, total: p.totalSalary })).sort((a, b) => b.total - a.total);
    const hit = asked > 0 ? list[asked - 1] : null;
    if (asked > list.length) return text(T(lang, `年俸総額の順位は${list.length}位までです。`, `Payroll ranks only go to ${list.length}.`));
    return boardAnswer(
      hit
        ? T(lang, `${payload.season}の年俸総額 ${asked}位は${teamJa(hit.id)}（${money(hit.total)}）`, `#${asked} payroll in ${payload.season}: ${abbr(hit.id)} (${money(hit.total)})`)
        : T(lang, `${payload.season}の年俸総額ランキング`, `${payload.season} team payroll ranking`),
      {
        columns: cols(lang, ["salary"]),
        rows: around(list, asked).map((t) => ({ label: `${list.indexOf(t) + 1}. ${ja(lang) ? teamJa(t.id) : abbr(t.id)}`, cells: [money(t.total)] })),
        note,
      }
    );
  }

  /** ペイロールの名前は表示用の略し（L.DONCIC）なのでロスターのフルネームに */
  const fullName = new Map<string, string>();
  for (const t of Object.values(await loadRosters(ctx.db))) {
    for (const p of t.players) fullName.set(String(p.id), `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim());
  }
  const best = new Map<string, { playerId: string; name: string; teamId: string; salary: number }>();
  for (const [id, p] of teams) {
    for (const l of p.lines) {
      if (l.isTwoWay || !(l.salary > 0)) continue;
      const prev = best.get(l.playerId);
      const name = fullName.get(l.playerId) || l.name;
      if (!prev || l.salary > prev.salary) best.set(l.playerId, { playerId: l.playerId, name, teamId: id, salary: l.salary });
    }
  }
  const list = [...best.values()].sort((a, b) => b.salary - a.salary);
  /** 同額は同じ順位 */
  const rankOf = (i: number) => list.findIndex((x) => x.salary === list[i]!.salary) + 1;
  const row = (x: (typeof list)[number]) => {
    const i = list.indexOf(x);
    const r = rankOf(i);
    const tie = list.filter((y) => y.salary === x.salary).length > 1;
    return { label: `${tie ? T(lang, `${r}位タイ`, `T-${r}`) : `${r}.`} ${x.name}（${ja(lang) ? teamJa(x.teamId) : abbr(x.teamId)}）`, cells: [money(x.salary)] };
  };

  if (intent.player) {
    const found = await needPlayer(ctx, intent);
    if ("reply" in found) return found.reply;
    const i = list.findIndex((x) => x.playerId === found.hit.playerId);
    if (i < 0) return text(T(lang, `${found.hit.name} の今季の年俸はデータにありません（Two-Way 契約の選手は順位に入れていません）。`, `No salary on file for ${found.hit.name} this season (two-way players are not ranked).`));
    return boardAnswer(
      T(lang, `${found.hit.name} の年俸 ${money(list[i]!.salary)} はリーグ${rankOf(i)}位（${list.length}人中）`, `${found.hit.name} earns ${money(list[i]!.salary)}: #${rankOf(i)} of ${list.length} in the league`),
      { columns: cols(lang, ["salary"]), rows: around(list, i + 1).map(row), note }
    );
  }

  if (asked > list.length) return text(T(lang, `年俸の順位は${list.length}位までです。`, `Salary ranks only go to ${list.length}.`));
  const hit = asked > 0 ? list[asked - 1]! : null;
  const tied = hit ? list.filter((x) => x.salary === hit.salary) : [];
  const who = (x: (typeof list)[number]) => `${x.name}（${ja(lang) ? teamJa(x.teamId) : abbr(x.teamId)}）`;
  const tieRank = hit ? rankOf(list.indexOf(hit)) : 0;
  return boardAnswer(
    !hit
      ? T(lang, `${payload.season}の年俸ランキング`, `${payload.season} salary ranking`)
      : tied.length > 1
        ? T(
            lang,
            `${payload.season}の年俸 ${asked}位は同額 ${money(hit.salary)} の ${tied.length}人（${tieRank}位タイ）: ${tied.map(who).join("、")}`,
            `#${asked} salary in ${payload.season}: ${tied.length} players tied at ${money(hit.salary)} (T-${tieRank}): ${tied.map(who).join(", ")}`
          )
        : T(lang, `${payload.season}の年俸 ${asked}位は ${who(hit)}・${money(hit.salary)}`, `#${asked} salary in ${payload.season}: ${who(hit)}, ${money(hit.salary)}`),
    { columns: cols(lang, ["salary"]), rows: around(list, asked).map(row), note }
  );
}

async function teamShapes(ctx: NbaAskNbaContext, teamId: string, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const r = asObj(await runNbaAskTool(ctx.db, "get_team_shapes", { team: abbr(teamId), season: seasonOf(intent) }, lang, ctx.timeZone));
  const shapes = asRows(r?.shapes);
  if (shapes.length === 0) return text(T(lang, `${teamJa(teamId)}の得意形・苦手形は、まだ試合数が足りず出ていません。`, `Not enough games yet for ${abbr(teamId)} strengths and weaknesses.`));
  return boardAnswer(T(lang, `${teamJa(teamId)}の得意な展開・苦手な展開（${String(r?.record ?? "")}）`, `${abbr(teamId)} strong and weak game shapes (${String(r?.record ?? "")})`), {
    columns: cols(lang, ["w", "l"]),
    rows: shapes.map((s) => ({ label: `${s.kind === "weak" ? T(lang, "苦手", "Weak") : T(lang, "得意", "Strong")} ${String(s.label ?? "")}`, cells: [num(s.w), num(s.l)] })),
  });
}

async function standings(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const season = seasonOf(intent);
  const snap = await ctx.db.collection(NBA_CONFERENCE_STANDINGS_COLLECTION).doc(season).get();
  const board = readStandingsBoard(snap.data());
  if (!board) return text(T(lang, "順位表のデータはまだありません。", "Standings are not ready yet."));
  const sides = intent.conference ? [intent.conference] : (["east", "west"] as const);
  const rows = sides.flatMap((side) =>
    board[side].slice(0, intent.conference ? 15 : 8).map((r) => ({
      label: `${side === "east" ? T(lang, "東", "E") : T(lang, "西", "W")}${r.rank} ${abbr(r.teamId)}`,
      cells: [String(r.wins), String(r.losses)],
    }))
  );
  return boardAnswer(
    T(lang, `${season} の順位${intent.conference ? "" : "（各カンファレンス上位8）"}`, `${season} standings${intent.conference ? "" : " (top 8 each)"}`),
    { columns: cols(lang, ["w", "l"]), rows }
  );
}

// ---------------------------------------------------------------------------
// リーグ
// ---------------------------------------------------------------------------

async function playerLeaders(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const word = nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, ctx.question);
  const metric = word?.id ?? (intent.metric && ["pts", "reb", "ast", "stl", "blk", "tov", "fg3m"].includes(intent.metric) ? intent.metric : "pts");
  const label = word ? (ja(lang) ? word.ja : word.en) : col(lang, metric);
  const teamId = resolveNbaAskTeamId(intent.team);
  const r = asObj(
    await runNbaAskTool(ctx.db, "get_player_leaders", { metric, season: seasonOf(intent), season_type: intent.playoffs ? "playoffs" : "season", ...(teamId ? { team: abbr(teamId) } : {}) }, lang, ctx.timeZone)
  );
  const leaders = asRows(r?.leaders);
  if (leaders.length === 0) return text(T(lang, `${label}のランキングのデータはまだありません。`, `No ${label} leader data yet.`));
  const mine = asObj(r?.team);
  const rows = leaders.map((l) => ({ label: `${String(l.name ?? "")} ${String(l.team ?? "")}`, cells: [String(l.rank ?? ""), statValueText(metric, l.value)] }));
  if (mine && !leaders.some((l) => l.name === mine.name)) rows.push({ label: `${String(mine.name ?? "")} ${String(mine.team ?? "")}`, cells: [String(mine.rank ?? ""), statValueText(metric, mine.value)] });
  const top = leaders[0]!;
  return boardAnswer(
    T(lang, `${String(r?.season ?? "")} の${label}1位は ${String(top.name ?? "")}（${teamNameFromAbbr(String(top.team ?? ""), lang)}）${statValueText(metric, top.value)}`, `${String(r?.season ?? "")} ${label} leader: ${String(top.name ?? "")} (${String(top.team ?? "")}) ${statValueText(metric, top.value)}`),
    { columns: [col(lang, "rank"), label], rows }
  );
}

async function dailyLeaders(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const metric = intent.metric && ["pts", "reb", "ast", "stl", "blk", "fg3m"].includes(intent.metric) ? intent.metric : "pts";
  const r = asObj(await runNbaAskTool(ctx.db, "get_daily_leaders", { metric }, lang, ctx.timeZone));
  const leaders = asRows(r?.leaders);
  if (leaders.length === 0) return text(T(lang, "その日の box スコアはまだありません。", "No box scores for that day yet."));
  return boardAnswer(T(lang, `最新の試合日（米国東部 ${String(r?.date ?? "")}）の${col(lang, metric)}上位`, `${col(lang, metric)} leaders, ${String(r?.date ?? "")} (US Eastern)`), {
    columns: cols(lang, ["rank", metric]),
    rows: leaders.map((l) => ({ label: `${String(l.name ?? "")} ${String(l.team ?? "")}`, cells: [String(l.rank ?? ""), num(l.value)] })),
  });
}

const AWARD_TITLE: Record<string, { ja: string; en: string }> = {
  mvp: { ja: "MVP", en: "MVP" },
  rookie: { ja: "新人王", en: "Rookie of the Year" },
  dpoy: { ja: "最優秀守備選手", en: "Defensive Player of the Year" },
  sixth: { ja: "シックスマン賞", en: "Sixth Man" },
  mip: { ja: "MIP（成長株）", en: "Most Improved" },
};

async function awardLadder(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const award = intent.award ?? "mvp";
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  const rows = (award === "rookie" ? hub?.rookies : award === "mvp" ? hub?.mvp : hub?.[award]) ?? [];
  const title = (ja(lang) ? AWARD_TITLE[award]?.ja : AWARD_TITLE[award]?.en) ?? award;
  if (rows.length === 0) return text(T(lang, `${title}ラダーはまだ出ていません（試合数が足りない時期は空です）。`, `The ${title} ladder isn't out yet.`));
  return boardAnswer(
    T(lang, `${title}ラダー（UNITERZ の試算・公式の予想ではありません）`, `${title} ladder (UNITERZ estimate, not official)`),
    {
      columns: cols(lang, ["pts", "reb", "ast"]),
      rows: rows.slice(0, 5).map((r, i) => ({ label: `${i + 1}. ${r.name} ${abbr(r.teamId)}`, cells: [num(r.pts), num(r.reb), num(r.ast)] })),
      note: T(lang, "順位ページの LEAGUE タブで詳しく見られます。", "See the LEAGUE tab on the standings page."),
    }
  );
}

// ---------------------------------------------------------------------------
// PRO
// ---------------------------------------------------------------------------

async function proInsight(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const date = resolveAskDate(intent.date ?? "today", ctx.timeZone);
  if (!date) return text(T(lang, "日付が読み取れませんでした。", "Couldn't read the date."), false);
  const teamId = resolveNbaAskTeamId(intent.team);
  const r = asObj(await runNbaAskTool(ctx.db, "get_pro_insight", { date, ...(teamId ? { team: abbr(teamId) } : {}) }, lang, ctx.timeZone));
  if (!r) return text(T(lang, "Pro Pick を読み込めませんでした。", "Couldn't load Pro Pick."));
  if (Array.isArray(r.games)) {
    const list = asRows(r.games).map((g) => `${String(g.away)} @ ${String(g.home)}`).join("、");
    return text(
      list
        ? T(lang, `${dateLabel(date, lang)}は複数の試合があります（${list}）。どのチームの試合か教えてください。`, `${dateLabel(date, lang)} has several games (${list}). Which team?`)
        : T(lang, `${dateLabel(date, lang)}の試合はありません。`, `No game on ${dateLabel(date, lang)}.`),
      false
    );
  }
  if (r.found !== true) return text(T(lang, `${String(r.away ?? "")} @ ${String(r.home ?? "")} の Pro Pick はまだできていません。`, `Pro Pick for ${String(r.away ?? "")} @ ${String(r.home ?? "")} is not ready yet.`));
  const lines = asRows(r.sections).flatMap((s) => (Array.isArray(s.lines) ? s.lines.map((l) => `・${String(l)}`) : []));
  return text([`Pro Pick — ${String(r.away)} @ ${String(r.home)}（${dateLabel(date, lang)}）`, ...lines.slice(0, 8)].join("\n"));
}

async function proLeague(ctx: NbaAskNbaContext): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const r = asObj(await runNbaAskTool(ctx.db, "get_pro_league_leaders", {}, lang, ctx.timeZone));
  const leaders = asRows(r?.leaders);
  if (leaders.length === 0) return text(T(lang, "今日の PRO LEAGUE はまだ集計がありません。", "No PRO LEAGUE scores yet today."));
  return boardAnswer(T(lang, `PRO LEAGUE ${dateLabel(String(r?.date ?? ""), lang)}${r?.complete ? "" : "（集計中）"}`, `PRO LEAGUE ${dateLabel(String(r?.date ?? ""), lang)}${r?.complete ? "" : " (in progress)"}`), {
    columns: cols(lang, ["rank", "points"]),
    rows: leaders.map((l) => ({ label: String(l.name ?? ""), cells: [String(l.rank ?? ""), num(l.points)] })),
  });
}

function newsUnavailable(ctx: NbaAskNbaContext): NbaAskAnswer {
  return text(
    T(
      ctx.language,
      "トレードや噂などのニュースは、このチャットでは調べられません。アプリにある今季の入れ替わり（IN / OUT）・故障者リスト・契約なら答えられます。",
      "This chat can't look up news such as trades or rumors. It can answer from the app's data: this season's roster moves (IN / OUT), injury reports, and contracts."
    ),
    false
  );
}

// ---------------------------------------------------------------------------

export async function answerNbaAskQuery(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const q = intent.query ?? "unsupported";

  const askedYear = Number(/^(\d{4})/.exec(intent.season ?? intent.date ?? "")?.[1] ?? /(?:19|20)\d{2}/.exec(ctx.question)?.[0]);
  if (askedYear && askedYear < 2020) {
    return text(
      T(lang, "アプリにあるのは 2020-21 シーズンからのデータです。それより前の試合・成績・優勝チームには答えられません。", "The app has data from the 2020-21 season on. It can't answer about earlier games, stats, or champions."),
      false
    );
  }

  if (q === "games_on_date") {
    const asked = resolveAskDate(intent.date ?? "today", ctx.timeZone);
    if (!asked) return text(T(lang, "日付が読み取れませんでした。", "Couldn't read the date."), false);
    const teamId = resolveNbaAskTeamId(intent.team);
    /** チームだけ聞かれて今日以降に試合が無いときは、次の試合まで 7 日先読みする */
    const lookAhead = teamId && !intent.date ? 7 : 0;
    let date = asked;
    let games: NbaAskGameCard[] = [];
    for (let i = 0; i <= lookAhead; i++) {
      date = shiftDateKey(asked, i);
      const r = await runNbaAskTool(ctx.db, "get_games_on_date", { date, pickup_only: intent.pickup_only }, lang, ctx.timeZone);
      games = gamesFromAskTool("get_games_on_date", r) ?? [];
      if (teamId) games = games.filter((g) => g.homeTeamId === teamId || g.awayTeamId === teamId);
      if (games.length > 0) break;
    }
    const day = dateLabel(date, lang);
    if (games.length === 0) {
      return text(
        intent.pickup_only
          ? T(lang, `${day}の PICK UP 試合はありません。`, `No PICK UP game on ${day}.`)
          : teamId
            ? lookAhead
              ? T(lang, `${teamJa(teamId)}は${dateLabel(asked, lang)}から1週間、試合の予定がありません。`, `${abbr(teamId)} has no game in the next week.`)
              : T(lang, `${day}、${teamJa(teamId)}の試合はありません。`, `${abbr(teamId)} doesn't play on ${day}.`)
            : T(lang, `${day}の NBA の試合はありません。`, `No NBA games on ${day}.`),
        false
      );
    }
    return {
      answer: intent.pickup_only
        ? T(lang, `${day}の PICK UP（${games.length}試合）`, `${day} PICK UP (${games.length})`)
        : teamId && date !== asked
          ? T(lang, `${teamJa(teamId)}の次の試合は${day}です。`, `${abbr(teamId)}'s next game is on ${day}.`)
          : T(lang, `${day}の試合（${games.length}試合）`, `${day} games (${games.length})`),
      board: null,
      games,
      opens: [],
      usedStats: false,
    };
  }

  if (q === "who_wins") {
    return {
      ...text(
        T(
          lang,
          "どちらが勝つかの予想はこのチャットでは出していません。試合カードの予想画面にあるスタッツ・ケガ人・直近の調子が参考になります。PRO の人は Pro Pick で勝つ確率と予想スコアも見られます。",
          "This chat doesn't pick winners. The pick screen on each game card shows stats, injuries, and recent form; PRO members also get win probability and a projected score in Pro Pick."
        ),
        false
      ),
      opens: ["games"],
    };
  }

  if (q === "player_leaders") return playerLeaders(ctx, intent);
  if (q === "on_off") return onOffAnswer(ctx, intent);
  if (q === "salary_ranking") return salaryRanking(ctx, intent);
  if (q === "style_map") return styleMapAnswer(ctx, intent);

  if (q.startsWith("player_")) {
    const found = await needPlayer(ctx, intent);
    if ("reply" in found) return found.reply;
    const hit = found.hit;
    switch (q) {
      case "player_last_game":
        return playerLastGame(ctx, hit);
      case "player_game_on_date":
        return playerGameOnDate(ctx, hit, intent);
      case "player_recent_games":
        return playerRecentGames(ctx, hit, intent);
      case "player_season":
        return playerSeason(ctx, hit);
      case "player_splits":
        return playerSplits(ctx, hit, intent);
      case "player_highs":
        return playerHighs(ctx, hit, intent);
      case "player_matchups":
        return matchupsAnswer(ctx, hit, intent);
      case "player_profile":
        return playerProfile(ctx, hit);
      case "player_career":
        return playerCareer(ctx, hit, intent);
      case "player_contract":
        return playerContract(ctx, hit);
      case "player_shot_zones":
        return playerShotZones(ctx, hit, intent);
      case "player_discipline":
        return disciplineAnswer(ctx, intent, { player_id: hit.playerId }, hit.name);
    }
  }

  if (q === "milestones") return milestones(ctx, intent);
  if (q === "daily_leaders") return dailyLeaders(ctx, intent);
  if (q === "award_ladder") return awardLadder(ctx, intent);
  if (q === "standings") return standings(ctx, intent);
  if (q === "team_stat") return teamStat(ctx, intent);
  if (q === "pro_insight") return proInsight(ctx, intent);
  if (q === "pro_league") return proLeague(ctx);
  if (q === "news") return newsUnavailable(ctx);

  if (q === "team_injuries" && intent.player) {
    const p = await needPlayer(ctx, intent);
    if ("reply" in p) return p.reply;
    return teamInjuries(ctx, p.hit.teamId, p.hit);
  }

  if (q.startsWith("team_")) {
    const t = needTeam(ctx, intent);
    if ("reply" in t) return t.reply;
    switch (q) {
      case "team_recent_games":
        return teamRecentGames(ctx, t.teamId, intent);
      case "team_record":
        return teamRecord(ctx, t.teamId, intent);
      case "team_roster":
        return teamRoster(ctx, t.teamId);
      case "team_lineups":
        return teamLineups(ctx, t.teamId, intent);
      case "team_injuries":
        return teamInjuries(ctx, t.teamId);
      case "team_moves":
        return teamMoves(ctx, t.teamId);
      case "team_shapes":
        return teamShapes(ctx, t.teamId, intent);
      case "team_discipline":
        return disciplineAnswer(ctx, intent, { team: abbr(t.teamId) }, abbr(t.teamId));
      case "team_payroll":
        return teamPayroll(ctx, t.teamId);
      case "team_splits":
        return teamSplits(ctx, t.teamId, intent);
      case "team_position_defense":
        return teamPositionDefense(ctx, t.teamId, intent);
      case "team_draft_picks":
        return teamDraftPicks(ctx, t.teamId);
    }
  }

  return text(
    T(
      lang,
      "その質問に答えられるデータはアプリにありません。試合・選手・チームの成績、順位、ケガ人、ラインナップ、契約などは聞けます。",
      "The app has no data for that. You can ask about games, player and team stats, standings, injuries, lineups, and contracts."
    ),
    false
  );
}
