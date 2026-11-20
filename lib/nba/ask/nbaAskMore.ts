/**
 * AI の query では表しきれない質問を、質問の言葉で先に拾う（条件の絞り込み `nbaAskFilter` よりさらに前）。
 * 数字はすべて Firestore スナップショットから（BDL・AI は使わない）。
 *
 * 経歴（ロスター）: 「日本人選手」「デューク大出身」「一番背が高い」「一番若い選手で平均10点以上」（年齢はドラフト年で近似）
 * 選手の数字: 「プラスマイナスが一番いい」「36分あたりの得点」「コーナースリーがうまい」「今季の1試合最多得点」「先週一番活躍」
 * 選手 1 人: 「レブロンの通算得点」「カリーの11月の平均」
 * チーム: 「11月の成績」「平均20点以上の選手が一番多いチーム」「一番若いチーム」
 * チーム「なぜ勝てない」: 因果は断定せず、NET / 攻守 / 得失点差 / 日程 / 欠場 / 接戦を並べる
 * そのほか: 「今日欠場する主な選手」「来年FAになる選手」「ヘッドコーチは」（データなし）
 */
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { formatNbaPlayerListName } from "@/lib/nba/formatNbaPlayerListName";
import { loadNbaLeagueHubSnapshot } from "@/lib/nba/leagueHub/loadNbaLeagueHubSnapshot";
import type { LeagueHubHighStat } from "@/lib/nba/leagueHub/leagueHubTypes";
import { careerBaseFromRows } from "@/lib/nba/leagueHub/buildLeagueHubExtras";
import { loadPlayerCareerSeasonsSnapshot } from "@/lib/nba/playerCareerSeasons/loadPlayerCareerSeasonsSnapshot";
import { loadPlayerGameLogsSnapshot } from "@/lib/nba/playerGameLogs/loadPlayerGameLogsSnapshot";
import { loadTeamGameLogDetail } from "@/lib/nba/teamGameLog/loadTeamGameLogDetail";
import { loadTeamInjuriesSnapshot } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import { loadNbaPlayerShotAreas } from "@/lib/nba/shotCharts/loadNbaPlayerShotAreas";
import type { NbaShotAreaId } from "@/lib/nba/shotCharts/shotChartTypes";
import {
  NBA_PLAYER_CONTRACTS_COLLECTION,
  NBA_PLAYER_CONTRACTS_PLAYERS_SUB,
} from "@/lib/nba/playerContract/playerContractTypes";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import { getTodayKeyInTimeZone } from "@/lib/time/zonedTime";
import { shiftDateKeyInTimeZone } from "@/lib/games/gamesWindowRange";
import { abbr, loadGamesOnDate, loadRosters, readStandingsBoard } from "./nbaAskTools";
import { NBA_CONFERENCE_STANDINGS_COLLECTION } from "@/lib/nba/standings/loadNbaConferenceStandings";
import { normalizeLiveGameStatsDoc, type LiveGameBoxPlayer } from "@/lib/games/liveGameStats";
import { findNbaAskTeamsInText, resolveNbaAskTeamId } from "./nbaAskTeamNames";
import { nbaAskNicknamePlayer, pickNbaAskPlayer, type NbaAskPlayerHit } from "./nbaAskPlayerResolve";
import {
  conferenceFilter,
  fmt,
  hasTeamValue,
  higherIsBetter,
  pct1,
  rowValue,
  s1,
  teamName,
  teamSeasonRows,
  wl,
} from "./nbaAskCompare";
import { countriesInText, countryJa } from "./nbaAskJa";
import type { NbaAskIntent } from "./nbaAskIntent";
import { withHubView, type NbaAskBoard } from "./nbaAskBoard";
import type { NbaAskAnswer, NbaAskNbaContext } from "./nbaAskNbaAnswer";

const ja = (lang: string) => lang === "ja";
const T = (lang: string, jaText: string, enText: string) => (ja(lang) ? jaText : enText);

function text(answer: string, usedStats = true): NbaAskAnswer {
  return { answer, board: null, games: null, opens: [], usedStats };
}

function boardAnswer(answer: string, board: NbaAskBoard): NbaAskAnswer {
  return { answer, board, games: null, opens: [], usedStats: true };
}

const PLAYER_WORD = /選手|プレーヤー|プレイヤー|\bplayers?\b|誰|だれ|\bwho\b/i;
const TEAM_WORD = /チーム|\bteams?\b/i;
const RANK_WORD = /一番|いちばん|最も|もっとも|トップ|1位|誰|だれ|どこ|どの|ランキング|\bmost\b|\bwho\b/i;
const LOW = /少な|低い|悪い|ワースト|最低|最下位|worst|lowest/i;
const SEASON_START = Number(CURRENT_NBA_SEASON_KEY.slice(0, 4));

const n1 = (v: number) => v.toFixed(1);

// ---------------------------------------------------------------------------
// ロスター（今季の全選手）
// ---------------------------------------------------------------------------

type RosterRow = { p: NbaRosterPlayer; id: string; teamId: string; name: string; full: string };

async function rosterRows(ctx: NbaAskNbaContext): Promise<RosterRow[]> {
  const teams = await loadRosters(ctx.db);
  return Object.entries(teams).flatMap(([teamId, t]) =>
    t.players.map((p) => {
      const full = `${p.firstName} ${p.lastName}`.trim();
      return { p, id: String(p.id), teamId, name: formatNbaPlayerListName(full, String(p.id)), full };
    })
  );
}

/** 今季の主力（チーム試合数の半分以上） */
function minGpOf(rows: RosterRow[]): number {
  const maxGp = Math.max(0, ...rows.map((r) => (r.p.averagesSeasonKey && r.p.averagesSeasonKey !== CURRENT_NBA_SEASON_KEY ? 0 : r.p.gp)));
  return Math.max(3, Math.floor(maxGp * 0.5));
}

const thisSeason = (r: RosterRow) => !r.p.averagesSeasonKey || r.p.averagesSeasonKey === CURRENT_NBA_SEASON_KEY;

const POSITION_WORDS: ReadonlyArray<[RegExp, "G" | "F" | "C", string]> = [
  [/ガード|\bPG\b|\bSG\b|司令塔|guards?/i, "G", "ガード"],
  [/フォワード|\bSF\b|ウイング|ウィング|forwards?/i, "F", "フォワード"],
  [/センター|ビッグマン|centers?/i, "C", "センター"],
];

/** 質問の「レイカーズで」「東の」「センターで」の絞り込み */
function scopeOf(ctx: NbaAskNbaContext, intent: NbaAskIntent) {
  const q = ctx.question;
  const teams = findNbaAskTeamsInText(q);
  const teamId = teams.length === 1 ? teams[0]! : null;
  const conf = teamId ? null : conferenceFilter(q, intent);
  const pos = POSITION_WORDS.find(([re]) => re.test(q)) ?? null;
  const rookie = /ルーキー|新人|1年目|一年目|\brookies?\b/i.test(q);
  const label = [
    teamId ? teamName(teamId, ctx.language) : conf ? T(ctx.language, conf === "east" ? "東" : "西", conf === "east" ? "East" : "West") : "",
    pos ? pos[2] : "",
    rookie ? T(ctx.language, "ルーキー", "rookies") : "",
  ]
    .filter(Boolean)
    .join("の");
  /** ルーキー = 今季ドラフト組（ドラフト外の新人は年が無いので入らない） */
  const ok = (r: RosterRow) =>
    (!teamId || r.teamId === teamId) &&
    (!conf || nbaConferenceForTeam(r.teamId) === conf) &&
    (!pos || String(r.p.position ?? "").toUpperCase().split("-").includes(pos[1])) &&
    (!rookie || r.p.draftYear === SEASON_START);
  return { teamId, label, ok };
}

const who = (lang: string, r: { name: string; teamId: string }, withTeam = true) => (withTeam ? `${r.name}（${teamName(r.teamId, lang)}）` : r.name);

/** 1 試合平均の条件（「平均10点以上」「8リバウンド以上」） */
function rosterConds(q: string): Array<{ key: "ppg" | "rpg" | "apg"; min: number; label: string }> {
  const out: Array<{ key: "ppg" | "rpg" | "apg"; min: number; label: string }> = [];
  for (const m of q.matchAll(/(\d+(?:\.\d+)?)\s*(点|リバウンド|アシスト)\s*(?:以上|超)/g)) {
    const key = m[2] === "点" ? "ppg" : m[2] === "リバウンド" ? "rpg" : "apg";
    out.push({ key, min: Number(m[1]), label: `平均${m[1]}${m[2]}以上` });
  }
  return out;
}

// ---------------------------------------------------------------------------
// データが無い質問（コーチ・フロント）
// ---------------------------------------------------------------------------

function staffQuestion(ctx: NbaAskNbaContext): NbaAskAnswer | null {
  if (!/ヘッドコーチ|コーチ(?!ング)|監督|\bHC\b|\bGM\b|ゼネラルマネージャー|オーナー|球団社長|head\s*coach|\bcoach(?:es)?\b|general\s*manager/i.test(ctx.question)) return null;
  return text(
    T(
      ctx.language,
      "コーチやフロント（GM・オーナー）のデータはアプリにありません。選手・チームの成績、順位、故障者、契約などは答えられます。",
      "The app has no data on coaches or front offices. You can ask about player and team stats, standings, injuries, and contracts."
    ),
    false
  );
}

// ---------------------------------------------------------------------------
// 経歴: 国・大学・身長・年齢（ドラフト年）
// ---------------------------------------------------------------------------

function rosterBoard(lang: string, rows: RosterRow[], extra?: { label: string; cell: (r: RosterRow) => string }): NbaAskBoard {
  return {
    columns: [...(extra ? [extra.label] : []), T(lang, "得点", "PTS"), T(lang, "試合", "GP")],
    rows: rows.slice(0, 10).map((r) => ({
      label: `${r.name} ${abbr(r.teamId)}`,
      cells: [...(extra ? [extra.cell(r)] : []), thisSeason(r) && r.p.gp ? n1(r.p.ppg) : "—", thisSeason(r) ? String(r.p.gp) : "0"],
    })),
    ...(rows.length > 10 ? { note: T(lang, `ほか ${rows.length - 10}人`, `+${rows.length - 10} more`) } : {}),
  };
}

const byPpg = (a: RosterRow, b: RosterRow) => (thisSeason(b) ? b.p.ppg : 0) - (thisSeason(a) ? a.p.ppg : 0) || b.p.gp - a.p.gp;

type RosterStat = { key: "ppg" | "rpg" | "apg" | "spg" | "bpg" | "fg3m"; ja: string; unit: string; en: string };
const ROSTER_STATS: ReadonlyArray<[RegExp, RosterStat]> = [
  [/リバウンド|\breb/i, { key: "rpg", ja: "リバウンド", unit: "リバウンド", en: "RPG" }],
  [/アシスト|\bast/i, { key: "apg", ja: "アシスト", unit: "アシスト", en: "APG" }],
  [/スティール|\bstl|\bsteals?/i, { key: "spg", ja: "スティール", unit: "スティール", en: "SPG" }],
  [/ブロック|\bblk|\bblocks?/i, { key: "bpg", ja: "ブロック", unit: "ブロック", en: "BPG" }],
  [/3P|スリー|3ポイント|3点/i, { key: "fg3m", ja: "3P成功", unit: "本", en: "3PM" }],
];
const PPG_STAT: RosterStat = { key: "ppg", ja: "得点", unit: "点", en: "PPG" };
/** 「リバウンドが一番多い」→ rpg。指定が無ければ得点 */
const rosterStatOf = (q: string): RosterStat => ROSTER_STATS.find(([re]) => re.test(q))?.[1] ?? PPG_STAT;
const byStat = (st: RosterStat) => (a: RosterRow, b: RosterRow) =>
  (thisSeason(b) ? (b.p[st.key] ?? 0) : 0) - (thisSeason(a) ? (a.p[st.key] ?? 0) : 0) || b.p.gp - a.p.gp;
const statColumn = (lang: string, st: RosterStat) =>
  st.key === "ppg" ? undefined : { label: T(lang, st.ja, st.en), cell: (r: RosterRow) => (thisSeason(r) && r.p.gp ? n1(r.p[st.key] ?? 0) : "—") };
const statLead = (lang: string, st: RosterStat) => T(lang, st.key === "ppg" ? "いちばん点を取っている" : `いちばん${st.ja}が多い`, `Top ${st.en}`);

async function countryQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player) return null;
  const countries = countriesInText(q);
  const intl = /外国人|海外出身|アメリカ以外|米国以外|アメリカ人以外|international|non.?US/i.test(q);
  if (countries.length === 0 && !intl) return null;
  const all = await rosterRows(ctx);
  const scope = scopeOf(ctx, intent);
  const rows = all.filter((r) => scope.ok(r) && r.p.country);
  if (intl) {
    const st = rosterStatOf(q);
    const hits = rows.filter((r) => !/^(?:USA|United States)$/.test(r.p.country!)).sort(byStat(st));
    const byCountry = new Map<string, number>();
    for (const r of hits) byCountry.set(countryJa(r.p.country!), (byCountry.get(countryJa(r.p.country!)) ?? 0) + 1);
    const top = [...byCountry].sort((a, b) => b[1] - a[1]).slice(0, 3);
    return boardAnswer(
      T(
        lang,
        `${scope.label ? `${scope.label}の` : ""}アメリカ以外の国籍の選手は${hits.length}人（ロスター${rows.length}人中）。多いのは${top.map(([c, n]) => `${c} ${n}人`).join("・")}。${statLead(lang, st)}のは${who(lang, hits[0]!)}の平均${n1(hits[0]!.p[st.key] ?? 0)}${st.unit}。`,
        `${hits.length} international players (of ${rows.length}). ${statLead(lang, st)}: ${hits[0]!.name} (${abbr(hits[0]!.teamId)}) ${n1(hits[0]!.p[st.key] ?? 0)} ${st.en}.`
      ),
      rosterBoard(lang, hits, statColumn(lang, st) ?? { label: T(lang, "国籍", "Country"), cell: (r) => (ja(lang) ? countryJa(r.p.country!) : r.p.country!) })
    );
  }
  const st = rosterStatOf(q);
  const hits = rows.filter((r) => countries.includes(r.p.country!)).sort(byStat(st));
  const place = ja(lang) ? countryJa(countries[0]!) : countries[0]!;
  const scopeJa = scope.label ? `${scope.label}の` : "";
  if (hits.length === 0) return text(T(lang, `今季のロスターに${place}出身の${scopeJa}選手はいません。`, `No players from ${place} on current rosters.`));
  const line = (r: RosterRow) =>
    thisSeason(r) && r.p.gp
      ? T(lang, `${r.full}（${teamName(r.teamId, lang)}・${r.p.gp}試合 平均${n1(r.p[st.key] ?? 0)}${st.unit}）`, `${r.full} (${abbr(r.teamId)}, ${n1(r.p[st.key] ?? 0)} ${st.en})`)
      : T(lang, `${r.full}（${teamName(r.teamId, lang)}・今季出場なし）`, `${r.full} (${abbr(r.teamId)}, DNP)`);
  return boardAnswer(
    T(
      lang,
      hits.length <= 3
        ? `今季のロスターで${place}出身の${scopeJa}選手は${hits.length}人: ${hits.map(line).join("・")}。`
        : `今季のロスターで${place}出身の${scopeJa}選手は${hits.length}人。${statLead(lang, st)}のは${line(hits[0]!)}。`,
      `${hits.length} player(s) from ${place}: ${hits.slice(0, 3).map(line).join(", ")}.`
    ),
    rosterBoard(lang, hits, statColumn(lang, st))
  );
}

/** 日本語の大学名 → ロスターの表記 */
const COLLEGES: ReadonlyArray<[RegExp, string, string]> = [
  [/デューク|\bDuke\b/i, "Duke", "デューク大"],
  [/ケンタッキー|\bKentucky\b/i, "Kentucky", "ケンタッキー大"],
  [/ノースカロライナ|\bUNC\b|North\s+Carolina/i, "North Carolina", "ノースカロライナ大"],
  [/ミシガン州立|Michigan\s+State/i, "Michigan State", "ミシガン州立大"],
  [/ミシガン|\bMichigan\b/i, "Michigan", "ミシガン大"],
  [/アリゾナ|\bArizona\b/i, "Arizona", "アリゾナ大"],
  [/ゴンザガ|Gonzaga/i, "Gonzaga", "ゴンザガ大"],
  [/アーカンソー|Arkansas/i, "Arkansas", "アーカンソー大"],
  [/テキサスA&M|Texas\s*A&M/i, "Texas A&M", "テキサスA&M大"],
  [/テキサス|\bTexas\b/i, "Texas", "テキサス大"],
  [/カンザス|\bKansas\b/i, "Kansas", "カンザス大"],
  [/UCLA/i, "UCLA", "UCLA"],
  [/南カリフォルニア|\bUSC\b|Southern\s+California/i, "Southern California", "南カリフォルニア大（USC）"],
  [/テネシー|Tennessee/i, "Tennessee", "テネシー大"],
  [/ベイラー|Baylor/i, "Baylor", "ベイラー大"],
  [/フロリダ州立|Florida\s+State/i, "Florida State", "フロリダ州立大"],
  [/フロリダ|\bFlorida\b/i, "Florida", "フロリダ大"],
  [/バージニア|ヴァージニア|\bVirginia\b/i, "Virginia", "バージニア大"],
  [/アラバマ|Alabama/i, "Alabama", "アラバマ大"],
  [/コネチカット|UConn|Connecticut/i, "Connecticut", "コネチカット大（UConn）"],
  [/ヒューストン|\bHouston\b/i, "Houston", "ヒューストン大"],
  [/メンフィス|\bMemphis\b/i, "Memphis", "メンフィス大"],
  [/ビラノバ|ヴィラノバ|Villanova/i, "Villanova", "ビラノバ大"],
  [/バンダービルト|Vanderbilt/i, "Vanderbilt", "バンダービルト大"],
  [/オーバーン|Auburn/i, "Auburn", "オーバーン大"],
  [/ルイジアナ州立|\bLSU\b|Louisiana\s+State/i, "Louisiana State", "ルイジアナ州立大"],
  [/オハイオ州立|Ohio\s+State/i, "Ohio State", "オハイオ州立大"],
  [/ワシントン州立|Washington\s+State/i, "Washington State", "ワシントン州立大"],
  [/ワシントン大|\bWashington\b(?!\s+State)/i, "Washington", "ワシントン大"],
  [/マーケット|Marquette/i, "Marquette", "マーケット大"],
  [/スタンフォード|Stanford/i, "Stanford", "スタンフォード大"],
  [/セント.?ジョンズ|St\.?\s*John'?s/i, "St. John's", "セントジョンズ大"],
  [/メリーランド|Maryland/i, "Maryland", "メリーランド大"],
  [/ミズーリ|Missouri/i, "Missouri", "ミズーリ大"],
  [/クレイトン|Creighton/i, "Creighton", "クレイトン大"],
  [/イリノイ|Illinois/i, "Illinois", "イリノイ大"],
  [/インディアナ|Indiana/i, "Indiana", "インディアナ大"],
  [/パデュー|Purdue/i, "Purdue", "パデュー大"],
  [/ウィスコンシン|Wisconsin/i, "Wisconsin", "ウィスコンシン大"],
  [/ルイビル|Louisville/i, "Louisville", "ルイビル大"],
  [/シラキュース|Syracuse/i, "Syracuse", "シラキュース大"],
  [/ジョージタウン|Georgetown/i, "Georgetown", "ジョージタウン大"],
  [/オレゴン|\bOregon\b/i, "Oregon", "オレゴン大"],
  [/アイオワ|\bIowa\b/i, "Iowa", "アイオワ大"],
  [/マイアミ大|Miami\s+\(?FL|University\s+of\s+Miami/i, "Miami", "マイアミ大"],
  [/Gリーグ.?イグナイト|G\s*League\s+Ignite/i, "NBA G League Ignite", "Gリーグ・イグナイト"],
];

async function collegeQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || !/出身|大学|カレッジ|卒|college/i.test(q)) return null;
  const all = await rosterRows(ctx);
  const scope = scopeOf(ctx, intent);
  const rows = all.filter((r) => scope.ok(r) && r.p.college);
  /** 「一番多く選手を出している大学」 */
  if (/大学|カレッジ|college/i.test(q) && /多い|多く|最多|輩出|ランキング|most/i.test(q) && !COLLEGES.some(([re]) => re.test(q))) {
    const count = new Map<string, RosterRow[]>();
    for (const r of rows) {
      if (/Ignite|Basket|Overtime|^none$/i.test(r.p.college!)) continue;
      count.set(r.p.college!, [...(count.get(r.p.college!) ?? []), r]);
    }
    const sorted = [...count].sort((a, b) => b[1].length - a[1].length);
    const [c, list] = sorted[0]!;
    const jaName = COLLEGES.find(([, en]) => en === c)?.[2] ?? c;
    return boardAnswer(
      T(lang, `今季のロスターでいちばん多く選手を出している大学は${jaName}（${list.length}人）。続いて${sorted.slice(1, 3).map(([x, l]) => `${COLLEGES.find(([, en]) => en === x)?.[2] ?? x} ${l.length}人`).join("・")}。`, `Most NBA players: ${c} (${list.length}).`),
      { columns: [T(lang, "人数", "Players")], rows: sorted.slice(0, 8).map(([x, l]) => ({ label: COLLEGES.find(([, en]) => en === x)?.[2] ?? x, cells: [String(l.length)] })) }
    );
  }
  const college = COLLEGES.find(([re]) => re.test(q));
  if (!college) return null;
  const st = rosterStatOf(q);
  const hits = rows.filter((r) => r.p.college === college[1]).sort(byStat(st));
  const name = T(lang, college[2], college[1]);
  const scopeJa = scope.label ? `${scope.label}の` : "";
  if (hits.length === 0) return text(T(lang, `今季のロスターに${name}出身の${scopeJa}選手はいません。`, `No ${college[1]} players on current rosters.`));
  const top = hits[0]!;
  const v = (r: RosterRow) => n1(r.p[st.key] ?? 0);
  return boardAnswer(
    T(
      lang,
      `今季のロスターで${name}出身の${scopeJa}選手は${hits.length}人。${statLead(lang, st)}のは${who(lang, top)}の平均${v(top)}${st.unit}${hits[1] ? `、続いて${hits[1].name} ${v(hits[1])}${st.unit}` : ""}。`,
      `${hits.length} ${college[1]} players. ${statLead(lang, st)}: ${top.name} (${abbr(top.teamId)}) ${v(top)} ${st.en}.`
    ),
    rosterBoard(lang, hits, statColumn(lang, st))
  );
}

const inchesOf = (h: string | null | undefined) => {
  const m = /^(\d+)-(\d+)$/.exec(String(h ?? ""));
  return m ? Number(m[1]) * 12 + Number(m[2]) : null;
};
const cmOf = (inches: number) => `${Math.round(inches * 2.54)}cm`;

async function sizeQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player) return null;
  const height = /背が|背の|身長|長身|小柄|tallest|shortest/i.test(q) || (/(?:一番|いちばん|最も)(?:大きい|小さい)(?:選手|人|のは)/.test(q) && !/差|割合|影響|変化/.test(q));
  const weight = /体重|重い|軽い|heaviest|lightest/i.test(q);
  if (!height && !weight) return null;
  if (!RANK_WORD.test(q) && !/選手/.test(q)) return null;
  const small = height ? /低い|小さい|小柄|shortest/i.test(q) : /軽い|lightest/i.test(q);
  const all = await rosterRows(ctx);
  const scope = scopeOf(ctx, intent);
  const val = (r: RosterRow) => (height ? inchesOf(r.p.height) : Number(r.p.weight) || null);
  const rows = all.filter((r) => scope.ok(r) && val(r) !== null).sort((a, b) => (val(a)! - val(b)!) * (small ? 1 : -1));
  if (rows.length === 0) return text(T(lang, "身長・体重のデータがまだありません。", "No height / weight data yet."));
  const fmtV = (r: RosterRow) => (height ? `${cmOf(val(r)!)}（${r.p.height}）` : `${Math.round(val(r)! * 0.4536)}kg（${r.p.weight}lb）`);
  const first = rows.filter((r) => val(r) === val(rows[0]!));
  const what = height ? T(lang, small ? "背が低い" : "背が高い", small ? "shortest" : "tallest") : T(lang, small ? "軽い" : "重い", small ? "lightest" : "heaviest");
  return boardAnswer(
    T(
      lang,
      `今季のロスターで${scope.label ? `${scope.label}の中で` : ""}いちばん${what}のは${first.map((r) => who(lang, r)).join("・")}の${fmtV(first[0]!)}。`,
      `${what}${scope.label ? ` (${scope.label})` : ""}: ${first.map((r) => `${r.name} (${abbr(r.teamId)})`).join(", ")} — ${fmtV(first[0]!)}.`
    ),
    {
      columns: [height ? T(lang, "身長", "HT") : T(lang, "体重", "WT"), T(lang, "得点", "PTS")],
      rows: rows.slice(0, 8).map((r) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [height ? cmOf(val(r)!) : `${Math.round(val(r)! * 0.4536)}kg`, thisSeason(r) && r.p.gp ? n1(r.p.ppg) : "—"] })),
      note: T(lang, "BDL の選手データの身長・体重（今季のロスター全員）。", "Height / weight from current rosters."),
    }
  );
}

/** チームの顔ぶれ（LEAGUE の ROSTER マップと同じ hub の値） */
const TEAM_STYLE: ReadonlyArray<[RegExp, "benchShare" | "aceShare" | "scorerCount" | "heightCm", string, string, (v: number) => string]> = [
  [/ベンチ.{0,4}(?:得点|点)|控え.{0,4}(?:得点|点)|bench\s+scoring/i, "benchShare", "ベンチの得点割合", "bench scoring share", (v) => pct1(v)],
  [/エース.{0,6}(?:依存|頼|割合)|一人に頼|ワンマン/, "aceShare", "エースの得点割合", "ace scoring share", (v) => pct1(v)],
  [/得点源|点を取れる選手が多|バランス(?:が)?(?:いい|良い)|分散/, "scorerCount", "得点源の数", "scoring options", (v) => v.toFixed(1)],
  [/平均身長|(?:身長|背)が.{0,4}(?:高|低)いチーム/, "heightCm", "平均身長（出場時間で平均）", "avg height", (v) => `${v.toFixed(1)}cm`],
];

async function teamStyleQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player) return null;
  const hit = TEAM_STYLE.find(([re]) => re.test(q));
  if (!hit) return null;
  const named = findNbaAskTeamsInText(q)[0] ?? resolveNbaAskTeamId(intent.team);
  if (!named && !TEAM_WORD.test(q) && !/どこ/.test(q)) return null;
  const [, key, labelJa, labelEn, fmtV] = hit;
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  const teams = (hub?.teams ?? []).filter((t) => typeof t.m?.[key] === "number");
  if (teams.length === 0) return text(T(lang, `${labelJa}はまだ集計がありません。`, `No ${labelEn} data yet.`));
  const low = key === "heightCm" ? /低い|小さい/.test(q) : LOW.test(q);
  const sorted = [...teams].sort((a, b) => (a.m![key]! - b.m![key]!) * (low ? 1 : -1));
  const label = T(lang, labelJa, labelEn);
  const mine = named ? sorted.find((t) => t.teamId === named) : undefined;
  /** 「ネッツの得点源」= 誰が点を取っているか。数は添えるだけ */
  if (key === "scorerCount" && named && !/数|バランス|分散|何人|多い|少な/.test(q)) {
    const all = (await rosterRows(ctx)).filter((r) => r.teamId === named && thisSeason(r) && r.p.gp > 0);
    const minGp = Math.max(1, Math.floor(Math.max(0, ...all.map((r) => r.p.gp)) * 0.5));
    const top = all.filter((r) => r.p.gp >= minGp).sort(byPpg).slice(0, 6);
    if (top.length > 0) {
      const rank = mine ? [...teams].sort((a, b) => b.m![key]! - a.m![key]!).indexOf(mine) + 1 : 0;
      return boardAnswer(
        T(
          lang,
          `${teamName(named, lang)}の主な得点源は${top.slice(0, 3).map((r) => `${r.name} ${n1(r.p.ppg)}点`).join("・")}。${mine ? `得点のばらけ具合（得点源の数）は ${fmtV(mine.m![key]!)}（${teams.length}チーム中${rank}位・多いほどバランス型）。` : ""}`,
          `${abbr(named)} top scorers: ${top.slice(0, 3).map((r) => `${r.name} ${n1(r.p.ppg)}`).join(", ")}.${mine ? ` Scoring options: ${fmtV(mine.m![key]!)} (#${rank} of ${teams.length}).` : ""}`
        ),
        {
          columns: [T(lang, "得点", "PTS"), T(lang, "試合", "GP")],
          rows: top.map((r) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [n1(r.p.ppg), String(r.p.gp)] })),
          note: T(lang, `チーム試合の半分以上（${minGp}試合以上）に出た選手の1試合平均。`, `Players with ${minGp}+ games.`),
        }
      );
    }
  }
  const note = T(
    lang,
    key === "benchShare"
      ? "先発がわかる試合で、ベンチから出た選手の得点の割合。"
      : key === "aceShare"
        ? "チームの得点のうち、いちばん点を取る選手の割合（チーム試合の半分以上・平均10分以上の選手）。"
        : key === "scorerCount"
          ? "得点のシェアから計算した実質の得点源の数（1 / Σシェア²）。多いほどバランス型。"
          : "出場時間で平均した身長。",
    ""
  );
  const out = boardAnswer(
    mine
      ? T(lang, `${teamName(named!, lang)}の${label}は ${fmtV(mine.m![key]!)}（${teams.length}チーム中${[...teams].sort((a, b) => b.m![key]! - a.m![key]!).indexOf(mine) + 1}位・高い順）。`, `${abbr(named!)} ${labelEn}: ${fmtV(mine.m![key]!)}.`)
      : T(lang, `${hub!.seasonKey} で${label}がいちばん${low ? (key === "heightCm" ? "低い" : "少ない") : key === "heightCm" ? "高い" : "多い"}のは${teamName(sorted[0]!.teamId, lang)}（${fmtV(sorted[0]!.m![key]!)}）。`, `${low ? "Lowest" : "Highest"} ${labelEn}: ${abbr(sorted[0]!.teamId)} (${fmtV(sorted[0]!.m![key]!)}).`),
    {
      columns: [label],
      rows: (mine ? [mine] : sorted.slice(0, 5)).map((t) => ({ label: teamName(t.teamId, lang), cells: [fmtV(t.m![key]!)] })),
      ...(note ? { note } : {}),
    }
  );
  return out;
}

/** チームの 1 試合平均（アシスト・スティール・ブロック・リバウンド数）。リーグ表に無い box の項目はチーム試合ログ明細の home / away から */
const TEAM_BOX: ReadonlyArray<[RegExp, "ast" | "stl" | "blk" | "reb" | "fg3m", string, string]> = [
  [/(?:3P|スリー|3ポイント).{0,4}(?:成功数|決め|入る|入ら|入れ|沈め)(?!.{0,4}(?:率|確率|%))/i, "fg3m", "3P成功数", "3PM"],
  [/アシスト(?!.{0,2}(?:率|対|\/|と.{0,2}ターンオーバー))/, "ast", "アシスト", "assists"],
  [/スティール/, "stl", "スティール", "steals"],
  [/ブロック/, "blk", "ブロック", "blocks"],
  [/リバウンド(?:数|が(?:一番|いちばん)?(?:多|少な)|を(?:一番|いちばん)?(?:多く)?取)/, "reb", "リバウンド", "rebounds"],
];

/** チーム試合ログ明細の home / away の平均を試合数で合わせた 1 試合平均（全項目がそろうチームだけ） */
async function teamBoxAverages(ctx: NbaAskNbaContext, season: string, keys: readonly string[]): Promise<Array<{ teamId: string; v: Record<string, number>; games: number }>> {
  const snap = await ctx.db.collection("nbaTeamGameLogs").doc(season).collection("teams").select("splits").get();
  return snap.docs.flatMap((d) => {
    const sp = (d.data() as { splits?: Record<string, { statGames?: number; avg?: Record<string, number | null> | null }> }).splits;
    const v: Record<string, number> = {};
    let games = 0;
    for (const key of keys) {
      let sum = 0;
      let g = 0;
      for (const k of ["home", "away"]) {
        const r = sp?.[k];
        const x = r?.avg?.[key];
        if (typeof x === "number" && (r?.statGames ?? 0) > 0) {
          sum += x * r!.statGames!;
          g += r!.statGames!;
        }
      }
      if (g === 0) return [];
      v[key] = sum / g;
      games = g;
    }
    return [{ teamId: d.id, v, games }];
  });
}

async function teamBoxQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || PLAYER_WORD.test(q) || /相手|許し|奪われ|された|失/.test(q)) return null;
  const season = intent.season ?? CURRENT_NBA_SEASON_KEY;
  if (season !== CURRENT_NBA_SEASON_KEY || intent.playoffs) return null;
  const hit = TEAM_BOX.find(([re]) => re.test(q));
  if (!hit) return null;
  const named = findNbaAskTeamsInText(q)[0] ?? resolveNbaAskTeamId(intent.team);
  if (named ? RANK_WORD.test(q) && !/何位|順位/.test(q) : !TEAM_WORD.test(q) && !/どこ/.test(q)) return null;
  const [, key, labelJa, labelEn] = hit;
  const rows = (await teamBoxAverages(ctx, season, [key])).map((r) => ({ teamId: r.teamId, v: r.v[key]!, games: r.games }));
  if (rows.length === 0) return text(T(lang, `チームの${labelJa}はまだ集計がありません。`, `No team ${labelEn} yet.`));
  const low = LOW.test(q) || /入らない|決まらない/.test(q);
  const sorted = [...rows].sort((a, b) => (low ? a.v - b.v : b.v - a.v));
  const byHigh = [...rows].sort((a, b) => b.v - a.v);
  const mine = named ? rows.find((r) => r.teamId === named) : undefined;
  if (named && !mine) return text(T(lang, `${teamName(named, lang)}の${labelJa}はまだ集計がありません。`, `No ${labelEn} for ${abbr(named)} yet.`));
  const note = T(lang, "box スコアがある試合の 1 試合平均（ホーム・アウェーの合計）。", "Per game, games with box scores.");
  return boardAnswer(
    mine
      ? T(lang, `${teamName(named!, lang)}の1試合平均の${labelJa}は ${mine.v.toFixed(1)}（${rows.length}チーム中${byHigh.indexOf(mine) + 1}位）。`, `${abbr(named!)} ${labelEn} per game: ${mine.v.toFixed(1)} (#${byHigh.indexOf(mine) + 1}).`)
      : T(lang, `${season} で1試合平均の${labelJa}がいちばん${low ? "少ない" : "多い"}のは${teamName(sorted[0]!.teamId, lang)}（${sorted[0]!.v.toFixed(1)}）。`, `${low ? "Fewest" : "Most"} ${labelEn} per game: ${abbr(sorted[0]!.teamId)} (${sorted[0]!.v.toFixed(1)}).`),
    {
      columns: [T(lang, labelJa, labelEn), T(lang, "順位", "RANK")],
      rows: (mine ? [mine] : sorted.slice(0, Math.min(15, Number(/(?:トップ|上位|ベスト|top)\s*(\d{1,2})/i.exec(q.normalize("NFKC"))?.[1] ?? 5)))).map((r) => ({
        label: teamName(r.teamId, lang),
        cells: [r.v.toFixed(1), `${byHigh.indexOf(r) + 1}`],
      })),
      note,
    }
  );
}

/** 「スティール＋ブロックの合計」「得点+リバウンド+アシスト」= 項目の足し算（選手はロスターの今季平均、チームは試合ログ明細） */
const SUM_PARTS: ReadonlyArray<{ re: RegExp; player: "ppg" | "rpg" | "apg" | "spg" | "bpg"; team: string; ja: string; en: string }> = [
  { re: /得点|(?<!3\s?)ポイント(?!ガード)|\bPTS\b/i, player: "ppg", team: "pts", ja: "得点", en: "PTS" },
  { re: /リバウンド|\bREB\b/i, player: "rpg", team: "reb", ja: "リバウンド", en: "REB" },
  { re: /アシスト|\bAST\b/i, player: "apg", team: "ast", ja: "アシスト", en: "AST" },
  { re: /スティール|\bSTL\b/i, player: "spg", team: "stl", ja: "スティール", en: "STL" },
  { re: /ブロック|\bBLK\b/i, player: "bpg", team: "blk", ja: "ブロック", en: "BLK" },
];

function sumPartsOf(question: string): typeof SUM_PARTS | null {
  const q = question.normalize("NFKC");
  if (/\bstocks?\b|ストックス/i.test(q)) return SUM_PARTS.filter((p) => p.player === "spg" || p.player === "bpg");
  if (/\bPRA\b/.test(q)) return SUM_PARTS.slice(0, 3);
  if (!/合計|足し|合わせ|(?<!マイナス)\+|プラス(?!マイナス)/.test(q) || /プラスマイナス|\+\/-/.test(q)) return null;
  const hits = SUM_PARTS.filter((p) => p.re.test(q));
  return hits.length >= 2 ? hits : null;
}

async function sumQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  const parts = sumPartsOf(q);
  if (!parts || /通算|キャリア|直近|最近|昨日|今日|試合で|1試合(?:の)?最多|最高/.test(q)) return null;
  if ((intent.season && intent.season !== CURRENT_NBA_SEASON_KEY) || intent.playoffs) return null;
  const label = T(lang, parts.map((p) => p.ja).join("＋"), parts.map((p) => p.en).join("+"));
  const low = LOW.test(q);
  const named = findNbaAskTeamsInText(q)[0] ?? resolveNbaAskTeamId(intent.team);
  const hit = await namedPlayer(ctx, intent);

  if (!hit && !PLAYER_WORD.test(q) && (named || TEAM_WORD.test(q) || /どこ/.test(q))) {
    const rows = (await teamBoxAverages(ctx, CURRENT_NBA_SEASON_KEY, parts.map((p) => p.team))).map((r) => ({
      ...r,
      total: parts.reduce((s, p) => s + r.v[p.team]!, 0),
    }));
    if (rows.length === 0) return text(T(lang, `チームの${label}はまだ集計がありません。`, `No team ${label} yet.`));
    const byHigh = [...rows].sort((a, b) => b.total - a.total);
    const sorted = low ? [...byHigh].reverse() : byHigh;
    const mine = named ? rows.find((r) => r.teamId === named) : undefined;
    const split = (r: (typeof rows)[number]) => parts.map((p) => r.v[p.team]!.toFixed(1)).join(" + ");
    const pack = (r: (typeof rows)[number]) => ({ label: teamName(r.teamId, lang), cells: [...parts.map((p) => r.v[p.team]!.toFixed(1)), r.total.toFixed(1), `${byHigh.indexOf(r) + 1}`] });
    return boardAnswer(
      mine
        ? T(lang, `${teamName(named!, lang)}の1試合平均の${label}は ${mine.total.toFixed(1)}（${split(mine)}・${rows.length}チーム中${byHigh.indexOf(mine) + 1}位）。`, `${abbr(named!)} ${label}: ${mine.total.toFixed(1)} per game (#${byHigh.indexOf(mine) + 1}).`)
        : T(lang, `${CURRENT_NBA_SEASON_KEY} で1試合平均の${label}がいちばん${low ? "少ない" : "多い"}のは${teamName(sorted[0]!.teamId, lang)}（${sorted[0]!.total.toFixed(1)}＝${split(sorted[0]!)}）。続いて${sorted.slice(1, 3).map((r) => `${teamName(r.teamId, lang)} ${r.total.toFixed(1)}`).join("・")}。`, `${low ? "Fewest" : "Most"} ${label} per game: ${abbr(sorted[0]!.teamId)} (${sorted[0]!.total.toFixed(1)}).`),
      {
        columns: [...parts.map((p) => T(lang, p.ja, p.en)), T(lang, "合計", "Total"), T(lang, "順位", "RANK")],
        rows: (mine ? [mine] : sorted.slice(0, 8)).map(pack),
        note: T(lang, "box スコアがある試合の 1 試合平均。", "Per game, games with box scores."),
      }
    );
  }

  const all = await rosterRows(ctx);
  const minGp = minGpOf(all);
  const totalOf = (r: RosterRow) => (parts.every((p) => typeof r.p[p.player] === "number") ? parts.reduce((s, p) => s + Number(r.p[p.player]), 0) : null);
  const pool = all.filter((r) => thisSeason(r) && r.p.gp >= minGp && totalOf(r) !== null).sort((a, b) => totalOf(b)! - totalOf(a)!);
  const split = (r: RosterRow) => parts.map((p) => `${T(lang, p.ja, p.en)} ${Number(r.p[p.player]).toFixed(1)}`).join(T(lang, "・", ", "));
  const note = T(lang, `ロスターの今季1試合平均。順位は今季${minGp}試合以上の選手の中。`, `Season per-game averages. Rank among ${minGp}+ GP.`);
  const pack = (r: RosterRow) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [...parts.map((p) => Number(r.p[p.player]).toFixed(1)), totalOf(r)!.toFixed(1)] });
  const columns = [...parts.map((p) => T(lang, p.ja, p.en)), T(lang, "合計", "Total")];
  if (hit) {
    const row = all.find((r) => r.id === hit.playerId);
    const total = row && thisSeason(row) ? totalOf(row) : null;
    if (!row || total === null) return text(T(lang, `${hit.name} の今季の${label}はまだありません。`, `No ${label} for ${hit.name} yet.`));
    const rank = pool.findIndex((r) => r.id === hit.playerId) + 1;
    return boardAnswer(
      T(lang, `${hit.name}（${teamName(hit.teamId, lang)}）の今季の${label}は1試合平均 ${total.toFixed(1)}（${split(row)}）${rank ? `。${pool.length}人中${rank}位` : ""}。`, `${hit.name} ${label}: ${total.toFixed(1)} per game${rank ? ` (#${rank} of ${pool.length})` : ""}.`),
      { columns, rows: [pack(row)], note }
    );
  }
  const scope = scopeOf(ctx, intent);
  const scoped = pool.filter((r) => scope.ok(r));
  if (scoped.length === 0) return text(T(lang, `${label}のデータがまだありません。`, `No ${label} data yet.`));
  const sorted = low ? [...scoped].reverse() : scoped;
  const top = sorted[0]!;
  return boardAnswer(
    T(
      lang,
      `今季${scope.label ? `の${scope.label}で` : ""}1試合平均の${label}がいちばん${low ? "少ない" : "多い"}のは${who(lang, top)}・${totalOf(top)!.toFixed(1)}（${split(top)}）。${sorted.length > 1 ? `続いて${sorted.slice(1, 3).map((r) => `${r.name} ${totalOf(r)!.toFixed(1)}`).join("・")}。` : ""}`,
      `${low ? "Fewest" : "Most"} ${label} per game: ${top.name} (${abbr(top.teamId)}) ${totalOf(top)!.toFixed(1)}.`
    ),
    { columns, rows: sorted.slice(0, Math.min(15, Number(/(?:トップ|上位|ベスト|top)\s*(\d{1,2})/i.exec(q.normalize("NFKC"))?.[1] ?? 8))).map(pack), note }
  );
}

async function ageQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player) return null;
  const young = /若い|最年少|年少|若手|youngest/i.test(q);
  const old = /年長|最年長|ベテラン|年上|高齢|年寄|oldest|veteran/i.test(q);
  if (!young && !old) return null;
  if (!RANK_WORD.test(q) && !(TEAM_WORD.test(q) && /多い|少な/.test(q))) return null;
  const note = T(
    lang,
    "年齢のデータはアプリに無いので、ドラフトの年で近い答えを出しています（同じ年のドラフトなら同じ扱い・ドラフト外の選手は除く）。",
    "No birthdates in the app, so this uses draft year as a proxy (undrafted players excluded)."
  );
  /** 「一番若いチーム」= ドラフトからの年数（出場時間で平均） */
  if (TEAM_WORD.test(q) && !PLAYER_WORD.test(q)) {
    const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
    const teams = (hub?.teams ?? []).filter((t) => typeof t.m?.experience === "number");
    if (teams.length === 0) return text(T(lang, "チームの経験年数はまだ集計がありません。", "No team experience data yet."));
    const sorted = [...teams].sort((a, b) => (a.m!.experience! - b.m!.experience!) * (young ? 1 : -1));
    const top = sorted[0]!;
    return boardAnswer(
      T(lang, `いちばん${young ? "若い" : "ベテランが多い"}チームは${teamName(top.teamId, lang)}（主力のドラフトからの年数の平均 ${n1(top.m!.experience!)}年）。`, `${young ? "Youngest" : "Most veteran"} team: ${abbr(top.teamId)} (${n1(top.m!.experience!)} yrs since draft, minutes-weighted).`),
      {
        columns: [T(lang, "経験年数", "Yrs")],
        rows: sorted.slice(0, 5).map((t) => ({ label: teamName(t.teamId, lang), cells: [n1(t.m!.experience!)] })),
        note: T(lang, "年齢のデータは無いので、ドラフトからの年数を出場時間で平均しています（ドラフト外の選手は除く）。", "Years since draft, minutes-weighted (undrafted excluded)."),
      }
    );
  }
  const all = await rosterRows(ctx);
  const scope = scopeOf(ctx, intent);
  const conds = rosterConds(q);
  const minGp = minGpOf(all);
  const pool = all.filter(
    (r) =>
      thisSeason(r) &&
      typeof r.p.draftYear === "number" &&
      scope.ok(r) &&
      (conds.length === 0 ? r.p.gp > 0 : r.p.gp >= minGp && conds.every((c) => (r.p[c.key] ?? 0) >= c.min))
  );
  if (pool.length === 0) return text(T(lang, `条件に合う選手がいません。${note}`, `No players match. ${note}`));
  const sorted = [...pool].sort((a, b) => (b.p.draftYear! - a.p.draftYear!) * (young ? 1 : -1) || byPpg(a, b));
  const year = sorted[0]!.p.draftYear!;
  const same = sorted.filter((r) => r.p.draftYear === year);
  const condJa = conds.map((c) => c.label).join("・");
  return boardAnswer(
    T(
      lang,
      `${scope.label ? `${scope.label}で` : ""}${condJa ? `${condJa}の選手のうち` : ""}ドラフトがいちばん${young ? "新しい" : "古い"}のは${year}年組の${same.slice(0, 3).map((r) => `${who(lang, r)}・平均${n1(r.p.ppg)}点`).join("、")}${same.length > 3 ? ` ほか${same.length - 3}人` : ""}。${note}`,
      `${young ? "Most recent" : "Earliest"} draft class${condJa ? ` among ${conds.map((c) => `${c.min}+ ${c.key}`).join(", ")}` : ""}: ${year} — ${same.slice(0, 3).map((r) => r.name).join(", ")}. ${note}`
    ),
    {
      columns: [T(lang, "ドラフト", "Draft"), T(lang, "得点", "PTS"), T(lang, "試合", "GP")],
      rows: sorted.slice(0, 8).map((r) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [`${r.p.draftYear}${r.p.draftNumber ? ` #${r.p.draftNumber}` : ""}`, n1(r.p.ppg), String(r.p.gp)] })),
    }
  );
}

// ---------------------------------------------------------------------------
// 選手の数字: プラスマイナス・36 分あたり
// ---------------------------------------------------------------------------

const PER_STATS: ReadonlyArray<[RegExp, keyof NbaRosterPlayer, string, string]> = [
  [/リバウンド|\breb/i, "rpg", "リバウンド", "REB"],
  [/アシスト|\bast/i, "apg", "アシスト", "AST"],
  [/ブロック|\bblk/i, "bpg", "ブロック", "BLK"],
  [/スティール|\bstl/i, "spg", "スティール", "STL"],
  [/3P|スリー|3ポイント/i, "fg3m", "3P成功", "3PM"],
  [/得点|点|\bpts|points?/i, "ppg", "得点", "PTS"],
];

async function namedPlayer(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskPlayerHit | null> {
  const name = intent.player ?? nbaAskNicknamePlayer(ctx.question);
  if (!name) return null;
  const found = pickNbaAskPlayer(await loadRosters(ctx.db), name, intent.player ? intent.player_written : null, null);
  return found.kind === "one" ? found.hit : null;
}

async function plusMinusQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (!/プラスマイナス|\+\/-|±|plus.?minus/i.test(q) || /オン.?オフ|ラインナップ/.test(q)) return null;
  const all = await rosterRows(ctx);
  const minGp = minGpOf(all);
  const pool = all.filter((r) => thisSeason(r) && r.p.gp >= minGp && (r.p.mpg ?? 0) >= 15 && typeof r.p.plusMinus === "number").sort((a, b) => b.p.plusMinus! - a.p.plusMinus!);
  const note = T(lang, `出場中のチームの得失点差の1試合平均。今季${minGp}試合以上・平均15分以上の選手で順位を付けています。`, `On-court point differential per game. ${minGp}+ GP, 15+ MPG.`);
  const hit = await namedPlayer(ctx, intent);
  if (hit) {
    const row = all.find((r) => r.id === hit.playerId);
    const v = row?.p.plusMinus;
    if (!row || typeof v !== "number" || !thisSeason(row)) return text(T(lang, `${hit.name} の今季のプラスマイナスはまだありません。`, `No +/- for ${hit.name} yet.`));
    const rank = pool.findIndex((r) => r.id === hit.playerId) + 1;
    return text(T(lang, `${hit.name}（${teamName(hit.teamId, lang)}）の今季のプラスマイナスは1試合平均 ${s1(v)}${rank ? `（${pool.length}人中${rank}位）` : ""}。${note}`, `${hit.name} +/-: ${s1(v)} per game${rank ? ` (#${rank} of ${pool.length})` : ""}.`));
  }
  const scope = scopeOf(ctx, intent);
  const scoped = pool.filter((r) => scope.ok(r));
  if (scoped.length === 0) return text(T(lang, "プラスマイナスのデータがまだありません。", "No +/- data yet."));
  const sorted = LOW.test(q) ? [...scoped].reverse() : scoped;
  const top = sorted[0]!;
  return boardAnswer(
    T(lang, `今季${scope.label ? `の${scope.label}で` : ""}プラスマイナスがいちばん${LOW.test(q) ? "悪い" : "良い"}のは${who(lang, top)}・1試合平均 ${s1(top.p.plusMinus!)}。${sorted[1] ? `続いて${sorted.slice(1, 3).map((r) => `${r.name} ${s1(r.p.plusMinus!)}`).join("・")}。` : ""}`, `${LOW.test(q) ? "Worst" : "Best"} +/-: ${top.name} (${abbr(top.teamId)}) ${s1(top.p.plusMinus!)}.`),
    {
      columns: ["+/-", T(lang, "出場分", "MIN")],
      rows: sorted.slice(0, 8).map((r) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [s1(r.p.plusMinus!), n1(r.p.mpg)] })),
      note,
    }
  );
}

async function perMinuteQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  const per = /48\s*分|per\s*48/i.test(q) ? 48 : /36\s*分|per\s*36|分あたり|分換算/i.test(q) ? 36 : 0;
  if (!per) return null;
  const stat = PER_STATS.find(([re]) => re.test(q.replace(/\d+\s*分/g, ""))) ?? PER_STATS[PER_STATS.length - 1]!;
  const key = stat[1];
  const label = T(lang, stat[2], stat[3]);
  const all = await rosterRows(ctx);
  const v = (r: RosterRow) => {
    const x = r.p[key];
    return typeof x === "number" && r.p.mpg > 0 ? (x / r.p.mpg) * per : null;
  };
  const minGp = minGpOf(all);
  const pool = all.filter((r) => thisSeason(r) && r.p.gp >= minGp && r.p.mpg >= 15 && v(r) !== null).sort((a, b) => v(b)! - v(a)!);
  const hit = await namedPlayer(ctx, intent);
  if (hit) {
    const row = all.find((r) => r.id === hit.playerId);
    if (!row || !thisSeason(row) || v(row) === null || !row.p.gp) return text(T(lang, `${hit.name} は今季まだ出場がありません。`, `${hit.name} has not played this season.`));
    const rank = pool.findIndex((r) => r.id === hit.playerId) + 1;
    return text(
      T(
        lang,
        `${hit.name}（${teamName(hit.teamId, lang)}）の${per}分あたりの${label}は ${n1(v(row)!)}${rank ? `（${pool.length}人中${rank}位）` : ""}。実際は平均${n1(row.p.mpg)}分で${n1(Number(row.p[key] ?? 0))}。`,
        `${hit.name} per ${per}: ${n1(v(row)!)} ${label}${rank ? ` (#${rank} of ${pool.length})` : ""}. Actual: ${n1(Number(row.p[key] ?? 0))} in ${n1(row.p.mpg)} MPG.`
      )
    );
  }
  const scope = scopeOf(ctx, intent);
  const scoped = pool.filter((r) => scope.ok(r));
  if (scoped.length === 0) return null;
  const top = scoped[0]!;
  return boardAnswer(
    T(lang, `今季${scope.label ? `の${scope.label}で` : ""}${per}分あたりの${label}がいちばん多いのは${who(lang, top)}・${n1(v(top)!)}（平均${n1(top.p.mpg)}分）。`, `Most ${label} per ${per}: ${top.name} (${abbr(top.teamId)}) ${n1(v(top)!)}.`),
    {
      columns: [T(lang, `${per}分あたり`, `Per ${per}`), T(lang, "平均", "Avg"), T(lang, "出場分", "MIN")],
      rows: scoped.slice(0, 8).map((r) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [n1(v(r)!), n1(Number(r.p[key] ?? 0)), n1(r.p.mpg)] })),
      note: T(lang, `今季${minGp}試合以上・平均15分以上の選手。`, `${minGp}+ GP, 15+ MPG.`),
    }
  );
}

// ---------------------------------------------------------------------------
// エリア別のシュート（shot charts のシーズン合計）
// ---------------------------------------------------------------------------

const ZONES: ReadonlyArray<[RegExp, NbaShotAreaId[], string, string]> = [
  [/左.?コーナー|left\s+corner/i, ["left_corner_3"], "左コーナーの3P", "left-corner 3"],
  [/右.?コーナー|right\s+corner/i, ["right_corner_3"], "右コーナーの3P", "right-corner 3"],
  [/コーナー|corner/i, ["left_corner_3", "right_corner_3"], "コーナーの3P", "corner 3"],
  [/トップ(?:から|の)(?:スリー|3)|トップ.?オブ.?(?:ザ.?)?キー|top\s+of\s+the\s+key/i, ["top_3"], "トップの3P", "top-of-key 3"],
  [/45度|ウイング|ウィング|wing\s*3/i, ["left_wing_3", "right_wing_3"], "45度の3P", "wing 3"],
  [/ミドル|ミッド.?レンジ|中距離|mid.?range/i, ["mid"], "ミドルレンジ", "mid-range"],
  [/ゴール下|リム|制限区域|リング下|at\s+the\s+rim|restricted/i, ["restricted"], "ゴール下（制限区域）", "restricted area"],
  [/ペイント.{0,4}(?:シュート|成功率|確率|FG|うまい|打)/i, ["paint"], "ペイント（制限区域の外）", "paint (non-RA)"],
];

async function zoneQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || nbaAskNicknamePlayer(q)) return null;
  const zone = ZONES.find(([re]) => re.test(q));
  if (!zone) return null;
  const [, ids, labelJa, labelEn] = zone;
  const volume = /多く打|たくさん打|試投|本数|打って(?:い)?る|打つ|attempts?/i.test(q) && !/うまい|上手|成功率|確率|精度|入る|accura|pct|%/i.test(q);
  const made = /決め|成功数|入れ|makes?/i.test(q) && !/成功率|確率/.test(q);
  const doc = await loadNbaPlayerShotAreas(ctx.db, CURRENT_NBA_SEASON_KEY);
  if (!doc || Object.keys(doc.players ?? {}).length === 0) return text(T(lang, "エリア別のシュートはまだ集計がありません。", "No shot area data yet."));
  const all = await rosterRows(ctx);
  const byId = new Map(all.map((r) => [r.id, r]));
  const scope = scopeOf(ctx, intent);
  const rows = Object.entries(doc.players).flatMap(([pid, counts]) => {
    const r = byId.get(pid);
    if (!r || !scope.ok(r)) return [];
    let m = 0;
    let a = 0;
    for (const id of ids) {
      m += counts[id]?.[0] ?? 0;
      a += counts[id]?.[1] ?? 0;
    }
    return a > 0 ? [{ r, m, a, pct: m / a }] : [];
  });
  if (rows.length === 0) return text(T(lang, `${labelJa}のデータはまだありません。`, `No ${labelEn} data yet.`));
  const totalM = rows.reduce((s, x) => s + x.m, 0);
  const totalA = rows.reduce((s, x) => s + x.a, 0);
  const league = totalA ? totalM / totalA : null;
  /** 成功率は試投の少ない選手が上に来るので、リーグ上位 30 人目の試投数の 6 割（最低 15 本）を下限にする */
  const att = rows.map((x) => x.a).sort((a, b) => b - a);
  const minA = Math.max(15, Math.round((att[Math.min(29, att.length - 1)] ?? 0) * 0.6));
  const pool = volume || made ? rows : rows.filter((x) => x.a >= minA);
  const sorted = [...pool].sort((a, b) => (volume ? b.a - a.a : made ? b.m - a.m : b.pct - a.pct || b.a - a.a));
  const low = LOW.test(q) && !volume && !made;
  if (low) sorted.reverse();
  const top = sorted[0]!;
  const fmtRow = (x: (typeof rows)[number]) => `${pct1(x.pct)}（${x.m}/${x.a}）`;
  const head = volume
    ? T(lang, `今季${labelJa}をいちばん多く打っているのは${who(lang, top.r)}・${top.a}本（成功率 ${pct1(top.pct)}）。`, `Most ${labelEn} attempts: ${top.r.name} (${top.a}).`)
    : made
      ? T(lang, `今季${labelJa}をいちばん多く決めているのは${who(lang, top.r)}・${top.m}本（${top.a}本中）。`, `Most ${labelEn} makes: ${top.r.name} (${top.m}).`)
      : T(lang, `今季${labelJa}の成功率がいちばん${low ? "低い" : "高い"}のは${who(lang, top.r)}・${fmtRow(top)}。${league !== null ? `リーグ全体は ${pct1(league)}。` : ""}`, `${low ? "Lowest" : "Best"} ${labelEn} FG%: ${top.r.name} ${fmtRow(top)}.`);
  return boardAnswer(head, {
    columns: [T(lang, "成功率", "FG%"), T(lang, "成功/試投", "M/A")],
    rows: sorted.slice(0, 8).map((x) => ({ label: `${x.r.name} ${abbr(x.r.teamId)}`, cells: [pct1(x.pct), `${x.m}/${x.a}`] })),
    note: T(
      lang,
      `今季レギュラーシーズンのシュート記録から（シーズン合計）。${volume || made ? "" : `成功率は${minA}本以上打った選手だけ。`}`,
      `Season totals from shot charts.${volume || made ? "" : ` Min ${minA} attempts.`}`
    ),
  });
}

// ---------------------------------------------------------------------------
// LEAGUE タブ: 1 試合の最高記録・週間の活躍
// ---------------------------------------------------------------------------

const HIGH_WORDS: ReadonlyArray<[RegExp, LeagueHubHighStat, string, string]> = [
  [/リバウンド/, "reb", "リバウンド", "REB"],
  [/アシスト/, "ast", "アシスト", "AST"],
  [/3P|スリー|3ポイント/i, "fg3m", "3P成功", "3PM"],
  [/スティール/, "stl", "スティール", "STL"],
  [/ブロック/, "blk", "ブロック", "BLK"],
  [/点|得点/, "pts", "得点", "PTS"],
];

async function gameHighQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || nbaAskNicknamePlayer(q) || TEAM_WORD.test(q)) return null;
  if (
    !/1試合|一試合|試合(?:で|の)?(?:最多|最高)|シーズンハイ|今季の?最高|今シーズンの?最高|ゲームハイ|最(?:多|高)得点の?試合|(?:一番|いちばん|最も|もっとも)(?:多く)?(?:点|得点)(?!差)[^。？?]{0,6}試合|single.?game|season.?high/i.test(q)
  ) {
    return null;
  }
  /** 「リバウンド1試合平均トップ10」はシーズン平均の順位 */
  if (/平均|アベレージ|average|per\s*game/i.test(q) && !/最多|最高|シーズンハイ|ゲームハイ|season.?high/i.test(q)) return null;
  /** 「今週の1試合ベスト」は週間の質問 */
  if (/先週|今週|この\s*1\s*週間|この一週間|ここ\s*1\s*週間|ここ一週間|1週間|一週間|週間|this\s+week|last\s+week/i.test(q)) return null;
  const asked = HIGH_WORDS.find(([re]) => re.test(q));
  /** 項目の無い「今季最高のパフォーマンス」は Game Score の 1 試合ベスト */
  if (!asked && BEST_GAME.test(q)) return null;
  const stat = asked ?? HIGH_WORDS[HIGH_WORDS.length - 1]!;
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  const rows = hub?.highs?.[stat[1]] ?? [];
  if (rows.length === 0) return text(T(lang, "今季の1試合の記録はまだ集計がありません。", "No single-game highs yet."));
  const top = rows[0]!;
  const same = rows.filter((r) => r.value === top.value);
  const label = T(lang, stat[2], stat[3]);
  return withHubView(boardAnswer(
    T(
      lang,
      `今季の1試合最多${label}は${same.map((r) => `${who(lang, r)}の${r.value}（${r.dateLabel} 対${teamName(nbaTeamIdFromAbbr(r.oppAbbr) ?? r.oppAbbr, lang)}）`).join("・")}。`,
      `${CURRENT_NBA_SEASON_KEY} single-game ${label} high: ${same.map((r) => `${r.name} ${r.value} (${r.dateLabel} vs ${r.oppAbbr})`).join(", ")}.`
    ),
    {
      columns: [label, T(lang, "試合", "Game")],
      rows: rows.slice(0, 8).map((r) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [String(r.value), `${r.dateLabel} ${r.oppAbbr}`] })),
    }
  ), "highs", stat[1]);
}

function nbaTeamIdFromAbbr(code: string): string | null {
  return resolveNbaAskTeamId(code);
}

async function weekQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || nbaAskNicknamePlayer(q) || TEAM_WORD.test(q) || /ラダー|ladder/i.test(q)) return null;
  if (!/先週|今週|この\s*1\s*週間|この一週間|ここ\s*1\s*週間|ここ一週間|1週間で|一週間で|週間|this\s+week|last\s+week/i.test(q)) return null;
  if (!/活躍|MVP|ベスト|一番|いちばん|誰|良かった|すごかった|トップ|best|top|who/i.test(q)) return null;
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  /** 「1 試合」「パフォーマンス」= 直近 7 日の 1 試合ベスト。それ以外は週の平均 */
  if (/試合|パフォーマンス|ゲーム|game|performance/i.test(q) && hub?.topGames?.games.length) {
    const t = hub.topGames;
    const g = t.games[0]!;
    return withHubView(boardAnswer(
      T(lang, `${t.startLabel}〜${t.endLabel} の1試合でいちばん良かったのは${who(lang, g)}の${g.dateLabel} ${g.home ? "vs" : "@"} ${g.oppAbbr}（${g.result === "W" ? "勝ち" : "負け"}）。${g.pts}点 ${g.reb}リバウンド ${g.ast}アシスト。`, `Best game ${t.startLabel}–${t.endLabel}: ${g.name} ${g.pts}/${g.reb}/${g.ast} (${g.dateLabel} ${g.home ? "vs" : "@"} ${g.oppAbbr}).`),
      {
        columns: T(lang, "得点|リバウンド|アシスト|GmSc", "PTS|REB|AST|GmSc").split("|"),
        rows: t.games.slice(0, 5).map((x) => ({ label: `${x.name} ${abbr(x.teamId)}`, cells: [String(x.pts), String(x.reb), String(x.ast), n1(x.gameScore)] })),
        note: T(lang, "Game Score（得点・効率・リバウンド・アシスト等をまとめた1試合の評価）順・1人1試合。", "By Game Score, one game per player."),
      }
    ), "top_games");
  }
  const w = hub?.week;
  if (!w || w.top.length === 0) return text(T(lang, "週間の集計はまだありません。", "No weekly data yet."));
  const side = /東|イースト|\beast/i.test(q) ? "east" : /西|ウエスト|ウェスト|\bwest/i.test(q) ? "west" : null;
  const sideTop = side ? w[side] : null;
  const top = sideTop ?? w.top[0]!;
  const sideRows = side ? w.top.filter((x) => nbaConferenceForTeam(x.teamId) === side) : w.top;
  /** 「今週」と聞かれても週の集計は前の週（今週の途中は開幕直後だけ） */
  const lastWeekNote = /今週|this\s+week/i.test(q) && !w.inProgress ? T(lang, "今週の分はまだ集計前なので、先週で答えます。", "This week isn't tallied yet; showing last week. ") : "";
  if (side && sideTop) {
    return boardAnswer(
      T(
        lang,
        `${lastWeekNote}${w.startLabel}〜${w.endLabel}に${side === "east" ? "東" : "西"}でいちばん活躍したのは${who(lang, sideTop)}・${sideTop.games}試合で平均${n1(sideTop.pts)}点 ${n1(sideTop.reb)}リバウンド ${n1(sideTop.ast)}アシスト（チームは${sideTop.wins}勝${sideTop.games - sideTop.wins}敗）。`,
        `${side === "east" ? "East" : "West"} player of the week ${w.startLabel}–${w.endLabel}: ${sideTop.name} (${abbr(sideTop.teamId)}) ${n1(sideTop.pts)}/${n1(sideTop.reb)}/${n1(sideTop.ast)}.`
      ),
      {
        columns: T(lang, "試合|得点|リバウンド|アシスト", "G|PTS|REB|AST").split("|"),
        rows: (sideRows.length ? sideRows : [sideTop]).slice(0, 5).map((x) => ({ label: `${x.name} ${abbr(x.teamId)}`, cells: [String(x.games), n1(x.pts), n1(x.reb), n1(x.ast)] })),
        note: T(lang, "月曜〜日曜（米国東部）の Game Score 平均で並べています（UNITERZ の試算）。", "Mon–Sun (US Eastern), by average Game Score."),
      }
    );
  }
  return boardAnswer(
    T(
      lang,
      `${lastWeekNote}${w.startLabel}〜${w.endLabel}${w.inProgress ? "（今週・途中）" : ""}にいちばん活躍したのは${who(lang, top)}・${top.games}試合で平均${n1(top.pts)}点 ${n1(top.reb)}リバウンド ${n1(top.ast)}アシスト（チームは${top.wins}勝${top.games - top.wins}敗）。${w.east && w.west ? `東は${w.east.name}、西は${w.west.name}。` : ""}`,
      `Player of the week ${w.startLabel}–${w.endLabel}: ${top.name} (${abbr(top.teamId)}) ${n1(top.pts)}/${n1(top.reb)}/${n1(top.ast)} in ${top.games} games.`
    ),
    {
      columns: T(lang, "試合|得点|リバウンド|アシスト", "G|PTS|REB|AST").split("|"),
      rows: w.top.slice(0, 5).map((x) => ({ label: `${x.name} ${abbr(x.teamId)}`, cells: [String(x.games), n1(x.pts), n1(x.reb), n1(x.ast)] })),
      note: T(lang, "月曜〜日曜（米国東部）の Game Score 平均で並べています（UNITERZ の試算）。", "Mon–Sun (US Eastern), by average Game Score."),
    }
  );
}

const BEST_GAME = /ベスト.?(?:パフォーマンス|ゲーム)|最高の(?:パフォーマンス|試合)|(?:一番|いちばん|最も)(?:良|よ|すご)かった試合|best\s+(?:game|performance)/i;
/** 今季の 1 試合ベストを探す選手の数（1 試合の最高記録・週間・得点上位に出る選手だけ読む） */
const BEST_GAME_CANDIDATES = 40;

/** 今季の 1 試合ベスト（Game Score）。LEAGUE の TOP PERFORMANCES は直近 7 日だけなので試合ログから */
async function seasonBestGameQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || nbaAskNicknamePlayer(q) || TEAM_WORD.test(q) || !BEST_GAME.test(q)) return null;
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  if (!hub) return text(T(lang, "今季の1試合の記録はまだ集計がありません。", "No single-game data yet."));
  const names = new Map<string, { name: string; teamId: string }>();
  const add = (r: { playerId: string; name: string; teamId: string }) => {
    if (!names.has(r.playerId)) names.set(r.playerId, { name: r.name, teamId: r.teamId });
  };
  for (const rows of Object.values(hub.highs ?? {})) rows.forEach(add);
  (hub.topGames?.games ?? []).forEach(add);
  [...hub.players].sort((a, b) => (b.m.pts ?? 0) - (a.m.pts ?? 0)).forEach(add);
  const ids = [...names.keys()].slice(0, BEST_GAME_CANDIDATES);
  const logs = await Promise.all(ids.map((id) => loadPlayerGameLogsSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY, id)));
  /** Hollinger Game Score */
  const gs = (g: NbaPlayerGameLog) =>
    g.pts + 0.4 * g.fgm - 0.7 * g.fga - 0.4 * (g.fta - g.ftm) + 0.7 * (g.oreb ?? 0) + 0.3 * (g.dreb ?? g.reb - (g.oreb ?? 0)) + g.stl + 0.7 * g.ast + 0.7 * g.blk - 0.4 * (g.pf ?? 0) - g.tov;
  /** 1 人 1 試合 */
  const best = ids
    .flatMap((id, i) => {
      const top = logs[i]!.gameLogs.filter((g) => g.min > 0).sort((a, b) => gs(b) - gs(a))[0];
      return top ? [{ ...names.get(id)!, g: top, score: gs(top) }] : [];
    })
    .sort((a, b) => b.score - a.score);
  if (best.length === 0) return text(T(lang, "今季の1試合の記録はまだ集計がありません。", "No single-game data yet."));
  const top = best[0]!;
  const vs = (g: NbaPlayerGameLog) => `${g.dateLabel} ${g.home ? "vs" : "@"} ${g.oppAbbr}`;
  return boardAnswer(
    T(
      lang,
      `${hub.seasonKey} の1試合でいちばん良かったのは${who(lang, top)}の${top.g.dateLabel} ${top.g.home ? "vs" : "@"} ${teamName(top.g.oppTeamId, lang)}（${top.g.result === "W" ? "勝ち" : "負け"}）。${top.g.pts}点 ${top.g.reb}リバウンド ${top.g.ast}アシスト・FG ${top.g.fgm}/${top.g.fga}（Game Score ${n1(top.score)}）。`,
      `${hub.seasonKey} best single game: ${top.name} ${top.g.pts}/${top.g.reb}/${top.g.ast}, FG ${top.g.fgm}/${top.g.fga} (${vs(top.g)}, Game Score ${n1(top.score)}).`
    ),
    {
      columns: T(lang, "得点|リバウンド|アシスト|GmSc", "PTS|REB|AST|GmSc").split("|"),
      rows: best.slice(0, 5).map((x) => ({
        label: `${x.name} ${abbr(x.teamId)} ${vs(x.g)}`,
        cells: [String(x.g.pts), String(x.g.reb), String(x.g.ast), n1(x.score)],
      })),
      note: T(
        lang,
        "Game Score（得点・効率・リバウンド・アシスト等をまとめた1試合の評価）順・1人1試合。1試合の最高記録や得点上位に出る選手から選んでいます。",
        "By Game Score, one game per player, among players on the single-game and scoring leaderboards."
      ),
    }
  );
}

// ---------------------------------------------------------------------------
// 欠場者（チームを指定しない）
// ---------------------------------------------------------------------------

const INJURY_ORDER: Record<string, number> = { out: 0, doubtful: 1, questionable: 2, "day-to-day": 3, probable: 4 };
const INJURY_JA: Record<string, string> = { out: "欠場", doubtful: "出場は厳しい", questionable: "出場微妙", "day-to-day": "様子見", probable: "出場見込み" };

async function injuryQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || resolveNbaAskTeamId(intent.team) || findNbaAskTeamsInText(q).length > 0 || nbaAskNicknamePlayer(q)) return null;
  if (!/欠場|ケガ|怪我|故障|休む|休場|出ない|出られない|離脱|injur|\bout\b/i.test(q)) return null;
  const day = /明日|tomorrow/i.test(q) ? 1 : /今日|今夜|今晩|tonight|today/i.test(q) ? 0 : null;
  if (day === null && !/主な|誰|だれ|どの選手|一覧|リーグ|全体|大物|スター|主力|who/i.test(q)) return null;
  const injuries = (await loadTeamInjuriesSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).bundle.teams;
  let teams: Set<string> | null = null;
  let dayLabel = "";
  if (day !== null) {
    const today = getTodayKeyInTimeZone(ctx.timeZone);
    const date = shiftDateKeyInTimeZone(today, ctx.timeZone, day) ?? today;
    const games = (await loadGamesOnDate(ctx.db, date, ctx.timeZone)) ?? [];
    teams = new Set(games.flatMap((g) => [String(g.data.homeTeamId ?? ""), String(g.data.awayTeamId ?? "")]).filter(Boolean));
    dayLabel = `${day === 1 ? T(lang, "明日", "Tomorrow") : T(lang, "今日", "Today")}（${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}）`;
    if (teams.size === 0) return text(T(lang, `${dayLabel}は NBA の試合がありません。`, `${dayLabel}: no NBA games.`));
  }
  const all = await rosterRows(ctx);
  const byId = new Map(all.map((r) => [r.id, r]));
  const rows = Object.entries(injuries)
    .filter(([teamId]) => !teams || teams.has(teamId))
    .flatMap(([teamId, list]) =>
      list.flatMap((e) => {
        const r = byId.get(String(e.playerId));
        const status = String(e.status ?? "").toLowerCase();
        return (INJURY_ORDER[status] ?? 9) <= 2 ? [{ teamId, name: r?.name ?? e.name, ppg: r && thisSeason(r) ? r.p.ppg : 0, status }] : [];
      })
    )
    .sort((a, b) => b.ppg - a.ppg || (INJURY_ORDER[a.status] ?? 9) - (INJURY_ORDER[b.status] ?? 9));
  if (rows.length === 0) return text(T(lang, `${dayLabel ? `${dayLabel}の試合に出るチームで` : ""}欠場予定の選手は故障者リストにいません。`, `No one listed out${dayLabel ? ` for ${dayLabel}` : ""}.`));
  const outs = rows.filter((r) => r.status === "out");
  const head = (outs.length ? outs : rows).slice(0, 3);
  return boardAnswer(
    T(
      lang,
      `${dayLabel ? `${dayLabel}の試合で` : "いま"}欠場する主な選手は${head.map((r) => `${r.name}（${teamName(r.teamId, lang)}・平均${n1(r.ppg)}点）`).join("・")}。故障者リストで欠場・出場微妙なのは${rows.length}人。`,
      `Notable absences${dayLabel ? ` ${dayLabel}` : ""}: ${head.map((r) => `${r.name} (${abbr(r.teamId)})`).join(", ")}. ${rows.length} listed out / doubtful / questionable.`
    ),
    {
      columns: [T(lang, "状態", "Status"), T(lang, "得点", "PTS")],
      rows: rows.slice(0, 10).map((r) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [ja(lang) ? (INJURY_JA[r.status] ?? r.status) : r.status, n1(r.ppg)] })),
      note: T(lang, "故障者リストの最新（今季の平均得点が高い順）。", "Latest injury report, by PPG."),
    }
  );
}

// ---------------------------------------------------------------------------
// 契約: FA になる選手
// ---------------------------------------------------------------------------

async function freeAgentQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || nbaAskNicknamePlayer(q)) return null;
  if (!/\bFA\b|フリーエージェント|free\s*agen|契約(?:が|の)?(?:切れ|満了|終わ|最終年)/i.test(q)) return null;
  const explicit = /20(\d{2})/.exec(q);
  const year = explicit ? 2000 + Number(explicit[1]) : /再来年|再来季/.test(q) ? SEASON_START + 2 : SEASON_START + 1;
  const all = await rosterRows(ctx);
  const scope = scopeOf(ctx, intent);
  const pool = all.filter((r) => thisSeason(r) && r.p.gp > 0 && scope.ok(r)).sort(byPpg).slice(0, scope.teamId ? 30 : 250);
  const col = ctx.db.collection(NBA_PLAYER_CONTRACTS_COLLECTION).doc(CURRENT_NBA_SEASON_KEY).collection(NBA_PLAYER_CONTRACTS_PLAYERS_SUB);
  const docs = pool.length
    ? await ctx.db.getAll(...pool.map((r) => col.doc(r.id)), { fieldMask: ["contract.freeAgencyYear", "contract.freeAgencyType", "contract.seasons"] })
    : [];
  const info = new Map<string, { year: number; type: string | null; option: string | null }>();
  for (const d of docs) {
    const c = d.data()?.contract as { freeAgencyYear?: unknown; freeAgencyType?: unknown; seasons?: Array<{ option?: unknown }> } | undefined;
    if (typeof c?.freeAgencyYear !== "number") continue;
    const last = c.seasons?.[c.seasons.length - 1];
    info.set(d.id, { year: c.freeAgencyYear, type: typeof c.freeAgencyType === "string" ? c.freeAgencyType : null, option: typeof last?.option === "string" ? last.option : null });
  }
  if (info.size === 0) return text(T(lang, "契約のデータがまだありません。", "No contract data yet."));
  const hits = pool.filter((r) => info.get(r.id)?.year === year);
  const scopeJa = scope.label ? `${scope.label}の` : "";
  if (hits.length === 0) return text(T(lang, `${scopeJa}主な選手で${year}年夏に FA になる選手はいません。`, `No notable ${year} free agents${scope.label ? ` (${scope.label})` : ""}.`));
  const tag = (r: RosterRow) => {
    const i = info.get(r.id)!;
    return [i.type, i.option === "PO" ? T(lang, "最終年は選手オプション", "player option") : i.option === "TO" ? T(lang, "最終年はチームオプション", "team option") : ""].filter(Boolean).join("・");
  };
  return boardAnswer(
    T(
      lang,
      `${year}年夏に契約が切れて FA になる${scopeJa}主な選手は${hits.slice(0, 3).map((r) => `${who(lang, r)}・平均${n1(r.p.ppg)}点`).join("、")}${hits.length > 3 ? ` ほか${hits.length - 3}人` : ""}。`,
      `${year} free agents${scope.label ? ` (${scope.label})` : ""}: ${hits.slice(0, 3).map((r) => `${r.name} (${abbr(r.teamId)})`).join(", ")}${hits.length > 3 ? ` +${hits.length - 3}` : ""}.`
    ),
    {
      columns: [T(lang, "得点", "PTS"), T(lang, "種類", "Type")],
      rows: hits.slice(0, 10).map((r) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [n1(r.p.ppg), tag(r) || "—"] })),
      note: T(
        lang,
        `${scope.teamId ? "" : "今季の平均得点の上位250人から。"}UFA = 制限なし、RFA = 元のチームが同じ条件で残せる。オプションを使うと FA の年は変わります。`,
        "UFA = unrestricted, RFA = restricted. Options can change the year."
      ),
    }
  );
}

// ---------------------------------------------------------------------------
// チーム: N 点以上の選手の数
// ---------------------------------------------------------------------------

async function scorerCountQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (intent.player || !(TEAM_WORD.test(q) || /どこ/.test(q))) return null;
  const m = /(\d+)\s*点以上.{0,12}(?:選手|人)/.exec(q);
  const th = m ? Number(m[1]) : /二桁得点|2桁得点|ふた桁得点/.test(q) ? 10 : null;
  if (th === null || !/多い|何人|一番|いちばん|最多|most|いる/.test(q)) return null;
  const all = await rosterRows(ctx);
  const minGp = minGpOf(all);
  const byTeam = new Map<string, RosterRow[]>();
  for (const r of all) {
    if (!thisSeason(r) || r.p.gp < minGp || r.p.ppg < th) continue;
    byTeam.set(r.teamId, [...(byTeam.get(r.teamId) ?? []), r]);
  }
  const conf = conferenceFilter(q, intent);
  const sorted = [...byTeam].filter(([t]) => !conf || nbaConferenceForTeam(t) === conf).sort((a, b) => b[1].length - a[1].length);
  if (sorted.length === 0) return text(T(lang, `平均${th}点以上の選手がいるチームはまだありません。`, `No team has a ${th}+ PPG scorer yet.`));
  const n = sorted[0]![1].length;
  const same = sorted.filter(([, l]) => l.length === n);
  return boardAnswer(
    T(
      lang,
      same.length > 2
        ? `平均${th}点以上の選手が${n}人いるチームが${same.length}チームで最多（${same.slice(0, 4).map(([t]) => teamName(t, lang)).join("・")}${same.length > 4 ? " ほか" : ""}）。`
        : `平均${th}点以上の選手がいちばん多いのは${same.map(([t, l]) => `${teamName(t, lang)}（${n}人: ${[...l].sort(byPpg).map((r) => `${r.name} ${n1(r.p.ppg)}`).join("・")}）`).join("・")}。`,
      `Most ${th}+ PPG scorers: ${same.map(([t]) => abbr(t)).join(", ")} (${n}).`
    ),
    {
      columns: [T(lang, "人数", "Players"), T(lang, "選手", "Who")],
      rows: sorted.slice(0, 6).map(([t, l]) => ({ label: teamName(t, lang), cells: [String(l.length), l.sort(byPpg).map((r) => r.name).join(" / ")] })),
      note: T(lang, `今季${minGp}試合以上出場した選手。`, `${minGp}+ GP.`),
    }
  );
}

// ---------------------------------------------------------------------------
// 選手 1 人: 通算 / チーム・選手: 月別
// ---------------------------------------------------------------------------

const CAREER_STATS: ReadonlyArray<[RegExp, "pts" | "reb" | "ast" | "fg3m", string, string]> = [
  [/リバウンド/, "reb", "リバウンド", "REB"],
  [/アシスト/, "ast", "アシスト", "AST"],
  [/3P|スリー|3ポイント/i, "fg3m", "3P成功", "3PM"],
  [/点|得点/, "pts", "得点", "PTS"],
];

async function careerTotalQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (!/通算|キャリア(?:で|の)?(?:合計|総|トータル)|キャリア通算|これまでの合計|career\s+(?:total|points|rebounds|assists)/i.test(q)) return null;
  if (/節目|大台|あと|まで|近い|迫|milestone/i.test(q) || /テクニカル|罰金|退場|フラグラント/.test(q)) return null;
  const hit = await namedPlayer(ctx, intent);
  if (!hit) return null;
  const [career, logs] = await Promise.all([
    loadPlayerCareerSeasonsSnapshot(ctx.db, hit.playerId),
    loadPlayerGameLogsSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY, hit.playerId),
  ]);
  const rows = career.careerSeasons.regular;
  if (rows.length === 0) return text(T(lang, `${hit.name} のキャリア記録はまだありません。`, `No career data for ${hit.name}.`));
  const base = careerBaseFromRows(rows, SEASON_START);
  const now = logs.gameLogs.filter((g) => g.min > 0);
  const total = {
    games: base.games + now.length,
    pts: base.pts + now.reduce((s, g) => s + g.pts, 0),
    reb: base.reb + now.reduce((s, g) => s + g.reb, 0),
    ast: base.ast + now.reduce((s, g) => s + g.ast, 0),
    fg3m: base.fg3m + now.reduce((s, g) => s + g.fg3m, 0),
  };
  const approx = (base.approxGames ?? 0) > 0;
  const first = Math.min(...rows.map((r) => r.seasonStart));
  const stat = CAREER_STATS.find(([re]) => re.test(q)) ?? null;
  const fmtN = (v: number) => `${approx ? "約" : ""}${Math.round(v).toLocaleString("en-US")}`;
  const lead = stat
    ? T(lang, `${hit.name} のレギュラーシーズン通算${stat[2]}は ${fmtN(total[stat[1]])}（${total.games}試合・平均${n1(total[stat[1]] / Math.max(1, total.games))}）。`, `${hit.name} career regular-season ${stat[3]}: ${fmtN(total[stat[1]])} in ${total.games} games.`)
    : T(lang, `${hit.name} のレギュラーシーズン通算は${total.games}試合で ${fmtN(total.pts)}点・${fmtN(total.reb)}リバウンド・${fmtN(total.ast)}アシスト。`, `${hit.name} career regular season: ${fmtN(total.pts)} PTS, ${fmtN(total.reb)} REB, ${fmtN(total.ast)} AST in ${total.games} games.`);
  return boardAnswer(lead, {
    columns: T(lang, "通算|平均", "Total|Avg").split("|"),
    rows: CAREER_STATS.map(([, k, jaL, enL]) => ({ label: T(lang, jaL, enL), cells: [fmtN(total[k]), n1(total[k] / Math.max(1, total.games))] })),
    note: T(
      lang,
      `${first}-${String(first + 1).slice(-2)} から今季まで（今季は${now.length}試合）。プレーオフは含みません。${approx ? "一部のシーズンは平均 × 試合数の概算です。" : ""}`,
      `${first}-${String(first + 1).slice(-2)} to date. Regular season only.${approx ? " Some seasons are estimated." : ""}`
    ),
  });
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthOfLabel(label: string): number | null {
  const slash = /^(\d{1,2})\//.exec(label);
  if (slash) return Number(slash[1]);
  const i = MONTHS_EN.findIndex((m) => label.startsWith(m));
  return i >= 0 ? i + 1 : null;
}

/** 「ミッチェルの月別の成績」= 月ごとの平均（選手）/ 勝敗（チーム） */
async function monthlyBreakdown(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const lang = ctx.language;
  const order = (month: number) => (month >= 8 ? month : month + 12);
  const hit = await namedPlayer(ctx, intent);
  if (hit) {
    const logs = (await loadPlayerGameLogsSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY, hit.playerId)).gameLogs.filter((g) => g.min > 0);
    if (logs.length === 0) return text(T(lang, `${hit.name} は今季まだ出場がありません。`, `${hit.name} has not played this season.`));
    const by = new Map<number, typeof logs>();
    for (const g of logs) {
      const month = monthOfLabel(g.dateLabel);
      if (month) by.set(month, [...(by.get(month) ?? []), g]);
    }
    const months = [...by.keys()].sort((a, b) => order(a) - order(b));
    const avg = (list: typeof logs, k: "pts" | "reb" | "ast") => list.reduce((s, g) => s + g[k], 0) / list.length;
    const line = months.map((month) => `${month}月 ${n1(avg(by.get(month)!, "pts"))}点`).join("・");
    return boardAnswer(
      T(lang, `${hit.name} の今季の月別の平均得点: ${line}。`, `${hit.name} by month: ${months.map((month) => `${month}: ${n1(avg(by.get(month)!, "pts"))}`).join(", ")}.`),
      {
        columns: T(lang, "試合|得点|リバウンド|アシスト", "G|PTS|REB|AST").split("|"),
        rows: months.map((month) => {
          const list = by.get(month)!;
          return { label: T(lang, `${month}月`, `M${month}`), cells: [String(list.length), n1(avg(list, "pts")), n1(avg(list, "reb")), n1(avg(list, "ast"))] };
        }),
      }
    );
  }
  const teamId = resolveNbaAskTeamId(intent.team) ?? findNbaAskTeamsInText(ctx.question)[0] ?? null;
  if (!teamId) return null;
  const games = (await loadTeamGameLogDetail(ctx.db, CURRENT_NBA_SEASON_KEY, teamId)).detail?.games ?? [];
  if (games.length === 0) return text(T(lang, `${teamName(teamId, lang)}は今季まだ試合がありません。`, `${abbr(teamId)} has no games yet.`));
  const by = new Map<number, typeof games>();
  for (const g of games) {
    const month = monthOfLabel(g.dateLabel);
    if (month) by.set(month, [...(by.get(month) ?? []), g]);
  }
  const months = [...by.keys()].sort((a, b) => order(a) - order(b));
  const rec = (list: typeof games) => ({ wins: list.filter((g) => g.result === "W").length, losses: list.filter((g) => g.result === "L").length });
  return boardAnswer(
    T(lang, `${teamName(teamId, lang)}の今季の月別: ${months.map((month) => `${month}月 ${wl(rec(by.get(month)!), lang)}`).join("・")}。`, `${abbr(teamId)} by month: ${months.map((month) => `${month}: ${wl(rec(by.get(month)!), lang)}`).join(", ")}.`),
    {
      columns: T(lang, "勝敗|得点|失点", "W-L|PTS|OPP").split("|"),
      rows: months.map((month) => {
        const list = by.get(month)!;
        return {
          label: T(lang, `${month}月`, `M${month}`),
          cells: [wl(rec(list), lang), n1(list.reduce((s, g) => s + g.teamScore, 0) / list.length), n1(list.reduce((s, g) => s + g.oppScore, 0) / list.length)],
        };
      }),
      note: T(lang, "日付は日本時間で数えています。", "Dates in Japan time."),
    }
  );
}

/** 「今季のドラフト1位の選手」= 今季ドラフト組（ロスターの指名順） */
async function draftPickQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question.normalize("NFKC");
  const lang = ctx.language;
  if (intent.player) return null;
  if (/ドラフト外|ドラフトされ(?:て(?:い)?)?なかった|指名されなかった|undrafted/i.test(q)) {
    const all = await rosterRows(ctx);
    const scope = scopeOf(ctx, intent);
    const st = rosterStatOf(q);
    const minGp = minGpOf(all);
    const pool = all.filter((r) => scope.ok(r) && (r.p.draftYear === null || r.p.draftRound === null) && thisSeason(r) && r.p.gp >= minGp).sort(byStat(st));
    if (pool.length === 0) return text(T(lang, "条件に合うドラフト外の選手はいません。", "No undrafted players match."));
    const top = pool[0]!;
    const v = (r: RosterRow) => n1(r.p[st.key] ?? 0);
    return boardAnswer(
      T(
        lang,
        `今季のドラフト外の選手（${minGp}試合以上）で${statLead(lang, st)}のは${who(lang, top)}・平均${v(top)}${st.unit}。続いて${pool.slice(1, 3).map((r) => `${r.name} ${v(r)}`).join("・")}。`,
        `Top undrafted (${st.en}): ${top.name} (${abbr(top.teamId)}) ${v(top)}.`
      ),
      {
        columns: [T(lang, st.ja, st.en), T(lang, "試合", "GP")],
        rows: pool.slice(0, 8).map((r) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [v(r), String(r.p.gp)] })),
      }
    );
  }
  const m = /ドラフト\s*(?:全体)?\s*(\d{1,2})\s*位|全体\s*(\d{1,2})\s*位|(\d{1,2})\s*位指名|(?:no\.?\s*|#)(\d{1,2})\s*pick/i.exec(q);
  if (!m || !/選手|誰|だれ|who/i.test(q)) return null;
  const pick = Number(m[1] ?? m[2] ?? m[3] ?? m[4]);
  const yearM = /(20\d{2})\s*年?/.exec(q);
  const year = yearM ? Number(yearM[1]) : /去年|昨年|昨季|前季/.test(q) ? SEASON_START - 1 : SEASON_START;
  const all = await rosterRows(ctx);
  const hit = all.find((r) => r.p.draftYear === year && r.p.draftRound === 1 && r.p.draftNumber === pick);
  if (!hit) return text(T(lang, `${year}年ドラフト全体${pick}位の選手は今季のロスターにいません。`, `No ${year} #${pick} pick on current rosters.`));
  const classmates = all.filter((r) => r.p.draftYear === year && r.p.draftRound === 1 && typeof r.p.draftNumber === "number").sort((a, b) => a.p.draftNumber! - b.p.draftNumber!);
  return boardAnswer(
    T(
      lang,
      `${year}年ドラフト全体${pick}位は${who(lang, hit)}。${thisSeason(hit) && hit.p.gp ? `今季は${hit.p.gp}試合で平均${n1(hit.p.ppg)}点 ${n1(hit.p.rpg ?? 0)}リバウンド ${n1(hit.p.apg ?? 0)}アシスト。` : "今季はまだ出場がありません。"}`,
      `${year} #${pick} pick: ${hit.name} (${abbr(hit.teamId)}).`
    ),
    {
      columns: T(lang, "指名|得点|試合", "Pick|PTS|GP").split("|"),
      rows: classmates.slice(0, 10).map((r) => ({ label: `${r.name} ${abbr(r.teamId)}`, cells: [String(r.p.draftNumber), thisSeason(r) && r.p.gp ? n1(r.p.ppg) : "—", thisSeason(r) ? String(r.p.gp) : "0"] })),
    }
  );
}

async function monthQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (/月別|月ごと|毎月|月単位|by\s+month|monthly/i.test(q)) return monthlyBreakdown(ctx, intent);
  const m = /(\d{1,2})\s*月(?!\s*\d)/.exec(q);
  if (!m || !/成績|勝敗|何勝|勝率|平均|スタッツ|得点|調子|どう|record|average/i.test(q)) return null;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return null;
  const note = T(lang, "日付は日本時間で数えています。", "Dates in Japan time.");
  const venue = /ホーム|本拠地|\bhome\b/i.test(q) ? true : /アウェー|アウェイ|敵地|ロード|\baway\b|\broad\b/i.test(q) ? false : null;
  const venueOk = (home: boolean) => venue === null || home === venue;
  const vj = venue === null ? "" : venue ? "のホーム" : "のアウェー";
  const hit = await namedPlayer(ctx, intent);
  if (hit) {
    const logs = (await loadPlayerGameLogsSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY, hit.playerId)).gameLogs.filter(
      (g) => g.min > 0 && monthOfLabel(g.dateLabel) === month && venueOk(g.home)
    );
    if (logs.length === 0) return text(T(lang, `${hit.name} は今季${month}月${vj}にまだ試合がありません。`, `${hit.name} has no games in month ${month} yet.`));
    const avg = (k: "pts" | "reb" | "ast") => logs.reduce((s, g) => s + g[k], 0) / logs.length;
    const fga = logs.reduce((s, g) => s + g.fga, 0);
    const w = logs.filter((g) => g.result === "W").length;
    return boardAnswer(
      T(lang, `${hit.name} の${month}月${vj}（${logs.length}試合）は平均 ${n1(avg("pts"))}点 ${n1(avg("reb"))}リバウンド ${n1(avg("ast"))}アシスト${fga ? `・FG ${pct1(logs.reduce((s, g) => s + g.fgm, 0) / fga)}` : ""}。チームは${w}勝${logs.length - w}敗。`, `${hit.name} in month ${month} (${logs.length} games): ${n1(avg("pts"))}/${n1(avg("reb"))}/${n1(avg("ast"))}.`),
      {
        columns: T(lang, "得点|リバウンド|アシスト", "PTS|REB|AST").split("|"),
        rows: logs.slice(0, 10).map((g) => ({ label: `${g.dateLabel} ${g.home ? "vs" : "@"} ${g.oppAbbr} ${g.result}`, cells: [String(g.pts), String(g.reb), String(g.ast)] })),
        note,
      }
    );
  }
  const teamId = resolveNbaAskTeamId(intent.team) ?? findNbaAskTeamsInText(q)[0] ?? null;
  if (!teamId) return null;
  const games = ((await loadTeamGameLogDetail(ctx.db, CURRENT_NBA_SEASON_KEY, teamId)).detail?.games ?? []).filter(
    (g) => monthOfLabel(g.dateLabel) === month && venueOk(g.home)
  );
  if (games.length === 0) return text(T(lang, `${teamName(teamId, lang)}は今季${month}月${vj}にまだ試合がありません。`, `${abbr(teamId)} has no games in month ${month} yet.`));
  const rec = { wins: games.filter((g) => g.result === "W").length, losses: games.filter((g) => g.result === "L").length };
  const pf = games.reduce((s, g) => s + g.teamScore, 0) / games.length;
  const pa = games.reduce((s, g) => s + g.oppScore, 0) / games.length;
  return boardAnswer(
    T(lang, `${teamName(teamId, lang)}の${month}月${vj}は ${wl(rec, lang)}（平均 ${n1(pf)}点・失点 ${n1(pa)}、得失点差 ${s1(pf - pa)}）。`, `${abbr(teamId)} in month ${month}: ${wl(rec, lang)} (${n1(pf)}-${n1(pa)}).`),
    {
      columns: T(lang, "結果|スコア", "W/L|Score").split("|"),
      rows: games.slice(0, 12).map((g) => ({ label: `${teamDate(lang, g.dateLabel)} ${g.home ? "vs" : "@"} ${g.oppAbbr}`, cells: [ja(lang) ? (g.result === "W" ? "勝" : "敗") : g.result, `${g.teamScore}-${g.oppScore}`] })),
      note,
    }
  );
}

// ---------------------------------------------------------------------------
// チームの状況別: 接戦・「ホームで負け越しなのにプレーオフ圏」・2 チームの対戦結果
// ---------------------------------------------------------------------------

/** チーム試合ログの「Nov 5」→「11月5日」 */
const teamDate = (lang: string, label: string) => {
  const m = monthOfLabel(label);
  const d = /(\d{1,2})\s*$/.exec(label)?.[1];
  return ja(lang) && m && d ? `${m}月${d}日` : label;
};

const CLOSE = /接戦|僅差|競った|クロスゲーム|5点差|close\s+games?/i;
const isW = (lang: string, r: string) => (ja(lang) ? (r === "W" ? "勝" : "敗") : r);

/** 「ウォリアーズの接戦の成績」（team_splits に接戦が無いので hub の close + 試合ログ） */
async function teamCloseQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (!CLOSE.test(q)) return null;
  const teams = findNbaAskTeamsInText(q);
  const teamId = teams.length === 1 ? teams[0]! : teams.length === 0 && !intent.opponent ? resolveNbaAskTeamId(intent.team) : null;
  if (!teamId) return null;
  const [hub, detail] = await Promise.all([
    loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY).then((r) => r.hub),
    loadTeamGameLogDetail(ctx.db, CURRENT_NBA_SEASON_KEY, teamId).then((r) => r.detail),
  ]);
  const games = (detail?.games ?? []).filter((g) => Math.abs(g.teamScore - g.oppScore) <= 5);
  const row = hub?.teams.find((t) => t.teamId === teamId);
  const rec = row?.close ?? { wins: games.filter((g) => g.result === "W").length, losses: games.filter((g) => g.result === "L").length };
  const tn = teamName(teamId, lang);
  if (rec.wins + rec.losses === 0) return text(T(lang, `${tn}は今季まだ5点差以内の接戦がありません。`, `${abbr(teamId)} has no games within 5 yet.`));
  const pctOf = (r: { wins: number; losses: number }) => r.wins / Math.max(1, r.wins + r.losses);
  const ranked = (hub?.teams ?? []).filter((t) => t.close && t.close.wins + t.close.losses > 0).sort((a, b) => pctOf(b.close!) - pctOf(a.close!));
  const rank = ranked.findIndex((t) => t.teamId === teamId) + 1;
  return boardAnswer(
    T(
      lang,
      `${tn}の今季の接戦（5点差以内で決着）は ${wl(rec, lang)}（勝率 ${pct1(pctOf(rec))}${rank ? `・リーグ${rank}位` : ""}）。`,
      `${abbr(teamId)} in games within 5: ${wl(rec, lang)}${rank ? ` (#${rank})` : ""}.`
    ),
    {
      columns: T(lang, "結果|スコア", "W/L|Score").split("|"),
      rows: games.slice(0, 10).map((g) => ({ label: `${teamDate(lang, g.dateLabel)} ${g.home ? "vs" : "@"} ${g.oppAbbr}`, cells: [isW(lang, g.result), `${g.teamScore}-${g.oppScore}`] })),
      note: T(lang, "勝率の順位は接戦が1試合以上あるチームの中。", "Rank among teams with a close game."),
    }
  );
}

const SITUATION_RECORDS: ReadonlyArray<[RegExp, "home" | "away" | "b2b" | "close" | "vsOver500" | "last10", string]> = [
  [/ホーム|本拠地/, "home", "ホーム"],
  [/アウェー|アウェイ|敵地|ロード/, "away", "アウェー"],
  [/連戦|B2B|バック.?トゥ.?バック/i, "b2b", "連戦2日目"],
  [CLOSE, "close", "接戦"],
  [/(?:勝ち越し|強い|上位)(?:チーム|相手)(?:に|と|相手|で)/, "vsOver500", "勝ち越しチーム相手"],
  [/直近10|最近10|ここ10/, "last10", "直近10試合"],
];

/** 「ホームで負け越してるのにプレーオフ圏のチーム」= 状況の勝ち越し / 負け越し × 順位の帯 */
async function situationZoneQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  const losing = /負け越|勝率.{0,4}5割(?:未満|以下|を?切)/.test(q);
  const winning = !losing && /勝ち越し(?:て|た|の|が)|勝率.{0,4}5割(?:以上|超)/.test(q);
  if (!losing && !winning) return null;
  const zone = /プレーオフ圏外|圏外/.test(q) ? "out" : /プレーイン/.test(q) ? "playin" : /プレーオフ圏|プレーオフ(?:に)?(?:いる|入って)|上位/.test(q) ? "in" : null;
  const sit = SITUATION_RECORDS.find(([re, key]) => key !== "vsOver500" && re.test(q)) ?? SITUATION_RECORDS.find(([re]) => re.test(q));
  if (!zone || !sit) return null;
  const season = CURRENT_NBA_SEASON_KEY;
  const [hub, board] = await Promise.all([
    loadNbaLeagueHubSnapshot(ctx.db, season).then((r) => r.hub),
    ctx.db.collection(NBA_CONFERENCE_STANDINGS_COLLECTION).doc(season).get().then((d) => readStandingsBoard(d.data())),
  ]);
  if (!hub || !board) return text(T(lang, "今季の順位・状況別の成績がまだありません。", "No standings yet this season."));
  const conf = conferenceFilter(q, intent);
  const inZone = (rank: number) => (zone === "out" ? rank >= 11 : zone === "playin" ? rank >= 7 && rank <= 10 : rank <= 6);
  const seeds = [...board.east, ...board.west].filter((r) => inZone(r.rank) && (!conf || nbaConferenceForTeam(r.teamId) === conf));
  const rankOf = new Map(seeds.map((r) => [r.teamId, r.rank]));
  const rows = hub.teams.flatMap((t) => {
    const r = t[sit[1]];
    if (!rankOf.has(t.teamId) || !r || r.wins + r.losses === 0) return [];
    return (losing ? r.wins < r.losses : r.wins > r.losses) ? [{ t, r }] : [];
  });
  const zoneJa = zone === "out" ? "プレーオフ圏外（11位以下）" : zone === "playin" ? "プレーイン圏（7〜10位）" : "プレーオフ圏（6位以内）";
  const confJa = conf ? (conf === "east" ? "東の" : "西の") : "";
  const cond = `${sit[2]}で${losing ? "負け越し" : "勝ち越し"}`;
  if (rows.length === 0) return text(T(lang, `${season} の${confJa}${zoneJa}で${cond}のチームはありません。`, `No such teams.`));
  rows.sort((a, b) => a.r.wins / (a.r.wins + a.r.losses) - b.r.wins / (b.r.wins + b.r.losses));
  if (!losing) rows.reverse();
  return boardAnswer(
    T(
      lang,
      `${season} の${confJa}${zoneJa}で${cond}のチームは${rows.length}つ: ${rows.map(({ t, r }) => `${teamName(t.teamId, lang)}（${wl(r, lang)}・全体 ${t.wins}勝${t.losses}敗）`).join("、")}。`,
      `${rows.length} team(s): ${rows.map(({ t, r }) => `${abbr(t.teamId)} (${wl(r, lang)})`).join(", ")}.`
    ),
    {
      columns: [T(lang, sit[2], sit[1]), T(lang, "全体", "Overall"), T(lang, "順位", "Seed")],
      rows: rows.map(({ t, r }) => ({ label: teamName(t.teamId, lang), cells: [wl(r, lang), `${t.wins}-${t.losses}`, `${nbaConferenceForTeam(t.teamId) === "east" ? T(lang, "東", "E") : T(lang, "西", "W")}${rankOf.get(t.teamId)}`] })),
    }
  );
}

/** 「サンダーのアウェーで負けた試合」= 条件に合う試合の一覧（ホーム / アウェー・接戦・月・相手で絞る） */
async function teamGamesListQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  const lost = /(?:負けた|負け|敗れた|敗戦した?)(?:試合|ゲーム)/.test(q);
  const won = /(?:勝った|勝ち|勝利した?)(?:試合|ゲーム)/.test(q);
  if (lost === won || intent.player || nbaAskNicknamePlayer(q)) return null;
  if (/平均|スタッツ|成績|勝率|何勝|得点|リバウンド|アシスト|欠場|休んだ|出なかった/.test(q)) return null;
  const inText = findNbaAskTeamsInText(q);
  const teamId = inText[0] ?? resolveNbaAskTeamId(intent.team);
  if (!teamId) return null;
  const oppId = inText[1] ?? resolveNbaAskTeamId(intent.opponent);
  const venue = /ホーム|本拠地/.test(q) ? true : /アウェー|アウェイ|敵地|ロード/.test(q) ? false : null;
  const month = /(\d{1,2})\s*月(?!\s*\d)/.exec(q);
  const games = ((await loadTeamGameLogDetail(ctx.db, CURRENT_NBA_SEASON_KEY, teamId)).detail?.games ?? []).filter(
    (g) =>
      g.result === (lost ? "L" : "W") &&
      (venue === null || g.home === venue) &&
      (!oppId || oppId === teamId || g.oppTeamId === oppId) &&
      (!CLOSE.test(q) || Math.abs(g.teamScore - g.oppScore) <= 5) &&
      (!month || monthOfLabel(g.dateLabel) === Number(month[1]))
  );
  const cond = [
    month ? `${month[1]}月` : "",
    oppId && oppId !== teamId ? `${teamName(oppId, lang)}戦` : "",
    venue === null ? "" : venue ? "ホーム" : "アウェー",
    CLOSE.test(q) ? "接戦" : "",
  ]
    .filter(Boolean)
    .join("・");
  const what = `${cond ? `${cond}で` : ""}${lost ? "負けた" : "勝った"}試合`;
  const tn = teamName(teamId, lang);
  if (games.length === 0) return text(T(lang, `${tn}は今季まだ${what}がありません。`, `${abbr(teamId)} has no such games yet.`));
  const margin = games.reduce((s, g) => s + g.teamScore - g.oppScore, 0) / games.length;
  const line = (g: (typeof games)[number]) => `${teamDate(lang, g.dateLabel)} ${g.home ? "vs" : "@"} ${teamName(g.oppTeamId, lang)} ${g.teamScore}-${g.oppScore}`;
  return boardAnswer(
    T(
      lang,
      `${tn}の今季の${what}は${games.length}試合（平均 ${s1(margin)}点差）。${games.slice(0, 3).map(line).join("、")}${games.length > 3 ? ` ほか${games.length - 3}試合` : ""}。`,
      `${abbr(teamId)}: ${games.length} game(s).`
    ),
    {
      columns: T(lang, "スコア|点差", "Score|Diff").split("|"),
      rows: games.slice(0, 12).map((g) => ({ label: `${teamDate(lang, g.dateLabel)} ${g.home ? "vs" : "@"} ${g.oppAbbr}`, cells: [`${g.teamScore}-${g.oppScore}`, s1(g.teamScore - g.oppScore)] })),
      note: T(lang, "日付は日本時間。", "Dates in Japan time."),
    }
  );
}

/** 「今季のレイカーズ対ウォリアーズの結果」= 済んだ直接対決の一覧 */
async function headToHeadQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (!/結果|対戦成績|戦績|勝敗|何勝|直接対決|どっちが勝った|どちらが勝った|スコア|戦の成績|との成績|との対戦|head.?to.?head/i.test(q)) return null;
  if (/今日|明日|あした|次|予想|勝つ|勝てる|日程|いつ|予定|勝ちそう/.test(q)) return null;
  const inText = findNbaAskTeamsInText(q);
  const [a, b] = inText.length >= 2 ? inText : [resolveNbaAskTeamId(intent.team), resolveNbaAskTeamId(intent.opponent)];
  if (!a || !b || a === b) return null;
  const games = ((await loadTeamGameLogDetail(ctx.db, CURRENT_NBA_SEASON_KEY, a)).detail?.games ?? []).filter((g) => g.oppTeamId === b);
  const ta = teamName(a, lang);
  const tb = teamName(b, lang);
  if (games.length === 0) return text(T(lang, `${ta}と${tb}は今季まだ対戦していません。`, `${abbr(a)} and ${abbr(b)} have not met this season.`));
  const rec = { wins: games.filter((g) => g.result === "W").length, losses: games.filter((g) => g.result === "L").length };
  return boardAnswer(
    T(
      lang,
      `今季の${ta}対${tb}は${games.length}試合で${ta}の${wl(rec, lang)}。${games.map((g) => `${teamDate(lang, g.dateLabel)} ${g.teamScore}-${g.oppScore}（${g.home ? `${ta}のホーム` : `${tb}のホーム`}・${ta}${g.result === "W" ? "勝ち" : "負け"}）`).join("、")}。`,
      `${abbr(a)} vs ${abbr(b)} this season: ${abbr(a)} ${wl(rec, lang)}.`
    ),
    {
      columns: T(lang, `${ta}|スコア`, `${abbr(a)}|Score`).split("|"),
      rows: games.map((g) => ({ label: `${teamDate(lang, g.dateLabel)} ${g.home ? "vs" : "@"} ${abbr(b)}`, cells: [isW(lang, g.result), `${g.teamScore}-${g.oppScore}`] })),
      note: T(lang, "日付は日本時間。", "Dates in Japan time."),
    }
  );
}

// ---------------------------------------------------------------------------
// 日付の box: 「昨日ダブルダブルした選手」
// ---------------------------------------------------------------------------

async function dateDoubleQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  const dd = /(トリプル.?ダブル|ダブル.?ダブル|triple.?double|double.?double)/i.exec(q);
  if (!dd || intent.player) return null;
  const shift = /一昨日|おととい/.test(q) ? -2 : /昨日|きのう|昨晩|昨夜|yesterday/i.test(q) ? -1 : /今日|きょう|today|tonight/i.test(q) ? 0 : null;
  const tz = ctx.timeZone;
  const today = getTodayKeyInTimeZone(tz);
  const date = shift !== null ? (shiftDateKeyInTimeZone(today, tz, shift) ?? today) : intent.date;
  if (!date) return null;
  const triple = /トリプル|triple/i.test(dd[1]!);
  const games = (await loadGamesOnDate(ctx.db, date, tz, { box: true })) ?? [];
  const hits: Array<{ name: string; teamId: string; p: LiveGameBoxPlayer; opp: string }> = [];
  let withBox = 0;
  for (const g of games) {
    const live = normalizeLiveGameStatsDoc((g.data as Record<string, unknown>).liveStats);
    if (!live) continue;
    withBox++;
    const homeId = String((g.data as Record<string, unknown>).homeTeamId ?? "");
    const awayId = String((g.data as Record<string, unknown>).awayTeamId ?? "");
    for (const [side, teamId, opp] of [["home", homeId, awayId], ["away", awayId, homeId]] as const) {
      for (const p of live.box[side] ?? []) {
        const tens = [p.pts, p.reb, p.ast, p.stl, p.blk].filter((v) => v >= 10).length;
        if (tens >= (triple ? 3 : 2)) hits.push({ name: `${p.firstName} ${p.lastName}`.trim(), teamId, p, opp });
      }
    }
  }
  const kind = T(lang, triple ? "トリプルダブル" : "ダブルダブル", triple ? "triple-doubles" : "double-doubles");
  const day = T(lang, `${date}（日本時間）`, `${date} (Japan time)`);
  if (withBox === 0) return text(T(lang, `${day}の試合の box スコアはまだありません。`, `No box scores for ${date} yet.`));
  if (hits.length === 0) return text(T(lang, `${day}の${withBox}試合で${kind}はいませんでした。`, `No ${kind} on ${date} (${withBox} games).`));
  hits.sort((a, b) => b.p.pts - a.p.pts);
  return boardAnswer(
    T(
      lang,
      `${day}の${withBox}試合で${kind}は${hits.length}人: ${hits.slice(0, 5).map((h) => `${h.name}（${teamName(h.teamId, lang)}）${h.p.pts}点 ${h.p.reb}リバウンド ${h.p.ast}アシスト`).join("、")}${hits.length > 5 ? ` ほか${hits.length - 5}人` : ""}。`,
      `${hits.length} ${kind} on ${date}: ${hits.slice(0, 5).map((h) => `${h.name} ${h.p.pts}/${h.p.reb}/${h.p.ast}`).join(", ")}.`
    ),
    {
      columns: T(lang, "得点|リバウンド|アシスト|相手", "PTS|REB|AST|Opp").split("|"),
      rows: hits.slice(0, 12).map((h) => ({ label: `${h.name} ${abbr(h.teamId)}`, cells: [String(h.p.pts), String(h.p.reb), String(h.p.ast), abbr(h.opp)] })),
    }
  );
}

// ---------------------------------------------------------------------------
// 「なぜ勝てない」— 因果は断定せず、関連スタッツを並べる
// ---------------------------------------------------------------------------

const WHY_WORD = /理由|なぜ|なんで|どうして|何故|\bwhy\b/i;
const WHY_WEAK =
  /勝てて(?:い)?ない|勝てない|勝ちきれ|負け(?:て(?:ばかり|いる|る)?|越し|っぱなし)|弱い|低迷|苦戦|不振|振るわ|losing|struggling|can(?:'?t|not)\s+win|so\s+bad|worst\s+team/i;

/**
 * 「ウィザーズの勝ててない理由は」「なぜサンダーは弱い」→
 * 勝ち負けの理由は断定せず、NET / 攻守 / 得失点差 / 日程 / 欠場 / 接戦を並べる。
 */
async function teamWhyLosingQuestion(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const lang = ctx.language;
  if (!WHY_WORD.test(q) || !WHY_WEAK.test(q)) return null;
  if (intent.player || nbaAskNicknamePlayer(q) || PLAYER_WORD.test(q)) return null;
  if (/(?:UNITERZ|ユニターズ|ユーザー|みんな)の?予想/i.test(q)) return null;
  const teams = findNbaAskTeamsInText(q);
  const teamId = teams.length === 1 ? teams[0]! : teams.length === 0 ? resolveNbaAskTeamId(intent.team) : null;
  if (!teamId) return null;

  const season = CURRENT_NBA_SEASON_KEY;
  const [{ rows, clean }, hubSnap, injurySnap] = await Promise.all([
    teamSeasonRows(ctx.db, season),
    loadNbaLeagueHubSnapshot(ctx.db, season),
    loadTeamInjuriesSnapshot(ctx.db, season),
  ]);
  const row = rows.find((r) => r.teamId === teamId);
  if (!row) {
    return text(T(lang, `${teamName(teamId, lang)}の今季の成績はまだありません。`, `No ${abbr(teamId)} stats yet this season.`));
  }

  const rankOf = (id: string) => {
    const hi = higherIsBetter(id);
    const list = rows
      .filter((r) => hasTeamValue(r, id, clean))
      .sort((a, b) => (rowValue(b, id)! - rowValue(a, id)!) * (hi ? 1 : -1));
    const i = list.findIndex((r) => r.teamId === teamId);
    return i >= 0 ? i + 1 : null;
  };
  const cell = (id: string, label: string) => {
    const v = rowValue(row, id);
    if (v == null || !hasTeamValue(row, id, clean)) return null;
    const rank = rankOf(id);
    return {
      label,
      cells: [fmt(id, v), rank != null ? T(lang, `${rank}位`, `#${rank}`) : "—"],
    };
  };

  const games = row.wins + row.losses;
  const hubTeam = (hubSnap.hub?.teams ?? []).find((t) => t.teamId === teamId);
  const schedule = hubTeam?.schedule;
  const close = hubTeam?.close;
  const closeG = close ? close.wins + close.losses : 0;
  const outs = (injurySnap.bundle.teams[teamId] ?? []).filter((e) => {
    const s = String(e.status ?? "").toLowerCase();
    return (INJURY_ORDER[s] ?? 9) <= 2;
  });

  const lines: string[] = [
    T(
      lang,
      `${teamName(teamId, lang)}が勝てていない理由そのものは断定できません。アプリにある関連する数字です。`,
      `I won't claim a single reason ${abbr(teamId)} aren't winning. Here are related numbers in the app.`
    ),
    T(
      lang,
      `今季 ${wl({ wins: row.wins, losses: row.losses }, lang)}（勝率 ${pct1(row.winPct)}・${games}試合）。`,
      `This season ${wl({ wins: row.wins, losses: row.losses }, lang)} (win% ${pct1(row.winPct)}, ${games} G).`
    ),
  ];

  const metricIds: Array<[string, string, string]> = [
    ["netrtg", "NET", "NET"],
    ["ortg", "ORTG（攻撃）", "ORTG"],
    ["drtg", "DRTG（守備・低いほど良い）", "DRTG (lower better)"],
    ["diff", "得失点差", "Point differential"],
  ];
  for (const [id, jaL, enL] of metricIds) {
    const v = rowValue(row, id);
    if (v == null || !hasTeamValue(row, id, clean)) continue;
    const rank = rankOf(id);
    lines.push(
      T(
        lang,
        `${jaL} ${fmt(id, v)}${rank != null ? `（30チーム中${rank}位）` : ""}。`,
        `${enL} ${fmt(id, v)}${rank != null ? ` (#${rank}/30)` : ""}.`
      )
    );
  }

  if (schedule && typeof schedule.played === "number" && schedule.playedGames > 0) {
    lines.push(
      T(
        lang,
        `終わった試合の相手の平均勝率 ${pct1(schedule.played)}（${schedule.playedGames}試合）。高いほど日程がきつい。`,
        `Opp win% faced so far ${pct1(schedule.played)} (${schedule.playedGames} G). Higher = tougher schedule.`
      )
    );
  }
  if (close && closeG >= 2) {
    lines.push(
      T(
        lang,
        `接戦（5点差以内）は ${wl(close, lang)}。`,
        `Close games (≤5): ${wl(close, lang)}.`
      )
    );
  }
  if (outs.length > 0) {
    const names = outs
      .slice(0, 4)
      .map((e) => e.name || String(e.playerId))
      .join(ja(lang) ? "・" : ", ");
    lines.push(
      T(
        lang,
        `故障者リストで出場が厳しい／欠場の選手が ${outs.length} 人（${names}${outs.length > 4 ? " など" : ""}）。`,
        `${outs.length} listed out / doubtful / questionable (${names}${outs.length > 4 ? ", …" : ""}).`
      )
    );
  }

  const boardRows = [
    cell("netrtg", "NET"),
    cell("ortg", "ORTG"),
    cell("drtg", "DRTG"),
    cell("diff", T(lang, "得失点差", "DIFF")),
  ].filter((x): x is NonNullable<typeof x> => x != null);

  if (schedule && typeof schedule.played === "number" && schedule.playedGames > 0) {
    boardRows.push({
      label: T(lang, "相手の平均勝率", "OPP WIN%"),
      cells: [pct1(schedule.played), T(lang, `${schedule.playedGames}試合`, `${schedule.playedGames} G`)],
    });
  }
  if (close && closeG >= 2) {
    boardRows.push({
      label: T(lang, "接戦", "CLOSE"),
      cells: [wl(close, lang), pct1(close.wins / closeG)],
    });
  }
  if (outs.length > 0) {
    boardRows.push({
      label: T(lang, "故障者（厳しい以上）", "INJURED"),
      cells: [String(outs.length), T(lang, "人", "players")],
    });
  }

  return {
    answer: lines.join(ja(lang) ? "" : " "),
    board:
      boardRows.length > 0
        ? {
            columns: T(lang, "値|順位など", "Value|Rank").split("|"),
            rows: boardRows,
            note: T(
              lang,
              "勝ち負けの因果は断定しません。NET は100ポゼッションあたりの得失点差、DRTG は低いほど守備が良い数字です。",
              "Not a causal claim. NET = point differential per 100 possessions; lower DRTG is better defense."
            ),
          }
        : null,
    games: null,
    opens: [],
    usedStats: true,
    view: { kind: "leaders", id: "netrtg", scope: "team", team: teamId },
  };
}

// 入口
// ---------------------------------------------------------------------------

/** 「ルーキーで一番背が高い選手」に AI が覚えている選手を入れることがある。名前ではなく「一番〜な選手」を聞いている形なら外す */
const ASKS_FOR_PLAYER = /(?:一番|いちばん|最も|もっとも)[^、。]{0,16}(?:(?:選手|人)(?:は|を|って|$|[？?])|の?は(?:誰|だれ))|(?:選手|人)は(?:誰|だれ)|(?:誰|だれ)が一番/;

export async function answerNbaAskMore(ctx: NbaAskNbaContext, input: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const intent =
    input.player && !input.player2 && ASKS_FOR_PLAYER.test(ctx.question) && !nbaAskNicknamePlayer(ctx.question)
      ? { ...input, player: null, player_written: null }
      : input;
  return (
    staffQuestion(ctx) ??
    (await teamWhyLosingQuestion(ctx, intent)) ??
    (await sumQuestion(ctx, intent)) ??
    (await careerTotalQuestion(ctx, intent)) ??
    (await dateDoubleQuestion(ctx, intent)) ??
    (await headToHeadQuestion(ctx, intent)) ??
    (await teamGamesListQuestion(ctx, intent)) ??
    (await situationZoneQuestion(ctx, intent)) ??
    (await teamCloseQuestion(ctx, intent)) ??
    (await monthQuestion(ctx, intent)) ??
    (await perMinuteQuestion(ctx, intent)) ??
    (await plusMinusQuestion(ctx, intent)) ??
    (await zoneQuestion(ctx, intent)) ??
    (await gameHighQuestion(ctx, intent)) ??
    (await weekQuestion(ctx, intent)) ??
    (await seasonBestGameQuestion(ctx, intent)) ??
    (await draftPickQuestion(ctx, intent)) ??
    (await injuryQuestion(ctx, intent)) ??
    (await freeAgentQuestion(ctx, intent)) ??
    (await scorerCountQuestion(ctx, intent)) ??
    (await countryQuestion(ctx, intent)) ??
    (await collegeQuestion(ctx, intent)) ??
    (await teamStyleQuestion(ctx, intent)) ??
    (await teamBoxQuestion(ctx, intent)) ??
    (await sizeQuestion(ctx, intent)) ??
    (await ageQuestion(ctx, intent))
  );
}
