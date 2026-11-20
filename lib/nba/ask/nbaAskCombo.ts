/**
 * 条件を 2 つ重ねる質問・地域・試合の決着の仕方。AI の query では表せないので言葉で先に拾う（`nbaAskMore` よりさらに前）。
 * 数字はすべて Firestore スナップショットから（BDL・AI は使わない）。
 *
 * - 「DRTG上位10チームの中で得点が一番多い」「得点トップ10の選手の中で3P成功率が一番高い」= A の上位 N の中を B で並べる
 * - 「テキサスの3チームで一番強い」「パシフィック地区で得点が一番多いチーム」= 地域 / 地区のチームだけで比べる
 * - 「延長戦の成績」「10点差以上の試合」「マジックの10点差以上で負けた試合」= `games` の終了試合（ピリオド数・最終スコア）
 */
import { Timestamp } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { NBA_DIVISION_TEAM_IDS } from "@/lib/nba/nbaTeamMapCoords";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import { loadPlayerStatLeadersSnapshot } from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import {
  NBA_PLAYER_SEASON_METRICS_COLLECTION,
  NBA_PLAYER_SEASON_METRICS_PLAYERS_SUB,
} from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { formatNbaPlayerListName } from "@/lib/nba/formatNbaPlayerListName";
import { abbr, loadRosters } from "./nbaAskTools";
import { NBA_ASK_PLAYER_STAT_WORDS, NBA_ASK_TEAM_STAT_WORDS, nbaAskStatWord, type NbaAskStatWord } from "./nbaAskStatWords";
import { findNbaAskTeamsInText, resolveNbaAskTeamId } from "./nbaAskTeamNames";
import { fmt, hasTeamValue, higherIsBetter, nbaAskRelativeSeason, pct1, rowValue, s1, teamName, teamSeasonRows, wl } from "./nbaAskCompare";
import type { NbaAskIntent } from "./nbaAskIntent";
import type { NbaAskBoard } from "./nbaAskBoard";
import type { NbaAskAnswer, NbaAskNbaContext } from "./nbaAskNbaAnswer";

const ja = (lang: string) => lang === "ja";
const T = (lang: string, jaText: string, enText: string) => (ja(lang) ? jaText : enText);

function text(answer: string): NbaAskAnswer {
  return { answer, board: null, games: null, opens: [], usedStats: true };
}

function boardAnswer(answer: string, board: NbaAskBoard): NbaAskAnswer {
  return { answer, board, games: null, opens: [], usedStats: true };
}

const PLAYER_WORD = /選手|プレーヤー|プレイヤー|\bplayers?\b|誰|だれ|\bwho\b/i;
const RECORD_WORD = /強い|強さ|成績|勝率|勝ってる|勝っている|勝ち星|順位|\bbest\s+record\b/i;
const MOST = /多い|高い|\bmost\b|\bhighest\b/i;
const FEWEST = /少な|低い|\bfewest\b|\blowest\b/i;
const WORST = /悪い|弱い|ワースト|最低|最下位|\bworst\b/i;

// ---------------------------------------------------------------------------
// 地域・地区
// ---------------------------------------------------------------------------

type Region = { re: RegExp; ja: string; en: string; ids: readonly string[] };

const REGIONS: readonly Region[] = [
  { re: /テキサス|\btexas\b/i, ja: "テキサスの3チーム", en: "Texas teams", ids: ["nba-mavericks", "nba-rockets", "nba-spurs"] },
  { re: /カリフォルニア|\bcalifornia\b/i, ja: "カリフォルニアの4チーム", en: "California teams", ids: ["nba-lakers", "nba-clippers", "nba-warriors", "nba-kings"] },
  { re: /フロリダ|\bflorida\b/i, ja: "フロリダの2チーム", en: "Florida teams", ids: ["nba-heat", "nba-magic"] },
  { re: /ニューヨーク(?:の|に(?:ある)?)?(?:2|二|ふた)?つ?の?チーム|ニューヨーク勢/, ja: "ニューヨークの2チーム", en: "New York teams", ids: ["nba-knicks", "nba-nets"] },
  { re: /(?:ロサンゼルス|\bLA\b|ロス)(?:の|に(?:ある)?)?(?:2|二|ふた)?つ?の?チーム|(?:ロサンゼルス|\bLA\b)勢/i, ja: "ロサンゼルスの2チーム", en: "LA teams", ids: ["nba-lakers", "nba-clippers"] },
  { re: /アトランティック|\batlantic\b/i, ja: "アトランティック地区", en: "Atlantic Division", ids: NBA_DIVISION_TEAM_IDS.atlantic },
  { re: /セントラル(?:地区|ディビジョン)|\bcentral\s+division\b/i, ja: "セントラル地区", en: "Central Division", ids: NBA_DIVISION_TEAM_IDS.central },
  { re: /サウスイースト|\bsoutheast\b/i, ja: "サウスイースト地区", en: "Southeast Division", ids: NBA_DIVISION_TEAM_IDS.southeast },
  { re: /ノースウェスト|\bnorthwest\b/i, ja: "ノースウェスト地区", en: "Northwest Division", ids: NBA_DIVISION_TEAM_IDS.northwest },
  { re: /パシフィック|\bpacific\b/i, ja: "パシフィック地区", en: "Pacific Division", ids: NBA_DIVISION_TEAM_IDS.pacific },
  { re: /サウスウェスト|\bsouthwest\b/i, ja: "サウスウェスト地区", en: "Southwest Division", ids: NBA_DIVISION_TEAM_IDS.southwest },
];

/** 「ロサンゼルス対決」「レイカーズとクリッパーズの直接対決」は対戦成績（`nbaAskMore`） */
export function nbaAskRegionOf(question: string): Region | null {
  const q = question.normalize("NFKC");
  if (/対決|直接対決|対戦/.test(q)) return null;
  return REGIONS.find((r) => r.re.test(q)) ?? null;
}

// ---------------------------------------------------------------------------
// 「A の上位 N の中で B」
// ---------------------------------------------------------------------------

const POOL_RE = /^(.*?)(上位|トップ|ベスト|top|下位|ワースト|worst)\s*(\d{1,2})\s*(?:の(?=チーム|選手))?(チーム|人|選手|teams?|players?)?\s*(?:の中|のうち|以内|内|に入っ(?:て|た)(?:いる|る)?|に入る|に入った|で|among|within)(.*)$/i;

export function nbaAskPoolOf(question: string): { head: string; worst: boolean; n: number; unit: string; rest: string } | null {
  const m = POOL_RE.exec(question.normalize("NFKC"));
  if (!m) return null;
  const n = Number(m[3]);
  if (!(n >= 2 && n <= 30)) return null;
  return { head: m[1]!, worst: /下位|ワースト|worst/i.test(m[2]!), n, unit: m[4] ?? "", rest: m[5] ?? "" };
}

/** B の並べ方: 多い / 少ない（値の向き）・良い / 悪い（指標の良し悪し） */
function orderOf(rest: string, id: string): { desc: boolean; wordJa: string } {
  const better = higherIsBetter(id);
  if (FEWEST.test(rest)) return { desc: false, wordJa: /低い/.test(rest) ? "低い" : "少ない" };
  if (MOST.test(rest)) return { desc: true, wordJa: /高い/.test(rest) ? "高い" : "多い" };
  if (WORST.test(rest)) return { desc: !better, wordJa: "悪い" };
  return { desc: better, wordJa: better ? "高い" : "低い（良い）" };
}

type TeamRow = Awaited<ReturnType<typeof teamSeasonRows>>["rows"][number];

const winPctOf = (r: TeamRow) => (r.wins + r.losses > 0 ? r.wins / (r.wins + r.losses) : 0);

/** チームを並べた答え（地域 / 上位 N の中）。B が無ければ勝率で並べる */
async function teamPoolAnswer(
  ctx: NbaAskNbaContext,
  season: string,
  pool: { ja: string; en: string; ids: readonly string[] | null; a?: NbaAskStatWord & { n: number; worst: boolean } },
  rest: string
): Promise<NbaAskAnswer | null> {
  const lang = ctx.language;
  const b = nbaAskStatWord(NBA_ASK_TEAM_STAT_WORDS, rest);
  const byRecord = !b || (b.id === "winPct" && !pool.a);
  if (!b && !RECORD_WORD.test(rest) && pool.a) return null;
  const { rows, clean } = await teamSeasonRows(ctx.db, season);
  let members = rows.filter((r) => r.wins + r.losses > 0 || !byRecord);
  let aRank = new Map<string, number>();
  if (pool.a) {
    const a = pool.a;
    const ranked = rows
      .filter((r) => hasTeamValue(r, a.id, clean))
      .sort((x, y) => (rowValue(y, a.id)! - rowValue(x, a.id)!) * (higherIsBetter(a.id) ? 1 : -1));
    aRank = new Map(ranked.map((r, i) => [r.teamId, i + 1]));
    members = (a.worst ? [...ranked].reverse() : ranked).slice(0, a.n);
  } else if (pool.ids) {
    const ids = pool.ids;
    members = rows.filter((r) => ids.includes(r.teamId));
  }
  if (members.length === 0) return text(T(lang, `${season} のチームのデータがまだありません。`, `No team data for ${season} yet.`));
  const label = pool.a
    ? T(lang, `${pool.a.ja}${pool.a.worst ? "下位" : "上位"}${pool.a.n}チーム`, `${pool.a.worst ? "bottom" : "top"} ${pool.a.n} in ${pool.a.en}`)
    : T(lang, pool.ja, pool.en);
  const aCol = pool.a ? [T(lang, pool.a.ja.replace(/（.+）/, ""), pool.a.en)] : [];
  const aCell = (r: TeamRow) => (pool.a ? [`${fmt(pool.a.id, rowValue(r, pool.a.id) ?? 0)}（${aRank.get(r.teamId) ?? "—"}位）`] : []);
  const record = (r: TeamRow) => wl({ wins: r.wins, losses: r.losses }, lang);

  if (byRecord) {
    const worst = WORST.test(rest);
    const sorted = [...members].sort((x, y) => (winPctOf(y) - winPctOf(x) || (rowValue(y, "netrtg") ?? 0) - (rowValue(x, "netrtg") ?? 0)) * (worst ? -1 : 1));
    const top = sorted[0]!;
    return boardAnswer(
      T(
        lang,
        `${season} の${label}で成績がいちばん${worst ? "悪い" : "いい"}のは${teamName(top.teamId, lang)}（${record(top)}・勝率 ${pct1(winPctOf(top))}）。${sorted
          .slice(1)
          .map((r) => `${teamName(r.teamId, lang)} ${record(r)}`)
          .join("、")}${sorted.length > 1 ? "。" : ""}`,
        `${season} ${label}: ${worst ? "worst" : "best"} record is ${abbr(top.teamId)} (${top.wins}-${top.losses}).`
      ),
      {
        columns: [T(lang, "勝敗", "W-L"), T(lang, "勝率", "PCT"), "NET", ...aCol],
        rows: sorted.map((r) => ({ label: teamName(r.teamId, lang), cells: [`${r.wins}-${r.losses}`, pct1(winPctOf(r)), fmt("netrtg", rowValue(r, "netrtg") ?? 0), ...aCell(r)] })),
      }
    );
  }

  const stat = b!;
  if (pool.a && stat.id === pool.a.id) return null;
  const has = members.filter((r) => hasTeamValue(r, stat.id, clean));
  if (has.length === 0) return text(T(lang, `${label}の${stat.ja}はまだありません。`, `No ${stat.en} for ${label} yet.`));
  const order = orderOf(rest, stat.id);
  const sorted = [...has].sort((x, y) => (rowValue(y, stat.id)! - rowValue(x, stat.id)!) * (order.desc ? 1 : -1));
  const league = rows
    .filter((r) => hasTeamValue(r, stat.id, clean))
    .sort((x, y) => (rowValue(y, stat.id)! - rowValue(x, stat.id)!) * (higherIsBetter(stat.id) ? 1 : -1));
  const leagueRank = (r: TeamRow) => league.findIndex((x) => x.teamId === r.teamId) + 1;
  const top = sorted[0]!;
  const v = (r: TeamRow) => fmt(stat.id, rowValue(r, stat.id)!);
  return boardAnswer(
    T(
      lang,
      `${season} の${label}の中で${stat.ja}がいちばん${order.wordJa}のは${teamName(top.teamId, lang)}（${v(top)}・リーグ${leagueRank(top)}位）。${sorted.length > 1 ? `続いて${sorted.slice(1, 3).map((r) => `${teamName(r.teamId, lang)} ${v(r)}`).join("・")}。` : ""}`,
      `${season} ${label}: ${order.desc ? "highest" : "lowest"} ${stat.en} is ${abbr(top.teamId)} (${v(top)}, #${leagueRank(top)} in the league).`
    ),
    {
      columns: [T(lang, stat.ja.replace(/（.+）/, ""), stat.en), T(lang, "リーグ順位", "RANK"), ...aCol, T(lang, "勝敗", "W-L")],
      rows: sorted.map((r) => ({ label: teamName(r.teamId, lang), cells: [v(r), `${leagueRank(r)}`, ...aCell(r), `${r.wins}-${r.losses}`] })),
      ...(higherIsBetter(stat.id) ? {} : { note: T(lang, `${stat.ja}は低いほど良い数字です。`, `Lower ${stat.en} is better.`) }),
    }
  );
}

/** 「得点トップ10の選手の中で3P成功率が一番高い」: A はリーダーボード（公式の出場資格）、B は全出場選手のメトリクス doc */
async function playerPoolAnswer(
  ctx: NbaAskNbaContext,
  season: string,
  a: NbaAskStatWord,
  pool: { n: number; worst: boolean },
  rest: string
): Promise<NbaAskAnswer | null> {
  const lang = ctx.language;
  const b = nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, rest);
  if (!b || b.id === a.id) return null;
  const board = (await loadPlayerStatLeadersSnapshot(ctx.db, season)).bundle.season[a.id as NbaPlayerLeaderMetricId] ?? [];
  if (board.length === 0) return null;
  const members = (pool.worst ? [...board].reverse() : board).slice(0, pool.n);
  const col = ctx.db.collection(NBA_PLAYER_SEASON_METRICS_COLLECTION).doc(season).collection(NBA_PLAYER_SEASON_METRICS_PLAYERS_SUB);
  const docs = await ctx.db.getAll(...members.map((r) => col.doc(r.playerId)), { fieldMask: [`metrics.${b.id}`] });
  const cellOf = new Map(
    docs.map((d) => {
      const c = ((d.data()?.metrics ?? {}) as Record<string, { value?: unknown; rank?: unknown }>)[b.id];
      return [d.id, typeof c?.value === "number" ? { value: c.value, rank: typeof c.rank === "number" ? c.rank : 0 } : null] as const;
    })
  );
  const rows = members.flatMap((r, i) => {
    const c = cellOf.get(r.playerId);
    return c ? [{ r, aRank: i + 1, ...c }] : [];
  });
  if (rows.length === 0) return text(T(lang, `${b.ja}のデータがまだありません。`, `No ${b.en} data yet.`));
  const order = orderOf(rest, b.id);
  rows.sort((x, y) => (y.value - x.value) * (order.desc ? 1 : -1));
  const name = (r: (typeof rows)[number]) => formatNbaPlayerListName(r.r.playerName, r.r.playerId);
  const top = rows[0]!;
  const label = T(lang, `${a.ja}${pool.worst ? "下位" : "上位"}${pool.n}人`, `${pool.worst ? "bottom" : "top"} ${pool.n} in ${a.en}`);
  return boardAnswer(
    T(
      lang,
      `${season} の${label}の中で${b.ja}がいちばん${order.wordJa}のは${name(top)}（${teamName(top.r.teamId, lang)}）・${fmt(b.id, top.value)}${top.rank ? `（リーグ${top.rank}位）` : ""}。${rows.length > 1 ? `続いて${rows.slice(1, 3).map((r) => `${name(r)} ${fmt(b.id, r.value)}`).join("・")}。` : ""}`,
      `${season} ${label}: ${order.desc ? "highest" : "lowest"} ${b.en} is ${name(top)} (${abbr(top.r.teamId)}) ${fmt(b.id, top.value)}.`
    ),
    {
      columns: [T(lang, b.ja, b.en), T(lang, "リーグ順位", "RANK"), T(lang, a.ja, a.en)],
      rows: rows.map((r) => ({
        label: `${name(r)} ${abbr(r.r.teamId)}`,
        cells: [fmt(b.id, r.value), r.rank ? `${r.rank}` : "—", `${fmt(a.id, r.r.value)}（${r.aRank}位）`],
      })),
      note: T(lang, `${a.ja}の順位は公式の出場資格を満たす選手の中。リーグ順位「—」は${b.ja}の資格外。`, `${a.en} rank among qualified players.`),
    }
  );
}

/** 地域の選手（「テキサスのチームで一番点を取ってる選手」）。ロスターの今季平均 */
const ROSTER_STATS: ReadonlyArray<[RegExp, "ppg" | "rpg" | "apg" | "spg" | "bpg" | "fg3m", string, string]> = [
  [/リバウンド/, "rpg", "リバウンド", "REB"],
  [/アシスト/, "apg", "アシスト", "AST"],
  [/スティール/, "spg", "スティール", "STL"],
  [/ブロック/, "bpg", "ブロック", "BLK"],
  [/3P|スリー|3ポイント/i, "fg3m", "3P成功数", "3PM"],
  [/得点|点|\bpts\b|points?/i, "ppg", "得点", "PTS"],
];

async function regionPlayers(ctx: NbaAskNbaContext, region: Region): Promise<NbaAskAnswer | null> {
  const lang = ctx.language;
  const q = ctx.question;
  const stat = ROSTER_STATS.find(([re]) => re.test(q)) ?? ROSTER_STATS[ROSTER_STATS.length - 1]!;
  const [, key, labelJa, labelEn] = stat;
  const rosters = await loadRosters(ctx.db);
  const all = Object.entries(rosters).flatMap(([teamId, t]) => t.players.map((p) => ({ p, teamId })));
  const current = (p: (typeof all)[number]["p"]) => !p.averagesSeasonKey || p.averagesSeasonKey === CURRENT_NBA_SEASON_KEY;
  const maxGp = Math.max(0, ...all.filter((x) => current(x.p)).map((x) => x.p.gp));
  const minGp = Math.max(3, Math.floor(maxGp * 0.5));
  const rows = all
    .filter((x) => region.ids.includes(x.teamId) && current(x.p) && x.p.gp >= minGp && typeof x.p[key] === "number")
    .sort((x, y) => (Number(y.p[key]) - Number(x.p[key])) * (FEWEST.test(q) ? -1 : 1));
  if (rows.length === 0) return text(T(lang, `${region.ja}の選手の今季のデータがまだありません。`, `No ${region.en} player data yet.`));
  const name = (x: (typeof rows)[number]) => formatNbaPlayerListName(`${x.p.firstName} ${x.p.lastName}`.trim(), String(x.p.id));
  const top = rows[0]!;
  return boardAnswer(
    T(
      lang,
      `今季の${region.ja}の選手で${labelJa}がいちばん${FEWEST.test(q) ? "少ない" : "多い"}のは${name(top)}（${teamName(top.teamId, lang)}）・1試合平均 ${Number(top.p[key]).toFixed(1)}。${rows.length > 1 ? `続いて${rows.slice(1, 3).map((x) => `${name(x)} ${Number(x.p[key]).toFixed(1)}`).join("・")}。` : ""}`,
      `${region.en}: most ${labelEn} is ${name(top)} (${abbr(top.teamId)}) ${Number(top.p[key]).toFixed(1)}.`
    ),
    {
      columns: [T(lang, labelJa, labelEn), T(lang, "試合", "GP")],
      rows: rows.slice(0, 8).map((x) => ({ label: `${name(x)} ${abbr(x.teamId)}`, cells: [Number(x.p[key]).toFixed(1), String(x.p.gp)] })),
      note: T(lang, `今季${minGp}試合以上の選手。`, `${minGp}+ games.`),
    }
  );
}

async function poolQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question.normalize("NFKC");
  const season = nbaAskRelativeSeason(q) ?? intent.season ?? CURRENT_NBA_SEASON_KEY;
  if (intent.playoffs) return null;
  const region = nbaAskRegionOf(q);
  if (region) {
    if (PLAYER_WORD.test(q)) return season === CURRENT_NBA_SEASON_KEY ? regionPlayers(ctx, region) : null;
    return teamPoolAnswer(ctx, season, { ja: region.ja, en: region.en, ids: region.ids }, q.replace(region.re, " "));
  }
  const pool = nbaAskPoolOf(q);
  if (!pool) return null;
  const isPlayer = /人|選手|player/i.test(pool.unit) || (!/チーム|team/i.test(pool.unit) && PLAYER_WORD.test(q) && !/チーム|どこ/.test(q));
  if (isPlayer) {
    const a = nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, pool.head);
    return a ? playerPoolAnswer(ctx, season, a, pool, pool.rest) : null;
  }
  const a = nbaAskStatWord(NBA_ASK_TEAM_STAT_WORDS, pool.head);
  if (!a) {
    /** 「西の上位5チームで」= 項目の無い上位は勝率の順位 */
    if (!/^(?:今季の?|今シーズンの?|リーグ(?:の|で)?|NBAの?)?(?:(?:東|西|イースト|ウエスト|ウェスト)(?:カンファレンス)?の?)?\s*(?:勝率|成績|順位)?(?:の|で)?\s*$/i.test(pool.head)) return null;
    if (!/チーム|team/i.test(pool.unit) && !/チーム|どこ/.test(pool.rest)) return null;
    const conf = /東|イースト|east/i.test(pool.head) ? "east" : /西|ウエスト|ウェスト|west/i.test(pool.head) ? "west" : null;
    const { rows } = await teamSeasonRows(ctx.db, season);
    const ids = rows
      .filter((r) => r.wins + r.losses > 0 && (!conf || nbaConferenceForTeam(r.teamId) === conf))
      .sort((x, y) => (winPctOf(y) - winPctOf(x) || (rowValue(y, "netrtg") ?? 0) - (rowValue(x, "netrtg") ?? 0)) * (pool.worst ? -1 : 1))
      .slice(0, pool.n)
      .map((r) => r.teamId);
    const confJa = conf === "east" ? "東の" : conf === "west" ? "西の" : "";
    const confEn = conf === "east" ? "East " : conf === "west" ? "West " : "";
    return teamPoolAnswer(
      ctx,
      season,
      { ja: `${confJa}${pool.worst ? "下位" : "上位"}${pool.n}チーム（勝率）`, en: `${confEn}${pool.worst ? "bottom" : "top"} ${pool.n} by record`, ids },
      pool.rest
    );
  }
  return teamPoolAnswer(ctx, season, { ja: a.ja, en: a.en, ids: null, a: { ...a, n: pool.n, worst: pool.worst } }, pool.rest);
}

// ---------------------------------------------------------------------------
// 試合の決着: 延長・点差
// ---------------------------------------------------------------------------

type FinalGame = { ms: number; home: string; away: string; hs: number; as: number; ot: number };

/** 今季（レギュラー / プレーオフ）の終了試合。同じ 2 チーム・同じ日の重複 doc は 1 試合 */
async function loadFinalGames(ctx: NbaAskNbaContext, season: string, playoffs: boolean): Promise<FinalGame[]> {
  const snap = await ctx.db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", season)
    .where("startAtJst", "<", Timestamp.fromMillis(Date.now()))
    .select("status", "seasonPhase", "homeTeamId", "awayTeamId", "homeScore", "awayScore", "startAtJst", "liveStats.lineScore.periods")
    .get();
  const seen = new Set<string>();
  const out: FinalGame[] = [];
  for (const d of snap.docs) {
    const g = d.data() as Record<string, unknown>;
    if (g.status !== "final" || g.seasonPhase !== (playoffs ? "playoffs" : "regular")) continue;
    const hs = Number(g.homeScore);
    const as = Number(g.awayScore);
    const ms = (g.startAtJst as { toMillis?: () => number } | undefined)?.toMillis?.();
    if (!(hs > 0 && as > 0) || ms == null) continue;
    const key = `${g.homeTeamId}|${g.awayTeamId}|${Math.floor((ms + 9 * 3_600_000) / 86_400_000)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const periods = ((g.liveStats as { lineScore?: { periods?: unknown } } | undefined)?.lineScore?.periods ?? []) as unknown[];
    out.push({ ms, home: String(g.homeTeamId), away: String(g.awayTeamId), hs, as, ot: Math.max(0, (Array.isArray(periods) ? periods.length : 0) - 4) });
  }
  return out.sort((a, b) => b.ms - a.ms);
}

type GameCond = { ot: boolean; min: number | null; max: number | null };

export function nbaAskGameCondOf(question: string): GameCond | null {
  const q = question.normalize("NFKC");
  const ot = /延長|オーバータイム|\bOT\b|overtime/i.test(q);
  let min: number | null = null;
  let max: number | null = null;
  const m = /(\d{1,2})\s*点差\s*(以上|超|以内|未満|以下)?|(\d{1,2})\s*点以上(?:の)?(?:点)?差|by\s+(\d{1,2})\+?/i.exec(q);
  if (m) {
    const n = Number(m[1] ?? m[3] ?? m[4]);
    const how = m[2] ?? "以上";
    if (how === "以内" || how === "以下") max = n;
    else if (how === "未満") max = n - 1;
    else min = how === "超" ? n + 1 : n;
  } else if (/(?:二|2)桁(?:の)?点差|ダブルスコア/.test(q)) min = 10;
  else if (/大差|大勝|大敗|blowout/i.test(q)) min = 15;
  if (!ot && min === null && max === null) return null;
  return { ot, min, max };
}

function condJa(c: GameCond): string {
  const parts = [c.ot ? "延長戦" : "", c.min !== null ? `${c.min}点差以上` : "", c.max !== null ? `${c.max}点差以内` : ""].filter(Boolean);
  return c.ot && parts.length === 1 ? "延長戦" : `${parts.join("・")}で決着した試合`;
}

function condEn(c: GameCond): string {
  return [c.ot ? "overtime games" : "", c.min !== null ? `games decided by ${c.min}+` : "", c.max !== null ? `games decided by ${c.max} or less` : ""].filter(Boolean).join(", ");
}

const matches = (g: FinalGame, c: GameCond) => {
  const diff = Math.abs(g.hs - g.as);
  return (!c.ot || g.ot > 0) && (c.min === null || diff >= c.min) && (c.max === null || diff <= c.max);
};

const otLabel = (ot: number) => (ot <= 0 ? "" : ot === 1 ? "OT" : `${ot}OT`);
const dateLabel = (ms: number) => {
  const d = new Date(ms + 9 * 3_600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

async function gameQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question.normalize("NFKC");
  const lang = ctx.language;
  const c = nbaAskGameCondOf(q);
  if (!c || intent.player || PLAYER_WORD.test(q)) return null;
  const season = nbaAskRelativeSeason(q) ?? intent.season ?? CURRENT_NBA_SEASON_KEY;
  const playoffs = intent.playoffs || /プレーオフ|playoffs?/i.test(q);
  const all = await loadFinalGames(ctx, season, playoffs);
  const games = all.filter((g) => matches(g, c));
  const phase = playoffs ? T(lang, "プレーオフ", "playoffs") : T(lang, "レギュラーシーズン", "regular season");
  const what = T(lang, condJa(c), condEn(c));
  const inText = findNbaAskTeamsInText(q);
  const teamId = inText[0] ?? resolveNbaAskTeamId(intent.team);
  const oppId = inText[1] ?? null;

  if (teamId) {
    const wonOnly = /勝った|勝ち(?!越)|勝利した/.test(q) && !/負け|敗/.test(q);
    const lostOnly = /負けた|負け(?!越)|敗れた|敗戦/.test(q) && !/勝っ|勝ち|勝利/.test(q);
    const mine = games
      .filter((g) => (g.home === teamId || g.away === teamId) && (!oppId || g.home === oppId || g.away === oppId))
      .map((g) => {
        const home = g.home === teamId;
        const my = home ? g.hs : g.as;
        const op = home ? g.as : g.hs;
        return { g, home, opp: home ? g.away : g.home, my, op, won: my > op };
      });
    const rec = { wins: mine.filter((x) => x.won).length, losses: mine.filter((x) => !x.won).length };
    const list = mine.filter((x) => (!wonOnly || x.won) && (!lostOnly || !x.won));
    const tn = teamName(teamId, lang);
    const vsJa = oppId ? `${teamName(oppId, lang)}戦の` : "";
    if (mine.length === 0) return text(T(lang, `${tn}は${season} の${phase}でまだ${vsJa}${what}がありません。`, `${abbr(teamId)} has no ${condEn(c)} in the ${season} ${phase} yet.`));
    const line = (x: (typeof mine)[number]) =>
      `${dateLabel(x.g.ms)} ${x.home ? "vs" : "@"} ${teamName(x.opp, lang)} ${x.my}-${x.op}${x.g.ot ? `（${otLabel(x.g.ot)}）` : ""}`;
    const head = wonOnly || lostOnly
      ? T(lang, `${tn}の${season} の${vsJa}${what}で${wonOnly ? "勝った" : "負けた"}のは${list.length}試合（${what}全体は ${wl(rec, lang)}）。`, `${abbr(teamId)}: ${list.length} ${wonOnly ? "wins" : "losses"} in ${condEn(c)}.`)
      : T(lang, `${tn}の${season} の${vsJa}${what}は${mine.length}試合で${wl(rec, lang)}。`, `${abbr(teamId)} in ${condEn(c)}: ${wl(rec, lang)} (${mine.length} games).`);
    return boardAnswer(`${head}${list.length ? T(lang, `${list.slice(0, 3).map(line).join("、")}${list.length > 3 ? ` ほか${list.length - 3}試合` : ""}。`, "") : ""}`, {
      columns: T(lang, "勝敗|スコア|点差", "W/L|Score|Diff").split("|"),
      rows: list.slice(0, 12).map((x) => ({
        label: `${dateLabel(x.g.ms)} ${x.home ? "vs" : "@"} ${abbr(x.opp)}${x.g.ot ? ` ${otLabel(x.g.ot)}` : ""}`,
        cells: [x.won ? T(lang, "勝", "W") : T(lang, "敗", "L"), `${x.my}-${x.op}`, s1(x.my - x.op)],
      })),
      note: T(lang, `${phase}の終了試合。日付は日本時間。`, `${phase} finals. Dates in Japan time.`),
    });
  }

  const finals = all.length;
  if (games.length === 0) return text(T(lang, `${season} の${phase}ではまだ${what}がありません。`, `No ${condEn(c)} in the ${season} ${phase} yet.`));
  /** 「延長になった試合一覧」= 試合を並べる */
  if (/一覧|リスト|全部|全て|すべて|どの試合|試合を(?:教えて|見せて|並べ)|\blist\b/i.test(q)) {
    const shown = games.slice(0, 20);
    return boardAnswer(
      T(
        lang,
        `${season} の${phase}で${what}は${games.length}試合${games.length > shown.length ? `（新しい順に${shown.length}試合）` : ""}。`,
        `${season} ${phase}: ${games.length} ${condEn(c)}.`
      ),
      {
        columns: T(lang, "スコア|点差", "Score|Diff").split("|"),
        rows: shown.map((g) => ({
          label: `${dateLabel(g.ms)} ${abbr(g.away)} @ ${abbr(g.home)}${g.ot ? ` ${otLabel(g.ot)}` : ""}`,
          cells: [`${g.as}-${g.hs}`, String(Math.abs(g.hs - g.as))],
        })),
        note: T(lang, `${phase}の終了試合。日付は日本時間・スコアはアウェー-ホーム。`, `${phase} finals. Away-home score, Japan dates.`),
      }
    );
  }
  const byTeam = new Map<string, { teamId: string; wins: number; losses: number }>();
  for (const g of games) {
    for (const [id, won] of [[g.home, g.hs > g.as], [g.away, g.as > g.hs]] as const) {
      const r = byTeam.get(id) ?? { teamId: id, wins: 0, losses: 0 };
      if (won) r.wins++;
      else r.losses++;
      byTeam.set(id, r);
    }
  }
  const teams = [...byTeam.values()];
  const n = (r: { wins: number; losses: number }) => r.wins + r.losses;
  const pct = (r: { wins: number; losses: number }) => r.wins / Math.max(1, n(r));
  const lossesFirst = /負け|敗/.test(q) && !/勝/.test(q);
  const countFirst = /多い|一番.{0,4}(?:やっ|戦っ|して)|回数|何試合/.test(q) && !/勝ち|負け|勝率/.test(q);
  const sorted = [...teams].sort((a, b) =>
    countFirst ? n(b) - n(a) || b.wins - a.wins : lossesFirst ? b.losses - a.losses || pct(a) - pct(b) : b.wins - a.wins || pct(b) - pct(a)
  );
  const top = sorted[0]!;
  const otGames = c.ot ? games.filter((g) => g.ot >= 2).length : 0;
  const lead = T(
    lang,
    `${season} の${phase}で${what}は${games.length}試合${c.ot ? (otGames ? `（うち2回以上の延長${otGames}試合）` : "") : `（終了${finals}試合の${pct1(games.length / Math.max(1, finals))}）`}。`,
    `${season} ${phase}: ${games.length} ${condEn(c)}.`
  );
  const best = countFirst
    ? T(lang, `いちばん多いのは${teamName(top.teamId, lang)}（${n(top)}試合・${wl(top, lang)}）。`, `Most: ${abbr(top.teamId)} (${n(top)}).`)
    : lossesFirst
      ? T(lang, `負けがいちばん多いのは${teamName(top.teamId, lang)}（${wl(top, lang)}）。`, `Most losses: ${abbr(top.teamId)} (${wl(top, lang)}).`)
      : T(lang, `勝ちがいちばん多いのは${teamName(top.teamId, lang)}（${wl(top, lang)}）。`, `Most wins: ${abbr(top.teamId)} (${wl(top, lang)}).`);
  const recent = c.ot ? T(lang, `直近: ${games.slice(0, 3).map((g) => `${dateLabel(g.ms)} ${teamName(g.away, lang)} ${g.as}-${g.hs} ${teamName(g.home, lang)}（${otLabel(g.ot)}）`).join("、")}。`, "") : "";
  return boardAnswer(`${lead}${best}${recent}`, {
    columns: T(lang, "試合|勝敗|勝率", "G|W-L|PCT").split("|"),
    rows: sorted.slice(0, 10).map((r) => ({ label: teamName(r.teamId, lang), cells: [String(n(r)), `${r.wins}-${r.losses}`, pct1(pct(r))] })),
    note: T(lang, `${phase}の終了試合。`, `${phase} finals.`),
  });
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

export async function answerNbaAskCombo(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  return (await gameQuestion(ctx, intent)) ?? (await poolQuestion(ctx, intent));
}
