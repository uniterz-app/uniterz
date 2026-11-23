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
import {
  applyCleanRatingsToLeagueTeamBundle,
  loadNbaTeamCleanRatings,
} from "@/lib/nba/cleanRatings/applyCleanRatingsToLeagueTeamBundle";
import { answerNbaAskCompare, conferenceFilter, nbaAskRelativeSeason } from "./nbaAskCompare";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import { answerNbaAskFilter } from "./nbaAskFilter";
import { answerNbaAskMore } from "./nbaAskMore";
import { answerNbaAskCombo } from "./nbaAskCombo";
import { loadPlayerSeasonMetricsSnapshot } from "@/lib/nba/playerSeasonMetrics/loadPlayerSeasonMetricsSnapshot";
import { formatShotPerGame, nbaShotPctParts } from "@/lib/nba/playerStatLeaders/shotPctParts";
import { loadNbaDisciplineHistory } from "@/lib/nba/discipline/nbaDisciplineHistory";
import { loadNbaDisciplineSnapshot } from "@/lib/nba/discipline/nbaDisciplineSnapshot";
import type { NbaDisciplineCounts } from "@/lib/nba/discipline/disciplineTypes";
import {
  formatPlayerAdvancedLeaderValue,
  playerAdvancedMetricDef,
  type NbaPlayerAdvancedLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersAdvanced";
import {
  nbaAskHowTheyPlayFocus,
  nbaAskIsSingleQuestion,
  nbaAskTeamHowTheyPlayFocus,
  nbaAskHowTheyPlayFocusForStat,
  type NbaAskHowFocus,
  type NbaAskTeamHowFocus,
} from "./nbaAskHowTheyPlay";
import { getTeamHowTheyPlay } from "@/lib/predict/nbaTeamDetailHowTheyPlay";
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
import { NBA_ASK_PLAYER_STAT_WORDS, NBA_ASK_TEAM_STAT_WORDS, nbaAskIsPctStat, nbaAskStatWord, nbaAskStatWordsAll } from "./nbaAskStatWords";
import { NBA_CONFERENCE_STANDINGS_COLLECTION } from "@/lib/nba/standings/loadNbaConferenceStandings";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import {
  abbr,
  gameDateKeysByBdlId,
  loadMovesDoc,
  loadRosters,
  readStandingsBoard,
  resolveAskDate,
  runNbaAskTool,
} from "./nbaAskTools";
import { DAILY_LEADER_STATS } from "@/lib/nba/dailyLeaders/buildDailyLeaders";
import { gamesFromAskTool, NBA_ASK_LADDER_AWARDS, type NbaAskBoard, type NbaAskGameCard, type NbaAskMoves, type NbaAskView } from "./nbaAskBoard";
import type { NbaAskDestinationId } from "./nbaAskDestinations";
import type { NbaAskIntent, NbaAskMetric } from "./nbaAskIntent";
import { pickNbaAskPlayer, resolveNbaAskPlayer, type NbaAskPlayerHit } from "./nbaAskPlayerResolve";
import { findNbaAskTeamsInText, nbaAskTeamJaName, resolveNbaAskTeamId } from "./nbaAskTeamNames";
import { countryJa, injuryReasonJa, positionJa } from "./nbaAskJa";

export type NbaAskAnswer = {
  answer: string;
  board: NbaAskBoard | null;
  games: NbaAskGameCard[] | null;
  moves?: NbaAskMoves | null;
  view?: NbaAskView | null;
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
  /** Pro Insight / PRO LEAGUE の中身を出してよいか。省略は false */
  isPro?: boolean;
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

/** 試合ログの MIN は分.秒（5.6 = 5:36）。平均の小数分は num のまま */
function minLabel(v: unknown): string {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return "—";
  const whole = Math.floor(v);
  const frac = v - whole;
  if (frac < 0.05) return String(whole);
  const sec = Math.round(frac * 60);
  if (sec === 60) return String(whole + 1);
  return `${whole}:${String(sec).padStart(2, "0")}`;
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

/** 「前回の試合のブロック」= 聞かれた項目も答えの文に */
function askedLineText(q: string, l: { stl: unknown; blk: unknown; fg3?: string; ft?: string; fg?: string }): string {
  const bits = [
    /ブロック/.test(q) ? `${num(l.blk)}ブロック` : "",
    /スティール/.test(q) ? `${num(l.stl)}スティール` : "",
    /3P|スリー|3ポイント/i.test(q) && l.fg3 ? `3P ${l.fg3.replace("-", "/")}` : "",
    /フリースロー|\bFT/i.test(q) && l.ft ? `FT ${l.ft.replace("-", "/")}` : "",
    /\bFG|フィールドゴール/i.test(q) && l.fg ? `FG ${l.fg.replace("-", "/")}` : "",
  ].filter(Boolean);
  return bits.length ? `${bits.join("・")}。` : "";
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
        `${who}の${fresh.live ? "今の試合" : "前回の試合"}: ${dateLabel(fresh.dateKey, lang)} ${vs} ${outcome} ${fresh.score ?? ""}`.trim() +
          `。${num(fresh.line.pts)}点 ${num(fresh.line.reb)}リバウンド ${num(fresh.line.ast)}アシスト。${askedLineText(ctx.question, fresh.line)}`,
        `${hit.name} (${abbr(hit.teamId)}) ${fresh.live ? "live now" : "last game"}: ${dateLabel(fresh.dateKey, lang)} ${vs} ${outcome} ${fresh.score ?? ""}`.trim() +
          ` — ${num(fresh.line.pts)} PTS, ${num(fresh.line.reb)} REB, ${num(fresh.line.ast)} AST.`
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
  const out = boardAnswer(
    T(
      lang,
      `${who}の前回の試合${seasonNote}: ${when} ${vs} ${resultWord(g.result, lang)}。${num(g.pts)}点 ${num(g.reb)}リバウンド ${num(g.ast)}アシスト。${askedLineText(ctx.question, { stl: g.stl, blk: g.blk, fg: `${g.fgm}-${g.fga}`, fg3: `${g.fg3m}-${g.fg3a}`, ft: `${g.ftm}-${g.fta}` })}`,
      `${hit.name} (${abbr(hit.teamId)}) last game${seasonNote}: ${when} ${vs} ${resultWord(g.result, lang)} — ${num(g.pts)} PTS, ${num(g.reb)} REB, ${num(g.ast)} AST.`
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
  /** 試合ログに入った試合だけ（box だけの直後の試合はログの先頭と違う） */
  return season === CURRENT_NBA_SEASON_KEY
    ? { ...out, view: { kind: "player", id: hit.playerId, section: "game_logs", count: 1 } }
    : out;
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
  /** 「直近3試合の3P」「最近5試合のブロック」= その項目も平均と列に */
  const q = ctx.question;
  const shot = /(?:3P|スリー|3ポイント)/i.test(q) ? "fg3" : /フリースロー|\bFT/i.test(q) ? "ft" : /\bFG|フィールドゴール/i.test(q) ? "fg" : null;
  const box = /ブロック/.test(q) ? "blk" : /スティール/.test(q) ? "stl" : null;
  const made = (g: Record<string, unknown>, k: string) => String(g[k] ?? "0-0").split("-").map(Number) as [number, number];
  let extraHead = "";
  let extraCol: string | null = null;
  let extraCell: ((g: Record<string, unknown>) => string) | null = null;
  if (shot) {
    const [m, a] = games.reduce<[number, number]>((acc, g) => { const [x, y] = made(g, shot); return [acc[0] + (x || 0), acc[1] + (y || 0)]; }, [0, 0]);
    const label = shot === "fg3" ? "3P" : shot === "ft" ? "FT" : "FG";
    extraHead = T(lang, `・${label} ${m}/${a}（平均 ${num(m / games.length)}本・${a ? ((m / a) * 100).toFixed(1) : "0.0"}%）`, ` · ${label} ${m}/${a}`);
    extraCol = label;
    extraCell = (g) => String(g[shot] ?? "—").replace("-", "/");
  } else if (box) {
    extraHead = T(lang, `・${box === "blk" ? "ブロック" : "スティール"} 平均 ${num(avg(box))}`, ` · ${num(avg(box))} ${box.toUpperCase()}`);
    extraCol = col(lang, box);
    extraCell = (g) => num(g[box]);
  }
  return boardAnswer(
    T(
      lang,
      `${hit.name}（${teamJa(hit.teamId)}）直近${games.length}試合${season !== CURRENT_NBA_SEASON_KEY ? `（${season}）` : ""}: 平均 ${num(avg("pts"))}点 ${num(avg("reb"))}リバウンド ${num(avg("ast"))}アシスト${extraHead}`,
      `${hit.name} (${abbr(hit.teamId)}) last ${games.length}${season !== CURRENT_NBA_SEASON_KEY ? ` (${season})` : ""}: ${num(avg("pts"))} PTS ${num(avg("reb"))} REB ${num(avg("ast"))} AST${extraHead}`
    ),
    {
      columns: [...cols(lang, ["min", "pts", "reb", "ast"]), ...(extraCol ? [extraCol] : [])],
      rows: games.map((g) => ({
        label: `${dateLabel(String(g.date ?? ""), lang)} ${abbrsToJa(String(g.opp ?? ""), lang)} ${ja(lang) ? (g.result === "W" ? "勝" : g.result === "L" ? "敗" : "") : String(g.result ?? "")}`.trim(),
        cells: [minLabel(g.min), num(g.pts), num(g.reb), num(g.ast), ...(extraCell ? [extraCell(g)] : [])],
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
  let gpOnly = false;
  const many = nbaAskStatWordsAll(NBA_ASK_PLAYER_STAT_WORDS, ctx.question).slice(0, 4);
  if (/何試合(?!連続)(?:.{0,3}(?:出|出場))?|出場試合数?/.test(ctx.question) && !/以上|以下|連続/.test(ctx.question)) {
    focusText = T(lang, `出場 ${p.gp}試合`, `${p.gp} games played`);
    gpOnly = true;
  } else if (many.length >= 2) {
    const { metrics } = await loadPlayerSeasonMetricsSnapshot(ctx.db, season, hit.playerId);
    const parts = await Promise.all(
      many.map(async (w) => {
        const isCount = /^(?:games_|double_|triple_)/.test(w.id);
        const c = isCount ? await countFromLogs(ctx, season, hit.playerId, w.id) : metrics[w.id as NbaPlayerLeaderMetricId];
        if (!c || typeof c.value !== "number") return "";
        return `${ja(lang) ? w.ja : w.en} ${statValueText(w.id, c.value)}${isCount ? T(lang, "回", "") : ""}${c.rank ? T(lang, `（${c.rank}位）`, ` (#${c.rank})`) : ""}`;
      })
    );
    focusText = parts.filter(Boolean).join(T(lang, "・", ", "));
  } else if (word && !(hits.length >= 2 && !focus)) {
    countStat = /^(?:games_|double_|triple_)/.test(word.id);
    const all = countStat ? null : (await loadPlayerSeasonMetricsSnapshot(ctx.db, season, hit.playerId)).metrics;
    const c = countStat ? await countFromLogs(ctx, season, hit.playerId, word.id) : all?.[word.id as NbaPlayerLeaderMetricId];
    const parts = nbaShotPctParts(word.id);
    const made = all && parts ? (all[word.id as NbaPlayerLeaderMetricId]?.made ?? (parts.made ? all[parts.made as NbaPlayerLeaderMetricId]?.value : undefined)) : undefined;
    const att = all && parts ? (all[word.id as NbaPlayerLeaderMetricId]?.att ?? (parts.att ? all[parts.att as NbaPlayerLeaderMetricId]?.value : undefined)) : undefined;
    const shotText =
      made != null && att != null
        ? T(lang, `（1試合 ${formatShotPerGame(made)}/${formatShotPerGame(att)}本・計 約${Math.round(made * p.gp)}/${Math.round(att * p.gp)}本）`, ` (${formatShotPerGame(made)}/${formatShotPerGame(att)} per game)`)
        : "";
    if (c && typeof c.value === "number") {
      const rank = c.rank
        ? T(lang, `・リーグ${c.rank}位`, `, #${c.rank} in the league`)
        : /何位|順位|ランキング|\brank/i.test(ctx.question)
          ? T(lang, "・出場試合が少なくリーグ順位の対象外", ", not enough games to be ranked")
          : "";
      focusText = `${ja(lang) ? word.ja : word.en} ${statValueText(word.id, c.value)}${shotText}${countStat ? T(lang, "回", "") : ""}${rank}`;
    } else countStat = false;
  }
  const out = boardAnswer(
    T(
      lang,
      `${hit.name}（${teamJa(hit.teamId)}）${season} の${gpOnly ? `${focusText}（平均 ${num(p.mpg)}分）` : focusText ? `${focusText}（${p.gp}試合${countStat ? "" : "の平均"}）` : "平均"}${prior ? "（今季はまだ出場なし）" : ""}`,
      `${hit.name} (${abbr(hit.teamId)}) ${season} ${gpOnly ? `${focusText} (${num(p.mpg)} MPG)` : focusText ? `${focusText} (${p.gp} games${countStat ? "" : ", average"})` : "averages"}${prior ? " (no games this season yet)" : ""}`
    ),
    {
      columns: cols(lang, ["pts", "reb", "ast"]),
      rows: [{ label: season, cells: [num(p.ppg), num(p.rpg), num(p.apg)] }],
      note,
    }
  );
  /** 数字を答えたうえで、選手詳細の SEASON AVERAGES（ドライブなどは HOW THEY PLAY のそのタブ）を下に出す */
  if (prior) return out;
  const how = word && focusText ? nbaAskHowTheyPlayFocusForStat(ctx.question, word.id) : null;
  return {
    ...out,
    view: how
      ? { kind: "player", id: hit.playerId, section: "how_they_play", tab: how.tab, ...(how.group ? { group: how.group } : {}) }
      : { kind: "player", id: hit.playerId, section: "season" },
  };
}

/** 「ドライブに関するスタッツ」→ 選手詳細の HOW THEY PLAY のそのタブを上に出し、値と順位を下に書く */
async function howTheyPlayAnswer(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit, focus: NbaAskHowFocus): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const season = hit.player.averagesSeasonKey || CURRENT_NBA_SEASON_KEY;
  const { metrics } = await loadPlayerSeasonMetricsSnapshot(ctx.db, season, hit.playerId);
  const items = focus.ids.flatMap((id) => {
    const c = metrics[id as NbaPlayerLeaderMetricId];
    if (!c || typeof c.value !== "number") return [];
    try {
      const def = playerAdvancedMetricDef(id as NbaPlayerAdvancedLeaderMetric);
      return [{ short: def.short, value: formatPlayerAdvancedLeaderValue(def.id, c.value), rank: c.rank ?? null }];
    } catch {
      return [];
    }
  });
  const label = ja(lang) ? focus.ja : focus.en;
  if (items.length === 0) {
    return text(T(lang, `${hit.name} の${label}のデータはまだありません。`, `No ${label.toLowerCase()} data for ${hit.name} yet.`));
  }
  const line = items
    .map((it) => `${it.short} ${it.value}${it.rank ? T(lang, `（${it.rank}位）`, ` (#${it.rank})`) : ""}`)
    .join(" · ");
  const out = boardAnswer(
    T(lang, `${hit.name}（${teamJa(hit.teamId)}）${season} の${label}: ${line}`, `${hit.name} (${abbr(hit.teamId)}) ${season} ${label}: ${line}`),
    {
      columns: [T(lang, "値", "Value"), T(lang, "順位", "Rank")],
      rows: items.map((it) => ({ label: it.short, cells: [it.value, it.rank ? String(it.rank) : "—"] })),
    }
  );
  if (season !== CURRENT_NBA_SEASON_KEY) return out;
  return {
    ...out,
    view: { kind: "player", id: hit.playerId, section: "how_they_play", tab: focus.tab, ...(focus.group ? { group: focus.group } : {}) },
  };
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
  /** 「ホームとアウェーで3P%」のように項目を聞かれたら見出しはその項目 */
  const q = ctx.question;
  type Focus = { ja: string; en: string; unit: string; pct: boolean; v: (list: typeof logs) => number | null };
  const ratio = (list: typeof logs, m: "fgm" | "fg3m" | "ftm", a: "fga" | "fg3a" | "fta") => {
    const att = list.reduce((sum, g) => sum + (g[a] ?? 0), 0);
    return att ? list.reduce((sum, g) => sum + (g[m] ?? 0), 0) / att : null;
  };
  const per = (k: "pts" | "reb" | "ast" | "fg3m" | "stl" | "blk") => (list: typeof logs) => list.reduce((sum, g) => sum + g[k], 0) / list.length;
  const focus: Focus =
    /3P%|3P成功率|スリー.{0,3}(?:成功率|確率|%)|3ポイント.{0,3}(?:成功率|確率)|three.?point\s*%/i.test(q)
      ? { ja: "3P成功率", en: "3P%", unit: "", pct: true, v: (l) => ratio(l, "fg3m", "fg3a") }
      : /FG%|FG成功率|フィールドゴール|シュート(?:成功)?率|シュート確率/i.test(q)
        ? { ja: "FG成功率", en: "FG%", unit: "", pct: true, v: (l) => ratio(l, "fgm", "fga") }
        : /フリースロー|FT%|\bFT\b/i.test(q)
          ? { ja: "FT成功率", en: "FT%", unit: "", pct: true, v: (l) => ratio(l, "ftm", "fta") }
          : /リバウンド|\breb/i.test(q)
            ? { ja: "リバウンド", en: "RPG", unit: "", pct: false, v: per("reb") }
            : /アシスト|\bast/i.test(q)
              ? { ja: "アシスト", en: "APG", unit: "", pct: false, v: per("ast") }
              : /スリー|3P|3ポイント|three/i.test(q)
                ? { ja: "3P成功数", en: "3PM", unit: "本", pct: false, v: per("fg3m") }
                : { ja: "得点", en: "PPG", unit: "点", pct: false, v: per("pts") };
  const fv = (v: number | null) => (v === null ? "—" : focus.pct ? pct(v) : `${num(v)}${focus.unit}`);
  const filled = groups
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => {
      const avg = (k: "pts" | "reb" | "ast") => list.reduce((sum, g) => sum + g[k], 0) / list.length;
      const fg = ratio(list, "fgm", "fga");
      const fg3 = ratio(list, "fg3m", "fg3a");
      return {
        games: list.length,
        f: focus.v(list),
        row: { label: `${label} ${list.length}${T(lang, "試合", "G")}`, cells: [num(avg("pts")), num(avg("reb")), num(avg("ast")), fg === null ? "—" : pct(fg), fg3 === null ? "—" : pct(fg3)] },
      };
    });
  const rows = filled.map((f) => f.row);
  const seasonNote = season !== CURRENT_NBA_SEASON_KEY ? `（${season}）` : "";
  if (rows.length === 0) {
    return text(T(lang, `${hit.name} は${season}に${oppId ? `${teamJa(oppId)}との` : ""}試合がまだありません。`, `${hit.name} has no ${season} game${oppId ? ` vs ${abbr(oppId)}` : ""} yet.`));
  }
  const [a, b] = filled;
  const diff = a && b && a.f !== null && b.f !== null ? a.f - b.f : null;
  const diffText = diff === null ? "" : focus.pct ? `${diff >= 0 ? "+" : ""}${(diff * 100).toFixed(1)}pt` : `${diff >= 0 ? "+" : ""}${num(diff)}${focus.unit}`;
  /** 「ホームのほうが -1.1点」ではなく、多いほうを主語に */
  const gapText =
    diff === null
      ? ""
      : diff === 0
        ? "で、差はありません"
        : `で、${diff > 0 ? "ホーム" : "アウェー"}のほうが ${focus.pct ? `${(Math.abs(diff) * 100).toFixed(1)}pt 高い` : `${num(Math.abs(diff))}${focus.unit} 多い`}`;
  const headline = oppId
    ? T(
        lang,
        `${hit.name} の${teamJa(oppId)}戦${seasonNote}は ${a.games}試合で${focus.pct ? `${focus.ja} ${fv(a.f)}` : `平均 ${fv(a.f)}${focus.unit ? "" : focus.ja}`}。`,
        `${hit.name} vs ${abbr(oppId)}${seasonNote}: ${fv(a.f)} ${focus.en} in ${a.games} games.`
      )
    : a && b
      ? T(
          lang,
          `${hit.name}${seasonNote}の${focus.ja}はホーム ${fv(a.f)}・アウェー ${fv(b.f)}${gapText}。`,
          `${hit.name}${seasonNote} ${focus.en}: ${fv(a.f)} at home, ${fv(b.f)} on the road${diffText ? ` (${diffText})` : ""}.`
        )
      : T(lang, `${hit.name} のホームとアウェー${seasonNote}`, `${hit.name} home / away${seasonNote}`);
  return boardAnswer(headline, { columns: [...cols(lang, ["pts", "reb", "ast", "fgPct"]), "3P%"], rows });
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
  /** 「今季最高得点」のように 1 項目なら数字を答えて、下に選手詳細のシーズン最高を出す */
  const word = nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, ctx.question);
  const one = keys.find((k) => k === word?.id);
  if (one && word) {
    const best = logs.reduce((a, b) => (b[one] > a[one] ? b : a));
    return boardAnswer(
      T(
        lang,
        `${hit.name} の${season}シーズン最高${word.ja}は ${num(best[one])}（${best.dateLabel} ${vsLabel(best.home, best.oppAbbr, lang)}・${logs.length}試合中）`,
        `${hit.name} ${season} season-high ${word.en}: ${num(best[one])} (${best.dateLabel} ${vsLabel(best.home, best.oppAbbr, lang)}, ${logs.length} games)`
      ),
      { columns: T(lang, "記録|試合", "HIGH|GAME").split("|"), rows: rows.filter((_, i) => keys[i] === one) }
    );
  }
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

/** 今季以外・プレーオフの平均はキャリアの doc から（ロスターの平均は今季のレギュラーだけ） */
async function playerOtherSeason(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const season = intent.season && intent.season !== CURRENT_NBA_SEASON_KEY ? intent.season : null;
  if (!season) return playerCareer(ctx, hit, intent);
  const kind = intent.playoffs ? T(lang, "プレーオフ", "playoffs") : T(lang, "レギュラーシーズン", "regular season");
  const r = asObj(
    await runNbaAskTool(ctx.db, "get_player_career", { player_id: hit.playerId, season_type: intent.playoffs ? "playoffs" : "season", season }, lang, ctx.timeZone)
  );
  const row = asRows(r?.seasons)[0];
  if (!row) return text(T(lang, `${hit.name} の${season}（${kind}）の記録はありません。`, `No ${season} ${kind} record for ${hit.name}.`));
  const team = typeof row.team === "string" ? (resolveNbaAskTeamId(row.team) ? teamJa(resolveNbaAskTeamId(row.team)!) : row.team) : "";
  return boardAnswer(
    T(
      lang,
      `${hit.name} の${season}（${kind}${team ? `・${team}` : ""}）は ${String(row.gp ?? "—")}試合で平均 ${num(row.pts)}点 ${num(row.reb)}リバウンド ${num(row.ast)}アシスト。`,
      `${hit.name} ${season} (${kind}${row.team ? `, ${String(row.team)}` : ""}): ${num(row.pts)}/${num(row.reb)}/${num(row.ast)} in ${String(row.gp ?? "—")} games.`
    ),
    {
      columns: cols(lang, ["pts", "reb", "ast"]),
      rows: [{ label: `${season} ${String(row.team ?? "")}`.trim(), cells: [num(row.pts), num(row.reb), num(row.ast)] }],
    }
  );
}

async function playerContract(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const r = asObj(await runNbaAskTool(ctx.db, "get_player_contract", { player_id: hit.playerId }, lang, ctx.timeZone));
  const rows = asRows(r?.seasons);
  if (!r || r.found !== true || rows.length === 0) return text(T(lang, `${hit.name} の契約データはアプリにありません。`, `No contract data for ${hit.name} in the app.`));
  const fa = r.freeAgencyYear ? T(lang, `FA ${String(r.freeAgencyYear)}${r.freeAgencyType ? `（${String(r.freeAgencyType)}）` : ""}`, `FA ${String(r.freeAgencyYear)}${r.freeAgencyType ? ` (${String(r.freeAgencyType)})` : ""}`) : "";
  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  const total = rows.reduce((sum, row) => sum + Number(row.salary ?? 0), 0);
  const lastOpt = last.option ? T(lang, `（最終年は ${String(last.option)}）`, ` (final year ${String(last.option)})`) : "";
  return boardAnswer(
    T(
      lang,
      `${hit.name}（${teamJa(hit.teamId)}）の今季（${String(first.season ?? "")}）の年俸は ${money(first.salary)}。契約は ${String(last.season ?? "")} まで${lastOpt}・残り${rows.length}シーズンで総額 ${money(total)}。`,
      `${hit.name} (${abbr(hit.teamId)}): ${money(first.salary)} in ${String(first.season ?? "")}; signed through ${String(last.season ?? "")}${lastOpt}, ${money(total)} over ${rows.length} seasons.`
    ),
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

type DisciplineKey = "fines" | "tech" | "flag" | "eject" | "susp";

const DISCIPLINE_WORDS: ReadonlyArray<[RegExp, DisciplineKey, string, string]> = [
  [/罰金|ファイン|\bfines?\b/i, "fines", "罰金", "fines"],
  [/テクニカル|technicals?|\btechs?\b/i, "tech", "テクニカル", "technicals"],
  [/フ[ラレ]グラント|flagrants?/i, "flag", "フラグラント", "flagrants"],
  [/退場|ejections?|ejected/i, "eject", "退場", "ejections"],
  [/出場停止|サスペンション|suspensions?/i, "susp", "出場停止", "suspension games"],
];

const KANJI_NUM: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

/** 「過去5シーズン」→ 5、「通算」→ all。規律は 2020-21 から */
function disciplineRange(question: string): number | "all" | null {
  const q = question.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
  if (/通算|キャリア|これまで|全シーズン|歴代|\bcareer\b|all.?time/i.test(q)) return "all";
  const m =
    /(?:過去|直近|ここ|最近|last|past)\s*(\d+|[一二三四五六七八九十])\s*(?:シーズン|年|季|seasons?|years?)/i.exec(q) ??
    /(\d+|[一二三四五六七八九十])\s*(?:シーズン|年)(?:間|分)/.exec(q);
  if (!m) return null;
  const n = /^\d+$/.test(m[1]!) ? Number(m[1]) : (KANJI_NUM[m[1]!] ?? 0);
  return n > 1 ? n : null;
}

function disciplineValue(key: DisciplineKey, c: NbaDisciplineCounts, lang: string): string {
  if (key === "fines") return money(c.fines);
  return key === "susp" ? T(lang, `${num(c.susp)}試合`, `${num(c.susp)} games`) : num(c[key]);
}

/** 「テクニカルが一番多い選手 / チーム」= 名前なしの規律の順位 */
async function disciplineLeaders(ctx: NbaAskNbaContext, intent: NbaAskIntent, teams: boolean): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const season = seasonOf(intent);
  const phase = intent.playoffs ? "playoffs" : "regular";
  const snap = await loadNbaDisciplineSnapshot(ctx.db, season);
  if (!snap) return text(T(lang, `${season} の規律データはまだありません。`, `No discipline data for ${season} yet.`));
  const word = DISCIPLINE_WORDS.find(([re]) => re.test(ctx.question)) ?? DISCIPLINE_WORDS[1]!;
  const [, key, wja, wen] = word;
  const rows = (teams
    ? Object.entries(snap.teams).map(([id, t]) => ({ label: teamJa(id), c: t[phase] }))
    : Object.values(snap.players).map((p) => ({ label: `${p.name}${p.teamId ? `（${teamJa(p.teamId)}）` : ""}`, c: p[phase] }))
  )
    .filter((r) => (r.c[key] ?? 0) > 0)
    .sort((a, b) => b.c[key] - a.c[key]);
  const label = T(lang, wja, wen);
  if (rows.length === 0) return text(T(lang, `${season} はまだ${label}を受けた${teams ? "チーム" : "選手"}がいません。`, `No ${wen} yet in ${season}.`));
  const top = rows.filter((r) => r.c[key] === rows[0]!.c[key]);
  return boardAnswer(
    T(
      lang,
      `${season} の${label}がいちばん多い${teams ? "チーム" : "選手"}は${top.slice(0, 3).map((r) => r.label).join("・")}（${disciplineValue(key, rows[0]!.c, lang)}）。${key === "eject" || key === "flag" ? `${label}を受けた${teams ? "チーム" : "選手"}は${rows.length}${teams ? "チーム" : "人"}。` : ""}`,
      `${season} most ${wen}: ${top.slice(0, 3).map((r) => r.label).join(", ")} (${disciplineValue(key, rows[0]!.c, lang)}).`
    ),
    {
      columns: [...cols(lang, ["tech", "flag", "eject"]), T(lang, "罰金", "FINES")],
      rows: rows.slice(0, 8).map((r) => ({ label: r.label, cells: [num(r.c.tech), num(r.c.flag), num(r.c.eject), money(r.c.fines)] })),
    }
  );
}

/** 聞かれた項目（罰金・テクニカル…）と期間（今季・過去Nシーズン・通算）にそのまま答える */
async function disciplineAnswer(
  ctx: NbaAskNbaContext,
  intent: NbaAskIntent,
  args: Record<string, unknown>,
  who: string,
  subject: { kind: "player" | "team"; id: string }
): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const phase = intent.playoffs ? "playoffs" : "regular";
  const phaseLabel = phase === "playoffs" ? T(lang, "プレーオフ", "playoffs") : T(lang, "レギュラーシーズン", "regular season");
  const word = DISCIPLINE_WORDS.find(([re]) => re.test(ctx.question));
  const range = disciplineRange(ctx.question);

  if (range) {
    const points = await loadNbaDisciplineHistory(ctx.db, { subject: subject.kind, id: subject.id, toSeason: CURRENT_NBA_SEASON_KEY });
    const picked = range === "all" ? points : points.slice(-range);
    if (picked.length === 0) return text(T(lang, `${who} の規律データはまだありません。`, `No discipline data for ${who} yet.`));
    const first = picked[0]!.season;
    const span = `${first}〜${picked[picked.length - 1]!.season}`;
    const period = range === "all" ? T(lang, "通算", "all seasons") : T(lang, `過去${picked.length}シーズン`, `the last ${picked.length} seasons`);
    const shortNote =
      range === "all" || picked.length < range ? T(lang, `（データは${first}から）`, ` (data from ${first})`) : "";
    const total: NbaDisciplineCounts = { tech: 0, flag: 0, eject: 0, susp: 0, fines: 0 };
    for (const p of picked) for (const k of Object.keys(total) as DisciplineKey[]) total[k] += p[phase][k] ?? 0;
    let head: string;
    if (word) {
      const [, key, wja, wen] = word;
      const per = picked.map((p) => `${p.season.slice(2)} ${disciplineValue(key, p[phase], lang)}`).join(" / ");
      const forfeitNote =
        key === "fines" && total.susp > 0
          ? T(lang, `（出場停止 ${num(total.susp)}試合で失った年俸を含む）`, ` (includes salary lost to ${num(total.susp)} suspension games)`)
          : "";
      head = T(
        lang,
        `${who}の${period}（${span}・${phaseLabel}）の${wja}は合計 ${disciplineValue(key, total, lang)}${forfeitNote}${shortNote}。${per}`,
        `${who} ${wen}, ${period} (${span}, ${phaseLabel}): ${disciplineValue(key, total, lang)} total${forfeitNote}${shortNote}. ${per}`
      );
    } else {
      head = T(
        lang,
        `${who}の${period}（${span}・${phaseLabel}）: テクニカル ${num(total.tech)}・フラグラント ${num(total.flag)}・退場 ${num(total.eject)}・出場停止 ${num(total.susp)}試合・罰金 ${money(total.fines)}${shortNote}`,
        `${who}, ${period} (${span}, ${phaseLabel}): ${num(total.tech)} techs, ${num(total.flag)} flagrants, ${num(total.eject)} ejections, ${num(total.susp)} suspension games, ${money(total.fines)} in fines${shortNote}`
      );
    }
    return boardAnswer(head, {
      columns: [...cols(lang, ["tech", "flag", "eject"]), T(lang, "罰金", "FINES")],
      rows: [...picked].reverse().map((p) => ({
        label: p.season,
        cells: [num(p[phase].tech), num(p[phase].flag), num(p[phase].eject), money(p[phase].fines)],
      })),
    });
  }

  const r = asObj(await runNbaAskTool(ctx.db, "get_discipline", { ...args, season: seasonOf(intent), season_type: phase === "playoffs" ? "playoffs" : "season" }, lang, ctx.timeZone));
  if (!r || r.found !== true) return text(T(lang, `${who} の規律データはまだありません。`, `No discipline data for ${who} yet.`));
  const counts: NbaDisciplineCounts = {
    tech: Number(r.tech) || 0,
    flag: Number(r.flag) || 0,
    eject: Number(r.eject) || 0,
    susp: Number(r.suspensions) || 0,
    fines: Number(r.fineUsd) || 0,
  };
  const season = String(r.season ?? "");
  const players = asRows(r.players);
  const rows =
    players.length > 0
      ? players.map((p) => ({ label: String(p.name ?? ""), cells: [num(p.tech), num(p.flag), num(p.eject)] }))
      : [{ label: who, cells: [num(counts.tech), num(counts.flag), num(counts.eject)] }];
  const all = T(
    lang,
    `テクニカル ${num(counts.tech)}・フラグラント ${num(counts.flag)}・退場 ${num(counts.eject)}${counts.susp ? `・出場停止 ${num(counts.susp)}試合` : ""}・罰金 ${money(counts.fines)}`,
    `${num(counts.tech)} techs, ${num(counts.flag)} flagrants, ${num(counts.eject)} ejections${counts.susp ? `, ${num(counts.susp)} suspension games` : ""}, ${money(counts.fines)} in fines`
  );
  const head = word
    ? T(
        lang,
        `${who}の${season}（${phaseLabel}）の${word[2]}は ${disciplineValue(word[1], counts, lang)}。（${all}）`,
        `${who} ${word[3]} in ${season} (${phaseLabel}): ${disciplineValue(word[1], counts, lang)}. (${all})`
      )
    : T(lang, `${who}の${season}（${phaseLabel}）: ${all}`, `${who}, ${season} (${phaseLabel}): ${all}`);
  return boardAnswer(head, { columns: cols(lang, ["tech", "flag", "eject"]), rows });
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
  let viewId = "all";
  if (intent.player) {
    const found = await needPlayer(ctx, intent);
    if ("reply" in found) return found.reply;
    rows = rows.filter((r) => r.playerId === found.hit.playerId);
    who = found.hit.name;
    viewId = found.hit.playerId;
    if (rows.length === 0) {
      return text(T(lang, `${who} は、今季のペースで25試合以内に届く通算の節目がありません。`, `${who} has no career milestone within about 25 games at this pace.`));
    }
  }
  if (rows.length === 0) return text(T(lang, "近い節目のデータはまだありません。", "No milestone data yet."));
  const label = (stat: string) => (ja(lang) ? MILESTONE_LABEL[stat]?.ja : MILESTONE_LABEL[stat]?.en) ?? stat;
  const out = boardAnswer(
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
  return { ...out, view: { kind: "milestones", id: viewId } };
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
  const out = boardAnswer(head, {
    columns: cols(lang, ["result", "score"]),
    rows: games.map((g) => ({ label: label(g), cells: [ja(lang) ? (g.result === "W" ? "勝" : "敗") : g.result, `${g.teamScore}-${g.oppScore}`] })),
  });
  return season === CURRENT_NBA_SEASON_KEY
    ? { ...out, view: { kind: "team", id: teamId, section: "game_logs", count: games.length } }
    : out;
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
  /** 「何連勝中？」は見出しで連勝 / 連敗を答える */
  const streakAsked = /連勝|連敗|streak/i.test(ctx.question) && season === CURRENT_NBA_SEASON_KEY;
  const streakLine = !streakAsked
    ? ""
    : row.streak?.count
      ? T(lang, `${teamJa(teamId)}はいま${streak}（${row.wins}勝${row.losses}敗・${conf}${row.rank}位）。`, `${abbr(teamId)}: ${row.streak.kind}${row.streak.count} (${row.wins}-${row.losses}, ${conf} #${row.rank}).`)
      : T(lang, `${teamJa(teamId)}はいま連勝・連敗中ではありません（${row.wins}勝${row.losses}敗・${conf}${row.rank}位）。`, `${abbr(teamId)} has no active streak (${row.wins}-${row.losses}).`);
  return boardAnswer(
    streakLine ||
      T(lang, `${teamJa(teamId)} ${season}: ${row.wins}勝${row.losses}敗・${conf}${row.rank}位`, `${abbr(teamId)} ${season}: ${row.wins}-${row.losses}, ${conf} #${row.rank}`),
    { columns: cols(lang, ["w", "l", "rank"]), rows: [{ label: abbr(teamId), cells: [String(row.wins), String(row.losses), String(row.rank)] }], ...(note ? { note } : {}) }
  );
}

async function teamRoster(ctx: NbaAskNbaContext, teamId: string): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const rosters = await loadRosters(ctx.db);
  const team = rosters[teamId];
  if (!team || team.players.length === 0) return text(T(lang, `${teamJa(teamId)}のロスターはまだありません。`, `No roster for ${abbr(teamId)} yet.`));
  const q = ctx.question;
  /** 「リバウンド上位3人」= その項目で並べて見出しで名前を出す */
  const sortKey: "ppg" | "rpg" | "apg" = /リバウンド|\breb/i.test(q) ? "rpg" : /アシスト|\bast/i.test(q) ? "apg" : "ppg";
  const sortJa = sortKey === "rpg" ? "リバウンド" : sortKey === "apg" ? "アシスト" : "得点";
  const players = [...team.players].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0) || (b.gp ?? 0) - (a.gp ?? 0));
  const prior = (p: (typeof players)[number]) => Boolean(p.averagesSeasonKey && p.averagesSeasonKey !== CURRENT_NBA_SEASON_KEY);
  const anyPrior = players.slice(0, 12).some(prior);
  const KANJI: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5 };
  const nm = /(?:上位|トップ|ベスト)\s*(\d+|[一二三四五])|(\d+|[二三四五])\s*人(?:の|は|を|で|$)/.exec(q);
  const topN = nm ? Math.min(10, Number(nm[1] ?? nm[2]) || KANJI[nm[1] ?? nm[2] ?? ""] || 0) : 0;
  const nameOf = (p: (typeof players)[number]) => formatNbaPlayerListName(`${p.firstName} ${p.lastName}`.trim(), String(p.id));
  const unit = sortKey === "ppg" ? "点" : sortKey === "rpg" ? "リバウンド" : "アシスト";
  return boardAnswer(
    topN >= 1
      ? T(
          lang,
          `${teamJa(teamId)}の${sortJa}上位${topN}人は${players.slice(0, topN).map((p) => `${nameOf(p)}（平均${num(p[sortKey])}${unit}）`).join("・")}。`,
          `${abbr(teamId)} top ${topN}: ${players.slice(0, topN).map((p) => `${nameOf(p)} ${num(p[sortKey])}`).join(", ")}.`
        )
      : T(lang, `${teamJa(teamId)}のロスター ${players.length}人（${sortJa}の多い順）`, `${abbr(teamId)} roster, ${players.length} players (by ${sortKey})`),
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
  return {
    ...boardAnswer(
      T(lang, `${teamJa(teamId)} ${CURRENT_NBA_SEASON_KEY} の${size}人ラインナップ（${what}順）`, `${abbr(teamId)} ${CURRENT_NBA_SEASON_KEY} ${size}-man lineups (${what})`),
      {
        columns: T(lang, "NET|分|試合", "NET|MIN|G").split("|"),
        rows: list.map((l) => ({
          label: (l.names ?? []).join(" / "),
          cells: [l.net != null ? signed(l.net) : "—", l.min != null ? num(l.min) : "—", l.games != null ? String(l.games) : "—"],
        })),
        note: T(lang, "NET は 100 ポゼッションあたりの得失点差です。", "NET is point differential per 100 possessions."),
      }
    ),
    view: { kind: "team", id: teamId, section: "lineups", mode: order, size },
  };
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
  const out = text(
    [
      T(lang, `${teamJa(teamId)}の故障者リスト`, `${abbr(teamId)} injury report`),
      ...players.map((p) => {
        const reason = injuryReasonShort(p.reason);
        return `・${String(p.name ?? "")} — ${injuryStatusLabel(p.status, lang)}${reason ? `（${ja(lang) ? injuryReasonJa(reason) : reason}）` : ""}`;
      }),
    ].join("\n")
  );
  /** 一覧はチーム詳細の INJURIES が出すので、文は見出しだけ */
  return {
    ...out,
    answer: T(lang, `${teamJa(teamId)}の故障者リスト（${players.length}人）`, `${abbr(teamId)} injury report (${players.length})`),
    view: { kind: "team", id: teamId, section: "injuries" },
  };
}

/** チーム詳細の OFFSEASON MOVES と同じ IN / OUT を、同じ部品で出す */
async function teamMoves(ctx: NbaAskNbaContext, teamId: string): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const doc = await loadMovesDoc(ctx.db);
  const row = doc.teams[teamId];
  const incoming = row?.incoming ?? [];
  const outgoing = row?.outgoing ?? [];
  if (incoming.length === 0 && outgoing.length === 0) {
    return text(T(lang, `${teamJa(teamId)}の前季からの入れ替わりはありません。`, `No roster changes for ${abbr(teamId)} versus last season.`));
  }
  return {
    ...text(
      T(
        lang,
        `${teamJa(teamId)}の前季からの入れ替わり（IN ${incoming.length}人・OUT ${outgoing.length}人）。今日のトレード速報ではなく、今季のロスターと前季最後の所属の比較です。`,
        `${abbr(teamId)} roster changes vs last season (IN ${incoming.length}, OUT ${outgoing.length}). Compares this season's roster with last season's final teams, not a same-day wire.`
      )
    ),
    moves: { teamId, moves: { seasonKey: doc.seasonKey, priorSeasonKey: doc.priorSeasonKey, incoming, outgoing } },
  };
}

const TEAM_STAT_FALLBACK: Record<string, string> = { ppg: "ppg", papg: "papg", pace: "pace", netrtg: "netrtg", ortg: "ortg", drtg: "drtg", diff: "diff" };
const RATING_SET = ["ortg", "drtg", "netrtg", "cleanNet", "cleanAdjNet"] as const;

function statValueText(id: string, v: unknown): string {
  return typeof v === "number" && Number.isFinite(v) ? (nbaAskIsPctStat(id) ? pct(v) : num(v)) : "—";
}

const CLEAN_RATING_IDS = new Set(["cleanNet", "cleanOrtg", "cleanDrtg", "cleanAdjNet", "cleanAdjOrtg", "cleanAdjDrtg", "cleanNetL10"]);

async function teamStat(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const word = nbaAskStatWord(NBA_ASK_TEAM_STAT_WORDS, ctx.question);
  /** 「ブロックが多いチーム」= チームのリーグ表に無い項目。NET に置き換えて答えない */
  const playerOnly = word || (intent.metric && TEAM_STAT_FALLBACK[intent.metric]) ? null : nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, ctx.question);
  if (playerOnly) {
    const l = ja(lang) ? playerOnly.ja : playerOnly.en;
    return text(T(lang, `チームの${l}はデータがないので答えられません。選手の${l}のランキングなら答えられます。`, `Team ${l} isn't available. Player ${l} leaders are.`));
  }
  const metric = word?.id ?? (intent.metric && TEAM_STAT_FALLBACK[intent.metric]) ?? "netrtg";
  const teamId = resolveNbaAskTeamId(intent.team);
  /** 「東トップ3」= そのカンファレンスの中で */
  const conf = teamId ? null : conferenceFilter(ctx.question, intent);
  const label = `${word ? (ja(lang) ? word.ja : word.en) : col(lang, metric)}${conf ? T(lang, conf === "east" ? "（東）" : "（西）", conf === "east" ? " (East)" : " (West)") : ""}`;
  const season = seasonOf(intent);
  const windowName = intent.playoffs ? "playoffs" : "season";
  const [payload, clean] = await Promise.all([
    loadLeagueTeamStatsSnapshot(ctx.db, season),
    intent.playoffs ? Promise.resolve(null) : loadNbaTeamCleanRatings(ctx.db, season),
  ]);
  const bundle = applyCleanRatingsToLeagueTeamBundle(payload.bundle, clean);
  const all = (bundle[windowName] ?? []).filter((row) => !conf || nbaConferenceForTeam(row.teamId) === conf);
  const valueOf = (row: (typeof all)[number], id: string) => (row as unknown as Record<string, unknown>)[id];
  /** ガベージ抜きは集計できたチームだけ（無いチームの行は 0 のまま） */
  const hasValue = (row: (typeof all)[number], id: string) =>
    typeof valueOf(row, id) === "number" && (!CLEAN_RATING_IDS.has(id) || (clean?.teams[row.teamId]?.games ?? 0) > 0);
  const ranked = (id: string) => {
    /** リーグ表にまだ定義が無い指標は無いものとして扱う */
    let higher: boolean;
    try {
      higher = leagueMetricDef(id as NbaLeagueTeamStatMetric).higherIsBetter;
    } catch {
      return [];
    }
    return all
      .filter((row) => hasValue(row, id))
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
  /** 「低い / 少ない」は高いほど良い項目なら下位から、「失点が多い」のように低いほど良い項目なら逆 */
  let higherBetter = true;
  try {
    higherBetter = leagueMetricDef(metric as NbaLeagueTeamStatMetric).higherIsBetter;
  } catch {
    /* 定義が無い項目は高いほど良いとみなす */
  }
  const q = ctx.question;
  const badWord = /悪い|ワースト|最下位|下位|弱い|下手|苦手|worst/i.test(q);
  const lowWord = /低い|少な|遅い|lowest|fewest|slowest/i.test(q);
  const highWord = /高い|多い|速い|highest|most|fastest/i.test(q);
  const worst = badWord || lowWord || highWord ? badWord || (lowWord && higherBetter) || (highWord && !higherBetter && !lowWord) : intent.order === "worst";
  /** 「ペース100以上」「リーグ平均より高い」= 条件に入るチームを全部 */
  const th = /(\d+(?:\.\d+)?)\s*(%|％|点|本|回)?\s*(以上|以下|を?超え|未満)/.exec(q);
  const avgCmp = /(?:リーグ)?平均(?:より|以上|以下|を)(?:.{0,3})(高|多|上|低|少|下)/.exec(q);
  if (!teamId && (th || avgCmp)) {
    const norm = (v: unknown) => {
      const n = Number(v);
      return nbaAskIsPctStat(metric) && n > 1 ? n / 100 : n;
    };
    const avgValue = rows.reduce((sum, row) => sum + norm(valueOf(row, metric)), 0) / rows.length;
    const limit = th ? (nbaAskIsPctStat(metric) && Number(th[1]) > 1 ? Number(th[1]) / 100 : Number(th[1])) : avgValue;
    const above = th ? !/以下|未満/.test(th[3]!) : /高|多|上/.test(avgCmp![1]!);
    const inc = th ? /以上|以下/.test(th[3]!) : false;
    const pass = (v: number) => (above ? (inc ? v >= limit : v > limit) : inc ? v <= limit : v < limit);
    const hits = rows.filter((row) => pass(norm(valueOf(row, metric)))).sort((a, b) => (norm(valueOf(b, metric)) - norm(valueOf(a, metric))) * (above ? 1 : -1));
    const rawAvg = rows.reduce((sum, row) => sum + Number(valueOf(row, metric)), 0) / rows.length;
    const condJa = th ? `${th[1]}${th[2] ?? ""}${th[3]}` : `リーグ平均（${statValueText(metric, rawAvg)}）より${above ? "上" : "下"}`;
    return boardAnswer(
      hits.length
        ? T(lang, `${season} で${label}が${condJa}のチームは${hits.length}チーム: ${hits.slice(0, 8).map((row) => `${nameOf(row)}（${statValueText(metric, valueOf(row, metric))}）`).join("・")}${hits.length > 8 ? " ほか" : ""}。`, `${season}: ${hits.length} teams with ${label} ${condJa}.`)
        : T(lang, `${season} で${label}が${condJa}のチームはありません。`, `No team with ${label} ${condJa} in ${season}.`),
      {
        columns: [col(lang, "rank"), label],
        rows: hits.slice(0, 15).map((row) => pack(row, rows.indexOf(row) + 1)),
        ...(hits.length > 15 ? { note: T(lang, `ほか ${hits.length - 15}チーム`, `+${hits.length - 15} more`) } : {}),
      }
    );
  }
  /** STATS のチームリーグ表と同じ並び（今季のレギュラーだけ） */
  const withLeaders = (out: NbaAskAnswer): NbaAskAnswer =>
    intent.season || intent.playoffs
      ? out
      : { ...out, view: { kind: "leaders", id: metric, scope: "team", ...(teamId ? { team: teamId } : {}), ...(worst ? { worst: true } : {}) } };
  if (teamId) {
    const i = rows.findIndex((row) => row.teamId === teamId);
    if (i < 0) return text(T(lang, `${teamJa(teamId)}の${label}はまだありません。`, `No ${label} for ${abbr(teamId)} yet.`));
    const leader = rows[0]!;
    return withLeaders(boardAnswer(
      T(
        lang,
        `${teamJa(teamId)}の${label}: ${statValueText(metric, valueOf(rows[i]!, metric))}（${total}チーム中${i + 1}位）${i > 0 ? `。1位は${nameOf(leader)} ${statValueText(metric, valueOf(leader, metric))}` : ""}`,
        `${abbr(teamId)} ${label}: ${statValueText(metric, valueOf(rows[i]!, metric))} (#${i + 1} of ${total})${i > 0 ? `. Leader: ${abbr(leader.teamId)} ${statValueText(metric, valueOf(leader, metric))}` : ""}`
      ),
      { columns, rows: [pack(leader, 1), ...(i > 0 ? [pack(rows[i]!, i + 1)] : [])] }
    ));
  }
  const list = worst ? rows.slice(-5).reverse().map((row, k) => pack(row, total - k)) : rows.slice(0, 5).map((row, k) => pack(row, k + 1));
  const head = worst
    ? T(lang, `${season} の${label}がいちばん下位なのは${list[0]!.label}（${list[0]!.cells[1]}・${total}位）`, `${season} lowest in ${label}: ${list[0]!.label} (${list[0]!.cells[1]}, #${total})`)
    : T(lang, `${season} の${label}1位は${list[0]!.label}（${list[0]!.cells[1]}）`, `${season} ${label} leader: ${list[0]!.label} (${list[0]!.cells[1]})`);
  return withLeaders(boardAnswer(head, { columns, rows: list }));
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
/** チーム詳細の HOW THEY PLAY のタブを上に出し、画面と同じ計算の値と順位を下に書く */
async function teamHowTheyPlayAnswer(ctx: NbaAskNbaContext, teamId: string, focus: NbaAskTeamHowFocus): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const season = CURRENT_NBA_SEASON_KEY;
  const payload = await loadLeagueTeamStatsSnapshot(ctx.db, season);
  const label = ja(lang) ? focus.ja : focus.en;
  const none = text(T(lang, `${teamJa(teamId)}の${label}のデータはまだありません。`, `No ${label.toLowerCase()} data for ${abbr(teamId)} yet.`));
  if (!payload.bundle.season.some((r) => r.teamId === teamId)) return none;
  const b = getTeamHowTheyPlay(teamId, payload.bundle);
  type Item = { short: string; value: string; rank: number };
  const cell = (short: string, c: { display: string; rank: number }): Item => ({ short, value: c.display, rank: c.rank });
  const items: Item[] =
    focus.tab === "fourFactors"
      ? b.fourFactors.map((r) => cell(r.short, r.own))
      : focus.tab === "scoring"
        ? b.scoring.map((r) => cell(ja(lang) ? r.label.ja : r.label.en, r.cell))
        : focus.tab === "playtype"
          ? b.playtype.map((r) => ({ short: r.short, value: `${r.ppp.display} PPP`, rank: r.ppp.rank }))
          : focus.tab === "clutch"
            ? b.clutch.map((r) => cell(r.label, r.cell))
            : focus.tab === "hustle"
              ? b.hustle.map((r) => cell(r.short, r.cell))
              : focus.tab === "rebounding"
                ? b.rebounding.map((r) => cell(r.short, r.cell))
                : b.tracking.filter((r) => focus.ids?.includes(r.id) ?? true).map((r) => cell(r.short, r.cell));
  const shown = items.filter((it) => it.value && it.value !== "—" && it.rank > 0);
  if (shown.length === 0) return none;
  const line = shown.map((it) => `${it.short} ${it.value}${T(lang, `（${it.rank}位）`, ` (#${it.rank})`)}`).join(" · ");
  return {
    ...boardAnswer(
      T(lang, `${teamJa(teamId)}の${label}（${season}）: ${line}`, `${abbr(teamId)} ${label} (${season}): ${line}`),
      {
        columns: [T(lang, "値", "Value"), T(lang, "順位", "Rank")],
        rows: shown.map((it) => ({ label: it.short, cells: [it.value, String(it.rank)] })),
      }
    ),
    view: { kind: "team", id: teamId, section: "how_they_play", tab: focus.tab, ...(focus.group ? { group: focus.group } : {}) },
  };
}

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
  const focused = SPLIT_FOCUS.filter(([re]) => re.test(ctx.question)).map(([, k]) => k);
  /** 「ホームとアウェー」= 両方を文に */
  if (focused.includes("home") && focused.includes("away") && detail.splits.home && detail.splits.away) {
    const h = detail.splits.home;
    const a = detail.splits.away;
    const keys = Object.keys(SPLIT_LABEL).filter((k) => detail.splits[k as keyof typeof detail.splits]);
    return boardAnswer(
      T(
        lang,
        `${teamJa(teamId)}（${season}）はホーム ${h.wins}勝${h.losses}敗（平均 ${num(h.avg?.pts)}点 / 失点 ${num(h.avg?.oppPts)}）、アウェー ${a.wins}勝${a.losses}敗（平均 ${num(a.avg?.pts)}点 / 失点 ${num(a.avg?.oppPts)}）。`,
        `${abbr(teamId)} (${season}): home ${h.wins}-${h.losses}, away ${a.wins}-${a.losses}.`
      ),
      { columns, rows: keys.map((k) => ({ label: (ja(lang) ? SPLIT_LABEL[k]?.ja : SPLIT_LABEL[k]?.en) ?? k, cells: cells(detail.splits[k as keyof typeof detail.splits]) })) }
    );
  }
  const focus = focused[0];
  const keys = Object.keys(SPLIT_LABEL).filter((k) => detail.splits[k as keyof typeof detail.splits]);
  const rows = keys.map((k) => ({ label: (ja(lang) ? SPLIT_LABEL[k]?.ja : SPLIT_LABEL[k]?.en) ?? k, cells: cells(detail.splits[k as keyof typeof detail.splits]) }));
  const f = focus ? detail.splits[focus as keyof typeof detail.splits] : null;
  const fLabel = focus ? (ja(lang) ? SPLIT_LABEL[focus]?.ja : SPLIT_LABEL[focus]?.en) : "";
  if (f && f.wins + f.losses === 0) {
    return boardAnswer(T(lang, `${teamJa(teamId)}は${season}にまだ${fLabel}の試合がありません。`, `${abbr(teamId)} has no ${fLabel} games in ${season} yet.`), { columns, rows });
  }
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
  /** 「誰にマークされてる」= 守られた側だけ、「誰をマークしてる」= 守った側だけ */
  /** 「ドンチッチを抑えているのは」= ドンチッチをマークした側。「ドンチッチが抑えている」= ドンチッチが守った側 */
  const askOf =
    /マークされ|守られ|ガードされ|抑えられ|止められ|(?:誰|だれ)が(?:マーク|守|ガード|抑え|止め)|を.{0,10}(?:抑え|止め)|(?<!誰|だれ)を.{0,10}(?:マーク|守っ|ガード)し?|苦手な(?:守備者|ディフェンダー|相手|マーク)|守備者|ディフェンダー|guarded\s+by|who\s+guards/i.test(ctx.question) &&
    guardedBy.length > 0;
  const askDf = !askOf && /(?:誰|だれ)を(?:マーク|守|ガード|抑え|止め)|(?:守|マークし|抑え)た(?:相手|選手)|(?:守っ|マークし|抑え)て(?:い)?る(?:相手|選手)|が.{0,10}(?:抑え|止め)|who\s+does\s+.+\s+guard/i.test(ctx.question) && defended.length > 0;
  /** 「抑えている」は時間だけでなく成功率も。3 本以上打った相手だけ */
  const holdAsk = /抑え|止め|苦手|shut|lock/i.test(ctx.question);
  const heldBest = (list: HubMatchup[]) =>
    [...list].filter((m) => m.fga >= 3 && typeof m.fgPct === "number").sort((x, y) => x.fgPct! - y.fgPct! || y.fga - x.fga)[0];
  const heldOf = holdAsk && askOf ? heldBest(guardedBy) : undefined;
  const heldDf = holdAsk && askDf ? heldBest(defended) : undefined;
  const rows = askOf
    ? guardedBy.slice(0, 8).map((m) => row(m, false))
    : askDf
      ? defended.slice(0, 8).map((m) => row(m, true))
      : [...defended.slice(0, 4).map((m) => row(m, true)), ...guardedBy.slice(0, 4).map((m) => row(m, false))];
  const heldText = (m: HubMatchup | undefined, whose: string) =>
    m ? T(lang, `${whose}成功率をいちばん抑えているのは ${m.name}（${m.fgm}/${m.fga}・FG ${pct(m.fgPct)}）。`, ` Lowest FG%: ${m.name} (${m.fgm}/${m.fga}).`) : "";
  const head = askOf
    ? T(lang, `${hit.name} をマークした選手（今季・時間の長い順）。いちばん長いのは ${guardedBy[0]!.name}（${num(guardedBy[0]!.minutes)}分・FG ${pct(guardedBy[0]!.fgPct)}）。`, `${hit.name} guarded by (this season, by minutes): ${guardedBy[0]!.name} most.`) +
      heldText(heldOf, `${hit.name} のシュートの`)
    : askDf
      ? T(lang, `${hit.name} がマークした選手（今季・時間の長い順）。いちばん長いのは ${defended[0]!.name}（${num(defended[0]!.minutes)}分・相手の FG ${pct(defended[0]!.fgPct)}）。`, `${hit.name} guarding (this season, by minutes): ${defended[0]!.name} most.`) +
        heldText(heldDf, "相手の")
      : T(lang, `${hit.name} のマッチアップ（今季・時間の長い順）`, `${hit.name} matchups (this season, by minutes)`);
  return {
    ...boardAnswer(head, { columns, rows, note }),
    view: { kind: "player", id: hit.playerId, section: "matchups", mode: askDf || (!askOf && guardedBy.length === 0) ? "df" : "of" },
  };
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
  const out = boardAnswer(
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
  return r.season === CURRENT_NBA_SEASON_KEY ? { ...out, view: { kind: "team", id: teamId, section: "payroll" } } : out;
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
  /** 「ぜいたく税を払っているチーム」= 今の年俸総額がぜいたく税ラインを超えているチーム */
  if (!intent.player && /ぜいたく税|贅沢税|タックス|luxury\s*tax/i.test(ctx.question)) {
    const over = teams
      .filter(([, p]) => p.taxSpace != null && p.taxSpace < 0)
      .map(([id, p]) => ({ id, total: p.totalSalary, over: -(p.taxSpace ?? 0) }))
      .sort((a, b) => b.over - a.over);
    return boardAnswer(
      over.length
        ? T(lang, `${payload.season}の年俸総額がぜいたく税ラインを超えているのは${over.length}チーム: ${over.map((t) => teamJa(t.id)).join("・")}。`, `${over.length} teams over the luxury tax line in ${payload.season}: ${over.map((t) => abbr(t.id)).join(", ")}.`)
        : T(lang, `${payload.season}の年俸総額でぜいたく税ラインを超えているチームはありません。`, `No team is over the luxury tax line in ${payload.season}.`),
      {
        columns: T(lang, "年俸総額|超過", "Payroll|Over").split("|"),
        rows: over.map((t) => ({ label: ja(lang) ? teamJa(t.id) : abbr(t.id), cells: [money(t.total), money(t.over)] })),
        note: T(lang, "今の年俸総額とラインの差。実際の税額はシーズン最終日の額で決まります。", "Current payroll vs the tax line; the actual tax is set by the end-of-season payroll."),
      }
    );
  }
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
  const lead = (side: "east" | "west") => {
    const r = board[side][0];
    return r ? T(lang, `${side === "east" ? "東" : "西"}の1位は${teamJa(r.teamId)}（${r.wins}勝${r.losses}敗）`, `${side === "east" ? "East" : "West"} #1: ${abbr(r.teamId)} (${r.wins}-${r.losses})`) : "";
  };
  const leads = sides.map(lead).filter(Boolean);
  const q = ctx.question;
  /** 「東の1位と2位のゲーム差」 */
  const gapAsk = /ゲーム差|games?\s+behind/i.exec(q);
  if (gapAsk) {
    const nq = q.normalize("NFKC");
    const ranks = /(\d{1,2})\s*位\s*(?:と|から|・|vs)\s*(\d{1,2})\s*位/.exec(nq);
    const named = findNbaAskTeamsInText(q);
    const side: "east" | "west" = intent.conference ?? (/西|west/i.test(q) ? "west" : named[0] && board.west.some((r) => r.teamId === named[0]) ? "west" : "east");
    const all = [...board.east, ...board.west];
    const a = named.length >= 2 ? all.find((r) => r.teamId === named[0]) : board[side].find((r) => r.rank === Number(ranks?.[1] ?? 1));
    const b = named.length >= 2 ? all.find((r) => r.teamId === named[1]) : named.length === 1 ? all.find((r) => r.teamId === named[0]) : board[side].find((r) => r.rank === Number(ranks?.[2] ?? 2));
    if (a && b) {
      const [hi, lo] = a.wins - a.losses >= b.wins - b.losses ? [a, b] : [b, a];
      const gb = (hi.wins - lo.wins + (lo.losses - hi.losses)) / 2;
      return boardAnswer(
        T(lang, `${teamJa(hi.teamId)}（${hi.wins}勝${hi.losses}敗）と${teamJa(lo.teamId)}（${lo.wins}勝${lo.losses}敗）のゲーム差は ${gb}。`, `${abbr(hi.teamId)} (${hi.wins}-${hi.losses}) lead ${abbr(lo.teamId)} (${lo.wins}-${lo.losses}) by ${gb} games.`),
        { columns: cols(lang, ["w", "l"]), rows: [hi, lo].map((r) => ({ label: `${r.rank} ${abbr(r.teamId)}`, cells: [String(r.wins), String(r.losses)] })) }
      );
    }
  }
  /** 「勝率が一番高いチーム」= リーグ全体の上位 */
  if (/(?:一番|いちばん|最も|もっとも)(?:高|強|良|勝って)|勝率.{0,6}(?:トップ|1位|首位)|最高勝率|リーグ首位|リーグ1位/.test(q) && !/低|弱|悪|負け/.test(q)) {
    const pctOf = (r: { wins: number; losses: number }) => (r.wins + r.losses ? r.wins / (r.wins + r.losses) : 0);
    const list = [...board.east.map((r) => ({ r, side: "east" as const })), ...board.west.map((r) => ({ r, side: "west" as const }))]
      .filter(({ side }) => !intent.conference || side === intent.conference)
      .sort((x, y) => pctOf(y.r) - pctOf(x.r) || y.r.wins - x.r.wins)
      .slice(0, 5);
    const top = list[0];
    if (top) {
      const confJa = (side: "east" | "west") => T(lang, side === "east" ? "東" : "西", side === "east" ? "E" : "W");
      return boardAnswer(
        T(lang, `${season} で勝率がいちばん高いのは${teamJa(top.r.teamId)}（${top.r.wins}勝${top.r.losses}敗・勝率 ${(pctOf(top.r) * 100).toFixed(1)}%・${confJa(top.side)}${top.r.rank}位）。`, `${season} best record: ${abbr(top.r.teamId)} (${top.r.wins}-${top.r.losses}).`),
        { columns: cols(lang, ["w", "l"]), rows: list.map((x) => ({ label: `${confJa(x.side)}${x.r.rank} ${abbr(x.r.teamId)}`, cells: [String(x.r.wins), String(x.r.losses)] })) }
      );
    }
  }
  const zone = /圏外|プレーオフに(?:出られ|行け|進め)ない/.test(q)
    ? "out"
    : /プレーイン|play.?in/i.test(q)
      ? "playin"
      : /最下位|(?:一番|いちばん|最も|もっとも)(?:低|弱|悪|負け)|最低|ワースト|worst/i.test(q)
        ? "bottom"
        : null;
  if (zone) {
    const confJa = (side: "east" | "west") => T(lang, side === "east" ? "東" : "西", side === "east" ? "E" : "W");
    const pct = (r: { wins: number; losses: number }) => (r.wins + r.losses ? r.wins / (r.wins + r.losses) : 0);
    const list =
      zone === "bottom"
        ? [...board.east.map((r) => ({ r, side: "east" as const })), ...board.west.map((r) => ({ r, side: "west" as const }))]
            .filter(({ side }) => !intent.conference || side === intent.conference)
            .sort((a, b) => pct(a.r) - pct(b.r) || b.r.losses - a.r.losses)
            .slice(0, 5)
        : sides.flatMap((side) => board[side].filter((r) => (zone === "out" ? r.rank >= 11 : r.rank >= 7 && r.rank <= 10)).map((r) => ({ r, side })));
    const zoneJa = zone === "out" ? "プレーオフ圏外（11位以下）" : zone === "playin" ? "プレーイン圏（7〜10位）" : "";
    const names = (side: "east" | "west") => list.filter((x) => x.side === side).map((x) => `${teamJa(x.r.teamId)}（${x.r.wins}勝${x.r.losses}敗）`).join("・");
    const top = list[0];
    return boardAnswer(
      zone === "bottom"
        ? T(lang, top ? `${season} で勝率がいちばん低いのは${teamJa(top.r.teamId)}（${top.r.wins}勝${top.r.losses}敗・${confJa(top.side)}${top.r.rank}位）。` : "順位表のデータはまだありません。", top ? `${season} worst record: ${abbr(top.r.teamId)} (${top.r.wins}-${top.r.losses}).` : "No standings yet.")
        : T(
            lang,
            `${season} でいま${zoneJa}なのは、${sides.map((side) => `${confJa(side)}: ${names(side) || "なし"}`).join("、")}。`,
            `${season} ${zone === "out" ? "outside the playoff picture" : "in the play-in spots"}: ${list.map((x) => abbr(x.r.teamId)).join(", ")}.`
          ),
      {
        columns: cols(lang, ["w", "l"]),
        rows: list.map((x) => ({ label: `${confJa(x.side)}${x.r.rank} ${abbr(x.r.teamId)}`, cells: [String(x.r.wins), String(x.r.losses)] })),
      }
    );
  }
  return boardAnswer(
    T(
      lang,
      `${season} の順位${intent.conference ? "" : "（各カンファレンス上位8）"}。${leads.join("、")}。`,
      `${season} standings${intent.conference ? "" : " (top 8 each)"}. ${leads.join("; ")}.`
    ),
    { columns: cols(lang, ["w", "l"]), rows }
  );
}

// ---------------------------------------------------------------------------
// リーグ
// ---------------------------------------------------------------------------

/** 「Top10」「上位10」「ベスト10」「10人」→ 10。書いていなければ 5（最大 20） */
function askedTopN(question: string): number {
  const m = /(?:top|トップ|上位|ベスト|best)\s*(\d{1,2})|(\d{1,2})\s*(?:人|位まで)/i.exec(question.normalize("NFKC"));
  const n = m ? Number(m[1] ?? m[2]) : 0;
  return n >= 1 ? Math.min(20, n) : 5;
}

async function playerLeaders(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const word = nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, ctx.question);
  const metric = word?.id ?? (intent.metric && ["pts", "reb", "ast", "stl", "blk", "tov", "fg3m"].includes(intent.metric) ? intent.metric : "pts");
  const label = word ? (ja(lang) ? word.ja : word.en) : col(lang, metric);
  const teamId = resolveNbaAskTeamId(intent.team);
  const r = asObj(
    await runNbaAskTool(ctx.db, "get_player_leaders", { metric, season: seasonOf(intent), season_type: intent.playoffs ? "playoffs" : "season", limit: askedTopN(ctx.question), ...(teamId ? { team: abbr(teamId) } : {}) }, lang, ctx.timeZone)
  );
  const leaders = asRows(r?.leaders);
  if (leaders.length === 0) return text(T(lang, `${label}のランキングのデータはまだありません。`, `No ${label} leader data yet.`));
  const mine = asObj(r?.team);
  const shot = nbaShotPctParts(metric);
  const hasShot = (l: Record<string, unknown>) => typeof l.made === "number" && typeof l.att === "number";
  const showShot = Boolean(shot) && leaders.some(hasShot);
  const cellsOf = (l: Record<string, unknown>) => [
    String(l.rank ?? ""),
    statValueText(metric, l.value),
    ...(showShot ? [formatShotPerGame(hasShot(l) ? Number(l.made) : null), formatShotPerGame(hasShot(l) ? Number(l.att) : null)] : []),
  ];
  /** 「56.5%（1試合 1.2/2.1本・計 約12/21本）」 */
  const valueText = (l: Record<string, unknown>) => {
    if (!showShot || !hasShot(l)) return statValueText(metric, l.value);
    const made = Number(l.made);
    const att = Number(l.att);
    const gp = Number(l.gp) || 0;
    const total = gp > 0 ? `・計 約${Math.round(made * gp)}/${Math.round(att * gp)}本` : "";
    return `${statValueText(metric, l.value)}${T(lang, `（1試合 ${formatShotPerGame(made)}/${formatShotPerGame(att)}本${total}）`, ` (${formatShotPerGame(made)}/${formatShotPerGame(att)} per game)`)}`;
  };
  const rows = leaders.map((l) => ({ label: `${String(l.name ?? "")} ${String(l.team ?? "")}`, cells: cellsOf(l) }));
  if (mine && !leaders.some((l) => l.name === mine.name)) rows.push({ label: `${String(mine.name ?? "")} ${String(mine.team ?? "")}`, cells: cellsOf(mine) });
  const top = leaders[0]!;
  const second = leaders[1];
  const view: NbaAskView | undefined =
    intent.season || intent.playoffs
      ? undefined
      : { kind: "leaders", id: metric, scope: "player", count: askedTopN(ctx.question), ...(teamId ? { team: teamId } : {}) };
  const out = boardAnswer(
    T(
      lang,
      `${String(r?.season ?? "")} の${label}1位は ${String(top.name ?? "")}（${teamNameFromAbbr(String(top.team ?? ""), lang)}）${valueText(top)}。${second ? `2位は ${String(second.name ?? "")}（${teamNameFromAbbr(String(second.team ?? ""), lang)}）${valueText(second)}。` : ""}`,
      `${String(r?.season ?? "")} ${label} leader: ${String(top.name ?? "")} (${String(top.team ?? "")}) ${valueText(top)}.${second ? ` #2: ${String(second.name ?? "")} ${valueText(second)}.` : ""}`
    ),
    { columns: [col(lang, "rank"), label, ...(showShot && shot ? [shot.madeShort, shot.attShort] : [])], rows }
  );
  return view ? { ...out, view } : out;
}

async function dailyLeaders(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const metric = intent.metric && ["pts", "reb", "ast", "stl", "blk", "fg3m"].includes(intent.metric) ? intent.metric : "pts";
  const count = askedTopN(ctx.question);
  const back = intent.date === "yesterday" || /昨日|昨夜|きのう|yesterday|last\s+night/i.test(ctx.question) ? 1 : 0;
  const r = asObj(await runNbaAskTool(ctx.db, "get_daily_leaders", { metric, limit: count, slatesBack: back }, lang, ctx.timeZone));
  const leaders = asRows(r?.leaders);
  if (leaders.length === 0) return text(T(lang, "その日の box スコアはまだありません。", "No box scores for that day yet."));
  const top = leaders[0]!;
  const date = String(r?.date ?? "");
  const out = boardAnswer(
    T(
      lang,
      `${back ? "前の" : "最新の"}試合日（米国東部 ${date}）の${col(lang, metric)}1位は ${String(top.name ?? "")}（${teamNameFromAbbr(String(top.team ?? ""), lang)}）${num(top.value)}。`,
      `${col(lang, metric)} leader, ${date} (US Eastern): ${String(top.name ?? "")} (${String(top.team ?? "")}) ${num(top.value)}.`
    ),
    {
      columns: cols(lang, ["rank", metric]),
      rows: leaders.map((l) => ({ label: `${String(l.name ?? "")} ${String(l.team ?? "")}`, cells: [String(l.rank ?? ""), num(l.value)] })),
    }
  );
  const stat = DAILY_LEADER_STATS.find((s) => s.key === metric)?.key;
  return stat ? { ...out, view: { kind: "today", id: date, stat, count }, opens: ["today"] } : out;
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
  const [first, second] = rows;
  const line = (r: (typeof rows)[number]) =>
    T(lang, `${r.name}（${teamJa(r.teamId)}・${num(r.pts)}点 ${num(r.reb)}リバウンド ${num(r.ast)}アシスト）`, `${r.name} (${abbr(r.teamId)}, ${num(r.pts)}/${num(r.reb)}/${num(r.ast)})`);
  const moved = (r: (typeof rows)[number], now: number) =>
    typeof r.prevRank === "number" && r.prevRank !== now ? T(lang, `・先週${r.prevRank}位`, `, last week #${r.prevRank}`) : "";
  /** 「先週から上がった / 下がった」= 先週の順位との差の大きい順 */
  if (/先週.{0,8}(?:上が|上昇|伸び|下が|落ち|ダウン)|(?:順位|ランク).{0,4}(?:上が|上昇|下が|落ち)|急上昇/.test(ctx.question)) {
    const down = /下が|落ち|ダウン/.test(ctx.question);
    const moves = rows
      .map((r, i) => ({ r, now: i + 1, d: typeof r.prevRank === "number" ? r.prevRank - (i + 1) : null }))
      .filter((m): m is typeof m & { d: number } => m.d !== null && (down ? m.d < 0 : m.d > 0))
      .sort((a, b) => (down ? a.d - b.d : b.d - a.d));
    const view = NBA_ASK_LADDER_AWARDS.find((a) => a === (award === "rookie" ? "rookies" : award));
    if (moves.length === 0) {
      const none = text(T(lang, `${title}ラダーで先週から順位を${down ? "下げた" : "上げた"}選手はいません（先週の順位がまだ無い・入れ替わりなし）。`, `No one moved ${down ? "down" : "up"} on the ${title} ladder since last week.`));
      return view ? { ...none, view: { kind: "ladder", id: view } } : none;
    }
    const m0 = moves[0]!;
    const out = boardAnswer(
      T(lang, `${title}ラダーで先週からいちばん${down ? "下げた" : "上げた"}のは${m0.r.name}（${teamJa(m0.r.teamId)}・先週${m0.r.prevRank}位 → ${m0.now}位）。`, `Biggest ${down ? "drop" : "rise"} on the ${title} ladder: ${m0.r.name} (#${m0.r.prevRank} → #${m0.now}).`),
      {
        columns: T(lang, "先週|今週|差", "LAST|NOW|MOVE").split("|"),
        rows: moves.slice(0, 5).map((m) => ({ label: `${m.r.name} ${abbr(m.r.teamId)}`, cells: [`${m.r.prevRank}`, `${m.now}`, m.d > 0 ? `+${m.d}` : `${m.d}`] })),
        note: T(lang, "UNITERZ の試算。先週 = 前の週の締めの順位。", "UNITERZ estimate."),
      }
    );
    return view ? { ...out, view: { kind: "ladder", id: view } } : out;
  }
  const out = boardAnswer(
    T(
      lang,
      `${title}ラダー（UNITERZ の試算・公式の予想ではありません）の1位は${line(first!)}${moved(first!, 1)}。${second ? `2位は${line(second)}${moved(second, 2)}。` : ""}`,
      `${title} ladder (UNITERZ estimate, not official): #1 ${line(first!)}${moved(first!, 1)}.${second ? ` #2 ${line(second)}.` : ""}`
    ),
    {
      columns: cols(lang, ["pts", "reb", "ast"]),
      rows: rows.slice(0, 5).map((r, i) => ({ label: `${i + 1}. ${r.name} ${abbr(r.teamId)}`, cells: [num(r.pts), num(r.reb), num(r.ast)] })),
      note: T(lang, "順位ページの LEAGUE タブで詳しく見られます。", "See the LEAGUE tab on the standings page."),
    }
  );
  const ladder = NBA_ASK_LADDER_AWARDS.find((a) => a === (award === "rookie" ? "rookies" : award));
  return ladder ? { ...out, view: { kind: "ladder", id: ladder } } : out;
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

/** 「ニックスの次の試合は？相手は？」→ いつ・どこで・誰と */
function nextGameLine(lang: string, teamId: string, g: NbaAskGameCard, day: string): string {
  const home = g.homeTeamId === teamId;
  const opp = home ? g.awayTeamId : g.homeTeamId;
  const when = g.start ? `${day} ${g.start}` : day;
  if (g.status === "live") {
    return T(lang, `${teamJa(teamId)}は今、${home ? "ホーム" : "アウェー"}で${teamJa(opp)}と試合中です。`, `${abbr(teamId)} is playing ${home ? "vs" : "at"} ${abbr(opp)} right now.`);
  }
  if (g.score) {
    return T(lang, `${teamJa(teamId)}の${day}の試合は${home ? "ホーム" : "アウェー"}で${teamJa(opp)}戦（${g.score}）。`, `${abbr(teamId)} ${day}: ${home ? "vs" : "at"} ${abbr(opp)} (${g.score}).`);
  }
  return T(
    lang,
    `${teamJa(teamId)}の次の試合は${when}、${home ? "ホーム" : "アウェー"}で${teamJa(opp)}戦です。`,
    `${abbr(teamId)}'s next game: ${when}, ${home ? "vs" : "at"} ${abbr(opp)}.`
  );
}

// ---------------------------------------------------------------------------

export async function answerNbaAskQuery(ctx: NbaAskNbaContext, input: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  /** 「DRTG上位10チームの中で得点」「テキサスの3チーム」「延長戦」「10点差以上」= 条件を重ねる・地域・決着の仕方 */
  const combo = await answerNbaAskCombo(ctx, input);
  if (combo) return combo;
  /** 経歴・エリア別・通算・月別・FA など、AI の query に無い切り口も言葉で先に拾う */
  const more = await answerNbaAskMore(ctx, input);
  if (more) return more;
  /** 「40% 以上で 20 点以上」「負けた試合で」「無敗」「日程がきつい」などの条件は AI の振り分けより先に言葉で拾う */
  const filtered = await answerNbaAskFilter(ctx, input);
  if (filtered) return filtered;
  /** 「差」「去年より」「〜に強いチーム」などの比較も同じ */
  const compared = await answerNbaAskCompare(ctx, input);
  if (compared) return compared;
  /** AI は今季を知らないので「去年」「一昨年」の年はコードで決める */
  const relative = nbaAskRelativeSeason(ctx.question);
  const intent: NbaAskIntent = relative ? { ...input, season: relative } : input;
  const q = intent.query ?? "unsupported";
  /** 「ドライブに関するスタッツ」を AI がプレースタイルに振ることがある */
  if (q === "style_map" && intent.player && nbaAskHowTheyPlayFocus(ctx.question)) {
    return answerNbaAskQuery(ctx, { ...intent, query: "player_season" });
  }
  /** チームのジャンル（「セルティックスのリバウンドに関するスタッツ」）はチーム詳細の HOW THEY PLAY */
  const teamGenreQuery =
    q === "team_stat" ||
    q === "style_map" ||
    q === "team_shapes" ||
    q === "team_record" ||
    (q === "team_moves" && !/加入|移籍|入れ替|入った|出た|抜けた|トレード|獲得|放出|補強|オフシーズン|\bIN\b|\bOUT\b|signed|traded|moves?/i.test(ctx.question));
  if (!intent.player && !intent.season && !intent.playoffs && teamGenreQuery) {
    const teamId = resolveNbaAskTeamId(intent.team);
    const how = teamId ? nbaAskTeamHowTheyPlayFocus(ctx.question) : null;
    if (teamId && how) return teamHowTheyPlayAnswer(ctx, teamId, how);
  }

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
    /** 「次の3試合」= N 試合集まるまで先読み */
    const KANJI_N: Record<string, number> = { 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7 };
    const nm = teamId && /次|今後|これから|この先|next|upcoming/i.test(ctx.question) ? /(\d+|[二三四五六七])\s*(?:試合|games?)/i.exec(ctx.question) : null;
    const wantN = nm ? Math.min(10, Number(nm[1]) || KANJI_N[nm[1]!] || 1) : intent.count && teamId && /次|今後|これから/.test(ctx.question) ? Math.min(10, intent.count) : 1;
    /** チームだけ聞かれて今日以降に試合が無いときは、次の試合まで 7 日先読みする */
    const lookAhead = teamId && !intent.date ? (wantN > 1 ? Math.min(30, wantN * 4) : 7) : 0;
    let date = asked;
    let games: NbaAskGameCard[] = [];
    const collected: NbaAskGameCard[] = [];
    const askingNext = lookAhead > 0 && /次|今度|今後|これから|この先|next|upcoming/i.test(ctx.question);
    /** 「次の試合」で試合中のものは「今やっている」と別に伝え、その次の予定を探す */
    let liveNow: NbaAskGameCard | null = null;
    let liveDate = asked;
    for (let i = 0; i <= lookAhead; i++) {
      date = shiftDateKey(asked, i);
      const r = await runNbaAskTool(ctx.db, "get_games_on_date", { date, pickup_only: intent.pickup_only }, lang, ctx.timeZone);
      games = gamesFromAskTool("get_games_on_date", r) ?? [];
      if (teamId) games = games.filter((g) => g.homeTeamId === teamId || g.awayTeamId === teamId);
      /** 「次の試合」は終わった試合を飛ばす */
      if (askingNext) games = games.filter((g) => !/final|終了/i.test(g.status));
      if (askingNext && wantN === 1 && !liveNow) {
        const live = games.find((g) => g.status === "live");
        if (live) {
          liveNow = live;
          liveDate = date;
        }
      }
      if (liveNow) games = games.filter((g) => g.status !== "live");
      if (wantN > 1) {
        collected.push(...games);
        if (collected.length >= wantN) break;
        continue;
      }
      if (games.length > 0) break;
    }
    if (wantN > 1 && teamId) {
      const list = collected.slice(0, wantN);
      if (list.length === 0) return text(T(lang, `${teamJa(teamId)}はこの先しばらく試合の予定がありません。`, `${abbr(teamId)} has no upcoming games.`), false);
      return {
        answer: T(
          lang,
          `${teamJa(teamId)}の次の${list.length}試合${list.length < wantN ? `（${lookAhead + 1}日先までで見つかった分）` : ""}`,
          `${abbr(teamId)} next ${list.length} games`
        ),
        board: null,
        games: list,
        opens: [],
        usedStats: false,
      };
    }
    const day = dateLabel(date, lang);
    if (liveNow && teamId) {
      const nowLine = nextGameLine(lang, teamId, liveNow, dateLabel(liveDate, lang));
      const next = games[0];
      return {
        answer: next
          ? `${nowLine}${T(lang, "", " ")}${nextGameLine(lang, teamId, next, date === asked ? T(lang, "今日", "today") : day)}`
          : `${nowLine}${T(lang, "その次の試合は1週間先まで予定がありません。", " No other game in the next week.")}`,
        board: null,
        games: next ? [liveNow, next] : [liveNow],
        opens: [],
        usedStats: false,
      };
    }
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
        : teamId && games.length === 1 && !intent.date
          ? nextGameLine(lang, teamId, games[0]!, date === asked ? T(lang, "今日", "today") : day)
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

  /** 「ウォリアーズの次の5試合」を AI が直近の試合に振ることがある */
  if ((q === "team_recent_games" || q === "team_record") && intent.team && /次の|今後|これから|この先|next|upcoming/i.test(ctx.question) && !/直近|最近|前の|last/i.test(ctx.question)) {
    return answerNbaAskQuery(ctx, { ...intent, query: "games_on_date", date: null });
  }
  if (q === "player_leaders") return playerLeaders(ctx, intent);
  if (q === "on_off") {
    const out = await onOffAnswer(ctx, intent);
    if (!out.board || intent.season || intent.playoffs) return out;
    if (intent.player) {
      const found = await needPlayer(ctx, intent);
      return "hit" in found ? { ...out, view: { kind: "player", id: found.hit.playerId, section: "on_off" } } : out;
    }
    const teamId = resolveNbaAskTeamId(intent.team);
    return teamId ? { ...out, view: { kind: "team", id: teamId, section: "on_off" } } : out;
  }
  if (q === "salary_ranking") return salaryRanking(ctx, intent);
  if (q === "style_map") return styleMapAnswer(ctx, intent);

  /** 今季でデータがある答えだけ、詳細ページの部品を答えの上に出す（部品は今季のデータ） */
  const current = !intent.season && !intent.playoffs;
  const withView = async (answer: Promise<NbaAskAnswer>, view: NbaAskView | null): Promise<NbaAskAnswer> => {
    const out = await answer;
    return view && current && out.board ? { ...out, view } : out;
  };

  if ((q === "player_discipline" || q === "team_discipline") && !intent.player && !resolveNbaAskTeamId(intent.team) && findNbaAskTeamsInText(ctx.question).length === 0) {
    return disciplineLeaders(ctx, intent, q === "team_discipline" || (/チーム|どこ/.test(ctx.question) && !/選手|誰|だれ/.test(ctx.question)));
  }
  if (q.startsWith("player_")) {
    const found = await needPlayer(ctx, intent);
    if ("reply" in found) return found.reply;
    const hit = found.hit;
    /** 「カリーのセルティックス戦」を AI が team に入れることがある → 所属と違うチームは対戦相手 */
    const askedTeam = resolveNbaAskTeamId(intent.team);
    /** 「ヨキッチのレイカーズ戦」は AI が所属チームを team に入れて相手を落とすことがある → 質問の文の別チーム */
    const oppInText = findNbaAskTeamsInText(ctx.question).filter((t) => t !== hit.teamId);
    const vsTeam = askedTeam && askedTeam !== hit.teamId ? askedTeam : oppInText.length === 1 ? oppInText[0]! : null;
    if (
      !intent.opponent &&
      vsTeam &&
      /戦|相手|対|との試合|vs/i.test(ctx.question) &&
      !/昨日|きのう|今日|明日|\d+月\d+日/.test(ctx.question) &&
      (q === "player_season" || q === "player_recent_games" || q === "player_last_game" || q === "player_splits" || q === "player_game_on_date")
    ) {
      return playerSplits(ctx, hit, { ...intent, opponent: abbr(vsTeam) });
    }
    /** 過去シーズンの試合ごとの記録は持っていない → 断って今季の最高 */
    if (/キャリアハイ|キャリア最高|自己最高|自己ベスト|生涯最高|career.?high/i.test(ctx.question) && !intent.season) {
      const out = await playerHighs(ctx, hit, intent);
      const note = T(
        lang,
        "キャリアハイ（過去シーズンの1試合ごとの記録）はアプリにありません。今季の記録で答えます。",
        "Career highs (game-by-game records from past seasons) aren't in the app. Here is this season. "
      );
      return { ...out, answer: `${note}${out.answer}` };
    }
    const pv = (section: (NbaAskView & { kind: "player" })["section"], count?: number): NbaAskView => ({
      kind: "player",
      id: hit.playerId,
      section,
      ...(count ? { count } : {}),
    });
    switch (q) {
      case "player_last_game":
        return playerLastGame(ctx, hit).then((out) => (out.view && !current ? { ...out, view: undefined } : out));
      case "player_game_on_date":
        return playerGameOnDate(ctx, hit, intent);
      case "player_recent_games": {
        /** 「ブランソンとハリバートンの直近5試合」= 2 人分を並べる */
        if (intent.player2) {
          const second = await needPlayer(ctx, { ...intent, player: intent.player2, player_written: null, team: null });
          if ("hit" in second && second.hit.playerId !== hit.playerId) {
            const [a, b] = await Promise.all([playerRecentGames(ctx, hit, intent), playerRecentGames(ctx, second.hit, intent)]);
            const tag = (h: NbaAskPlayerHit, board: NbaAskBoard | null) => (board?.rows ?? []).map((r) => ({ ...r, label: `${h.name.split(" ").pop()} ${r.label}` }));
            return {
              ...a,
              answer: `${a.answer}\n${b.answer}`,
              board: a.board ? { ...a.board, rows: [...tag(hit, a.board), ...tag(second.hit, b.board)] } : b.board,
            };
          }
        }
        return withView(playerRecentGames(ctx, hit, intent), pv("game_logs", intent.count ?? 5));
      }
      case "player_season": {
        if (!current) return playerOtherSeason(ctx, hit, intent);
        const how = nbaAskHowTheyPlayFocus(ctx.question);
        return how ? howTheyPlayAnswer(ctx, hit, how) : playerSeason(ctx, hit);
      }
      case "player_splits":
        return withView(playerSplits(ctx, hit, intent), intent.opponent ? null : pv("splits"));
      case "player_highs":
        return playerHighs(ctx, hit, intent).then((out) =>
          out.board && current ? { ...out, view: pv("highs") } : out
        );
      case "player_matchups":
        return matchupsAnswer(ctx, hit, intent).then((out) => (current && !intent.player2 ? out : { ...out, view: undefined }));
      case "player_profile":
        return { ...playerProfile(ctx, hit), view: pv("profile") };
      case "player_career":
        return withView(playerCareer(ctx, hit, intent), pv("career"));
      case "player_contract":
        return withView(playerContract(ctx, hit), pv("contract"));
      case "player_shot_zones":
        return withView(playerShotZones(ctx, hit, intent), pv("shot_zones"));
      case "player_discipline":
        return withView(
          disciplineAnswer(ctx, intent, { player_id: hit.playerId }, hit.name, { kind: "player", id: hit.playerId }),
          nbaAskIsSingleQuestion(ctx.question) && !disciplineRange(ctx.question) ? null : pv("discipline")
        );
    }
  }

  if (q === "milestones") return milestones(ctx, intent);
  if (q === "award_ladder") return awardLadder(ctx, intent);
  if (q === "standings") {
    return withView(standings(ctx, intent), { kind: "standings", id: intent.conference ?? "all" });
  }
  if (q === "team_stat") return teamStat(ctx, intent);
  if (q === "daily_leaders") {
    /** 「2023-24 シーズンの得点王」を AI が日別に振ることがある → シーズンのリーダー */
    const ym = /(20\d{2})\s*[-–/〜~]\s*(\d{2})/.exec(ctx.question);
    const namedSeason = ym ? `${ym[1]}-${ym[2]}` : intent.season;
    if (
      (namedSeason || /シーズン|今季|通算|[得点リバウンドアシストブロックスティール]+王/.test(ctx.question)) &&
      !/昨日|きのう|一昨日|おととい|今日|きょう|昨晩|昨夜|今夜|最新の試合|\d{1,2}\s*月\s*\d{1,2}\s*日/.test(ctx.question)
    ) {
      return playerLeaders(ctx, { ...intent, query: "player_leaders", date: null, ...(namedSeason ? { season: namedSeason } : {}) });
    }
    return dailyLeaders(ctx, intent);
  }
  if ((q === "pro_insight" || q === "pro_league") && !ctx.isPro) {
    return text(
      q === "pro_insight"
        ? T(lang, "試合ごとの Pro Pick の中身は PRO だけが見られます。", "A game's Pro Pick is PRO-only.")
        : T(lang, "PRO LEAGUE の順位は PRO だけが見られます。", "The PRO LEAGUE board is PRO-only."),
      false
    );
  }
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
    const tv = (section: (NbaAskView & { kind: "team" })["section"]): NbaAskView => ({ kind: "team", id: t.teamId, section });
    switch (q) {
      case "team_recent_games":
        /** 「ヒートの連戦の成績」= 状況別（直近の試合ではない） */
        if (!intent.opponent && /成績|勝率|戦績|勝敗|record/i.test(ctx.question) && SPLIT_FOCUS.some(([re]) => re.test(ctx.question)) && !/直近|最近|前回|ここ\d|last/i.test(ctx.question)) {
          return withView(teamSplits(ctx, t.teamId, intent), tv("splits"));
        }
        return teamRecentGames(ctx, t.teamId, intent).then((out) =>
          out.view && !current ? { ...out, view: undefined } : out
        );
      case "team_record":
        return withView(teamRecord(ctx, t.teamId, intent), tv("form"));
      case "team_roster":
        return withView(teamRoster(ctx, t.teamId), tv("roster"));
      case "team_lineups":
        return teamLineups(ctx, t.teamId, intent).then((out) => (current ? out : { ...out, view: undefined }));
      case "team_injuries":
        return teamInjuries(ctx, t.teamId);
      case "team_moves":
        return teamMoves(ctx, t.teamId);
      case "team_shapes":
        return withView(teamShapes(ctx, t.teamId, intent), tv("edge"));
      case "team_discipline":
        return withView(
          disciplineAnswer(ctx, intent, { team: abbr(t.teamId) }, teamJa(t.teamId), { kind: "team", id: t.teamId }),
          nbaAskIsSingleQuestion(ctx.question) && !disciplineRange(ctx.question) ? null : tv("discipline")
        );
      case "team_payroll":
        return teamPayroll(ctx, t.teamId);
      case "team_draft_picks":
        return withView(Promise.resolve(teamDraftPicks(ctx, t.teamId)), tv("draft_picks"));
      case "team_splits":
        return withView(teamSplits(ctx, t.teamId, intent), resolveNbaAskTeamId(intent.opponent) ? null : tv("splits"));
      case "team_position_defense":
        return withView(teamPositionDefense(ctx, t.teamId, intent), tv("position_defense"));
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
