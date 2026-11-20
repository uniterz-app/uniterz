/**
 * 「A と B の差」で答える質問。AI の読み取り（query）は外れやすいので、質問の言葉で先に拾う。
 * 数字はすべて Firestore スナップショットから（BDL・AI は使わない）。
 *
 * チーム: ガベージ抜き / 相手補正 / 直近 10 の NET・ORTG・DRTG の差、前季比、状況別の勝率
 *        （ホーム・アウェー・連戦・対勝ち越し・接戦・東西・直近 10）、UNITERZ の予想との差、2 チームの比較
 * 選手:   前季比、直近 N 試合とシーズン平均、2 選手の比較、ホーム / アウェー・連戦 2 日目・好調 / 不調・オン / オフ（リーグ全体）
 */
import type { Firestore } from "firebase-admin/firestore";
import { NBA_CONFERENCE_STANDINGS_COLLECTION } from "@/lib/nba/standings/loadNbaConferenceStandings";
import { CURRENT_NBA_SEASON_KEY, previousNbaSeasonKey } from "@/lib/rankings/nbaSeason";
import { loadLeagueTeamStatsSnapshot } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import {
  applyCleanRatingsToLeagueTeamBundle,
  loadNbaTeamCleanRatings,
} from "@/lib/nba/cleanRatings/applyCleanRatingsToLeagueTeamBundle";
import type { NbaTeamCleanRatingsDoc, NbaTeamCleanRatingsEntry } from "@/lib/nba/cleanRatings/nbaCleanRatingsTypes";
import { leagueMetricDef, type NbaLeagueTeamStatMetric, type NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { loadNbaLeagueHubSnapshot } from "@/lib/nba/leagueHub/loadNbaLeagueHubSnapshot";
import type { LeagueHubPlayerSplitRow, LeagueHubRecord, LeagueHubTeamRow } from "@/lib/nba/leagueHub/leagueHubTypes";
import { loadPlayerSeasonMetricsSnapshot } from "@/lib/nba/playerSeasonMetrics/loadPlayerSeasonMetricsSnapshot";
import {
  NBA_PLAYER_SEASON_METRICS_COLLECTION,
  NBA_PLAYER_SEASON_METRICS_PLAYERS_SUB,
} from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import { loadPlayerGameLogsSnapshot } from "@/lib/nba/playerGameLogs/loadPlayerGameLogsSnapshot";
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import { abbr, loadRosters, readStandingsBoard } from "./nbaAskTools";
import { NBA_ASK_PLAYER_STAT_WORDS, NBA_ASK_TEAM_STAT_WORDS, nbaAskIsPctStat, nbaAskStatWord } from "./nbaAskStatWords";
import { findNbaAskTeamsInText, nbaAskTeamJaName, resolveNbaAskTeamId } from "./nbaAskTeamNames";
import { pickNbaAskPlayer, type NbaAskPlayerHit } from "./nbaAskPlayerResolve";
import type { NbaAskIntent } from "./nbaAskIntent";
import { NBA_ASK_HUB_SECTIONS, withHubView, type NbaAskBoard, type NbaAskView } from "./nbaAskBoard";
import type { NbaAskAnswer, NbaAskNbaContext } from "./nbaAskNbaAnswer";

// ---------------------------------------------------------------------------
// 文の部品
// ---------------------------------------------------------------------------

const ja = (lang: string) => lang === "ja";
const T = (lang: string, jaText: string, enText: string) => (ja(lang) ? jaText : enText);

function text(answer: string): NbaAskAnswer {
  return { answer, board: null, games: null, opens: [], usedStats: true };
}

function boardAnswer(answer: string, board: NbaAskBoard, view?: NbaAskView): NbaAskAnswer {
  return { answer, board, games: null, opens: [], usedStats: true, ...(view ? { view } : {}) };
}

export function teamName(teamId: string, lang: string): string {
  return ja(lang) ? (nbaAskTeamJaName(teamId) ?? abbr(teamId)) : abbr(teamId);
}

const finite = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const round1 = (v: number) => Math.round(v * 10) / 10;
export const s1 = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}`;

/** 0 をまたぐ値（NET・得失点差）は符号を付ける */
const SIGNED_IDS = new Set(["netrtg", "diff", "cleanNet", "cleanAdjNet", "cleanNetL10", "clutchNet"]);

/** 率（0–1 か 0–100）は % 表記、それ以外は小数 1 桁 */
export function fmt(id: string, v: number): string {
  if (nbaAskIsPctStat(id)) return `${(Math.abs(v) <= 1 ? v * 100 : v).toFixed(1)}%`;
  return SIGNED_IDS.has(id) ? s1(v) : v.toFixed(1);
}

/** 差。率はポイント差（pt） */
function fmtDiff(id: string, a: number, b: number): string {
  if (nbaAskIsPctStat(id)) {
    const scale = Math.abs(a) <= 1 && Math.abs(b) <= 1 ? 100 : 1;
    return `${s1((b - a) * scale)}pt`;
  }
  return s1(b - a);
}

export function winPct(r: LeagueHubRecord | null | undefined): number | null {
  if (!r) return null;
  const g = r.wins + r.losses;
  return g > 0 ? r.wins / g : null;
}

export const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`;
export const wl = (r: LeagueHubRecord, lang: string) => T(lang, `${r.wins}勝${r.losses}敗`, `${r.wins}-${r.losses}`);

// ---------------------------------------------------------------------------
// 言葉
// ---------------------------------------------------------------------------

export const LAST_SEASON = /去年|昨年|昨季|前季|昨シーズン|前シーズン|先シーズン|last\s+(?:season|year)|previous\s+season/i;
export const TWO_SEASONS_AGO = /一昨年|おととし|一昨季|2シーズン前|二シーズン前|two\s+seasons\s+ago/i;
const COMPARE = /比べ|比較|どっち|どちら|違い|\bvs\.?\b|\bcompare|\bversus/i;
const UP = /上が|上向|伸び|良くな|よくな|増え|得す|改善|成長|\bimprov|\bbetter|\brising|\bup\b/i;
const DOWN = /下が|下向|落ち|落と|悪くな|わるくな|減|損す|悪化|\bdrop|\bdecline|\bworse|\bdown\b/i;
const CHANGE = new RegExp(`${UP.source}|${DOWN.source}|(?<!得失点)差|変わ|変化|違い|比べ|比較|より`, "i");
const PLAYER_WORD = /選手|プレーヤー|プレイヤー|\bplayers?\b|誰|だれ|\bwho\b/i;
const TEAM_WORD = /チーム|\bteams?\b/i;
const RECENT = /最近|直近|ここ\s*\d*\s*試合|ラスト\s*\d+|last\s*\d+\s*games?|recent|lately/i;

/** 「去年」「一昨年」→ シーズン（AI は今季を知らないので年を外す） */
export function nbaAskRelativeSeason(question: string): string | null {
  const prev = previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY);
  if (TWO_SEASONS_AGO.test(question)) return previousNbaSeasonKey(prev);
  if (LAST_SEASON.test(question)) return prev;
  return null;
}

function prevWord(prev: string): string {
  return prev === previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY) ? "前季" : "一昨季";
}

/** 質問の文に書かれたチームだけ信じる（AI は「守備」などから別のチームを入れることがある） */
function teamInQuestion(question: string, intent: NbaAskIntent): string | null {
  const inText = findNbaAskTeamsInText(question);
  const id = resolveNbaAskTeamId(intent.team);
  if (id && inText.includes(id)) return id;
  return inText.length === 1 ? inText[0]! : null;
}

// ---------------------------------------------------------------------------
// チーム: 2 つのレーティングの差
// ---------------------------------------------------------------------------

type RatingMetric = "net" | "ortg" | "drtg";
type RatingDeltaKey = "garbage" | "sos" | "last10";

const RATING_DELTA_WORDS: ReadonlyArray<[RegExp, RatingDeltaKey]> = [
  [/相手補正|補正|\bADJ\b|対戦相手|日程/i, "sos"],
  [/ガベージ|クリーン|\bCLN\b|大差|garbage/i, "garbage"],
  [/直近|最近|ここ\s*\d*\s*試合|\bL10\b|last\s*10|調子/i, "last10"],
];

function ratingMetricOf(question: string): RatingMetric {
  if (/ディフェンス|守備|\bDRTG|失点|defen[cs]e/i.test(question)) return "drtg";
  if (/オフェンス|攻撃|\bORTG|得点力|offen[cs]e/i.test(question)) return "ortg";
  return "net";
}

function ratingDeltaKey(question: string): RatingDeltaKey | null {
  if (!CHANGE.test(question)) return null;
  /** 直近 10 は「直近 10 試合で勝ててる」（勝敗）と分ける。レーティングの言葉か上下の言葉が要る */
  for (const [re, key] of RATING_DELTA_WORDS) {
    if (!re.test(question)) continue;
    if (key === "last10" && !(UP.test(question) || DOWN.test(question) || /NET|レーティング|rating/i.test(question))) continue;
    return key;
  }
  return null;
}

const RATING_LABEL: Record<RatingMetric, { ja: string; en: string }> = {
  net: { ja: "NET", en: "NET" },
  ortg: { ja: "オフェンス（ORTG）", en: "ORTG" },
  drtg: { ja: "守備（DRTG）", en: "DRTG" },
};

const DELTA_SIDES: Record<RatingDeltaKey, { fromJa: string; fromEn: string; toJa: string; toEn: string; leadJa: string; leadEn: string }> = {
  garbage: { fromJa: "全時間", fromEn: "All minutes", toJa: "ガベージ抜き", toEn: "Garbage-free", leadJa: "ガベージタイムを抜くと", leadEn: "with garbage time removed" },
  sos: { fromJa: "ガベージ抜き", fromEn: "Garbage-free", toJa: "相手補正込み", toEn: "Opp-adjusted", leadJa: "相手の強さで補正すると", leadEn: "after the opponent adjustment" },
  last10: { fromJa: "シーズン", fromEn: "Season", toJa: "直近10試合", toEn: "Last 10", leadJa: "シーズン全体より直近10試合で", leadEn: "over the last 10 games versus the season" },
};

function ratingPair(
  key: RatingDeltaKey,
  metric: RatingMetric,
  row: NbaLeagueTeamStatRow,
  t: NbaTeamCleanRatingsEntry
): { from?: number; to?: number } {
  if (key === "garbage") {
    if (metric === "ortg") return { from: finite(row.ortg), to: finite(row.cleanOrtg) };
    if (metric === "drtg") return { from: finite(row.drtg), to: finite(row.cleanDrtg) };
    return { from: finite(row.netrtg), to: finite(row.cleanNet) };
  }
  if (key === "sos") {
    if (metric === "ortg") return { from: finite(row.cleanOrtg), to: finite(row.cleanAdjOrtg) };
    if (metric === "drtg") return { from: finite(row.cleanDrtg), to: finite(row.cleanAdjDrtg) };
    return { from: finite(row.cleanNet), to: finite(row.cleanAdjNet) };
  }
  /** 直近 10 は NET だけ。play-by-play の値そのままなので、シーズンとの差だけ公式基準のガベージ抜きに足す */
  const base = finite(row.cleanNet);
  const l10 = finite(t.last10?.net);
  if (base === undefined || l10 === undefined || !(t.last10!.games > 0)) return {};
  return { from: base, to: round1(base + l10 - t.clean.net) };
}

const RATING_NOTE: Record<RatingDeltaKey, { ja: string; en: string }> = {
  garbage: {
    ja: "100ポゼッションあたり。ガベージ抜きで良くなる = 大差がついた時間に数字を落としている（勝負の時間はもっと強い）。",
    en: "Per 100 possessions. Better without garbage time = blowout minutes drag the number down.",
  },
  sos: {
    ja: "100ポゼッションあたり。補正で良くなる = 強い相手と多く当たってきた（実力は見た目の数字より上）。",
    en: "Per 100 possessions. Better after adjustment = tougher opponents so far.",
  },
  last10: {
    ja: "ガベージタイム抜きのNET（100ポゼッションあたりの得失点差）。プラス = 最近のほうが強い。",
    en: "Garbage-free NET per 100 possessions. Positive = playing better lately.",
  },
};

async function teamRatingDelta(
  ctx: NbaAskNbaContext,
  season: string,
  key: RatingDeltaKey,
  requested: RatingMetric,
  teamId: string | null
): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const metric: RatingMetric = key === "last10" ? "net" : requested;
  const [payload, clean] = await Promise.all([loadLeagueTeamStatsSnapshot(ctx.db, season), loadNbaTeamCleanRatings(ctx.db, season)]);
  const none = text(
    T(lang, `${season} のガベージタイム抜きのデータはまだありません（レギュラーシーズンのみ）。`, `No garbage-time-free ratings for ${season} yet (regular season only).`)
  );
  if (!clean) return none;
  const bundle = applyCleanRatingsToLeagueTeamBundle(payload.bundle, clean);
  /** DRTG は低いほど良い → 良くなった量 = 下がった量 */
  const sign = metric === "drtg" ? -1 : 1;
  const rows = bundle.season.flatMap((row) => {
    const t = clean.teams[row.teamId];
    if (!t || t.games <= 0) return [];
    const { from, to } = ratingPair(key, metric, row, t);
    if (from === undefined || to === undefined) return [];
    const diff = round1(to - from);
    return [{ teamId: row.teamId, from, to, diff, gain: diff * sign }];
  });
  if (rows.length === 0) return none;

  const side = DELTA_SIDES[key];
  const label = ja(lang) ? RATING_LABEL[metric].ja : RATING_LABEL[metric].en;
  const fromLabel = T(lang, side.fromJa, side.fromEn);
  const toLabel = T(lang, side.toJa, side.toEn);
  const signedOrPlain = (v: number) => (metric === "net" ? s1(v) : v.toFixed(1));
  const columns = [fromLabel, toLabel, T(lang, "差", "DIFF")];
  const pack = (r: (typeof rows)[number]) => ({ label: teamName(r.teamId, lang), cells: [signedOrPlain(r.from), signedOrPlain(r.to), s1(r.diff)] });
  const notes = [T(lang, RATING_NOTE[key].ja, RATING_NOTE[key].en)];
  if (key === "last10" && requested !== "net") notes.push(T(lang, "直近10試合はNETだけ集計しています。", "Last-10 is tracked for NET only."));
  if (metric === "drtg") notes.push(T(lang, "DRTGは低いほど良い守備です。", "Lower DRTG is better."));
  const note = notes.join(" ");
  const byGain = [...rows].sort((a, b) => b.gain - a.gain);
  const goodVerb = metric === "drtg" ? T(lang, "良くなる", "improves") : T(lang, "上がる", "rises");
  const badVerb = metric === "drtg" ? T(lang, "悪くなる", "worsens") : T(lang, "下がる", "falls");

  if (teamId) {
    const r = rows.find((x) => x.teamId === teamId);
    if (!r) return text(T(lang, `${teamName(teamId, lang)}の${toLabel}の${label}はまだありません（${season}）。`, `No ${toLabel} ${label} for ${abbr(teamId)} (${season}).`));
    const i = byGain.findIndex((x) => x.teamId === teamId);
    return boardAnswer(
      T(
        lang,
        `${teamName(teamId, lang)}の${season} の${label}は${fromLabel} ${signedOrPlain(r.from)}、${toLabel} ${signedOrPlain(r.to)}（差 ${s1(r.diff)}・${r.gain >= 0 ? goodVerb : badVerb}幅は${rows.length}チーム中${r.gain >= 0 ? i + 1 : rows.length - i}位）。`,
        `${abbr(teamId)} ${season} ${label}: ${fromLabel} ${signedOrPlain(r.from)}, ${toLabel} ${signedOrPlain(r.to)} (${s1(r.diff)}, #${i + 1} of ${rows.length} in gain).`
      ),
      { columns, rows: [pack(r)], note }
    );
  }

  const worse = DOWN.test(ctx.question);
  const sorted = worse ? [...byGain].reverse() : byGain;
  const top = sorted[0]!;
  const moved = rows.filter((r) => (worse ? r.gain < 0 : r.gain > 0)).length;
  const verb = worse ? badVerb : goodVerb;
  const head = T(
    lang,
    `${season} で${side.leadJa}${label}がいちばん${verb}のは${teamName(top.teamId, lang)}（${signedOrPlain(top.from)} → ${signedOrPlain(top.to)}、${s1(top.diff)}）。${verb}のは${rows.length}チーム中${moved}チーム。`,
    `${season}: ${label} ${verb} most ${side.leadEn} for ${abbr(top.teamId)} (${signedOrPlain(top.from)} → ${signedOrPlain(top.to)}, ${s1(top.diff)}). ${moved} of ${rows.length} teams.`
  );
  const next = sorted.slice(1, 3).map((r) => `${teamName(r.teamId, lang)} ${s1(r.diff)}`);
  return boardAnswer(`${head}${next.length ? T(lang, `続いて${next.join("・")}。`, ` Next: ${next.join(", ")}.`) : ""}`, {
    columns,
    rows: sorted.slice(0, 5).map(pack),
    note,
  });
}

// ---------------------------------------------------------------------------
// チーム: 前季比
// ---------------------------------------------------------------------------

function teamMetricOf(question: string): { id: string; ja: string; en: string } {
  const w = nbaAskStatWord(NBA_ASK_TEAM_STAT_WORDS, question);
  if (w) return w;
  if (/勝率|成績|勝ち|勝利/.test(question)) return { id: "winPct", ja: "勝率", en: "Win %" };
  return { id: "netrtg", ja: "NET", en: "NET" };
}

export function higherIsBetter(id: string): boolean {
  try {
    return leagueMetricDef(id as NbaLeagueTeamStatMetric).higherIsBetter;
  } catch {
    return true;
  }
}

export const rowValue = (row: NbaLeagueTeamStatRow, id: string) => finite((row as unknown as Record<string, unknown>)[id]);

export async function teamSeasonRows(db: Firestore, season: string): Promise<{ rows: NbaLeagueTeamStatRow[]; clean: NbaTeamCleanRatingsDoc | null }> {
  const [payload, clean] = await Promise.all([loadLeagueTeamStatsSnapshot(db, season), loadNbaTeamCleanRatings(db, season)]);
  return { rows: applyCleanRatingsToLeagueTeamBundle(payload.bundle, clean).season, clean };
}

/** ガベージ抜きは集計できたチームだけ（無いチームの行は 0 のまま） */
export function hasTeamValue(row: NbaLeagueTeamStatRow, id: string, clean: NbaTeamCleanRatingsDoc | null): boolean {
  if (rowValue(row, id) === undefined) return false;
  return !/^clean/.test(id) || (clean?.teams[row.teamId]?.games ?? 0) > 0;
}

async function teamVsLastSeason(ctx: NbaAskNbaContext, teamId: string | null, prev: string): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const cur = CURRENT_NBA_SEASON_KEY;
  const pw = prevWord(prev);
  const m = teamMetricOf(ctx.question);
  const label = ja(lang) ? m.ja : m.en;
  const [a, b] = await Promise.all([teamSeasonRows(ctx.db, prev), teamSeasonRows(ctx.db, cur)]);
  const prevById = new Map(a.rows.filter((r) => hasTeamValue(r, m.id, a.clean)).map((r) => [r.teamId, r]));
  const sign = higherIsBetter(m.id) ? 1 : -1;
  const rows = b.rows.flatMap((r) => {
    const p = prevById.get(r.teamId);
    if (!p || !hasTeamValue(r, m.id, b.clean)) return [];
    const from = rowValue(p, m.id)!;
    const to = rowValue(r, m.id)!;
    return [{ teamId: r.teamId, from, to, gain: (to - from) * sign, games: r.wins + r.losses }];
  });
  if (rows.length === 0) return text(T(lang, `${label}を${pw}と比べられるデータがまだありません。`, `No ${label} to compare with last season yet.`));
  const byGain = [...rows].sort((x, y) => y.gain - x.gain);
  const columns = [prev, cur, T(lang, "差", "DIFF")];
  const pack = (r: (typeof rows)[number]) => ({ label: teamName(r.teamId, lang), cells: [fmt(m.id, r.from), fmt(m.id, r.to), fmtDiff(m.id, r.from, r.to)] });
  const games = Math.max(...rows.map((r) => r.games));
  const note = [
    sign < 0 ? T(lang, `${label}は低いほど良い数字です。`, `Lower ${label} is better.`) : "",
    games < 20 ? T(lang, `今季はまだ${games}試合ほどで、数字が動きやすい時期です。`, `Only about ${games} games into this season; numbers still swing.`) : "",
  ]
    .filter(Boolean)
    .join(" ");
  const good = sign > 0 ? T(lang, "上がった", "rose") : T(lang, "良くなった", "improved");
  const bad = sign > 0 ? T(lang, "下がった", "fell") : T(lang, "悪くなった", "worsened");

  if (teamId) {
    const r = rows.find((x) => x.teamId === teamId);
    if (!r) return text(T(lang, `${teamName(teamId, lang)}の${label}を${pw}と比べられるデータがまだありません。`, `No ${label} comparison for ${abbr(teamId)} yet.`));
    const i = byGain.findIndex((x) => x.teamId === teamId);
    return boardAnswer(
      T(
        lang,
        `${teamName(teamId, lang)}の${label}は${pw}（${prev}）${fmt(m.id, r.from)} → 今季 ${fmt(m.id, r.to)}（${fmtDiff(m.id, r.from, r.to)}・${r.gain >= 0 ? good : bad}。伸び幅は${rows.length}チーム中${i + 1}位）。`,
        `${abbr(teamId)} ${label}: ${prev} ${fmt(m.id, r.from)} → ${cur} ${fmt(m.id, r.to)} (${fmtDiff(m.id, r.from, r.to)}, #${i + 1} of ${rows.length} in improvement).`
      ),
      { columns, rows: [pack(r)], ...(note ? { note } : {}) }
    );
  }
  const worse = DOWN.test(ctx.question);
  const sorted = worse ? [...byGain].reverse() : byGain;
  const top = sorted[0]!;
  const verb = worse ? bad : good;
  const next = sorted.slice(1, 3).map((r) => `${teamName(r.teamId, lang)} ${fmtDiff(m.id, r.from, r.to)}`);
  return boardAnswer(
    T(
      lang,
      `${pw}（${prev}）より${label}がいちばん${verb}のは${teamName(top.teamId, lang)}（${fmt(m.id, top.from)} → ${fmt(m.id, top.to)}、${fmtDiff(m.id, top.from, top.to)}）。${next.length ? `続いて${next.join("・")}。` : ""}`,
      `Biggest ${label} change vs ${prev}: ${abbr(top.teamId)} (${fmt(m.id, top.from)} → ${fmt(m.id, top.to)}, ${fmtDiff(m.id, top.from, top.to)}).${next.length ? ` Next: ${next.join(", ")}.` : ""}`
    ),
    { columns, rows: sorted.slice(0, 5).map(pack), ...(note ? { note } : {}) }
  );
}

// ---------------------------------------------------------------------------
// チーム: 状況別の勝率（リーグ全体）
// ---------------------------------------------------------------------------

type Situation = "home" | "away" | "b2b" | "threeInFour" | "vsOver500" | "close" | "vsEast" | "vsWest" | "last10";

const SITUATIONS: ReadonlyArray<[RegExp, Situation, string, string]> = [
  [/ホーム|本拠地|\bhome\b/i, "home", "ホーム", "home"],
  [/アウェー|アウェイ|ロード|敵地|\baway\b|\broad\b/i, "away", "アウェー", "away"],
  [/3in4|4日で3|[3三]連戦/i, "threeInFour", "4日で3試合目", "3-in-4"],
  [/連戦|バック.?トゥ.?バック|\bB2B\b|2日目|back.?to.?back/i, "b2b", "連戦2日目", "2nd of back-to-backs"],
  [/勝ち越し|強い(?:チーム|相手)(?:に|と|相手)|上位(?:チーム|相手)?(?:に|と)|強豪(?:に|と|相手)|\.500|[5五]割以上の(?:チーム|相手)/i, "vsOver500", "勝ち越しチーム相手", "vs .500+ teams"],
  [/接戦|僅差|競った|クロスゲーム|5点差|close games?/i, "close", "5点差以内の接戦", "games within 5"],
  [/東(?:の|カンファ|相手|との|に強|に弱|に勝|に負)|対東|イースト|vs\s*east/i, "vsEast", "東のチーム相手", "vs East"],
  [/西(?:の|カンファ|相手|との|に強|に弱|に勝|に負)|対西|ウエスト|ウェスト|vs\s*west/i, "vsWest", "西のチーム相手", "vs West"],
  [/最近|直近|ここ10|好調|調子|勢い|波に乗|last\s*10|lately|hot/i, "last10", "直近10試合", "last 10"],
];

const RECORD_ASK = /強い|弱い|勝て|勝って|勝つ|負け|成績|勝率|得意|苦手|差|好調|不調|調子|勢い|いい|悪い|良い|best|worst|record|\bwin/i;
const WEAK = /弱い|負け|苦手|悪い|不調|落ち|下が|勝てない|worst|struggl/i;

function teamRecord(row: LeagueHubTeamRow, s: Situation): LeagueHubRecord | null {
  return (row[s] as LeagueHubRecord | null | undefined) ?? null;
}

/** 「東相手に強い西のチーム」の「西のチーム」= 絞り込み。「東のチーム相手」「東に強い」は状況のほう */
export function conferenceFilter(q: string, intent: NbaAskIntent): NbaConferenceId | null {
  for (const m of q.matchAll(/(東|西|イースト|ウエスト|ウェスト)(?:カンファレンス|カンファ)?(の)?(チーム)?(.{0,2})/g)) {
    const after = m[4] ?? "";
    if (/^(?:相手|勢|に|と|戦|相)/.test(after) || q[(m.index ?? 0) - 1] === "対") continue;
    if (m[3] || /^(?:で|は|だ|$|ガー|フォ|セン|選手|ルー|新人|ベン|プレ|上位|下位|首位|トッ|ベス|1位|PG|SG|SF|PF)/.test(after)) return /東|イースト/.test(m[1]!) ? "east" : "west";
  }
  return intent.conference;
}

async function teamsSituation(ctx: NbaAskNbaContext, found: Situation[], conf: NbaConferenceId | null): Promise<NbaAskAnswer | null> {
  const lang = ctx.language;
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  if (!hub) return text(T(lang, "今季の状況別の成績はまだ集計がありません。", "No situational records yet this season."));
  const confSituation: Situation | null = conf === "east" ? "vsEast" : conf === "west" ? "vsWest" : null;
  const list = found.filter((s) => s !== confSituation);
  if (list.length === 0) return null;
  /** 「プレーオフ圏で」「プレーイン圏の」= 順位の帯で絞る */
  const q = ctx.question;
  const zone = /プレーオフ圏外|圏外/.test(q) ? "out" : /プレーイン/.test(q) ? "playin" : /プレーオフ圏/.test(q) ? "in" : null;
  let zoneIds: Set<string> | null = null;
  if (zone) {
    const board = readStandingsBoard((await ctx.db.collection(NBA_CONFERENCE_STANDINGS_COLLECTION).doc(CURRENT_NBA_SEASON_KEY).get()).data());
    if (board) {
      const inZone = (rank: number) => (zone === "out" ? rank >= 11 : zone === "playin" ? rank >= 7 && rank <= 10 : rank <= 6);
      zoneIds = new Set([...board.east, ...board.west].filter((r) => inZone(r.rank)).map((r) => r.teamId));
    }
  }
  const teams = hub.teams.filter((t) => (!conf || nbaConferenceForTeam(t.teamId) === conf) && (!zoneIds || zoneIds.has(t.teamId)));
  const zoneJa = zoneIds ? (zone === "out" ? "プレーオフ圏外の" : zone === "playin" ? "プレーイン圏の" : "プレーオフ圏の") : "";
  const confName = conf || zoneIds ? T(lang, `${conf ? (conf === "east" ? "東の" : "西の") : ""}${zoneJa}`, `${conf === "east" ? "East " : conf === "west" ? "West " : ""}${zone && zoneIds ? `${zone} ` : ""}`) : "";
  const season = `${hub.seasonKey}${confName ? T(lang, `（${confName}チーム）`, ` (${confName}teams)`) : ""}`;
  const labelOf = (s: Situation) => {
    const d = SITUATIONS.find((x) => x[1] === s)!;
    return T(lang, d[2], d[3]);
  };

  /** ホームとアウェーの両方 → 勝率の差 */
  if (list.includes("home") && list.includes("away")) {
    const rows = teams.flatMap((t) => {
      const h = winPct(t.home);
      const a = winPct(t.away);
      return h === null || a === null ? [] : [{ t, h, a, diff: h - a }];
    });
    if (rows.length === 0) return null;
    const awayBetter = /アウェー(?:の方|のほう)が|ロードの方が|away\s+better/i.test(ctx.question);
    const sorted = [...rows].sort((x, y) => (awayBetter ? x.diff - y.diff : Math.abs(y.diff) - Math.abs(x.diff)));
    const top = sorted[0]!;
    const pack = (r: (typeof rows)[number]) => ({
      label: teamName(r.t.teamId, lang),
      cells: [wl(r.t.home!, lang), wl(r.t.away!, lang), `${s1(r.diff * 100)}pt`],
    });
    return boardAnswer(
      T(
        lang,
        `${season} のホームとアウェーの勝率の差がいちばん大きいのは${teamName(top.t.teamId, lang)}（ホーム ${wl(top.t.home!, lang)}・アウェー ${wl(top.t.away!, lang)}、${s1(top.diff * 100)}pt）。`,
        `${season} biggest home/away gap: ${abbr(top.t.teamId)} (home ${wl(top.t.home!, lang)}, away ${wl(top.t.away!, lang)}, ${s1(top.diff * 100)}pt).`
      ),
      {
        columns: [T(lang, "ホーム", "Home"), T(lang, "アウェー", "Away"), T(lang, "勝率差", "Diff")],
        rows: sorted.slice(0, 5).map(pack),
        note: T(lang, "勝率差 = ホームの勝率 − アウェーの勝率。", "Diff = home win% − away win%."),
      }
    );
  }

  const s = list[0]!;
  const all = teams.flatMap((t) => {
    const r = teamRecord(t, s);
    const p = winPct(r);
    const overall = winPct({ wins: t.wins, losses: t.losses });
    return r && p !== null && overall !== null ? [{ t, r, p, overall, games: r.wins + r.losses }] : [];
  });
  if (all.length === 0) return text(T(lang, `${labelOf(s)}の成績はまだありません。`, `No ${labelOf(s)} records yet.`));
  /** 「〜で成績が落ちる / 上がる」「全体と比べて」は全体の勝率との差で並べる */
  const byDiff = /差|比べ|比較|落ち|下が|上が|伸び|ふだん|普段|全体/.test(ctx.question);
  /** LEAGUE の FORM & SPLITS（勝率順・2 試合以上）と同じ並びのときだけ部品を付ける */
  const viewable = !conf && !zoneIds && !byDiff && (NBA_ASK_HUB_SECTIONS.team_records as readonly string[]).includes(s);
  const minGames = viewable ? 2 : all.filter((x) => x.games >= 3).length >= 8 ? 3 : 1;
  const pool = all.filter((x) => x.games >= minGames);
  const weak = WEAK.test(ctx.question);
  const key = (x: (typeof pool)[number]) => (byDiff ? x.p - x.overall : x.p);
  const sorted = [...pool].sort((x, y) => (weak ? key(x) - key(y) : key(y) - key(x)) || y.games - x.games);
  const top = sorted[0]!;
  const sit = labelOf(s);
  const pack = (x: (typeof pool)[number]) => ({
    label: teamName(x.t.teamId, lang),
    cells: [wl(x.r, lang), pct1(x.p), pct1(x.overall), `${s1((x.p - x.overall) * 100)}pt`],
  });
  const head = byDiff
    ? T(
        lang,
        `${season} で${sit}の勝率が全体よりいちばん${weak ? "下がる" : "上がる"}のは${teamName(top.t.teamId, lang)}（${sit} ${wl(top.r, lang)}・${pct1(top.p)}、全体 ${pct1(top.overall)}、${s1((top.p - top.overall) * 100)}pt）。`,
        `${season}: biggest ${weak ? "drop" : "lift"} ${sit} vs overall — ${abbr(top.t.teamId)} (${wl(top.r, lang)}, ${pct1(top.p)} vs ${pct1(top.overall)}).`
      )
    : T(
        lang,
        `${season}${season.endsWith("）") ? "" : " "}の${sit}の勝率がいちばん${weak ? "低い" : "高い"}のは${teamName(top.t.teamId, lang)}（${wl(top.r, lang)}・${pct1(top.p)}。全体は ${pct1(top.overall)}）。`,
        `${season} ${weak ? "worst" : "best"} ${sit}: ${abbr(top.t.teamId)} (${wl(top.r, lang)}, ${pct1(top.p)}; overall ${pct1(top.overall)}).`
      );
  const out = boardAnswer(head, {
    columns: [sit, T(lang, "勝率", "Win%"), T(lang, "全体", "Overall"), T(lang, "差", "Diff")],
    rows: sorted.slice(0, 5).map(pack),
    note: T(
      lang,
      `${minGames > 1 ? `${sit}が${minGames}試合以上のチーム。` : ""}差 = ${sit}の勝率 − 全体の勝率。${s === "b2b" ? "連戦2日目 = 前日にも試合がある日。" : ""}`,
      `${minGames > 1 ? `Teams with ${minGames}+ games. ` : ""}Diff = ${sit} win% − overall win%.`
    ),
  });
  return viewable ? withHubView(out, "team_records", s) : out;
}

// ---------------------------------------------------------------------------
// チーム: UNITERZ の予想との差
// ---------------------------------------------------------------------------

async function teamsVsPicks(ctx: NbaAskNbaContext): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  const rows = (hub?.teams ?? []).flatMap((t) =>
    t.picks && t.picks.games >= 3 ? [{ t, exp: t.picks.expectedWins, wins: t.picks.wins, games: t.picks.games, diff: t.picks.wins - t.picks.expectedWins }] : []
  );
  if (rows.length === 0) return text(T(lang, "UNITERZ の予想と比べられる試合がまだありません。", "Not enough predicted games yet."));
  /** 「予想の的中率」= 多数派の予想が当たった割合（1 試合を両チームで数えるので合計の比は全体と同じ） */
  if (/的中|当た|正解|accura/i.test(ctx.question)) {
    const hits = rows.reduce((s, r) => s + (r.t.picks!.majorityHits ?? 0), 0);
    const games = rows.reduce((s, r) => s + r.games, 0);
    const rate = (r: (typeof rows)[number]) => (r.games ? (r.t.picks!.majorityHits ?? 0) / r.games : 0);
    const low = /低い|外れ|当たらない|難し|worst|lowest/i.test(ctx.question);
    const byRate = [...rows].sort((a, b) => (low ? rate(a) - rate(b) : rate(b) - rate(a)) || b.games - a.games);
    return withHubView(boardAnswer(
      T(
        lang,
        `今季の UNITERZ の予想（多数派が選んだほう）の的中率は ${games ? ((hits / games) * 100).toFixed(1) : "—"}%（${Math.round(games / 2)}試合）。チーム別で${low ? "いちばん外れている" : "いちばん当たっている"}のは${teamName(byRate[0]!.t.teamId, lang)}の試合（${byRate[0]!.t.picks!.majorityHits}/${byRate[0]!.games}）。`,
        `UNITERZ majority pick accuracy this season: ${games ? ((hits / games) * 100).toFixed(1) : "—"}% (${Math.round(games / 2)} games).`
      ),
      {
        columns: [T(lang, "的中", "Hits"), T(lang, "試合", "G"), T(lang, "的中率", "Rate")],
        rows: byRate.slice(0, 5).map((r) => ({ label: teamName(r.t.teamId, lang), cells: [String(r.t.picks!.majorityHits ?? 0), String(r.games), `${(rate(r) * 100).toFixed(1)}%`] })),
        note: T(lang, "その試合でいちばん多くのユーザーが選んだチームが勝った割合（今季の終了したレギュラーの試合）。", "Share of finished regular-season games where the side most users picked won."),
      }
    ), "picks");
  }
  const worse = /負け|下回|裏切|期待外れ|不振|worse|under/i.test(ctx.question);
  const sorted = [...rows].sort((a, b) => (worse ? a.diff - b.diff : b.diff - a.diff));
  const top = sorted[0]!;
  const pack = (r: (typeof rows)[number]) => ({
    label: teamName(r.t.teamId, lang),
    cells: [r.exp.toFixed(1), String(r.wins), s1(r.diff)],
  });
  return withHubView(boardAnswer(
    T(
      lang,
      `UNITERZ の予想より${worse ? "勝てていない" : "勝っている"}のは${teamName(top.t.teamId, lang)}（予想 ${top.exp.toFixed(1)}勝 → 実際 ${top.wins}勝、${s1(top.diff)}・${top.games}試合）。`,
      `${worse ? "Most below" : "Most above"} UNITERZ picks: ${abbr(top.t.teamId)} (expected ${top.exp.toFixed(1)} → actual ${top.wins}, ${s1(top.diff)} in ${top.games} games).`
    ),
    {
      columns: [T(lang, "予想の勝ち", "Expected"), T(lang, "実際", "Actual"), T(lang, "差", "Diff")],
      rows: sorted.slice(0, 5).map(pack),
      note: T(lang, "予想の勝ち = 各試合でそのチームを選んだユーザーの割合の合計（今季の終了したレギュラーの試合）。", "Expected = sum of the share of users picking the team in each finished regular-season game."),
    }
  ), "picks");
}

// ---------------------------------------------------------------------------
// チーム: 2 チームの比較
// ---------------------------------------------------------------------------

const TEAM_COMPARE_SET = ["netrtg", "ortg", "drtg", "cleanNet", "pace", "ppg", "papg"] as const;

async function twoTeams(ctx: NbaAskNbaContext, season: string, a: string, b: string): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const { rows, clean } = await teamSeasonRows(ctx.db, season);
  const ra = rows.find((r) => r.teamId === a);
  const rb = rows.find((r) => r.teamId === b);
  if (!ra || !rb) return text(T(lang, `${season} の2チームの成績がそろっていません。`, `No ${season} stats for both teams.`));
  const asked = nbaAskStatWord(NBA_ASK_TEAM_STAT_WORDS, ctx.question);
  const ids = [...new Set([...(asked ? [asked.id] : []), ...TEAM_COMPARE_SET])].filter(
    (id) => hasTeamValue(ra, id, clean) && hasTeamValue(rb, id, clean)
  );
  const rankOf = (id: string, teamId: string) => {
    const hi = higherIsBetter(id);
    const list = rows.filter((r) => hasTeamValue(r, id, clean)).sort((x, y) => (rowValue(y, id)! - rowValue(x, id)!) * (hi ? 1 : -1));
    return list.findIndex((r) => r.teamId === teamId) + 1;
  };
  const labelOf = (id: string) => {
    const w = NBA_ASK_TEAM_STAT_WORDS.find((x) => x.id === id);
    return w ? (ja(lang) ? w.ja : w.en) : id === "netrtg" ? "NET" : id;
  };
  const head = asked ?? { id: "netrtg", ja: "NET（得失点効率）", en: "NET" };
  const va = rowValue(ra, head.id);
  const vb = rowValue(rb, head.id);
  const na = teamName(a, lang);
  const nb = teamName(b, lang);
  const recA = T(lang, `${ra.wins}勝${ra.losses}敗`, `${ra.wins}-${ra.losses}`);
  const recB = T(lang, `${rb.wins}勝${rb.losses}敗`, `${rb.wins}-${rb.losses}`);
  let line = T(lang, `${season}: ${na} ${recA}、${nb} ${recB}。`, `${season}: ${abbr(a)} ${recA}, ${abbr(b)} ${recB}.`);
  if (va !== undefined && vb !== undefined && ids.includes(head.id)) {
    const hi = higherIsBetter(head.id);
    const better = va === vb ? null : (va > vb) === hi ? na : nb;
    const hl = ja(lang) ? head.ja : head.en;
    line += T(
      lang,
      `${hl}は${na} ${fmt(head.id, va)}（${rankOf(head.id, a)}位）、${nb} ${fmt(head.id, vb)}（${rankOf(head.id, b)}位）${better ? `で${better}が上（差 ${fmtDiff(head.id, Math.min(va, vb), Math.max(va, vb)).replace("+", "")}）` : "で同じ"}。`,
      ` ${hl}: ${abbr(a)} ${fmt(head.id, va)} (#${rankOf(head.id, a)}), ${abbr(b)} ${fmt(head.id, vb)} (#${rankOf(head.id, b)})${better ? `; ${better} ahead` : ""}.`
    );
  }
  return boardAnswer(line, {
    columns: [na, nb],
    rows: ids.map((id) => ({
      label: labelOf(id),
      cells: [`${fmt(id, rowValue(ra, id)!)}（${rankOf(id, a)}）`, `${fmt(id, rowValue(rb, id)!)}（${rankOf(id, b)}）`],
    })),
    note: T(lang, "（）はリーグ順位。DRTG・失点は低いほど上位。", "(#) = league rank. Lower DRTG / points allowed rank higher."),
  });
}

// ---------------------------------------------------------------------------
// 選手: 比べる項目
// ---------------------------------------------------------------------------

const PLAYER_COMPARE_SET = ["pts", "reb", "ast", "stl", "blk", "fg3m", "fg_pct", "fg3_pct", "ts_pct", "min"] as const;

const PLAYER_LABEL: Record<string, { ja: string; en: string }> = {
  pts: { ja: "得点", en: "PTS" },
  reb: { ja: "リバウンド", en: "REB" },
  ast: { ja: "アシスト", en: "AST" },
  stl: { ja: "スティール", en: "STL" },
  blk: { ja: "ブロック", en: "BLK" },
  fg3m: { ja: "3P成功", en: "3PM" },
  fg_pct: { ja: "FG%", en: "FG%" },
  fg3_pct: { ja: "3P%", en: "3P%" },
  ts_pct: { ja: "TS%", en: "TS%" },
  min: { ja: "出場時間", en: "MIN" },
};

function playerLabel(id: string, lang: string): string {
  const w = PLAYER_LABEL[id] ?? NBA_ASK_PLAYER_STAT_WORDS.find((x) => x.id === id);
  return w ? (ja(lang) ? w.ja : w.en) : id;
}

/** 回数（ダブルダブル等）は試合ログからしか数えられないので比較には使わない */
function playerMetricOf(question: string): string {
  const w = nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, question);
  return w && !/^(?:games_|double_|triple_)/.test(w.id) ? w.id : "pts";
}

async function resolvePlayer(ctx: NbaAskNbaContext, name: string | null, written: string | null): Promise<NbaAskPlayerHit | string> {
  const lang = ctx.language;
  if (!name) return T(lang, "どの選手のことか、名前を入れてもう一度聞いてください。", "Which player? Ask again with the name.");
  const found = pickNbaAskPlayer(await loadRosters(ctx.db), name, written, null);
  if (found.kind === "one") return found.hit;
  if (found.kind === "many") return T(lang, `「${name}」に当たる選手が複数います。フルネームで聞いてください。`, `Several players match "${name}". Use the full name.`);
  return T(lang, `「${name}」は今季のロスターに見つかりませんでした。`, `"${name}" is not on a current roster.`);
}

// ---------------------------------------------------------------------------
// 選手: 2 選手の比較
// ---------------------------------------------------------------------------

/** 3 人: 聞かれた項目で並べ、表は 3 列 */
async function threePlayers(ctx: NbaAskNbaContext, hits: NbaAskPlayerHit[]): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const season = CURRENT_NBA_SEASON_KEY;
  const ms = await Promise.all(hits.map((h) => loadPlayerSeasonMetricsSnapshot(ctx.db, season, h.playerId)));
  const id = playerMetricOf(ctx.question);
  const has = (k: string) => ms.every((m) => typeof m.metrics[k as NbaPlayerLeaderMetricId]?.value === "number");
  const ids = [...new Set([id, ...PLAYER_COMPARE_SET])].filter(has);
  if (ids.length === 0) return text(T(lang, `${season} の3人の成績がそろっていません。`, `No ${season} stats for all three players.`));
  const head = ids.includes(id) ? id : ids[0]!;
  const v = (i: number, k: string) => ms[i]!.metrics[k as NbaPlayerLeaderMetricId]!;
  const cell = (i: number, k: string) => `${fmt(k, v(i, k).value)}${v(i, k).rank ? T(lang, `（${v(i, k).rank}位）`, ` (#${v(i, k).rank})`) : ""}`;
  const order = [0, 1, 2].sort((a, b) => (v(b, head).value - v(a, head).value) * (head === "tov" ? -1 : 1));
  const hl = playerLabel(head, lang);
  return boardAnswer(
    T(
      lang,
      `${season} の${hl}は${order.map((i) => `${hits[i]!.name} ${cell(i, head)}`).join("、")}の順。`,
      `${season} ${hl}: ${order.map((i) => `${hits[i]!.name} ${cell(i, head)}`).join(", ")}.`
    ),
    {
      columns: hits.map((h) => h.name),
      rows: ids.map((k) => ({ label: playerLabel(k, lang), cells: [0, 1, 2].map((i) => cell(i, k)) })),
      note: T(lang, `1試合平均。（）はリーグ順位。（${ms.map((m) => m.gamesPlayed).join(" / ")}試合）`, "Per game. (#) = league rank."),
    }
  );
}

async function twoPlayers(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const [ha, hb, hc] = await Promise.all([
    resolvePlayer(ctx, intent.player, intent.player_written),
    resolvePlayer(ctx, intent.player2, null),
    intent.player3 ? resolvePlayer(ctx, intent.player3, null) : Promise.resolve(null),
  ]);
  if (typeof ha === "string") return text(ha);
  if (typeof hb === "string") return text(hb);
  if (typeof hc === "string") return text(hc);
  if (hc && hc.playerId !== ha.playerId && hc.playerId !== hb.playerId) return threePlayers(ctx, [ha, hb, hc]);
  const season = CURRENT_NBA_SEASON_KEY;
  const [ma, mb] = await Promise.all([
    loadPlayerSeasonMetricsSnapshot(ctx.db, season, ha.playerId),
    loadPlayerSeasonMetricsSnapshot(ctx.db, season, hb.playerId),
  ]);
  const id = playerMetricOf(ctx.question);
  const ids = [...new Set([id, ...PLAYER_COMPARE_SET])].filter(
    (k) => typeof ma.metrics[k as NbaPlayerLeaderMetricId]?.value === "number" && typeof mb.metrics[k as NbaPlayerLeaderMetricId]?.value === "number"
  );
  if (ids.length === 0) return text(T(lang, `${season} の2人の成績がそろっていません。`, `No ${season} stats for both players.`));
  const cell = (m: typeof ma, k: string) => {
    const c = m.metrics[k as NbaPlayerLeaderMetricId]!;
    return `${fmt(k, c.value)}${c.rank ? T(lang, `（${c.rank}位）`, ` (#${c.rank})`) : ""}`;
  };
  const head = ids.includes(id) ? id : ids[0]!;
  const va = ma.metrics[head as NbaPlayerLeaderMetricId]!.value;
  const vb = mb.metrics[head as NbaPlayerLeaderMetricId]!.value;
  /** ターンオーバーだけは少ないほうが上 */
  const lowerBetter = head === "tov";
  const leader = va === vb ? null : (va > vb) !== lowerBetter ? ha.name : hb.name;
  const hl = playerLabel(head, lang);
  return boardAnswer(
    T(
      lang,
      `${season} の${hl}は${ha.name} ${cell(ma, head)}、${hb.name} ${cell(mb, head)}${leader ? `で${leader}が上（差 ${fmtDiff(head, Math.min(va, vb), Math.max(va, vb)).replace("+", "")}）` : "で同じ"}。（${ma.gamesPlayed}試合 / ${mb.gamesPlayed}試合）`,
      `${season} ${hl}: ${ha.name} ${cell(ma, head)}, ${hb.name} ${cell(mb, head)}${leader ? `; ${leader} ahead` : ""}. (${ma.gamesPlayed} / ${mb.gamesPlayed} GP)`
    ),
    {
      columns: [ha.name, hb.name],
      rows: ids.map((k) => ({ label: playerLabel(k, lang), cells: [cell(ma, k), cell(mb, k)] })),
      note: T(lang, "1試合平均。（）はリーグ順位。", "Per game. (#) = league rank."),
    }
  );
}

// ---------------------------------------------------------------------------
// 選手: 前季比（1 人）
// ---------------------------------------------------------------------------

async function playerVsLastSeason(ctx: NbaAskNbaContext, hit: NbaAskPlayerHit, prev: string): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const cur = CURRENT_NBA_SEASON_KEY;
  const pw = prevWord(prev);
  const [mp, mc] = await Promise.all([
    loadPlayerSeasonMetricsSnapshot(ctx.db, prev, hit.playerId),
    loadPlayerSeasonMetricsSnapshot(ctx.db, cur, hit.playerId),
  ]);
  if (!mp.gamesPlayed) return text(T(lang, `${hit.name} は${pw}（${prev}）の出場がないので比べられません。`, `${hit.name} did not play in ${prev}.`));
  if (!mc.gamesPlayed) return text(T(lang, `${hit.name} は今季まだ出場がありません。`, `${hit.name} has not played this season.`));
  const id = playerMetricOf(ctx.question);
  const ids = [...new Set([id, ...PLAYER_COMPARE_SET])].filter(
    (k) => typeof mp.metrics[k as NbaPlayerLeaderMetricId]?.value === "number" && typeof mc.metrics[k as NbaPlayerLeaderMetricId]?.value === "number"
  );
  if (ids.length === 0) return text(T(lang, `${hit.name} の${pw}と今季の成績がそろっていません。`, `No stats to compare for ${hit.name}.`));
  const v = (m: typeof mp, k: string) => m.metrics[k as NbaPlayerLeaderMetricId]!.value;
  const head = ids.includes(id) ? id : ids[0]!;
  const a = v(mp, head);
  const b = v(mc, head);
  const hl = playerLabel(head, lang);
  const verb = b > a ? T(lang, "上がっています", "up") : b < a ? T(lang, "下がっています", "down") : T(lang, "同じです", "flat");
  return boardAnswer(
    T(
      lang,
      `${hit.name} の${hl}は${pw}（${prev}）${fmt(head, a)} → 今季 ${fmt(head, b)}で、${fmtDiff(head, a, b)} ${verb}。（${pw} ${mp.gamesPlayed}試合・今季 ${mc.gamesPlayed}試合）`,
      `${hit.name} ${hl}: ${prev} ${fmt(head, a)} → ${cur} ${fmt(head, b)} (${fmtDiff(head, a, b)}, ${verb}). (${mp.gamesPlayed} / ${mc.gamesPlayed} GP)`
    ),
    {
      columns: [prev, cur, T(lang, "差", "DIFF")],
      rows: ids.map((k) => ({ label: playerLabel(k, lang), cells: [fmt(k, v(mp, k)), fmt(k, v(mc, k)), fmtDiff(k, v(mp, k), v(mc, k))] })),
      note: T(lang, "1試合平均。", "Per game."),
    }
  );
}

// ---------------------------------------------------------------------------
// 選手: 直近 N 試合とシーズン平均（1 人）
// ---------------------------------------------------------------------------

const LOG_STATS = ["pts", "reb", "ast", "fg3m", "stl", "blk", "min"] as const;

async function playerRecentVsSeason(ctx: NbaAskNbaContext, intent: NbaAskIntent, hit: NbaAskPlayerHit): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  let season = CURRENT_NBA_SEASON_KEY;
  let logs = (await loadPlayerGameLogsSnapshot(ctx.db, season, hit.playerId)).gameLogs.filter((g) => g.min > 0);
  if (logs.length === 0) {
    season = previousNbaSeasonKey(season);
    logs = (await loadPlayerGameLogsSnapshot(ctx.db, season, hit.playerId)).gameLogs.filter((g) => g.min > 0);
  }
  if (logs.length === 0) return text(T(lang, `${hit.name} の試合記録はまだありません。`, `No game log for ${hit.name} yet.`));
  const asked = Number(/(\d+)\s*試合|last\s*(\d+)/i.exec(ctx.question)?.slice(1).find(Boolean));
  const want = intent.count ?? (asked > 0 ? asked : 5);
  /** 頼まれた試合数がシーズン全体と同じ以上なら差が 0 になるので、5 試合で比べる */
  const whole = want >= logs.length;
  const n = whole ? Math.min(5, Math.max(1, logs.length - 1)) : want;
  const lead = whole && logs.length > 1 ? T(lang, `今季はまだ${logs.length}試合なので、直近${n}試合で比べます。`, `Only ${logs.length} games so far; using the last ${n}. `) : "";
  const recent = logs.slice(0, n);
  const avg = (list: NbaPlayerGameLog[], k: (typeof LOG_STATS)[number]) => list.reduce((s, g) => s + g[k], 0) / list.length;
  const fg = (list: NbaPlayerGameLog[]) => {
    const a = list.reduce((s, g) => s + g.fga, 0);
    return a ? list.reduce((s, g) => s + g.fgm, 0) / a : null;
  };
  const fg3 = (list: NbaPlayerGameLog[]) => {
    const a = list.reduce((s, g) => s + g.fg3a, 0);
    return a ? list.reduce((s, g) => s + g.fg3m, 0) / a : null;
  };
  const rows: Array<{ id: string; label: string; cells: string[] }> = LOG_STATS.map((k) => {
    const s = avg(logs, k);
    const r = avg(recent, k);
    return { id: k, label: playerLabel(k, lang), cells: [r.toFixed(1), s.toFixed(1), s1(r - s)] };
  });
  for (const [id, f] of [["fg_pct", fg], ["fg3_pct", fg3]] as const) {
    const s = f(logs);
    const r = f(recent);
    if (s !== null && r !== null) rows.push({ id, label: playerLabel(id, lang), cells: [pct1(r), pct1(s), `${s1((r - s) * 100)}pt`] });
  }
  const stat = playerMetricOf(ctx.question);
  const head = rows.find((r) => r.id === stat) ?? rows[0]!;
  const hl = head.label;
  const seasonNote = season !== CURRENT_NBA_SEASON_KEY ? T(lang, `（${season}）`, ` (${season})`) : "";
  return boardAnswer(
    lead +
    T(
      lang,
      `${hit.name} の直近${n}試合${seasonNote}の${hl}は平均 ${head.cells[0]}で、シーズン平均（${logs.length}試合）${head.cells[1]}と比べて ${head.cells[2]}。`,
      `${hit.name} last ${n}${seasonNote}: ${hl} ${head.cells[0]} vs season ${head.cells[1]} (${logs.length} games), ${head.cells[2]}.`
    ),
    {
      columns: [T(lang, `直近${n}`, `Last ${n}`), T(lang, "シーズン", "Season"), T(lang, "差", "Diff")],
      rows: rows.map(({ label, cells }) => ({ label, cells })),
    },
    season === CURRENT_NBA_SEASON_KEY ? { kind: "player", id: hit.playerId, section: "game_logs", count: n } : undefined
  );
}

// ---------------------------------------------------------------------------
// 選手: リーグ全体の前季比
// ---------------------------------------------------------------------------

async function playersVsLastSeason(ctx: NbaAskNbaContext, prev: string): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const cur = CURRENT_NBA_SEASON_KEY;
  const pw = prevWord(prev);
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, cur)).hub;
  if (!hub || hub.players.length === 0) return text(T(lang, "今季の選手の集計がまだありません。", "No player data this season yet."));
  const id = playerMetricOf(ctx.question);
  const maxGp = Math.max(...hub.players.map((p) => p.gp));
  const pool = hub.players.filter((p) => p.gp >= Math.max(3, Math.floor(maxGp * 0.5)));
  /** 成功率は試投が少ないと 0% → 100% のように振れるので、両シーズンとも 1 試合の試投で足切り */
  const volume = ({ fg3_pct: ["fg3a", 2], fg_pct: ["fga", 5], ft_pct: ["fta", 1.5] } as Record<string, [string, number]>)[id];
  const fields = ["gamesPlayed", `metrics.${id}`, ...(volume ? [`metrics.${volume[0]}`] : [])];
  const read = async (season: string) => {
    const col = ctx.db.collection(NBA_PLAYER_SEASON_METRICS_COLLECTION).doc(season).collection(NBA_PLAYER_SEASON_METRICS_PLAYERS_SUB);
    const refs = pool.map((p) => col.doc(p.playerId));
    const out = new Map<string, { gp: number; v: number }>();
    for (let i = 0; i < refs.length; i += 200) {
      const docs = await ctx.db.getAll(...refs.slice(i, i + 200), { fieldMask: fields });
      for (const d of docs) {
        const data = d.data();
        const metrics = data?.metrics as Record<string, { value?: unknown }> | undefined;
        const v = finite(metrics?.[id]?.value);
        if (volume && !((finite(metrics?.[volume[0]]?.value) ?? 0) >= volume[1])) continue;
        if (d.exists && v !== undefined) out.set(d.id, { gp: Number(data?.gamesPlayed ?? 0), v });
      }
    }
    return out;
  };
  const [before, now] = await Promise.all([read(prev), read(cur)]);
  const rows = pool.flatMap((p) => {
    const a = before.get(p.playerId);
    const b = now.get(p.playerId);
    return a && b && a.gp >= 20 ? [{ p, from: a.v, to: b.v, diff: b.v - a.v }] : [];
  });
  const label = playerLabel(id, lang);
  if (rows.length === 0) return text(T(lang, `${label}を${pw}と比べられる選手がまだいません。`, `No players to compare on ${label} yet.`));
  const worse = DOWN.test(ctx.question);
  const lowerBetter = id === "tov";
  const sorted = [...rows].sort((a, b) => ((worse !== lowerBetter) ? a.diff - b.diff : b.diff - a.diff));
  const top = sorted[0]!;
  const pack = (r: (typeof rows)[number]) => ({
    label: `${r.p.name}（${teamName(r.p.teamId, lang)}）`,
    cells: [fmt(id, r.from), fmt(id, r.to), fmtDiff(id, r.from, r.to)],
  });
  const next = sorted.slice(1, 3).map((r) => `${r.p.name} ${fmtDiff(id, r.from, r.to)}`);
  return boardAnswer(
    T(
      lang,
      `${pw}（${prev}）より${label}がいちばん${worse ? "下がった" : "上がった"}のは${top.p.name}（${teamName(top.p.teamId, lang)}・${fmt(id, top.from)} → ${fmt(id, top.to)}、${fmtDiff(id, top.from, top.to)}）。${next.length ? `続いて${next.join("・")}。` : ""}`,
      `Biggest ${label} ${worse ? "drop" : "rise"} vs ${prev}: ${top.p.name} (${abbr(top.p.teamId)}, ${fmt(id, top.from)} → ${fmt(id, top.to)}, ${fmtDiff(id, top.from, top.to)}).${next.length ? ` Next: ${next.join(", ")}.` : ""}`
    ),
    {
      columns: [prev, cur, T(lang, "差", "DIFF")],
      rows: sorted.slice(0, 5).map(pack),
      note: T(
        lang,
        `1試合平均。今季は出場の多い主力（${Math.max(3, Math.floor(maxGp * 0.5))}試合以上）、${pw}は20試合以上の選手で比べています。${volume ? `両シーズンとも1試合 ${volume[1]}本以上打った選手だけ。` : ""}`,
        `Per game. Regulars this season and 20+ games last season.`
      ),
    }
  );
}

// ---------------------------------------------------------------------------
// 選手: ホーム / アウェー・連戦 2 日目・好調 / 不調・オン / オフ（リーグ全体）
// ---------------------------------------------------------------------------

function ptsOnlyNote(question: string, lang: string): string {
  const w = nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, question);
  return w && w.id !== "pts" ? T(lang, `${w.ja}ではなく得点で比べています（この比較は得点だけ集計しています）。`, "Compared on points only.") : "";
}

function splitAnswer(
  lang: string,
  season: string,
  rows: LeagueHubPlayerSplitRow[],
  head: (top: LeagueHubPlayerSplitRow) => string,
  columns: [string, string],
  note: string
): NbaAskAnswer {
  if (rows.length === 0) return text(T(lang, "この比較に入る選手がまだいません。", "No qualifying players yet."));
  const top = rows[0]!;
  return boardAnswer(`${season} ${head(top)}`, {
    columns: [...columns, T(lang, "差", "Diff")],
    rows: rows.slice(0, 5).map((r) => ({
      label: `${r.name}（${teamName(r.teamId, lang)}）`,
      cells: [`${r.a.toFixed(1)}（${r.aGames}）`, `${r.b.toFixed(1)}（${r.bGames}）`, s1(r.diff)],
    })),
    note,
  });
}

async function playersSplitOrTrend(ctx: NbaAskNbaContext, kind: "home" | "away" | "homeAway" | "b2bDrop" | "b2bUp" | "hot" | "cold"): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  if (!hub) return text(T(lang, "今季の選手の集計がまだありません。", "No player data this season yet."));
  const season = hub.seasonKey;
  const extra = ptsOnlyNote(ctx.question, lang);

  if (kind === "hot" || kind === "cold") {
    const list = kind === "hot" ? hub.hot : hub.cold;
    if (list.length === 0) return text(T(lang, "この比較に入る選手がまだいません。", "No qualifying players yet."));
    const top = list[0]!;
    return withHubView(boardAnswer(
      T(
        lang,
        `${season} の直近5試合の平均得点が、それまでより${kind === "hot" ? "いちばん上がっている" : "いちばん下がっている"}のは${top.name}（${teamName(top.teamId, lang)}・直近 ${top.recent.toFixed(1)}点、それまで ${top.before.toFixed(1)}点、${s1(top.diff)}）。`,
        `${season} ${kind === "hot" ? "hottest" : "coldest"} scorer: ${top.name} (${abbr(top.teamId)}, last 5 ${top.recent.toFixed(1)} vs ${top.before.toFixed(1)} before, ${s1(top.diff)}).`
      ),
      {
        columns: [T(lang, "直近5", "Last 5"), T(lang, "それまで", "Before"), T(lang, "差", "Diff")],
        rows: list.slice(0, 5).map((r) => ({ label: `${r.name}（${teamName(r.teamId, lang)}）`, cells: [r.recent.toFixed(1), r.before.toFixed(1), s1(r.diff)] })),
        note: [T(lang, "1試合平均の得点。", "Points per game."), extra].filter(Boolean).join(" "),
      }
    ), "hot_cold");
  }

  const splits = hub.playerSplits;
  if (!splits) return text(T(lang, "ホーム / アウェー・連戦の比較はまだ集計がありません。", "No home/away or back-to-back splits yet."));
  /** 見出しは「名前（チーム・数字）」と括弧を 1 つにまとめる */
  const name = (r: LeagueHubPlayerSplitRow) => `${r.name}（${teamName(r.teamId, lang)}・`;
  if (kind === "b2bDrop" || kind === "b2bUp") {
    const rows = kind === "b2bDrop" ? splits.b2bDrop : splits.b2bUp;
    return withHubView(splitAnswer(
      lang,
      season,
      rows,
      (top) =>
        T(
          lang,
          `連戦2日目に得点がいちばん${kind === "b2bDrop" ? "落ちる" : "上がる"}のは${name(top)}2日目 ${top.a.toFixed(1)}点・ふだん ${top.b.toFixed(1)}点、${s1(top.diff)}）。`,
          `biggest back-to-back ${kind === "b2bDrop" ? "drop" : "lift"}: ${top.name} (2nd day ${top.a.toFixed(1)} vs ${top.b.toFixed(1)}).`
        ),
      [T(lang, "2日目", "2nd day"), T(lang, "ふだん", "Other")],
      [T(lang, "1試合平均の得点（）は試合数。2日目 = 自分も前日に出た試合。平均12点以上の選手。", "Points per game (games). 2nd day = played the day before too."), extra].filter(Boolean).join(" ")
    ), "splits", "b2b");
  }
  const rows =
    kind === "home" ? splits.home : kind === "away" ? splits.away : [...splits.home, ...splits.away].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  return withHubView(splitAnswer(
    lang,
    season,
    rows,
    (top) =>
      kind === "homeAway"
        ? T(lang, `ホームとアウェーの得点の差がいちばん大きいのは${name(top)}ホーム ${top.a.toFixed(1)}点・アウェー ${top.b.toFixed(1)}点、${s1(top.diff)}）。`, `biggest home/away scoring gap: ${top.name} (${top.a.toFixed(1)} home vs ${top.b.toFixed(1)} away).`)
        : T(
            lang,
            `${kind === "home" ? "ホーム" : "アウェー"}のほうが得点がいちばん多いのは${name(top)}ホーム ${top.a.toFixed(1)}点・アウェー ${top.b.toFixed(1)}点、${s1(kind === "home" ? top.diff : -top.diff)}）。`,
            `scores most more ${kind}: ${top.name} (${top.a.toFixed(1)} home vs ${top.b.toFixed(1)} away).`
          ),
    [T(lang, "ホーム", "Home"), T(lang, "アウェー", "Away")],
    [T(lang, "1試合平均の得点（）は試合数。差 = ホーム − アウェー。平均12点以上の選手。", "Points per game (games). Diff = home − away."), extra].filter(Boolean).join(" ")
  ), "splits", "homeAway");
}

async function playersOnOff(ctx: NbaAskNbaContext): Promise<NbaAskAnswer> {
  const lang = ctx.language;
  const hub = (await loadNbaLeagueHubSnapshot(ctx.db, CURRENT_NBA_SEASON_KEY)).hub;
  const all = (hub?.players ?? []).filter((p) => p.onOff);
  if (!hub || all.length === 0) return text(T(lang, "オン / オフの集計がまだありません。", "No on/off data yet."));
  /** LEAGUE の ON / OFF と同じ足切り（オン 100 分・オフ 50 分）。序盤で誰も届かないときだけ出場の長い順の割合で */
  const strict = all.filter((p) => p.onOff!.onMin >= 100 && p.onOff!.offMin >= 50);
  const maxOn = Math.max(...all.map((p) => p.onOff!.onMin));
  const pool = strict.length > 0 ? strict : all.filter((p) => p.onOff!.onMin >= maxOn * 0.4 && p.onOff!.offMin >= 30);
  const neg = /マイナス|悪い|低い|下が|ワースト|worst|negative/i.test(ctx.question);
  /** 「オンのネットが一番高い」= 差ではなくコートにいるときの NET */
  const onOnly = /オン(?:の|時の|コートの)?\s*(?:ネット|NET)|コートにいる(?:とき|時)の(?:ネット|NET)/i.test(ctx.question) && !/差/.test(ctx.question);
  const key = (p: (typeof pool)[number]) => (onOnly ? p.onOff!.onNet : p.onOff!.onNet - p.onOff!.offNet);
  const rows = pool.map((p) => ({ p, diff: p.onOff!.onNet - p.onOff!.offNet, k: key(p) })).sort((a, b) => (neg ? a.k - b.k : b.k - a.k));
  if (rows.length === 0) return text(T(lang, "この比較に入る選手がまだいません。", "No qualifying players yet."));
  const top = rows[0]!;
  const out = boardAnswer(
    T(
      lang,
      onOnly
        ? `${hub.seasonKey} でコートにいるときのチームの NET（100ポゼッションあたりの得失点差）がいちばん${neg ? "低い" : "高い"}のは${top.p.name}（${teamName(top.p.teamId, lang)}・オン ${s1(top.p.onOff!.onNet)} / オフ ${s1(top.p.onOff!.offNet)}）。`
        : `${hub.seasonKey} でコートにいるときといないときの差（100ポゼッションあたりの得失点差）がいちばん${neg ? "マイナスな" : "大きい"}のは${top.p.name}（${teamName(top.p.teamId, lang)}・オン ${s1(top.p.onOff!.onNet)} / オフ ${s1(top.p.onOff!.offNet)}、${s1(top.diff)}）。`,
      `${hub.seasonKey} ${neg ? "worst" : "best"} on/off: ${top.p.name} (${abbr(top.p.teamId)}, on ${s1(top.p.onOff!.onNet)} / off ${s1(top.p.onOff!.offNet)}, ${s1(top.diff)}).`
    ),
    {
      columns: [T(lang, "オン", "On"), T(lang, "オフ", "Off"), T(lang, "差", "Diff")],
      rows: rows.slice(0, 5).map(({ p, diff }) => ({ label: `${p.name}（${teamName(p.teamId, lang)}）`, cells: [s1(p.onOff!.onNet), s1(p.onOff!.offNet), s1(diff)] })),
      note: strict.length > 0
        ? T(lang, "オン 100 分・オフ 50 分以上の選手。", "At least 100 on and 50 off minutes.")
        : T(lang, "出場時間が長い選手（リーグ最長の4割以上）だけ。", "Players with heavy minutes only."),
    }
  );
  /** LEAGUE の ON / OFF は差の大きい順だけ */
  return neg || onOnly || strict.length === 0 ? out : withHubView(out, "on_off");
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

const NOT_COMPARE_QUERIES = new Set([
  "games_on_date",
  "who_wins",
  "news",
  "pro_insight",
  "pro_league",
  "team_payroll",
  "salary_ranking",
  "player_contract",
  "milestones",
  "award_ladder",
  "team_draft_picks",
  "team_injuries",
  "team_moves",
  "player_discipline",
  "team_discipline",
  "player_profile",
  "player_shot_zones",
  "team_lineups",
  "player_matchups",
]);

const PICKS = /(?:UNITERZ|ユニターズ|ユーザー|みんな)の?予想/i;
const PICKS_COMPARE = /より|上回|下回|以上|以下|勝って|負けて|裏切|期待|差|的中|当た|実際/;

/** 「UNITERZ の予想より勝っているチーム」= みんなの予想とチームの成績の比較（Pro Pick の質問ではない） */
export function nbaAskIsPicksCompare(question: string): boolean {
  return PICKS.test(question) && PICKS_COMPARE.test(question);
}

/** 比較の質問ならその答え。違えば null（ふだんの流れへ） */
export async function answerNbaAskCompare(ctx: NbaAskNbaContext, intent: NbaAskIntent): Promise<NbaAskAnswer | null> {
  const q = ctx.question;
  const query = intent.query ?? "unsupported";
  /** 2 選手（AI が「どっちが」を勝敗予想と読んでも、名前が 2 つあればスタッツの比較） */
  if (intent.player && intent.player2 && intent.player2 !== intent.player && !/勝つ|勝てる|試合|対戦|日程|予想|契約|年俸/.test(q)) {
    return twoPlayers(ctx, intent);
  }
  if (NOT_COMPARE_QUERIES.has(query) && !PICKS.test(q)) return null;

  const teamsInText = findNbaAskTeamsInText(q);
  const lastSeason = (LAST_SEASON.test(q) || TWO_SEASONS_AGO.test(q)) && CHANGE.test(q);
  const base = nbaAskRelativeSeason(q) ?? previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY);
  const season = nbaAskRelativeSeason(q) ?? (intent.season && /^20\d{2}-\d{2}$/.test(intent.season) ? intent.season : CURRENT_NBA_SEASON_KEY);
  /** 2 チーム（「試合」「勝つ」は予想・日程の質問） */
  if (teamsInText.length >= 2 && !intent.player && (COMPARE.test(q) || /と.{0,12}(?:の差|どっちが|どちらが)/.test(q)) && !/勝つ|勝てる|試合|対戦|日程|予想/.test(q)) {
    return twoTeams(ctx, nbaAskRelativeSeason(q) ?? CURRENT_NBA_SEASON_KEY, teamsInText[0]!, teamsInText[1]!);
  }

  /** 選手 1 人 */
  if (intent.player) {
    const recent = RECENT.test(q) && (COMPARE.test(q) || CHANGE.test(q) || /平均と|シーズン平均|いつも|普段|ふだん|調子/.test(q));
    if (!lastSeason && !recent) return null;
    const hit = await resolvePlayer(ctx, intent.player, intent.player_written);
    if (typeof hit === "string") return null;
    return lastSeason ? playerVsLastSeason(ctx, hit, base) : playerRecentVsSeason(ctx, intent, hit);
  }

  const teamId = teamInQuestion(q, intent);
  const playerWide =
    !teamId && (PLAYER_WORD.test(q) || (!TEAM_WORD.test(q) && (query.startsWith("player_") || query === "player_leaders" || query === "daily_leaders")));

  /** リーグ全体の選手 */
  if (playerWide) {
    if (lastSeason) return playersVsLastSeason(ctx, base);
    if (/オン.?オフ|on.?off|いるときと(?:いない|居ない)とき|オン(?:の|時の|コートの)?\s*(?:ネット|NET)/i.test(q)) return playersOnOff(ctx);
    const home = /ホーム|本拠地|\bhome\b/i.test(q);
    const away = /アウェー|アウェイ|ロード|敵地|\baway\b|\broad\b/i.test(q);
    if (/連戦|バック.?トゥ.?バック|\bB2B\b|2日目|back.?to.?back/i.test(q)) {
      return playersSplitOrTrend(ctx, /落ちない|強い|上が|増え|むしろ|better|up\b/i.test(q) ? "b2bUp" : "b2bDrop");
    }
    if (home && away && /差|違|比べ|比較|gap|diff/i.test(q)) return playersSplitOrTrend(ctx, "homeAway");
    if (home !== away) {
      /** 「ホームで落ちる」= アウェーのほうが取る */
      const flip = DOWN.test(q) || /弱い|苦手/.test(q);
      return playersSplitOrTrend(ctx, (home ? !flip : flip) ? "home" : "away");
    }
    if (RECENT.test(q) || /好調|不調|絶好調|スランプ|調子|波に乗|hot|cold|slump/i.test(q)) {
      return playersSplitOrTrend(ctx, DOWN.test(q) || /不調|スランプ|悪い|cold|slump/i.test(q) ? "cold" : "hot");
    }
    /** 「今季一番得点が伸びた選手」= 前季比 */
    if ((UP.test(q) || DOWN.test(q)) && /一番|いちばん|最も|もっとも|誰|だれ|どの選手|トップ|most|who/i.test(q) && !/試合|勝/.test(q)) {
      return playersVsLastSeason(ctx, base);
    }
    return null;
  }

  /** チーム（1 チームかリーグ全体） */
  if (nbaAskIsPicksCompare(q)) return teamsVsPicks(ctx);
  if (lastSeason) return teamVsLastSeason(ctx, teamId, base);
  const delta = ratingDeltaKey(q);
  if (delta) return teamRatingDelta(ctx, season, delta, ratingMetricOf(q), teamId);
  if (teamId) return null;
  const found = SITUATIONS.filter(([re]) => re.test(q)).map(([, s]) => s);
  if (found.length > 0 && RECORD_ASK.test(q)) {
    /** 「東と西でどこ」= カンファレンスごと */
    if (/東と西|西と東|東西(?:で|それぞれ|別)|各カンファ|両カンファ|それぞれのカンファ/.test(q)) {
      const [e, w] = await Promise.all([teamsSituation(ctx, found, "east"), teamsSituation(ctx, found, "west")]);
      if (e?.board && w?.board) {
        return boardAnswer(`${e.answer}${w.answer}`, {
          columns: e.board.columns,
          rows: [...e.board.rows.slice(0, 3).map((r) => ({ ...r, label: `${T(ctx.language, "東", "E")} ${r.label}` })), ...w.board.rows.slice(0, 3).map((r) => ({ ...r, label: `${T(ctx.language, "西", "W")} ${r.label}` }))],
          ...(e.board.note ? { note: e.board.note } : {}),
        });
      }
    }
    const out = await teamsSituation(ctx, found, conferenceFilter(q, intent));
    if (out) return out;
  }
  return null;
}
