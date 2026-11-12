/**
 * ASK の無料チェック。AI もネットも Firestore も使わない。
 * - 即答（言い回しの一致）
 * - AI が過去に返した読み違い → コードの直し（sanitize + settle）
 * - DB を読まずに返す定型の答え
 *
 *   npx tsx --tsconfig tsconfig.json scripts/nba-ask-offline-check.ts
 */
import type { Firestore } from "firebase-admin/firestore";
import { matchNbaAskKnowledge } from "../lib/nba/ask/nbaAskKnowledge";
import { sanitizeNbaAskIntent, type NbaAskIntent } from "../lib/nba/ask/nbaAskIntent";
import { settleNbaAskIntent, type NbaAskTurn } from "../lib/nba/ask/runNbaAsk";
import { answerNbaAskQuery } from "../lib/nba/ask/nbaAskNbaAnswer";

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, got: string) {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "OK" : "NG"}  ${label}${ok ? "" : `   → ${got}`}`);
}

// --- 即答 ---
const FAST: Array<[string, string | null]> = [
  ["unitって何", "unit_about"],
  ["ユニットとは", "unit_about"],
  ["Unitってどうやってもらえるの？", "unit_earn"],
  ["unitはどれくらいもらえる？", "unit_earn"],
  ["連勝ってどうやったら伸びる", "scoring"],
  ["連勝ボーナスって？", "scoring"],
  ["パスワード忘れた", "password"],
  ["グループの招待コードどこ", "groups"],
  ["友達招待したらいくらもらえる", "invite"],
  ["ランキングに自分が出ない", "ranking_missing"],
  ["英語表示にしたい", "language"],
  ["予想って何時まで？", "prediction_deadline"],
  ["解約の仕方", "pro_manage"],
  ["アップセットって何", "scoring"],
  ["エンビードの前回の試合", null],
  ["レイカーズの年俸", null],
];
for (const [q, id] of FAST) {
  const hit = matchNbaAskKnowledge(q);
  check(`即答 ${q}`, (hit?.id ?? null) === id, String(hit?.id ?? null));
}
check("即答 連勝の説明は streak", matchNbaAskKnowledge("連勝ってどうやったら伸びる")?.focus === "streak", String(matchNbaAskKnowledge("連勝ってどうやったら伸びる")?.focus));
check("即答 連勝ボーナスは全体の説明", matchNbaAskKnowledge("連勝ボーナスって？")?.focus === "overview", String(matchNbaAskKnowledge("連勝ボーナスって？")?.focus));

// --- AI の読み違い → 直し ---
type Case = { q: string; prior?: NbaAskTurn[]; raw: Record<string, unknown>; expect: Partial<NbaAskIntent> };
const embiidPrior: NbaAskTurn[] = [
  { role: "user", content: "エンビードの前回の試合" },
  { role: "assistant", content: "Joel Embiid（セブンティシクサーズ）の前回の試合: 11月11日 vs セルティックス 負け" },
];
const curryPrior: NbaAskTurn[] = [
  { role: "user", content: "カリーの直近5試合" },
  { role: "assistant", content: "Stephen Curry（ウォリアーズ）直近5試合: 平均 26.4点 3.6リバウンド 3.8アシスト" },
];
const CASES: Case[] = [
  { q: "シャイの身長は？", raw: { kind: "app", app_topic: "app_overview", player: "Shai Gilgeous-Alexander" }, expect: { kind: "nba", query: "player_profile" } },
  { q: "ウォーリアーズ強い？", raw: { kind: "unclear", team: "GSW" }, expect: { kind: "nba", query: "team_record" } },
  { q: "河村勇輝", raw: { kind: "unclear", player: "Yuki Kawamura" }, expect: { kind: "nba", query: "player_season" } },
  { q: "スコア外したら0点？", raw: { kind: "app", app_topic: "scoring", scoring_focus: "upset" }, expect: { kind: "app", scoring_focus: "overview" } },
  { q: "アップセットの点数は？", raw: { kind: "app", app_topic: "scoring", scoring_focus: "upset" }, expect: { scoring_focus: "upset" } },
  { q: "2016年の優勝チーム", raw: { kind: "off_topic" }, expect: { kind: "nba", query: "unsupported" } },
  { q: "明日の天気", raw: { kind: "off_topic" }, expect: { kind: "off_topic" } },
  { q: "今シーズンの得点王は", raw: { kind: "nba", query: "player_leaders", metric: "pts", season: "2024-25" }, expect: { query: "player_leaders", season: null } },
  { q: "去年の得点王", raw: { kind: "nba", query: "player_leaders", metric: "pts", season: "2025-26" }, expect: { season: "2025-26" } },
  { q: "その前は？", prior: embiidPrior, raw: { kind: "nba", query: "player_last_game", player: "Joel Embiid", count: 2 }, expect: { query: "player_recent_games" } },
  { q: "ウェンバンヤマ ブロック何本？", raw: { kind: "nba", query: "player_leaders", player: "Victor Wembanyama", metric: "blk" }, expect: { query: "player_season" } },
  { q: "昨日リバウンド一番取った人は", raw: { kind: "nba", query: "player_leaders", date: "yesterday", metric: "reb" }, expect: { query: "daily_leaders" } },
  { q: "ニックスは今何位？", raw: { kind: "nba", query: "standings", team: "NYK" }, expect: { query: "team_record" } },
  { q: "ドンチッチは？", prior: curryPrior, raw: { kind: "unclear", player: "Luka Doncic" }, expect: { kind: "nba", query: "player_recent_games", count: 5 } },
  { q: "アントのケガは？", raw: { kind: "nba", query: "team_injuries", player: "Anthony Davis" }, expect: { player: "Anthony Edwards" } },
  { q: "ザイオンの契約", raw: { kind: "app", app_topic: "app_overview", player: "Zion Williamson" }, expect: { query: "player_contract" } },
  { q: "ヨキッチのレイカーズ戦の成績", raw: { kind: "nba", query: "player_recent_games", player: "Nikola Jokic", opponent: "LAL" }, expect: { query: "player_splits" } },
  { q: "クラッチに強いチーム", raw: { kind: "nba", query: "team_shapes" }, expect: { query: "team_stat" } },
  { q: "ヨキッチのトリプルダブル何回？", raw: { kind: "nba", query: "player_highs", player: "Nikola Jokic" }, expect: { query: "player_season" } },
  { q: "トリプルダブル最多は誰", raw: { kind: "nba", query: "player_season", metric: "pts" }, expect: { query: "player_leaders" } },
  { q: "ドートがシャイを守ったときの成績", raw: { kind: "nba", query: "player_matchups", player: "Luguentz Dort", player2: "Shai Gilgeous-Alexander" }, expect: { player: "Luguentz Dort" } },
  { q: "こんきのサラリーランキング18位は", raw: { kind: "nba", query: "salary_ranking" }, expect: { player: null } },
  { q: "キングの今季平均", raw: { kind: "nba", query: "player_season", player: "LeBron James" }, expect: { player: "LeBron James" } },
  { q: "オンオフは？", prior: curryPrior, raw: { kind: "unclear", player: "Stephen Curry" }, expect: { kind: "nba", query: "on_off" } },
];
for (const c of CASES) {
  const turns: NbaAskTurn[] = [...(c.prior ?? []), { role: "user", content: c.q }];
  const got = settleNbaAskIntent(sanitizeNbaAskIntent(c.raw), turns);
  const miss = Object.entries(c.expect).filter(([k, v]) => got[k as keyof NbaAskIntent] !== v);
  check(`直し ${c.q}`, miss.length === 0, miss.map(([k, v]) => `${k}=${String(got[k as keyof NbaAskIntent])}≠${String(v)}`).join(", "));
}

// --- DB を読まない定型の答え ---
const noDb = null as unknown as Firestore;
const ctx = (question: string) => ({ db: noDb, language: "ja", timeZone: "Asia/Tokyo", uid: "offline", question });
const blank = sanitizeNbaAskIntent({ kind: "nba" });
const fixed: Array<[string, Partial<NbaAskIntent>, RegExp]> = [
  ["今日誰が勝つと思う？", { query: "who_wins" }, /予想は.*出していません/],
  ["2016年の優勝チーム", { query: "unsupported" }, /2020-21 シーズンから/],
  ["2018-19 のレブロン", { query: "player_season", season: "2018-19", player: "LeBron James" }, /2020-21 シーズンから/],
];

async function main() {
  for (const [q, patch, re] of fixed) {
    const r = await answerNbaAskQuery(ctx(q), { ...blank, ...patch });
    check(`定型 ${q}`, re.test(r.answer) && r.usedStats === false, `${r.answer} usedStats=${r.usedStats}`);
  }
  console.log(`\n${pass}/${pass + fail} OK（AI・ネット・Firestore は使っていません）`);
  if (fail) process.exit(1);
}

void main();
