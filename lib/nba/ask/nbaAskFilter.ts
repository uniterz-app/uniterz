/**
 * 条件で絞る・両端を出す・状況を指定する質問。AI の query では表しきれないので、質問の言葉で先に拾う。
 * 数字はすべて Firestore スナップショットから（BDL・AI は使わない）。
 *
 * 選手（nbaLeagueHub の今季の主力）: 「3P 40% 以上で 20 点以上」「ターンオーバーが少ないガード」「ルーキー / ベンチで一番」「ファウルが多い」
 * 選手 1 人（試合ログ）: 「負けた試合で平均何点」「30 点以上取った試合のチームの成績」
 * チーム: 「一番速いチームと遅いチーム」「オフェンスはいいけど守備が悪い」「東で一番 NET が高い」「無敗 / 全敗」
 *         「ホームでもアウェーでも勝ってる」「日程がきつい」「ガベージタイムが多い」
 * 年俸と働き: 「年俸に見合ってない選手」
 */
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadNbaLeagueHubSnapshot } from "@/lib/nba/leagueHub/loadNbaLeagueHubSnapshot";
import { leagueHubLogDayMs } from "@/lib/nba/leagueHub/buildNbaLeagueHub";
import type { LeagueHubPlayer, LeagueHubPlayerMetric, LeagueHubPosition, NbaLeagueHubDoc } from "@/lib/nba/leagueHub/leagueHubTypes";
import { LEAGUE_HUB_PLAYER_METRICS } from "@/lib/nba/leagueHub/leagueHubTypes";
import { loadPlayerGameLogsSnapshot } from "@/lib/nba/playerGameLogs/loadPlayerGameLogsSnapshot";
import {
  NBA_PLAYER_SEASON_METRICS_COLLECTION,
  NBA_PLAYER_SEASON_METRICS_PLAYERS_SUB,
} from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import { loadTeamGameLogDetail } from "@/lib/nba/teamGameLog/loadTeamGameLogDetail";
import { nbaGameDocIdFromBdlId } from "@/lib/nba/bdl/mapBdlGameToNbaGameDoc";
import { nbaConferenceForTeam, type NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { abbr, loadRosters, readStandingsBoard } from "./nbaAskTools";
import { NBA_CONFERENCE_STANDINGS_COLLECTION } from "@/lib/nba/standings/loadNbaConferenceStandings";
import { NBA_ASK_PLAYER_STAT_WORDS, NBA_ASK_TEAM_STAT_WORDS, nbaAskIsPctStat, type NbaAskStatWord } from "./nbaAskStatWords";
import { findNbaAskTeamsInText, resolveNbaAskTeamId } from "./nbaAskTeamNames";
import { nbaAskNicknamePlayer, pickNbaAskPlayer } from "./nbaAskPlayerResolve";
import {
  conferenceFilter,
  fmt,
  hasTeamValue,
  higherIsBetter,
  LAST_SEASON,
  pct1,
  rowValue,
  s1,
  teamName,
  teamSeasonRows,
  TWO_SEASONS_AGO,
  winPct,
  wl,
} from "./nbaAskCompare";
import type { NbaAskIntent } from "./nbaAskIntent";
import { withHubView, type NbaAskBoard } from "./nbaAskBoard";
import type { NbaAskAnswer, NbaAskNbaContext } from "./nbaAskNbaAnswer";

const ja = (lang: string) => lang === "ja";
const T = (lang: string, jaText: string, enText: string) => (ja(lang) ? jaText : enText);

function text(answer: string): NbaAskAnswer {
  return { answer, board: null, games: null, opens: [], usedStats: true };
}

function boardAnswer(answer: string, board: NbaAskBoard): NbaAskAnswer {
  return { answer, board, games: null, opens: [], usedStats: true };
}

const LOW = /少な|低い|低く|悪い|下手|ワースト|最低|最下位|苦手|遅い|worst|fewest|lowest|slowest/i;
const HIGH = /多い|高い|良い|いい|上手|ベスト|最高|トップ|速い|best|most|highest|fastest/i;
const RANK_ASK = /の次に|一番|いちばん|最も|もっとも|トップ|\d+位|番目|ランキング|順位|上位|ベスト|ワースト|誰|だれ|どこ|どの|多い|少な|高い|低い|速い|遅い|(?:選手|チーム|ガード|フォワード|センター)(?:は|って)[？?]?$|いる[？?]|\bwho\b|\bwhich\b|most|least/i;
const TEAM_WORD = /チーム|\bteams?\b/i;
const PLAYER_WORD = /選手|プレーヤー|プレイヤー|\bplayers?\b|誰|だれ|\bwho\b/i;

// ---------------------------------------------------------------------------
// 選手: 言葉 → ハブの指標
// ---------------------------------------------------------------------------

const HUB_METRICS = new Set<string>(LEAGUE_HUB_PLAYER_METRICS);

/** ハブにしか無い項目を先に見る（「ファウル」「ペイントの得点」など） */
const HUB_ONLY_WORDS: readonly NbaAskStatWord[] = [
  { re: /(?<!テクニカル.?|フ[ラレ]グラント.?)ファウル(?!を?もら)|\bPF\b|(?<!technical\s|flagrant\s)fouls?(?!\s*drawn)/i, id: "pf36", ja: "36分あたりのファウル", en: "Fouls per 36" },
  { re: /ペイント.{0,4}(?:得点|点)/, id: "pts_paint", ja: "ペイント内の得点", en: "Paint points" },
  { re: /(?:3P|スリー|3ポイント).{0,6}(?:試投|打っ|打つ|アテンプト|本数)/i, id: "fg3a", ja: "3P試投数", en: "3PA" },
  { re: /フリースロー.{0,6}(?:試投|数|もら|獲得|打っ|打つ)|ファウルを?もら|\bFTA\b|free\s*throw\s*attempts/i, id: "fta", ja: "フリースロー試投", en: "FTA" },
  { re: /スティール.{0,4}ブロック|ブロック.{0,4}スティール|\bstocks\b/i, id: "stocks", ja: "スティール+ブロック", en: "STL+BLK" },
  { re: /シュート.{0,3}(?:試投|数|打っ)|\bFGA\b/i, id: "fga", ja: "FG試投", en: "FGA" },
  { re: /(?:得点|点).{0,4}(?:ムラ|波|ばらつき|安定)|(?:安定|ムラ|波が?あ).{0,6}(?:得点|点)|consistent\s+scor/i, id: "pts_sd", ja: "得点の振れ幅", en: "Scoring SD" },
  { re: /点(?:を)?(?:取|と)って|点取|スコアラー|scorers?/i, id: "pts", ja: "得点", en: "PTS" },
  { re: /ディフェンス(?!.?リバウンド)|守備|defen[cs]e/i, id: "drtg", ja: "出場時の守備レーティング（DRTG）", en: "On-court DRTG" },
];

const PLAYER_LOWER_BETTER = new Set(["tov", "pf36", "drtg", "matchup_fg_pct", "tov_pct", "drive_tov", "pts_sd"]);

/** 回数（ダブルダブル・20 点以上の試合）は試合ログからしか数えられない */
const COUNT_IDS = /^(?:games_|double_|triple_)/;

/** ハブに無くても今季メトリクス doc にある項目（FG% など）は読み足して使う */
function statWord(text: string): NbaAskStatWord | null {
  for (const w of [...HUB_ONLY_WORDS, ...NBA_ASK_PLAYER_STAT_WORDS]) {
    if (w.re.test(text) && !COUNT_IDS.test(w.id)) return w;
  }
  return null;
}

/** 「3P がうまい」= 成功率。数だけの「3P」と分ける */
function skillWord(text: string, w: NbaAskStatWord | null): NbaAskStatWord | null {
  if (!w || !/うまい|上手|巧い|精度|確率|入る/.test(text)) return w;
  const to = w.id === "fg3m" ? "fg3_pct" : w.id === "pts" ? "ts_pct" : null;
  return to ? (NBA_ASK_PLAYER_STAT_WORDS.find((x) => x.id === to) ?? w) : w;
}

/** 成功率は試投が少ない選手が上に来るので、試投の下限を付ける（1 試合平均） */
const PCT_VOLUME: Record<string, [string, number, string]> = {
  fg3_pct: ["fg3a", 2, "3P試投 2本以上"],
  ft_pct: ["fta", 2, "FT試投 2本以上"],
  ts_pct: ["fga", 8, "FG試投 8本以上"],
  fg_pct: ["fga", 8, "FG試投 8本以上"],
};

const UNIT_METRIC: Record<string, string> = {
  点: "pts",
  分: "min",
  リバウンド: "reb",
  アシスト: "ast",
  ブロック: "blk",
  スティール: "stl",
};

type Cond = { id: string; label: string; op: ">=" | "<=" | ">" | "<"; value: number; raw: string };

const COND_RE = /(\d+(?:\.\d+)?)\s*(%|％|点|本|回|分|リバウンド|アシスト|ブロック|スティール)?\s*(以上|以下|を?超え|超|未満|より多|より少)/g;

/** 「平均20点10リバウンド以上」= 最後の「以上」が前の数字にもかかる */
const SHARED_OP_RE =
  /(\d+(?:\.\d+)?\s*(?:点|リバウンド|アシスト|ブロック|スティール))(?=[\s・、,と]*\d+(?:\.\d+)?\s*(?:点|リバウンド|アシスト|ブロック|スティール)[\s・、,と\d.点リバウンドアシストブロックスティール]*?(以上|以下|未満))/g;

function spreadSharedOp(q: string): string {
  let out = q;
  for (let i = 0; i < 3; i++) {
    const next = out.replace(SHARED_OP_RE, (_m, num: string, op: string) => `${num}${op}`);
    if (next === out) break;
    out = next;
  }
  return out;
}

/** 「3P成功率40%以上でアテンプト5本以上」= 項目の無い「試投」は前の条件の試投 */
const ATTEMPT_OF: Record<string, string> = { fg3_pct: "fg3a", fg3m: "fg3a", ft_pct: "fta", fg_pct: "fga" };

/** 「3Pの成功率が40%以上で平均20点以上」→ [3P% >= 0.4, PTS >= 20]。読めない条件が 1 つでもあれば null */
function parseConds(question: string): { conds: Cond[]; rest: string } | null {
  const q = spreadSharedOp(question);
  const conds: Cond[] = [];
  let prevEnd = 0;
  let rest = "";
  for (const m of q.matchAll(COND_RE)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    /** 「30点以上の試合」は回数（既存のリーダー表） */
    if (/^(?:の|を?取った|をとった|とった|決めた|記録した|した)?(?:試合|ゲーム|回数)|^を?.{0,6}(?:多く|何回|何度)/.test(q.slice(end))) return null;
    const segment = q.slice(prevEnd, start);
    rest += segment;
    const unit = m[2] ?? "";
    let w = statWord(segment);
    /** 「FT80%以上」「FG50%以上」= 項目の言葉が % の前で切れている */
    if (!w && /^[%％]/.test(unit)) {
      const tail = segment.slice(-12);
      const pctId = /3P|スリー|3ポイント/i.test(tail) ? "fg3_pct" : /FT|フリースロー/i.test(tail) ? "ft_pct" : /FG|フィールドゴール/i.test(tail) ? "fg_pct" : null;
      if (pctId) w = NBA_ASK_PLAYER_STAT_WORDS.find((x) => x.id === pctId) ?? null;
    }
    if (!w && UNIT_METRIC[unit]) w = NBA_ASK_PLAYER_STAT_WORDS.find((x) => x.id === UNIT_METRIC[unit]) ?? null;
    if (!w && /アテンプト|試投|attempts?/i.test(segment)) {
      const prev = conds[conds.length - 1];
      const att = (prev && ATTEMPT_OF[prev.id]) ?? (/3P|スリー|3ポイント/i.test(q) ? "fg3a" : null);
      if (att) w = [...HUB_ONLY_WORDS, ...NBA_ASK_PLAYER_STAT_WORDS].find((x) => x.id === att) ?? null;
    }
    if (!w && unit === "本" && /3P|スリー|3ポイント/i.test(q)) {
      const shots = /^.{0,4}(?:打|試投|放)/.test(q.slice(end));
      w = NBA_ASK_PLAYER_STAT_WORDS.find((x) => x.id === (shots ? "fg3a" : "fg3m")) ?? null;
    }
    if (!w) return null;
    /** 「3P40%以上」= 成功率（「3P」だけだと成功数に読む） */
    if (/^[%％]/.test(unit) && !nbaAskIsPctStat(w.id)) {
      const pctId = /^fg3/.test(w.id) ? "fg3_pct" : /^ft/.test(w.id) ? "ft_pct" : /^fg/.test(w.id) ? "fg_pct" : null;
      const pw = pctId ? NBA_ASK_PLAYER_STAT_WORDS.find((x) => x.id === pctId) : null;
      if (pw) w = pw;
    }
    let value = Number(m[1]);
    if (nbaAskIsPctStat(w.id) && value > 1) value /= 100;
    const opWord = m[3]!;
    const op: Cond["op"] = /以上/.test(opWord) ? ">=" : /以下/.test(opWord) ? "<=" : /超|より多/.test(opWord) ? ">" : "<";
    conds.push({ id: w.id, label: w.ja, op, value, raw: m[0] });
    prevEnd = end;
  }
  rest += q.slice(prevEnd);
  return { conds, rest };
}

function condOk(v: number | undefined, c: Cond): boolean {
  if (v === undefined) return false;
  return c.op === ">=" ? v >= c.value : c.op === "<=" ? v <= c.value : c.op === ">" ? v > c.value : v < c.value;
}

function condText(c: Cond, lang: string): string {
  const v = nbaAskIsPctStat(c.id) ? `${(c.value * 100).toFixed(0)}%` : String(c.value);
  const op = T(lang, c.op === ">=" ? "以上" : c.op === "<=" ? "以下" : c.op === ">" ? "超" : "未満", c.op);
  return ja(lang) ? `${c.label} ${v}${op}` : `${c.label} ${op} ${v}`;
}

const POSITION_WORDS: ReadonlyArray<[RegExp, LeagueHubPosition, string, string]> = [
  [/ガード|\bPG\b|\bSG\b|司令塔|guards?/i, "G", "ガード", "guards"],
  [/フォワード|\bSF\b|\bPF\b(?!.*ファウル)|ウイング|ウィング|forwards?/i, "F", "フォワード", "forwards"],
  [/センター|ビッグマン|centers?/i, "C", "センター", "centers"],
];

function hubValue(p: LeagueHubPlayer, id: string): number | undefined {
  if (id === "min") return p.min;
  const v = p.m[id as LeagueHubPlayerMetric];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** ハブに無い項目は今季メトリクス doc から主力の分だけ読み足す（fieldMask で項目だけ） */
async function extraMetrics(ctx: NbaAskNbaContext, season: string, ids: string[], players: LeagueHubPlayer[]): Promise<Map<string, Record<string, number>>> {
  const out = new Map<string, Record<string, number>>();
  if (ids.length === 0 || players.length === 0) return out;
  const col = ctx.db.collection(NBA_PLAYER_SEASON_METRICS_COLLECTION).doc(season).collection(NBA_PLAYER_SEASON_METRICS_PLAYERS_SUB);
  const refs = players.map((p) => col.doc(p.playerId));
  for (let i = 0; i < refs.length; i += 200) {
    const docs = await ctx.db.getAll(...refs.slice(i, i + 200), { fieldMask: ids.map((id) => `metrics.${id}`) });
    for (const d of docs) {
      const m = (d.data()?.metrics ?? {}) as Record<string, { value?: unknown }>;
      const row: Record<string, number> = {};
      for (const id of ids) {
        const v = m[id]?.value;
        if (typeof v === "number" && Number.isFinite(v)) row[id] = nbaAskIsPctStat(id) && v > 1 ? v / 100 : v;
      }
      out.set(d.id, row);
    }
  }
  return out;
}

/** 「成功率」だけの節は前の節の項目の率（「3P試投数は多いのに成功率が低い」） */
const RATE_OF: Record<string, string> = { fg3a: "fg3_pct", fg3m: "fg3_pct", fta: "ft_pct", fga: "fg_pct", drives: "drive_fg_pct" };

/** 「3P試投数は多いのに成功率が低い選手」= 2 つの項目の順位を足して当てはまる順 */
async function playerPair(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || !PLAYER_WORD.test(q) || TEAM_WORD.test(q)) return null;
  const clauses = q.split(/けど|けれど|のに|一方で?|が、|but|while/i);
  if (clauses.length !== 2) return null;
  const w1 = statWord(clauses[0]!);
  let w2 = statWord(clauses[1]!);
  if (!w1) return null;
  if ((!w2 || w2.id === w1.id) && /成功率|確率|%/.test(clauses[1]!) && RATE_OF[w1.id]) w2 = NBA_ASK_PLAYER_STAT_WORDS.find((x) => x.id === RATE_OF[w1.id]) ?? null;
  if (!w2 || w2.id === w1.id || COUNT_IDS.test(w1.id) || COUNT_IDS.test(w2.id)) return null;
  const dirOf = (c: string) => (LOW.test(c) ? "low" : HIGH.test(c) || /うまい|上手/.test(c) ? "high" : null);
  const d1 = dirOf(clauses[0]!);
  const d2 = dirOf(clauses[1]!);
  if (!d1 || !d2) return null;
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  if (!hub || hub.players.length === 0) return null;
  const maxGp = Math.max(...hub.players.map((p) => p.gp));
  const pool0 = hub.players.filter((p) => p.gp >= Math.max(3, Math.floor(maxGp * 0.5)) && p.min >= 20);
  const ids = [w1.id, w2.id];
  const missing = ids.filter((x) => !HUB_METRICS.has(x));
  const extra = await extraMetrics(ctx, hub.seasonKey, missing, pool0);
  const val = (p: LeagueHubPlayer, x: string) => (HUB_METRICS.has(x) ? hubValue(p, x) : extra.get(p.playerId)?.[x]);
  const pool = pool0.filter((p) => ids.every((x) => val(p, x) !== undefined));
  if (pool.length < 10) return null;
  const rankOf = (x: string, dir: "high" | "low") => {
    const sorted = [...pool].sort((a, b) => (val(b, x)! - val(a, x)!) * (dir === "high" ? 1 : -1));
    return new Map(sorted.map((p, i) => [p.playerId, i + 1]));
  };
  const r1 = rankOf(w1.id, d1);
  const r2 = rankOf(w2.id, d2);
  const sorted = [...pool].sort((a, b) => r1.get(a.playerId)! + r2.get(a.playerId)! - (r1.get(b.playerId)! + r2.get(b.playerId)!));
  const top = sorted[0]!;
  const l1 = T(lang, w1.ja, w1.en);
  const l2 = T(lang, w2.ja, w2.en);
  const adj = (d: "high" | "low", id: string) => (nbaAskIsPctStat(id) ? (d === "high" ? "高い" : "低い") : d === "high" ? "多い" : "少ない");
  return boardAnswer(
    T(
      lang,
      `${hub.seasonKey} で${l1}が${adj(d1, w1.id)}のに${l2}が${adj(d2, w2.id)}選手にいちばん当てはまるのは${top.name}（${teamName(top.teamId, lang)}）。${l1} ${fmt(w1.id, val(top, w1.id)!)}・${l2} ${fmt(w2.id, val(top, w2.id)!)}。`,
      `${hub.seasonKey}: best fit for ${d1} ${l1} and ${d2} ${l2} — ${top.name} (${abbr(top.teamId)}).`
    ),
    {
      columns: [l1, l2],
      rows: sorted.slice(0, 5).map((p) => ({ label: `${p.name} ${abbr(p.teamId)}`, cells: [fmt(w1.id, val(p, w1.id)!), fmt(w2.id, val(p, w2.id)!)] })),
      note: T(lang, `今季の主力（${pool.length}人・平均20分以上）で、2つの項目の順位を足して並べています。`, `${pool.length} rotation players (20+ MPG), ranked by the sum of both ranks.`),
    }
  );
}

async function playerFilter(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || LAST_SEASON.test(q) || TWO_SEASONS_AGO.test(q)) return null;
  const parsed = parseConds(q);
  if (!parsed) return null;
  const { conds, rest } = parsed;
  const pos = POSITION_WORDS.find(([re]) => re.test(q)) ?? null;
  const rookie = /ルーキー|新人|1年目|rookies?/i.test(q);
  const bench = /ベンチ(?:から|出場|スタート)?|控え|シックスマン|6th|sixth|bench/i.test(q);
  const restWord = skillWord(rest, statWord(rest));
  /** 並べる項目: 条件の外で聞いた項目。条件の言葉しか無ければ「〜以上」の主な条件（出場時間は除く） */
  const mainCond = conds.find((c) => (c.op === ">=" || c.op === ">") && c.id !== "min") ?? conds[0];
  const condWord = mainCond ? (NBA_ASK_PLAYER_STAT_WORDS.find((w) => w.id === mainCond.id) ?? HUB_ONLY_WORDS.find((w) => w.id === mainCond.id) ?? null) : null;
  const word = restWord && conds.some((c) => c.id === restWord.id) ? condWord : (restWord ?? condWord);
  /** 「ナゲッツで2番目に点を取ってる」= チーム内の選手の順位 */
  const nthRaw = /(\d+|二|三|四|五)(?:番目|位)/.exec(q)?.[1];
  let nth = nthRaw ? (Number(nthRaw) || { 二: 2, 三: 3, 四: 4, 五: 5 }[nthRaw as "二"] || 1) : 1;
  const hubOnly = HUB_ONLY_WORDS.some((w) => w.id !== "pts" && w.id !== "drtg" && w.re.test(rest));
  const defense = word?.id === "drtg" && !/レーティング|DRTG/i.test(q);
  const skill = restWord !== statWord(rest);
  const low = LOW.test(rest);
  const teamsInText = findNbaAskTeamsInText(q);
  const conf = conferenceFilter(q, intent);
  const teamScoped =
    teamsInText.length === 1 && Boolean(word) && (PLAYER_WORD.test(q) || /で(?:一番|いちばん|最も|\d+番目|[二三四五]番目)|の次に/.test(q)) && !TEAM_WORD.test(q);
  /** 「ヨキッチの次にアシストが多い選手」= その選手の 1 つ下 */
  const afterName = /の次に/.test(q) && intent.player2 ? intent.player2 : null;

  const trigger =
    conds.length > 0 || pos || rookie || bench || hubOnly || skill || teamScoped || Boolean(afterName && word) || (defense && PLAYER_WORD.test(q)) || (low && word) || (conf && word && PLAYER_WORD.test(q));
  if (!trigger) return null;
  if (TEAM_WORD.test(q) && !PLAYER_WORD.test(q) && !pos && !rookie && !bench) return null;
  if (word && COUNT_IDS.test(word.id)) return null;
  if (!RANK_ASK.test(q) && conds.length === 0) return null;

  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  if (!hub || hub.players.length === 0) return text(T(lang, "今季の選手の集計がまだありません。", "No player data this season yet."));

  /** ルーキー / ベンチで項目なし =「一番活躍」→ ラダー順。リーグ全体の「守備がいい選手」は DPOY ラダー */
  if ((rookie || bench) && !word && conds.length === 0) return ladderAnswer(ctx, hub, rookie ? "rookies" : "sixth");
  if (defense && !teamScoped && !pos && !rookie && !bench && conds.length === 0 && !conf && !low) return ladderAnswer(ctx, hub, "dpoy");

  const id = word?.id ?? "pts";
  const label = word ? T(lang, word.ja, word.en) : T(lang, "得点", "PTS");
  const lowerBetter = PLAYER_LOWER_BETTER.has(id);
  /** 「少ない / 低い」は昇順。下ほど良い項目で「良い / 上手」も昇順。得点の振れ幅は「安定」が昇順 */
  const goodWord = /良い|いい|上手|うまい|優秀|ベスト|強い|best/.test(rest);
  const ascending =
    id === "pts_sd" ? /安定/.test(q) : low ? !(/悪い|下手|苦手|ワースト|worst/.test(rest) && lowerBetter) : lowerBetter && (goodWord || defense);

  const maxGp = Math.max(...hub.players.map((p) => p.gp));
  const minGp = Math.max(3, Math.floor(maxGp * 0.5));
  /** 少ない順・出場時の守備は出場の短い選手が並ぶので主力（平均 25 分以上）だけ */
  const minMin = (ascending && !nbaAskIsPctStat(id)) || id === "drtg" ? 25 : 0;
  const volume = PCT_VOLUME[id] ?? null;
  const rookieIds = new Set((hub.rookies ?? []).map((r) => r.playerId));
  const benchIds = new Set((hub.sixth ?? []).map((r) => r.playerId));
  const scopeJa: string[] = [];
  const scopeEn: string[] = [];
  if (teamsInText.length === 1) {
    scopeJa.push(teamName(teamsInText[0]!, lang));
    scopeEn.push(abbr(teamsInText[0]!));
  } else if (conf) {
    scopeJa.push(conf === "east" ? "東" : "西");
    scopeEn.push(conf === "east" ? "East" : "West");
  }
  if (rookie) (scopeJa.push("ルーキー"), scopeEn.push("rookies"));
  if (bench) (scopeJa.push("ベンチ出場が多い選手"), scopeEn.push("bench players"));
  if (pos) (scopeJa.push(pos[2]), scopeEn.push(pos[3]));

  const scoped = hub.players.filter((p) => {
    if (p.gp < minGp || p.min < minMin) return false;
    if (teamsInText.length === 1 && p.teamId !== teamsInText[0]) return false;
    if (teamsInText.length !== 1 && conf && nbaConferenceForTeam(p.teamId) !== conf) return false;
    if (rookie && !rookieIds.has(p.playerId)) return false;
    if (bench && !benchIds.has(p.playerId)) return false;
    if (pos && !(p.positions ?? (p.pos ? [p.pos] : [])).includes(pos[1])) return false;
    return true;
  });
  const needed = [...new Set([id, ...conds.map((c) => c.id), ...(volume ? [volume[0]] : [])])];
  const missing = needed.filter((x) => x !== "min" && !HUB_METRICS.has(x));
  const extra = await extraMetrics(ctx, hub.seasonKey, missing, scoped);
  const val = (p: LeagueHubPlayer, x: string): number | undefined => (HUB_METRICS.has(x) || x === "min" ? hubValue(p, x) : extra.get(p.playerId)?.[x]);

  /** 得点の振れ幅は点の少ない選手ほど小さいので、平均 15 点以上の選手だけで比べる */
  const pool = scoped.filter(
    (p) => val(p, id) !== undefined && (!volume || (val(p, volume[0]) ?? 0) >= volume[1]) && (id !== "pts_sd" || (val(p, "pts") ?? 0) >= 15)
  );
  const hits = pool.filter((p) => conds.every((c) => condOk(val(p, c.id), c)));
  const sorted = [...hits].sort((a, b) => (val(a, id)! - val(b, id)!) * (ascending ? 1 : -1));

  const condsJa = conds.map((c) => condText(c, "ja")).join("・");
  const condsEn = conds.map((c) => condText(c, "en")).join(", ");
  const scope = T(lang, scopeJa.join("の"), scopeEn.join(" "));
  const dir =
    id === "pts_sd"
      ? T(lang, ascending ? "安定している" : "ムラがある", ascending ? "steadiest" : "streakiest")
      : lowerBetter && (goodWord || defense) && !low
        ? T(lang, "良い", "best")
        : nbaAskIsPctStat(id)
          ? T(lang, ascending ? "低い" : "高い", ascending ? "lowest" : "highest")
          : T(lang, ascending ? "少ない" : "多い", ascending ? "fewest" : "most");
  const season = hub.seasonKey;
  const cols = [...new Set([id, ...conds.map((c) => c.id), ...(volume ? [volume[0]] : []), ...(id === "pts_sd" ? ["pts"] : [])])];
  const labelOf = (cid: string) => {
    if (cid === id) return label;
    const w = [...HUB_ONLY_WORDS, ...NBA_ASK_PLAYER_STAT_WORDS].find((x) => x.id === cid);
    return w ? T(lang, w.ja, w.en) : cid;
  };
  const note = [
    T(
      lang,
      `今季${minGp}試合以上出場${minMin ? `・平均${minMin}分以上` : ""}${volume ? `・${volume[2]}` : ""}の選手（主力${hub.players.length}人の集計）から。`,
      `Players with ${minGp}+ games${minMin ? `, ${minMin}+ MPG` : ""}.`
    ),
    id === "pf36" ? T(lang, "ファウルは出場時間の差をならすため36分あたり。", "Fouls are per 36 minutes.") : "",
    id === "drtg" ? T(lang, "出場中のチームの100ポゼッションあたりの失点（低いほど良い）。", "Team points allowed per 100 possessions while on court (lower is better).") : "",
    id === "pts_sd" ? T(lang, "試合ごとの得点の標準偏差（大きいほどムラがある）。平均15点以上の選手で比べています。", "Standard deviation of points per game, 15+ PPG players.") : "",
  ]
    .filter(Boolean)
    .join(" ");

  const who = (p: LeagueHubPlayer) => (teamsInText.length === 1 ? p.name : `${p.name}（${teamName(p.teamId, lang)}）`);
  if (sorted.length === 0) {
    /** 条件に届かないときは、いちばん近い選手 */
    const c0 = conds[0];
    const near = c0 ? [...pool].sort((a, b) => ((val(b, c0.id) ?? -Infinity) - (val(a, c0.id) ?? -Infinity)) * (c0.op === "<=" || c0.op === "<" ? -1 : 1))[0] : null;
    return text(
      T(
        lang,
        `${season} で${scope ? `${scope}の中に` : ""}${condsJa ? `${condsJa}の` : ""}選手はいません。${near && c0 ? `いちばん近いのは${who(near)}の${c0.label} ${fmt(c0.id, val(near, c0.id)!)}。` : ""}${note}`,
        `No ${scope || "players"}${condsEn ? ` with ${condsEn}` : ""} in ${season}.${near && c0 ? ` Closest: ${near.name} ${fmt(c0.id, val(near, c0.id)!)}.` : ""}`
      )
    );
  }
  const top = sorted[0]!;
  const next = sorted.slice(1, 3).map((p) => `${p.name} ${fmt(id, val(p, id)!)}`);
  if (afterName) {
    const found = pickNbaAskPlayer(await loadRosters(ctx.db), afterName, null, null);
    const at = found.kind === "one" ? sorted.findIndex((p) => p.playerId === found.hit.playerId) : -1;
    if (at >= 0) nth = at + 2;
  }
  if (nth > 1 && !conds.length) {
    const p = sorted[nth - 1];
    if (!p) return text(T(lang, `${scope}で${label}の${nth}番目にあたる選手はいません。`, `No #${nth} in ${label}.`));
    return boardAnswer(
      T(
        lang,
        `${season} の${scope ? `${scope}で` : ""}${label}が${nth}番目に${dir}のは${who(p)}・${fmt(id, val(p, id)!)}。1番目は${top.name} ${fmt(id, val(top, id)!)}。`,
        `${season} ${scope ? `${scope}, ` : ""}#${nth} in ${label}: ${p.name} ${fmt(id, val(p, id)!)}. #1: ${top.name}.`
      ),
      {
        columns: [label, T(lang, "試合", "GP")],
        rows: sorted.slice(0, Math.max(5, nth)).map((x, i) => ({ label: `${i + 1}. ${x.name} ${abbr(x.teamId)}`, cells: [fmt(id, val(x, id)!), String(x.gp)] })),
        note,
      }
    );
  }
  const head = conds.length
    ? T(
        lang,
        `${season} で${scope ? `${scope}のうち` : ""}${condsJa}の選手は${sorted.length}人。${label}がいちばん${dir}のは${who(top)}・${fmt(id, val(top, id)!)}。`,
        `${season}: ${sorted.length} ${scope || "players"} with ${condsEn}. ${dir} ${label}: ${top.name} (${abbr(top.teamId)}) ${fmt(id, val(top, id)!)}.`
      )
    : T(
        lang,
        `${season} の${scope ? `${scope}で` : ""}${id === "pts_sd" ? "得点" : label}がいちばん${dir}のは${who(top)}・${fmt(id, val(top, id)!)}。${next.length ? `続いて${next.join("・")}。` : ""}`,
        `${season} ${scope ? `${scope}, ` : ""}${dir} ${label}: ${top.name} (${abbr(top.teamId)}) ${fmt(id, val(top, id)!)}.${next.length ? ` Next: ${next.join(", ")}.` : ""}`
      );
  return boardAnswer(head, {
    columns: [...cols.map(labelOf), T(lang, "試合", "GP")],
    rows: sorted.slice(0, conds.length ? 10 : 5).map((p) => ({
      label: `${p.name} ${abbr(p.teamId)}`,
      cells: [...cols.map((c) => (val(p, c) === undefined ? "—" : fmt(c, val(p, c)!))), String(p.gp)],
    })),
    note,
  });
}

const LADDER_TEXT = {
  rookies: { scopeJa: "ルーキー", scopeEn: "rookie", award: "新人王", awardEn: "Rookie", noteJa: "Game Score・PIE・出場時間の合成。", noteEn: "Blend of Game Score, PIE and minutes." },
  sixth: { scopeJa: "ベンチ出場が多い選手", scopeEn: "bench player", award: "シックスマン賞", awardEn: "Sixth Man", noteJa: "先発より途中出場が多い選手。ベンチ出場時の働きで並べています。", noteEn: "Players who come off the bench more than they start." },
  dpoy: { scopeJa: "選手", scopeEn: "defender", award: "最優秀守備選手", awardEn: "DPOY", noteJa: "出場時の守備レーティング・スティール+ブロック・ディフレクション+コンテスト・マークした相手のFG%・DREB の合成。", noteEn: "Blend of on-court DRTG, stocks, deflections/contests, matchup FG% and DREB." },
} as const;

function ladderAnswer(ctx: NbaAskNbaContext, hub: NbaLeagueHubDoc, kind: "rookies" | "sixth" | "dpoy"): NbaAskAnswer {
  const lang = ctx.language;
  const rows = (kind === "rookies" ? hub.rookies : hub[kind]) ?? [];
  const t = LADDER_TEXT[kind];
  const title = T(lang, t.scopeJa, t.scopeEn);
  if (rows.length === 0) return text(T(lang, `${t.award}ラダーはまだ出ていません。`, `No ${t.awardEn} ladder yet.`));
  const [a, b] = rows;
  const line = (r: (typeof rows)[number]) =>
    kind === "dpoy"
      ? T(lang, `${r.name}（${teamName(r.teamId, lang)}・${(r.stl ?? 0).toFixed(1)}スティール ${(r.blk ?? 0).toFixed(1)}ブロック${typeof r.drtg === "number" ? `・出場時DRTG ${r.drtg.toFixed(1)}` : ""}）`, `${r.name} (${abbr(r.teamId)})`)
      : T(lang, `${r.name}（${teamName(r.teamId, lang)}・${r.pts.toFixed(1)}点 ${r.reb.toFixed(1)}リバウンド ${r.ast.toFixed(1)}アシスト）`, `${r.name} (${abbr(r.teamId)}, ${r.pts.toFixed(1)}/${r.reb.toFixed(1)}/${r.ast.toFixed(1)})`);
  const lead = kind === "dpoy" ? T(lang, "守備がいちばん良い", "best defender") : T(lang, "いちばん活躍している", "top");
  const out = boardAnswer(
    T(
      lang,
      `${hub.seasonKey} の${title}で${lead}のは${line(a!)}。${t.award}ラダー（UNITERZ の試算）の1位です。${b ? `2位は${b.name}。` : ""}`,
      `${hub.seasonKey} ${lead} ${title}: ${line(a!)} — #1 on the UNITERZ ${t.awardEn} ladder.${b ? ` #2: ${b.name}.` : ""}`
    ),
    kind === "dpoy"
      ? {
          columns: T(lang, "スティール|ブロック|DRTG", "STL|BLK|DRTG").split("|"),
          rows: rows.slice(0, 5).map((r, i) => ({ label: `${i + 1}. ${r.name} ${abbr(r.teamId)}`, cells: [(r.stl ?? 0).toFixed(1), (r.blk ?? 0).toFixed(1), typeof r.drtg === "number" ? r.drtg.toFixed(1) : "—"] })),
          note: T(lang, t.noteJa, t.noteEn),
        }
      : {
          columns: T(lang, "得点|リバウンド|アシスト", "PTS|REB|AST").split("|"),
          rows: rows.slice(0, 5).map((r, i) => ({ label: `${i + 1}. ${r.name} ${abbr(r.teamId)}`, cells: [r.pts.toFixed(1), r.reb.toFixed(1), r.ast.toFixed(1)] })),
          note: T(lang, t.noteJa, t.noteEn),
        }
  );
  return { ...out, view: { kind: "ladder", id: kind } };
}

// ---------------------------------------------------------------------------
// 選手 1 人: 試合の条件（勝ち負け・N 点以上）
// ---------------------------------------------------------------------------

const GAME_STATS: ReadonlyArray<[RegExp, "pts" | "reb" | "ast" | "fg3m" | "blk" | "stl", string, string]> = [
  [/リバウンド/, "reb", "リバウンド", "REB"],
  [/アシスト/, "ast", "アシスト", "AST"],
  [/(?:3P|スリー|3ポイント)/i, "fg3m", "3P成功", "3PM"],
  [/ブロック/, "blk", "ブロック", "BLK"],
  [/スティール/, "stl", "スティール", "STL"],
  [/点|得点/, "pts", "得点", "PTS"],
];

async function playerGameCondition(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  const won = /(?:勝った|勝ち|勝利した?|勝つ)(?:試合|とき|時|ゲーム)/.test(q);
  const lost = /(?:負けた|負け|敗れた|敗戦|負ける)(?:試合|とき|時|ゲーム)/.test(q);
  const threshold = /(\d+)\s*(点|本|リバウンド|アシスト|ブロック|スティール)?\s*以上.{0,6}(?:試合|とき|時|ゲーム)/.exec(q);
  const dd = /(トリプル.?ダブル|ダブル.?ダブル)(?:を?した|を?記録した|の)?(?:試合|とき|時|ゲーム)/.exec(q);
  const askRecord = /成績|勝敗|勝率|戦績|何勝|勝って|勝てて|record/.test(q);
  const askCount = !askRecord && (/何試合|何回|何度|回数|how\s+many/i.test(q) || /以上の(?:試合|ゲーム)(?:は|って)?[？?]?$/.test(q.trim()));
  /** 「何試合連続で20点以上」 */
  /** 「何試合連続で3P成功してる」= 1 本以上の連続 */
  const streakTh = /連続/.test(q)
    ? /(\d+)\s*(点|本|リバウンド|アシスト|ブロック|スティール)?\s*以上/.exec(q) ?? /()(3P|スリー|3ポイント|ブロック|スティール)を?.{0,3}(?:成功|決め|沈め|記録)/i.exec(q)
    : null;
  /** 「レブロンの連戦2日目の成績」= 自分も前日に出た試合 */
  const b2b = /連戦|\bB2B\b|バック.?トゥ.?バック|back.?to.?back/i.test(q) && !/チーム/.test(q);
  /** 「ヨキッチがいるときといないとき」はコート上のオン / オフ */
  const absent =
    /(?:出|出場し|試合に出)(?:なかった|ていない|てない|ない)(?:試合|とき|時)|欠場(?:した)?(?:試合|とき|時|中)|休んだ(?:試合|とき)|いない(?:試合|とき)|不在/.test(q) &&
    !/いる(?:とき|時)|コート/.test(q);
  const best = /ベスト.?ゲーム|ベストの試合|一番(?:良|よ)かった試合|最高の試合|一番活躍した試合|best\s+game/i.test(q);
  if (!won && !lost && !((threshold || dd) && (askRecord || askCount)) && !absent && !best && !streakTh && !(b2b && intent.player)) return null;
  /** AI が「レブロンが休んだ試合のレイカーズ」の選手を落とすことがある → あだ名の表から拾う */
  const name = intent.player ?? nbaAskNicknamePlayer(q);
  if (!name) return null;

  const found = pickNbaAskPlayer(await loadRosters(ctx.db), name, intent.player ? intent.player_written : null, null);
  if (found.kind !== "one") return null;
  const hit = found.hit;
  const logs = (await loadPlayerGameLogsSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY, hit.playerId)).gameLogs.filter((g) => g.min > 0);
  /** 質問のチームと今の所属が違う（移籍など）ときは、所属チームで答えると断る */
  const askedTeam = findNbaAskTeamsInText(q)[0];
  const teamNote =
    askedTeam && askedTeam !== hit.teamId
      ? T(lang, `${hit.name} は今季${teamName(hit.teamId, lang)}の選手なので、${teamName(hit.teamId, lang)}の試合で答えます。`, `${hit.name} plays for ${abbr(hit.teamId)} this season. `)
      : "";

  if (absent) {
    const team = (await loadTeamGameLogDetail(ctx.db, CURRENT_NBA_SEASON_KEY, hit.teamId)).detail;
    if (!team || team.games.length === 0) return text(T(lang, `${teamName(hit.teamId, lang)}の今季の試合記録はまだありません。`, `No ${abbr(hit.teamId)} games yet.`));
    const played = new Set(logs.flatMap((g) => (/^\d+$/.test(g.gameId) ? [nbaGameDocIdFromBdlId(Number(g.gameId))] : [])));
    const playedKey = new Set(logs.map((g) => `${g.dateLabel}|${g.oppTeamId}`));
    const out = team.games.filter((g) => !(g.gameId ? played.has(g.gameId) : playedKey.has(`${g.dateLabel}|${g.oppTeamId}`)));
    const inn = team.games.filter((g) => !out.includes(g));
    const rec = (list: typeof team.games) => ({ wins: list.filter((g) => g.result === "W").length, losses: list.filter((g) => g.result === "L").length });
    const margin = (list: typeof team.games) => (list.length ? list.reduce((s, g) => s + g.teamScore - g.oppScore, 0) / list.length : 0);
    const a = rec(out);
    const b = rec(inn);
    const tn = teamName(hit.teamId, lang);
    return boardAnswer(
      teamNote +
      (out.length
        ? T(
            lang,
            `${hit.name} が出なかった試合（今季${out.length}試合）の${tn}は ${wl(a, lang)}。出た試合は ${wl(b, lang)}（平均得失点差 ${s1(margin(out))} と ${s1(margin(inn))}）。`,
            `${abbr(hit.teamId)} without ${hit.name} (${out.length} games): ${wl(a, lang)}; with him: ${wl(b, lang)}.`
          )
        : T(lang, `${hit.name} は今季${tn}の全${team.games.length}試合に出ています（${wl(b, lang)}）。`, `${hit.name} has played all ${team.games.length} ${abbr(hit.teamId)} games.`)),
      {
        columns: T(lang, "試合|勝敗|得失点差", "G|W-L|Diff").split("|"),
        rows: [
          { label: T(lang, "出なかった", "Without"), cells: [String(out.length), wl(a, lang), out.length ? s1(margin(out)) : "—"] },
          { label: T(lang, "出た", "With"), cells: [String(inn.length), wl(b, lang), inn.length ? s1(margin(inn)) : "—"] },
        ],
        note: T(lang, "出場時間が 0 の試合も「出なかった」に数えます。", "DNPs count as without."),
      }
    );
  }

  if (logs.length === 0) return text(T(lang, `${hit.name} は今季まだ出場がありません。`, `${hit.name} has not played this season.`));

  if (best) {
    /** Hollinger Game Score */
    const gs = (g: (typeof logs)[number]) =>
      g.pts + 0.4 * g.fgm - 0.7 * g.fga - 0.4 * (g.fta - g.ftm) + 0.7 * (g.oreb ?? 0) + 0.3 * (g.dreb ?? g.reb - (g.oreb ?? 0)) + g.stl + 0.7 * g.ast + 0.7 * g.blk - 0.4 * (g.pf ?? 0) - g.tov;
    const sorted = [...logs].sort((x, y) => gs(y) - gs(x));
    const g = sorted[0]!;
    const vs = (x: (typeof logs)[number]) => T(lang, `${x.dateLabel} ${x.home ? "vs" : "@"} ${teamName(x.oppTeamId, lang)}`, `${x.dateLabel} ${x.home ? "vs" : "@"} ${x.oppAbbr}`);
    return boardAnswer(
      T(
        lang,
        `${hit.name} の今季のベストゲームは${vs(g)}（${g.result === "W" ? "勝ち" : "負け"}）。${g.pts}点 ${g.reb}リバウンド ${g.ast}アシスト・FG ${g.fgm}/${g.fga}（Game Score ${gs(g).toFixed(1)}）。`,
        `${hit.name}'s best game: ${vs(g)} (${g.result}) — ${g.pts}/${g.reb}/${g.ast}, FG ${g.fgm}/${g.fga} (Game Score ${gs(g).toFixed(1)}).`
      ),
      {
        columns: T(lang, "得点|リバウンド|アシスト|GmSc", "PTS|REB|AST|GmSc").split("|"),
        rows: sorted.slice(0, 5).map((x) => ({ label: vs(x), cells: [String(x.pts), String(x.reb), String(x.ast), gs(x).toFixed(1)] })),
        note: T(lang, `今季${logs.length}試合から Game Score（得点・効率・リバウンド・アシスト等をまとめた1試合の評価）で選んでいます。`, `Picked by Game Score from ${logs.length} games.`),
      }
    );
  }
  const avg = (list: typeof logs, k: "pts" | "reb" | "ast" | "fg3m" | "stl" | "blk" | "min") => (list.length ? list.reduce((s, g) => s + g[k], 0) / list.length : 0);
  const fg = (list: typeof logs) => {
    const a = list.reduce((s, g) => s + g.fga, 0);
    return a ? list.reduce((s, g) => s + g.fgm, 0) / a : null;
  };

  if (streakTh) {
    const stat =
      GAME_STATS.find(([re]) => re.test(streakTh[2] ?? "") || re.test(q.slice(Math.max(0, streakTh.index - 8), streakTh.index + streakTh[0].length))) ?? GAME_STATS[GAME_STATS.length - 1]!;
    const n = Number(streakTh[1]) || 1;
    const ok = (g: (typeof logs)[number]) => g[stat[1]] >= n;
    /** 試合ログは新しい順 */
    let current = 0;
    while (current < logs.length && ok(logs[current]!)) current += 1;
    let longest = 0;
    let run = 0;
    for (const g of logs) {
      run = ok(g) ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    const condJa = stat[1] === "pts" ? `${n}点以上` : n === 1 && !streakTh[1] ? `${stat[2]}あり` : `${stat[2]} ${n}以上`;
    const vs = (x: (typeof logs)[number]) => T(lang, `${x.dateLabel} ${x.home ? "vs" : "@"} ${teamName(x.oppTeamId, lang)}`, `${x.dateLabel} ${x.home ? "vs" : "@"} ${x.oppAbbr}`);
    return boardAnswer(
      T(
        lang,
        current > 0
          ? `${hit.name} はいま${current}試合連続で${condJa}（今季の最長は${longest}試合）。`
          : `${hit.name} は前の試合で${condJa}に届かず、いまは連続が止まっています（今季の最長は${longest}試合）。`,
        `${hit.name}: ${current} straight games with ${n}+ ${stat[3]} (season best ${longest}).`
      ),
      {
        columns: T(lang, `${stat[2]}|${condJa}`, `${stat[3]}|${n}+`).split("|"),
        rows: logs.slice(0, 10).map((g) => ({ label: vs(g), cells: [String(g[stat[1]]), ok(g) ? "○" : "×"] })),
        note: T(lang, `今季${logs.length}試合（出場した試合だけ・新しい順）。`, `${logs.length} games this season (newest first).`),
      }
    );
  }

  if (b2b) {
    const days = logs.map((g) => leagueHubLogDayMs(g.dateLabel, CURRENT_NBA_SEASON_KEY));
    const played = new Set(days.filter((d): d is number => d !== null));
    const second = logs.filter((_, i) => days[i] !== null && played.has(days[i]! - 86_400_000));
    const others = logs.filter((g) => !second.includes(g));
    const line = (list: typeof logs) =>
      list.length
        ? [avg(list, "pts").toFixed(1), avg(list, "reb").toFixed(1), avg(list, "ast").toFixed(1), fg(list) === null ? "—" : pct1(fg(list)!)]
        : ["—", "—", "—", "—"];
    if (second.length === 0) {
      return text(T(lang, `${hit.name} は今季まだ連戦の2日目に出た試合がありません（${logs.length}試合）。`, `${hit.name} has not played the 2nd night of a back-to-back yet.`));
    }
    return boardAnswer(
      T(
        lang,
        `${hit.name} の連戦2日目（${second.length}試合）は平均 ${avg(second, "pts").toFixed(1)}点、それ以外（${others.length}試合）は ${avg(others, "pts").toFixed(1)}点（差 ${s1(avg(second, "pts") - avg(others, "pts"))}）。2日目のチームは${wl({ wins: second.filter((g) => g.result === "W").length, losses: second.filter((g) => g.result === "L").length }, lang)}。`,
        `${hit.name} on 2nd night of back-to-backs (${second.length}): ${avg(second, "pts").toFixed(1)} PTS vs ${avg(others, "pts").toFixed(1)} otherwise.`
      ),
      {
        columns: T(lang, "得点|リバウンド|アシスト|FG%", "PTS|REB|AST|FG%").split("|"),
        rows: [
          { label: T(lang, `2日目 ${second.length}`, `2nd night ${second.length}`), cells: line(second) },
          { label: T(lang, `それ以外 ${others.length}`, `Other ${others.length}`), cells: line(others) },
        ],
        note: T(lang, "2日目 = 自分も前日（米国東部の日付）に出た試合。", "2nd night = he also played the day before (US Eastern)."),
      }
    );
  }


  if ((threshold || dd) && (askRecord || askCount)) {
    const tens = (g: (typeof logs)[number]) => [g.pts, g.reb, g.ast, g.stl, g.blk].filter((v) => v >= 10).length;
    let test: (g: (typeof logs)[number]) => boolean;
    let condJa: string;
    let condEn: string;
    if (dd) {
      const triple = /トリプル/.test(dd[1]!);
      test = (g) => tens(g) >= (triple ? 3 : 2);
      condJa = triple ? "トリプルダブル" : "ダブルダブル";
      condEn = triple ? "triple-double" : "double-double";
    } else {
      const th = threshold!;
      const stat =
        GAME_STATS.find(([re]) => re.test(th[2] ?? "") || re.test(q.slice(Math.max(0, th.index - 8), th.index + th[0].length))) ?? GAME_STATS[GAME_STATS.length - 1]!;
      const n = Number(th[1]);
      test = (g) => g[stat[1]] >= n;
      condJa = stat[1] === "pts" ? `${n}点以上` : `${stat[2]} ${n}以上`;
      condEn = `${n}+ ${stat[3]}`;
    }
    const inGames = logs.filter(test);
    const others = logs.filter((g) => !test(g));
    if (askCount) {
      const vs = (x: (typeof logs)[number]) => T(lang, `${x.dateLabel} ${x.home ? "vs" : "@"} ${teamName(x.oppTeamId, lang)}`, `${x.dateLabel} ${x.home ? "vs" : "@"} ${x.oppAbbr}`);
      return boardAnswer(
        inGames.length
          ? T(
              lang,
              `${hit.name} が今季${condJa}だった試合は${inGames.length}試合（出場${logs.length}試合中）。${inGames.length <= 3 ? inGames.map((g) => `${vs(g)} ${g.pts}点 ${g.reb}リバウンド ${g.ast}アシスト`).join("・") + "。" : ""}`,
              `${hit.name}: ${inGames.length} ${condEn} games (of ${logs.length}).`
            )
          : T(lang, `${hit.name} は今季まだ${condJa}の試合がありません（${logs.length}試合）。`, `${hit.name} has no ${condEn} game yet.`),
        {
          columns: T(lang, "得点|リバウンド|アシスト|勝敗", "PTS|REB|AST|W/L").split("|"),
          rows: inGames.slice(0, 10).map((g) => ({ label: vs(g), cells: [String(g.pts), String(g.reb), String(g.ast), ja(lang) ? (g.result === "W" ? "勝" : "敗") : g.result] })),
          ...(inGames.length > 10 ? { note: T(lang, `ほか ${inGames.length - 10}試合`, `+${inGames.length - 10} more`) } : {}),
        }
      );
    }
    const rec = (list: typeof logs) => ({ wins: list.filter((g) => g.result === "W").length, losses: list.filter((g) => g.result === "L").length });
    const a = rec(inGames);
    const b = rec(others);
    const team = teamName(hit.teamId, lang);
    return boardAnswer(
      teamNote +
        (inGames.length
          ? T(
              lang,
              `${hit.name} が${condJa}の試合（今季${inGames.length}試合）は${team} ${wl(a, lang)}（勝率 ${pct1(winPct(a) ?? 0)}）。それ以外の試合は ${wl(b, lang)}${others.length ? `（勝率 ${pct1(winPct(b) ?? 0)}）` : ""}。`,
              `${hit.name} ${condEn} games (${inGames.length}): ${abbr(hit.teamId)} ${wl(a, lang)}. Otherwise ${wl(b, lang)}.`
            )
          : T(lang, `${hit.name} は今季まだ${condJa}の試合がありません（${logs.length}試合）。`, `${hit.name} has no ${condEn} game yet.`)),
      {
        columns: T(lang, "試合|勝敗|得点", "G|W-L|PTS").split("|"),
        rows: [
          { label: T(lang, condJa, condEn), cells: [String(inGames.length), wl(a, lang), inGames.length ? avg(inGames, "pts").toFixed(1) : "—"] },
          { label: T(lang, "それ以外", "Other"), cells: [String(others.length), wl(b, lang), others.length ? avg(others, "pts").toFixed(1) : "—"] },
        ],
      }
    );
  }

  const w = logs.filter((g) => g.result === "W");
  const l = logs.filter((g) => g.result === "L");
  const asked = GAME_STATS.find(([re]) => re.test(q.replace(/\d+\s*点/, ""))) ?? GAME_STATS[GAME_STATS.length - 1]!;
  const [mine, other, mineJa, otherJa] = lost ? [l, w, "負けた試合", "勝った試合"] : [w, l, "勝った試合", "負けた試合"];
  if (mine.length === 0) return text(T(lang, `${hit.name} は今季まだ${mineJa}がありません（${logs.length}試合）。`, `${hit.name} has no ${lost ? "losses" : "wins"} yet.`));
  const k = asked[1];
  const row = (labelJa: string, labelEn: string, list: typeof logs) => {
    const f = fg(list);
    return {
      label: T(lang, `${labelJa} ${list.length}`, `${labelEn} ${list.length}`),
      cells: [avg(list, "pts").toFixed(1), avg(list, "reb").toFixed(1), avg(list, "ast").toFixed(1), f === null ? "—" : pct1(f)],
    };
  };
  return boardAnswer(
    T(
      lang,
      `${hit.name} の${mineJa}（${mine.length}試合）の${asked[2]}は平均 ${avg(mine, k).toFixed(1)}${other.length ? `、${otherJa}（${other.length}試合）は ${avg(other, k).toFixed(1)}（差 ${s1(avg(mine, k) - avg(other, k))}）` : ""}。`,
      `${hit.name} in ${lost ? "losses" : "wins"} (${mine.length}): ${avg(mine, k).toFixed(1)} ${asked[3]}${other.length ? `; in ${lost ? "wins" : "losses"} (${other.length}): ${avg(other, k).toFixed(1)}` : ""}.`
    ),
    {
      columns: T(lang, "得点|リバウンド|アシスト|FG%", "PTS|REB|AST|FG%").split("|"),
      rows: [row("勝ち", "W", w), row("負け", "L", l)].filter((r) => !r.label.endsWith(" 0")),
    }
  );
}

// ---------------------------------------------------------------------------
// チーム
// ---------------------------------------------------------------------------

const GOOD = /いい|良い|よい|強い|高い|多い|上手|優秀|得意|速い|good|strong|great/i;
const BAD = /悪い|弱い|低い|少ない|下手|苦手|ひどい|ダメ|だめ|遅い|bad|weak|poor/i;

type TeamRow = NbaLeagueTeamStatRow;

const WIN_WORD: NbaAskStatWord = { re: /勝率/, id: "winPct", ja: "勝率", en: "Win %" };

/** 「一番 A」と「一番 B」を両方（速い / 遅い、多い / 少ない） */
function bothEnds(q: string): boolean {
  return (
    (/速い/.test(q) && /遅い/.test(q)) ||
    (/多い/.test(q) && /少な/.test(q)) ||
    (/高い/.test(q) && /低い/.test(q)) ||
    (/(?:1位|トップ|上位)/.test(q) && /(?:最下位|ワースト|下位)/.test(q)) ||
    /両端|上と下|best\s+and\s+worst/i.test(q) ||
    (q.match(/一番|いちばん|最も/g) ?? []).length >= 2
  );
}

async function teamRanking(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || LAST_SEASON.test(q) || TWO_SEASONS_AGO.test(q)) return null;
  if (!TEAM_WORD.test(q) && !/どこ/.test(q)) return null;
  if (findNbaAskTeamsInText(q).length > 0) return null;
  /** 「東のチームで得点が一番多い選手」は選手の順位 */
  if (PLAYER_WORD.test(q) && /(?:チーム|どこ)(?:で|の中で|のうち)/.test(q)) return null;

  /** 「オフェンスはいいけど守備が悪い」 */
  const clauses = q.split(/けど|けれど|けれども|だけど|のに|一方で?|が、|but|while/i);
  const parts = clauses.flatMap((c) => {
    const w = NBA_ASK_TEAM_STAT_WORDS.find((x) => x.re.test(c)) ?? (/勝って|勝てて|勝率|成績|勝ち越|負け越|5割/.test(c) ? WIN_WORD : null);
    if (!w) return [];
    if (w.id === "winPct") {
      const good = !/負け越|勝てて(?:い)?ない|負けて|5割(?:以下|未満|を切)|低い|悪い/.test(c);
      return [{ w: WIN_WORD, good, adj: good ? "高い" : "低い" }];
    }
    /** 「多い / 高い」は値の大小。良い悪いは項目しだい（失点が多い = 悪い） */
    const valueHigh = /多い|高い|速い|many|high/i.test(c);
    const valueLow = /少な|低い|遅い|few|low/i.test(c);
    const adjOf = (re: RegExp, fallback: string) => re.exec(c)?.[0] ?? fallback;
    if (valueHigh || valueLow) {
      return [{ w, good: valueHigh === higherIsBetter(w.id), adj: valueHigh ? adjOf(/多い|高い|速い/, "高い") : adjOf(/少ない|低い|遅い/, "低い") }];
    }
    const good = GOOD.test(c) && !BAD.test(c);
    const bad = BAD.test(c);
    return good || bad ? [{ w, good, adj: good ? "良い" : "悪い" }] : [];
  });
  const conf = conferenceFilter(q, intent);
  const both = bothEnds(q);
  const twoSided = parts.length >= 2 && parts[0]!.w.id !== parts[1]!.w.id;
  /** 順位の帯: プレーオフ圏（1〜6位）・プレーイン圏（7〜10位）・圏外（11位〜） */
  const zone = /プレーオフ圏外|プレーイン圏外|圏外|out\s+of\s+(?:the\s+)?playoff/i.test(q)
    ? "out"
    : /プレーイン圏|play.?in/i.test(q)
      ? "playin"
      : /プレーオフ圏|playoff\s+(?:spot|position)/i.test(q)
        ? "in"
        : null;
  if (!twoSided && !both && !conf && !zone) return null;
  if (!twoSided && conf && /相手|vs|対[東西]|[東西]に(?:強|弱|勝|負)/i.test(q)) return null;

  const season = CURRENT_NBA_SEASON_KEY;
  const { rows: all, clean } = await teamSeasonRows(ctx.db, season);
  let zoneIds: Set<string> | null = null;
  if (zone) {
    const board = readStandingsBoard((await ctx.db.collection(NBA_CONFERENCE_STANDINGS_COLLECTION).doc(season).get()).data());
    if (!board) return text(T(lang, "順位表のデータがまだありません。", "Standings are not ready yet."));
    const inZone = (rank: number) => (zone === "out" ? rank >= 11 : zone === "playin" ? rank >= 7 && rank <= 10 : rank <= 6);
    zoneIds = new Set([...board.east, ...board.west].filter((r) => inZone(r.rank)).map((r) => r.teamId));
  }
  const rows = all.filter((r) => (!conf || nbaConferenceForTeam(r.teamId) === conf) && (!zoneIds || zoneIds.has(r.teamId)));
  const zoneJa = zone === "out" ? "プレーオフ圏外（11位以下）" : zone === "playin" ? "プレーイン圏（7〜10位）" : zone === "in" ? "プレーオフ圏（6位以内）" : "";
  const confName = [conf ? T(lang, conf === "east" ? "東" : "西", conf === "east" ? "East" : "West") : "", zone ? T(lang, zoneJa, zone) : ""].filter(Boolean).join(T(lang, "の", " "));
  const ranked = (id: string) =>
    rows.filter((r) => hasTeamValue(r, id, clean)).sort((a, b) => (rowValue(b, id)! - rowValue(a, id)!) * (higherIsBetter(id) ? 1 : -1));
  const lbl = (w: NbaAskStatWord) => T(lang, w.ja, w.en);

  if (twoSided) {
    const [a, b] = [parts[0]!, parts[1]!];
    const ra = ranked(a.w.id);
    const rb = ranked(b.w.id);
    const n = Math.min(ra.length, rb.length);
    if (n === 0) return null;
    const rankIn = (list: TeamRow[], teamId: string) => list.findIndex((r) => r.teamId === teamId) + 1;
    const score = (teamId: string) => {
      const x = rankIn(ra, teamId);
      const y = rankIn(rb, teamId);
      if (!x || !y) return Infinity;
      return (a.good ? x : n + 1 - x) + (b.good ? y : n + 1 - y);
    };
    const sorted = ra.filter((r) => rankIn(rb, r.teamId) > 0).sort((x, y) => score(x.teamId) - score(y.teamId));
    const top = sorted[0]!;
    const desc = (p: typeof a, list: TeamRow[], r: TeamRow) => `${lbl(p.w)} ${fmt(p.w.id, rowValue(r, p.w.id)!)}（${rankIn(list, r.teamId)}位）`;
    return boardAnswer(
      T(
        lang,
        `${season} で${confName ? `${confName}のうち` : ""}${lbl(a.w)}が${a.adj.replace(/い$/, "くて")}${lbl(b.w)}が${b.adj}チームにいちばん当てはまるのは${teamName(top.teamId, lang)}。${desc(a, ra, top)}・${desc(b, rb, top)}。`,
        `${season}: best fit for ${a.good ? "good" : "poor"} ${lbl(a.w)} and ${b.good ? "good" : "poor"} ${lbl(b.w)} — ${abbr(top.teamId)}.`
      ),
      {
        columns: [lbl(a.w), T(lang, "順位", "#"), lbl(b.w), T(lang, "順位", "#")],
        rows: sorted.slice(0, 5).map((r) => ({
          label: teamName(r.teamId, lang),
          cells: [fmt(a.w.id, rowValue(r, a.w.id)!), String(rankIn(ra, r.teamId)), fmt(b.w.id, rowValue(r, b.w.id)!), String(rankIn(rb, r.teamId))],
        })),
        note: T(lang, `順位は${rows.length}チーム中（1位 = いちばん良い）。DRTG は低いほど良い守備です。`, `Ranks out of ${rows.length} (1 = best).`),
      }
    );
  }

  const w = NBA_ASK_TEAM_STAT_WORDS.find((x) => x.re.test(q)) ?? (/勝率|成績/.test(q) ? { re: /勝率/, id: "winPct", ja: "勝率", en: "Win %" } : null);
  if (!w) return null;
  const list = ranked(w.id);
  if (list.length === 0) return null;
  const v = (r: TeamRow) => fmt(w.id, rowValue(r, w.id)!);
  /** 並びは「良い順」。速い / 多い / 高いが良いとは限らないので値の大小で言う */
  const byValue = [...list].sort((a, b) => rowValue(b, w.id)! - rowValue(a, w.id)!);
  const label = lbl(w);
  const scope = confName ? T(lang, `${confName}のチームで`, `${confName}: `) : "";
  if (both) {
    const hi = byValue[0]!;
    const lo = byValue[byValue.length - 1]!;
    return boardAnswer(
      T(
        lang,
        `${season} の${scope}${label}がいちばん高いのは${teamName(hi.teamId, lang)}（${v(hi)}）、いちばん低いのは${teamName(lo.teamId, lang)}（${v(lo)}）。`,
        `${season} ${scope}highest ${label}: ${abbr(hi.teamId)} (${v(hi)}); lowest: ${abbr(lo.teamId)} (${v(lo)}).`
      ),
      {
        columns: [label],
        rows: [...byValue.slice(0, 3), ...byValue.slice(-3)].map((r) => ({ label: `${byValue.indexOf(r) + 1}. ${teamName(r.teamId, lang)}`, cells: [v(r)] })),
      }
    );
  }
  const low = LOW.test(q) && !HIGH.test(q.replace(LOW, ""));
  /** 「守備が良い」は DRTG が低い順 = 良い順。「低い / 少ない」は値の小さい順 */
  const valueWords = /高い|低い|多い|少な|速い|遅い/.test(q);
  const sorted = valueWords ? (low ? [...byValue].reverse() : byValue) : /悪い|弱い|ワースト|worst/.test(q) ? [...list].reverse() : list;
  const top = sorted[0]!;
  return boardAnswer(
    T(
      lang,
      `${season} の${scope}${label}${valueWords ? `がいちばん${low ? "低いのは" : "高いのは"}` : /悪い|弱い|ワースト/.test(q) ? "がいちばん悪いのは" : "が1位なのは"}${teamName(top.teamId, lang)}（${v(top)}）。`,
      `${season} ${scope}${label}: ${abbr(top.teamId)} (${v(top)}).`
    ),
    { columns: [label], rows: sorted.slice(0, 5).map((r, i) => ({ label: `${i + 1}. ${teamName(r.teamId, lang)}`, cells: [v(r)] })) }
  );
}

async function teamHubQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  const unbeaten = /一度も負けて(?:い)?ない|無敗|全勝|負けなし|まだ負けて(?:い)?ない|unbeaten|undefeated/i.test(q);
  const winless = /一度も勝って(?:い)?ない|全敗|未勝利|勝ちなし|まだ勝って(?:い)?ない|winless/i.test(q);
  const bothHA = /ホームでもアウェー(?:イ)?でも|ホームもアウェー(?:イ)?も|ホームとアウェー(?:イ)?(?:の)?(?:両方|どちらも|どっちも)/.test(q);
  const namedTeam = findNbaAskTeamsInText(q)[0] ?? resolveNbaAskTeamId(intent.team);
  const schedule =
    /日程|スケジュール|対戦相手の(?:強さ|勝率)|schedule/i.test(q) &&
    (/きつ|厳し|ハード|楽|甘い|簡単|易し|強い|弱い|tough|hard|easy/i.test(q) || (Boolean(namedTeam) && /残り|これから|今後|この先|remaining/i.test(q)));
  const garbage = /ガベージ/.test(q) && /多い|長い|少な|短い|割合|どれくらい|何%|most|least/.test(q) && !/抜|除|なし|無し|クリーン/.test(q);
  const streak = /連勝|連敗|streak/i.test(q) && findNbaAskTeamsInText(q).length === 0 && !resolveNbaAskTeamId(intent.team);
  const noTeam = findNbaAskTeamsInText(q).length === 0 && !resolveNbaAskTeamId(intent.team);
  /** 「アウェーで勝ち越してるチーム」= その状況の勝敗で並べる */
  const sitRecord = noTeam && !/プレーオフ|プレーイン|圏/.test(q) && /(?:ホーム|アウェー|アウェイ|敵地|接戦|連戦|B2B)(?:で|の試合で|では)?(?:勝ち越|負け越)/i.test(q);
  /** 「ガードに弱いチーム」「センターに一番点を取られてる」= ポジション別失点 */
  const posWord = /(ガード|フォワード|センター)(?:に|相手に)(?:弱|強|(?:一番|いちばん|最も)?(?:点を?)?(?:取られ|やられ|決められ))/.exec(q);
  if (!unbeaten && !winless && !bothHA && !schedule && !garbage && !streak && !sitRecord && !(posWord && noTeam)) return null;
  if (intent.player) return null;
  const season = CURRENT_NBA_SEASON_KEY;

  if (posWord && noTeam) {
    const hub = (await loadNbaLeagueHubSnapshot(ctx.db, season)).hub;
    const key = posWord[1] === "ガード" ? "G" : posWord[1] === "フォワード" ? "F" : "C";
    const rows = (hub?.teams ?? []).flatMap((t) => (t.posDef?.[key] ? [{ t, d: t.posDef[key]! }] : []));
    if (rows.length === 0) return text(T(lang, "ポジション別の失点はまだ集計がありません。", "No points-allowed-by-position data yet."));
    const strong = /強/.test(q.slice(posWord.index));
    const sorted = [...rows].sort((a, b) => (strong ? a.d.pts - b.d.pts : b.d.pts - a.d.pts));
    const top = sorted[0]!;
    return boardAnswer(
      T(
        lang,
        `${season} で${posWord[1]}に${strong ? "点を取られていない" : "いちばん点を取られている"}のは${teamName(top.t.teamId, lang)}（1試合 ${top.d.pts.toFixed(1)}点・${rows.length}チーム中${strong ? "最少" : "最多"}）。`,
        `${season} ${strong ? "fewest" : "most"} points allowed to ${posWord[1]}: ${abbr(top.t.teamId)} (${top.d.pts.toFixed(1)}).`
      ),
      {
        columns: [T(lang, "失点", "PTS"), T(lang, "順位", "#")],
        rows: sorted.slice(0, 5).map((r) => ({ label: teamName(r.t.teamId, lang), cells: [r.d.pts.toFixed(1), String(r.d.rank)] })),
        note: T(lang, "相手のそのポジションの選手が取った得点の1試合平均（順位 1 = 最少）。マークした相手ではなく、相手のポジションで数えています。", "Opponent points by position per game (rank 1 = fewest)."),
      }
    );
  }

  if (streak) {
    const hub = (await loadNbaLeagueHubSnapshot(ctx.db, season)).hub;
    const kind = /連敗/.test(q) ? "L" : "W";
    const rows = (hub?.teams ?? []).filter((t) => t.streak?.kind === kind).sort((a, b) => b.streak!.count - a.streak!.count);
    if (rows.length === 0) return text(T(lang, `いま${kind === "W" ? "連勝" : "連敗"}中のチームはありません。`, `No team is on a ${kind === "W" ? "winning" : "losing"} streak.`));
    const top = rows[0]!;
    const word = kind === "W" ? T(lang, "連勝", "-game win streak") : T(lang, "連敗", "-game losing streak");
    const same = rows.filter((t) => t.streak!.count === top.streak!.count);
    return withHubView(boardAnswer(
      T(
        lang,
        `いちばん${word}しているのは${same.map((t) => teamName(t.teamId, lang)).join("・")}（${top.streak!.count}${word}中・${wl(top, lang)}）。`,
        `Longest active ${kind === "W" ? "win" : "losing"} streak: ${same.map((t) => abbr(t.teamId)).join(", ")} (${top.streak!.count}).`
      ),
      {
        columns: [T(lang, kind === "W" ? "連勝" : "連敗", "Streak"), T(lang, "勝敗", "W-L")],
        rows: rows.slice(0, 5).map((t) => ({ label: teamName(t.teamId, lang), cells: [String(t.streak!.count), wl(t, lang)] })),
      }
    ), "team_records", "streak");
  }

  if (garbage) {
    const { clean } = await teamSeasonRows(ctx.db, season);
    const rows = Object.entries(clean?.teams ?? {})
      .filter(([, t]) => t.games > 0 && Number.isFinite(t.garbagePossPct))
      .map(([teamId, t]) => ({ teamId, pct: t.garbagePossPct, games: t.games }));
    if (rows.length === 0) return text(T(lang, `${season} のガベージタイムの集計はまだありません。`, `No garbage-time data for ${season} yet.`));
    const few = /少な|短い|least/.test(q);
    const sorted = [...rows].sort((a, b) => (few ? a.pct - b.pct : b.pct - a.pct));
    const teamId = findNbaAskTeamsInText(q)[0];
    const pick = teamId ? sorted.find((r) => r.teamId === teamId) : sorted[0];
    if (!pick) return text(T(lang, `${teamName(teamId!, lang)}のガベージタイムの集計はまだありません。`, `No garbage-time data for ${abbr(teamId!)}.`));
    const rank = [...rows].sort((a, b) => b.pct - a.pct).findIndex((r) => r.teamId === pick.teamId) + 1;
    return boardAnswer(
      teamId
        ? T(lang, `${teamName(teamId, lang)}の${season} のガベージタイムは全ポゼッションの${pct1(pick.pct)}（多い順で${rows.length}チーム中${rank}位）。`, `${abbr(teamId)} garbage time: ${pct1(pick.pct)} of possessions (#${rank} of ${rows.length}).`)
        : T(lang, `${season} でガベージタイムがいちばん${few ? "少ない" : "多い"}のは${teamName(pick.teamId, lang)}（全ポゼッションの${pct1(pick.pct)}）。`, `${season} ${few ? "least" : "most"} garbage time: ${abbr(pick.teamId)} (${pct1(pick.pct)} of possessions).`),
      {
        columns: [T(lang, "ガベージ割合", "Garbage %"), T(lang, "試合", "G")],
        rows: sorted.slice(0, 5).map((r) => ({ label: teamName(r.teamId, lang), cells: [pct1(r.pct), String(r.games)] })),
        note: T(lang, "ガベージタイム = 4Q 残り12〜9分で25点差・9〜6分で20点差・6分〜で10点差以上がついた時間。勝っていても負けていても数えます。", "Garbage time = 4th-quarter blowout minutes (either side)."),
      }
    );
  }

  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, season)).hub;
  if (!hub) return text(T(lang, "今季のチームの集計がまだありません。", "No team data this season yet."));
  const teams = hub.teams;

  if (sitRecord && !unbeaten && !winless) {
    const SITS: ReadonlyArray<[RegExp, "home" | "away" | "close" | "b2b", string, string]> = [
      [/ホーム/, "home", "ホーム", "home"],
      [/アウェー|アウェイ|敵地/, "away", "アウェー", "road"],
      [/接戦/, "close", "接戦", "close games"],
      [/連戦|B2B/i, "b2b", "連戦2日目", "back-to-backs"],
    ];
    const sit = SITS.find(([re]) => re.test(q))!;
    const losing = /負け越/.test(q);
    const hits = teams
      .flatMap((t) => {
        const r = t[sit[1]];
        return r && (losing ? r.losses > r.wins : r.wins > r.losses) ? [{ t, r }] : [];
      })
      .sort((a, b) => (losing ? b.r.losses - b.r.wins - (a.r.losses - a.r.wins) : b.r.wins - b.r.losses - (a.r.wins - a.r.losses)));
    const word = losing ? T(lang, "負け越し", "below .500") : T(lang, "勝ち越し", "above .500");
    if (hits.length === 0) return text(T(lang, `${hub.seasonKey} で${sit[2]}で${word}のチームはありません。`, `No team is ${word} ${sit[3]}.`));
    return withHubView(boardAnswer(
      T(
        lang,
        `${hub.seasonKey} で${sit[2]}で${word}しているのは${hits.length}チーム。いちばん${losing ? "負け越している" : "勝ち越している"}のは${teamName(hits[0]!.t.teamId, lang)}（${wl(hits[0]!.r, lang)}）。`,
        `${hits.length} teams ${word} ${sit[3]}; top: ${abbr(hits[0]!.t.teamId)} (${wl(hits[0]!.r, lang)}).`
      ),
      {
        columns: [T(lang, sit[2], sit[3]), T(lang, "全体", "Overall")],
        rows: hits.slice(0, 10).map((x) => ({ label: teamName(x.t.teamId, lang), cells: [wl(x.r, lang), wl(x.t, lang)] })),
      }
    ), "team_records", sit[1]);
  }

  if (unbeaten || winless) {
    /** 「ホームで無敗」「接戦で全敗」= 状況の勝敗で見る */
    const SIT: ReadonlyArray<[RegExp, "home" | "away" | "close" | "b2b" | "vsOver500", string, string]> = [
      [/ホーム|本拠地/, "home", "ホーム", "home"],
      [/アウェー|アウェイ|敵地|ロード/, "away", "アウェー", "on the road"],
      [/接戦|僅差|5点差/, "close", "接戦", "in close games"],
      [/連戦|B2B|バック.?トゥ.?バック/i, "b2b", "連戦2日目", "on back-to-backs"],
      [/勝ち越し(?:チーム|相手)|強い(?:チーム|相手)|上位(?:チーム|相手)/, "vsOver500", "勝ち越しチーム相手", "vs .500+ teams"],
    ];
    const sit = SIT.find(([re]) => re.test(q)) ?? null;
    const recOf = (t: (typeof teams)[number]) => (sit ? (t[sit[1]] ?? null) : { wins: t.wins, losses: t.losses });
    const pctOf = (t: (typeof teams)[number]) => {
      const r = recOf(t);
      return r && r.wins + r.losses > 0 ? r.wins / (r.wins + r.losses) : unbeaten ? -1 : 2;
    };
    const hits = teams.filter((t) => {
      const r = recOf(t);
      return r && r.wins + r.losses > 0 && (unbeaten ? r.losses === 0 : r.wins === 0);
    });
    const order = [...teams].sort((a, b) => (unbeaten ? pctOf(b) - pctOf(a) : pctOf(a) - pctOf(b)));
    const closest = order[0]!;
    const word = unbeaten ? T(lang, "無敗", "unbeaten") : T(lang, "未勝利", "winless");
    const where = sit ? T(lang, `${sit[2]}で`, ` ${sit[3]}`) : "";
    const wlOf = (t: (typeof teams)[number]) => wl(recOf(t) ?? { wins: 0, losses: 0 }, lang);
    const out = boardAnswer(
      hits.length
        ? T(lang, `${hub.seasonKey} で${where}まだ${word}なのは${hits.map((t) => `${teamName(t.teamId, lang)}（${wlOf(t)}）`).join("・")}。`, `${hub.seasonKey} ${word}${where}: ${hits.map((t) => `${abbr(t.teamId)} (${wlOf(t)})`).join(", ")}.`)
        : T(
            lang,
            `${hub.seasonKey} で${where}${word}のチームはもうありません。いちばん${unbeaten ? "負けが少ない" : "勝ちが少ない"}のは${teamName(closest.teamId, lang)}（${wlOf(closest)}）。`,
            `No ${word} team${where} left in ${hub.seasonKey}. Closest: ${abbr(closest.teamId)} (${wlOf(closest)}).`
          ),
      {
        columns: [sit ? T(lang, sit[2], sit[1]) : T(lang, "勝敗", "W-L")],
        rows: order.slice(0, 5).map((t) => ({ label: teamName(t.teamId, lang), cells: [wlOf(t)] })),
      }
    );
    return sit ? withHubView(out, "team_records", sit[1]) : out;
  }

  if (bothHA) {
    const weak = /弱い|負け|勝てない|苦手/.test(q);
    const rows = teams.flatMap((t) => {
      const h = winPct(t.home);
      const a = winPct(t.away);
      return h === null || a === null ? [] : [{ t, h, a, key: weak ? Math.max(h, a) : Math.min(h, a) }];
    });
    if (rows.length === 0) return null;
    const sorted = [...rows].sort((x, y) => (weak ? x.key - y.key : y.key - x.key) || (weak ? x.h + x.a - (y.h + y.a) : y.h + y.a - (x.h + x.a)));
    const top = sorted[0]!;
    return boardAnswer(
      T(
        lang,
        `${hub.seasonKey} でホームでもアウェーでも${weak ? "負けている" : "勝っている"}のは${teamName(top.t.teamId, lang)}（ホーム ${wl(top.t.home!, lang)}・アウェー ${wl(top.t.away!, lang)}）。`,
        `${hub.seasonKey} ${weak ? "worst" : "best"} both home and away: ${abbr(top.t.teamId)} (home ${wl(top.t.home!, lang)}, away ${wl(top.t.away!, lang)}).`
      ),
      {
        columns: [T(lang, "ホーム", "Home"), T(lang, "アウェー", "Away")],
        rows: sorted.slice(0, 5).map((r) => ({ label: teamName(r.t.teamId, lang), cells: [wl(r.t.home!, lang), wl(r.t.away!, lang)] })),
        note: T(lang, "ホームとアウェーの勝率の低いほうで並べています。", "Sorted by the lower of home / away win %."),
      }
    );
  }

  /** 日程: 相手の今の勝率の平均 */
  const past = /これまで|今まで|消化|終わった|ここまで|played|so far/i.test(q);
  const easy = /楽|甘い|簡単|易し|弱い|easy/i.test(q);
  const rows = teams.flatMap((t) => {
    const s = t.schedule;
    const v = past ? s?.played : s?.remaining;
    return s && typeof v === "number" ? [{ t, v, s }] : [];
  });
  if (rows.length === 0) return text(T(lang, "日程の厳しさはまだ集計がありません。", "No schedule strength yet."));
  const sorted = [...rows].sort((a, b) => (easy ? a.v - b.v : b.v - a.v));
  const top = sorted[0]!;
  const sideJa = past ? "これまで戦った相手" : "残り試合の相手";
  const fmtOpp = (v: number | null | undefined) => (typeof v === "number" ? v.toFixed(3).replace(/^0/, "") : "—");
  /** 「ジャズの残りの日程」= そのチームの相手の強さと、きつい順の順位 */
  const mine = namedTeam ? rows.find((r) => r.t.teamId === namedTeam) : undefined;
  if (mine) {
    const toughRank = [...rows].sort((a, b) => b.v - a.v).findIndex((r) => r === mine) + 1;
    return withHubView(boardAnswer(
      T(
        lang,
        `${teamName(namedTeam!, lang)}の${past ? "これまでの日程" : "残りの日程"}は、${sideJa}の今の勝率の平均が ${fmtOpp(mine.v)}（${past ? `${mine.s.playedGames}試合` : `残り${mine.s.remainingGames}試合`}）。きつい順で${rows.length}チーム中${toughRank}位。`,
        `${abbr(namedTeam!)} ${past ? "schedule so far" : "remaining schedule"}: opponents' win % ${fmtOpp(mine.v)} (#${toughRank} toughest of ${rows.length}).`
      ),
      {
        columns: [T(lang, "これまで", "Played"), T(lang, "残り", "Remaining")],
        rows: [{ label: teamName(namedTeam!, lang), cells: [fmtOpp(mine.s.played), fmtOpp(mine.s.remaining)] }],
        note: T(lang, "相手チームの今の勝率の平均。高いほど強い相手と当たる日程です。", "Average current win % of opponents. Higher = tougher."),
      }
    ), "schedule", past ? "played" : "remaining");
  }
  return withHubView(boardAnswer(
    T(
      lang,
      `${hub.seasonKey} で日程がいちばん${easy ? "楽な" : "きつい"}のは${teamName(top.t.teamId, lang)}。${sideJa}の今の勝率の平均が ${fmtOpp(top.v)}（${past ? `${top.s.playedGames}試合` : `残り${top.s.remainingGames}試合`}）。`,
      `${hub.seasonKey} ${easy ? "easiest" : "toughest"} ${past ? "schedule so far" : "remaining schedule"}: ${abbr(top.t.teamId)} (opponents' win % ${fmtOpp(top.v)}).`
    ),
    {
      columns: [T(lang, "これまで", "Played"), T(lang, "残り", "Remaining")],
      rows: sorted.slice(0, 5).map((r) => ({ label: teamName(r.t.teamId, lang), cells: [fmtOpp(r.s.played), fmtOpp(r.s.remaining)] })),
      note: T(lang, "相手チームの今の勝率の平均。高いほど強い相手と当たる日程です。", "Average current win % of opponents. Higher = tougher."),
    }
  ), "schedule", past ? "played" : "remaining");
}

// ---------------------------------------------------------------------------
// 年俸と働き
// ---------------------------------------------------------------------------

async function salaryValue(ctx: NbaAskNbaContext): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  const richBad = /年俸.{0,10}(?:高い|トップ|上位).{0,12}(?:成績|働き|活躍).{0,6}(?:悪い|低い|して(?:い)?ない|できて(?:い)?ない)/.test(q);
  if (
    !richBad &&
    !/年俸に見合|給料に見合|年俸と(?:働き|成績|活躍)|(?:年俸|給料)が?.{0,4}(?:安い|低い)のに|安いのに.{0,6}活躍|コスパ|割安|割高|給料泥棒|お買い得|もらいすぎ|貰いすぎ|もらい過ぎ|bargain|overpaid|underpaid|value\s+contract/i.test(q)
  ) {
    return null;
  }
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  const worst = richBad || /見合って(?:い)?ない|見合わない|割高|泥棒|もらいすぎ|貰いすぎ|もらい過ぎ|overpaid/i.test(q);
  const topN = Number(/(?:年俸|給料)(?:の)?(?:トップ|上位)\s*(\d+)/.exec(q.normalize("NFKC"))?.[1] ?? 0);
  const full = (worst ? hub?.value?.worst : hub?.value?.best) ?? [];
  const list = topN ? (full.filter((r) => r.salaryRank <= topN).length ? full.filter((r) => r.salaryRank <= topN) : full) : full;
  if (list.length === 0) return text(T(lang, "年俸と働きの比較はまだ集計がありません。", "No salary-vs-production data yet."));
  const top = list[0]!;
  const money = (m: number) => `$${m.toFixed(1)}M`;
  return withHubView(boardAnswer(
    T(
      lang,
      `${hub!.seasonKey} で年俸のわりに${worst ? "働きが足りない" : "よく働いている"}のは${top.name}（${teamName(top.teamId, lang)}）。年俸 ${money(top.salaryM)}（${top.of}人中${top.salaryRank}位）に対して働き（Game Score 平均 ${top.gameScore.toFixed(1)}）は${top.gameScoreRank}位。`,
      `${hub!.seasonKey} most ${worst ? "overpaid" : "underpaid"}: ${top.name} (${abbr(top.teamId)}) — salary #${top.salaryRank}, production #${top.gameScoreRank} of ${top.of}.`
    ),
    {
      columns: T(lang, "年俸|順位|働き|順位", "Salary|#|GmSc|#").split("|"),
      rows: list.slice(0, 5).map((r) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [money(r.salaryM), String(r.salaryRank), r.gameScore.toFixed(1), String(r.gameScoreRank)] })),
      note: T(lang, "平均15分以上の選手で、今季年俸の順位と Game Score 平均の順位を比べています（UNITERZ の試算）。", "Players with 15+ MPG: salary rank vs Game Score rank."),
    }
  ), "value", worst ? "worst" : "best");
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

/** 条件・両端・状況の質問ならその答え。違えば null（比較 → ふだんの流れへ） */
export async function answerNbaAskFilter(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  return (
    (await salaryValue(ctx)) ??
    (await playerGameCondition(ctx, intent)) ??
    (await teamHubQuestion(ctx, intent)) ??
    (await teamRanking(ctx, intent)) ??
    (await playerPair(ctx, intent)) ??
    (await playerFilter(ctx, intent))
  );
}
