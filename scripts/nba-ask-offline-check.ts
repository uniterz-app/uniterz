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
  ["予想を外したらUnitは減る？", "unit_rules"],
  ["Unitに有効期限はある？", "unit_rules"],
  ["試合が延期になったら予想はどうなる？", "postponed"],
  ["週間ランキングと月間ランキングの違いは？", "ranking_periods"],
  ["シーズン途中から始めても月間1位を狙える？", "ranking_periods"],
  ["スクワッドとグループの違いは？", "squads_vs_groups"],
  ["PROが切れたら今までのポイントは消える？", "pro_cancel_league"],
  ["PROを解約したい", "pro_manage"],
  ["連勝が切れたらポイントは？", "scoring"],
  ["試合が終わったらポイントはいつ付く？", null],
  ["エンビードの前回の試合", null],
  ["レイカーズの年俸", null],
  ["チームサラリーのみかたは？", "nav_team_payroll"],
  ["年俸総額の見方", "nav_team_payroll"],
  ["選手の年俸の見方", "nav_player_contract"],
  ["キャップの見方", "nav_team_payroll"],
  ["VALUEランキングはどこ？", "nav_league_hub"],
  ["MVPラダーはどうやってみるの", "nav_league_hub"],
  ["LADDERのMVPはどうやって決めてるの？", "award_ladders"],
  ["ランキングはどこ？", "ranking"],
  ["ショットチャートの見方", "nav_detail_sections"],
  ["ケガ情報はどこ？", "injuries_where"],
  ["MY RANKの見方", "nav_my_rank"],
  ["スタッツはいつ更新される", "stats_refresh"],
  ["スタイルマップはどうやってみるの？", "style_map"],
  ["スタイルマップってなに", "style_map"],
  ["レブロンはスタイルマップでどんなタイプ？", null],
  ["試合一覧で好きなチームの試合だけ表示できる？", "games_filter"],
  ["カレンダーで先の日付に飛べる？", "games_calendar"],
  ["試合のボックススコアはどこで見れる？", "game_stats"],
  ["みんなの予想の割合はどこで見れる？", "crowd_picks"],
  ["PRO PICKって何がわかるの？", "pro_pick"],
  ["PRO PICKの精度ってどうやって出してるの？", "pro_pick_accuracy"],
  ["結果をインスタに載せたい", "share"],
  ["プレーオフのトーナメント表はどこ？", "playoffs_view"],
  ["LADDERのMVPはどうやって決めてるの？", "award_ladders"],
  ["CLN NETって何？", "clean_ratings"],
  ["ガベージ抜きのNETが一番高いチームは？", null],
  ["チュートリアルをもう一回見たい", "tutorial"],
  ["他の人の予想を見たい", "others_picks"],
  ["レブロンとカリーを比べて", null],
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
  { q: "レブロンの成績", raw: { kind: "nba", query: "player_season", player: "Bronny James", player_written: "Lebron", team: "LAL" }, expect: { player: "LeBron James", player_written: null } },
  { q: "レブロンの今季平均", raw: { kind: "nba", query: "player_season", player: "Bronny James" }, expect: { player: "LeBron James" } },
  { q: "キングの今季平均", raw: { kind: "nba", query: "player_season", player: "Bronny James" }, expect: { player: "LeBron James" } },
  { q: "ブロニーの今季平均", raw: { kind: "nba", query: "player_season", player: "LeBron James" }, expect: { player: "Bronny James" } },
  { q: "プレーオフも予想できる？", raw: { kind: "nba", query: "who_wins" }, expect: { kind: "app", app_topic: "prediction_how" } },
  { q: "機種変更したらデータは引き継げる？", raw: { kind: "off_topic" }, expect: { kind: "app", app_topic: "account" } },
  { q: "昨日の試合", raw: { kind: "nba", query: "team_recent_games" }, expect: { query: "games_on_date", date: "yesterday" } },
  { q: "レイカーズの昨日の試合", raw: { kind: "nba", query: "team_recent_games", team: "LAL" }, expect: { query: "team_recent_games" } },
  { q: "オンオフは？", prior: curryPrior, raw: { kind: "unclear", player: "Stephen Curry" }, expect: { kind: "nba", query: "on_off" } },
  // 2026-11 の 286 問で外れた読み取り
  { q: "ミッチェルの出場時間", raw: { kind: "nba", query: "player_recent_games", player: "Donovan Mitchell" }, expect: { query: "player_season" } },
  { q: "ジョキッチのトリプルダブル", raw: { kind: "nba", query: "player_recent_games", player: "Nikola Jokic" }, expect: { query: "player_season" } },
  { q: "ウェンビーのコンテスト", raw: { kind: "nba", query: "player_recent_games", player: "Victor Wembanyama" }, expect: { query: "player_season" } },
  { q: "ホームズのボックスアウト", raw: { kind: "nba", query: "player_last_game", player: "DaRon Holmes II" }, expect: { query: "player_season" } },
  { q: "デローザンのプルアップ", raw: { kind: "nba", query: "style_map", player: "DeMar DeRozan" }, expect: { query: "player_season" } },
  { q: "ヨキッチのプレータイプ", raw: { kind: "nba", query: "style_map", player: "Nikola Jokic" }, expect: { query: "player_season" } },
  { q: "レブロンのプレースタイル", raw: { kind: "nba", query: "style_map", player: "LeBron James" }, expect: { query: "style_map" } },
  { q: "ペイントタッチが多い選手", raw: { kind: "nba", query: "style_map", player: "ペイントタッチ" }, expect: { player: null, query: "player_leaders" } },
  { q: "ドンチッチの直近3試合の平均", raw: { kind: "nba", query: "player_season", player: "Luka Doncic" }, expect: { query: "player_recent_games", count: 3 } },
  { q: "ピックアンドロールが上手いチーム", raw: { kind: "nba", query: "style_map" }, expect: { query: "team_stat" } },
  { q: "コンテストが多いチーム", raw: { kind: "nba", query: "team_shapes", team: "LAL" }, expect: { query: "team_stat", team: null } },
  { q: "ピストンズの得意な展開", raw: { kind: "nba", query: "team_shapes", team: "DET" }, expect: { query: "team_shapes" } },
  { q: "ロケッツの連勝", raw: { kind: "nba", query: "team_recent_games", team: "HOU" }, expect: { query: "team_record" } },
  { q: "サンダーとナゲッツはどっちが強い", raw: { kind: "nba", query: "who_wins", team: "OKC" }, expect: { query: "team_stat" } },
  { q: "今日のレイカーズ戦はどっちが勝つ", raw: { kind: "nba", query: "who_wins", team: "LAL" }, expect: { query: "who_wins" } },
  { q: "テキサスの3チームで一番強いのは", raw: { kind: "nba", query: "who_wins", team: "DAL" }, expect: { query: "team_record", team: null } },
  { q: "延長戦で一番勝ってるチーム", raw: { kind: "nba", query: "who_wins" }, expect: { query: "team_record" } },
  { q: "DRTG上位10チームの中で一番強いのは", raw: { kind: "nba", query: "who_wins" }, expect: { query: "team_record" } },
  { q: "テキサスのチームで明日勝つのは", raw: { kind: "nba", query: "who_wins" }, expect: { query: "who_wins" } },
  { q: "レイカーズは昨季と比べてどう", raw: { kind: "nba", query: "team_moves", team: "LAL" }, expect: { query: "team_stat" } },
  { q: "ラプターズのオフシーズンの補強", raw: { kind: "nba", query: "team_moves", team: "TOR" }, expect: { query: "team_moves" } },
  { q: "ぜいたく税を払っているチーム", raw: { kind: "nba", query: "team_payroll" }, expect: { query: "salary_ranking" } },
  { q: "デューク大学出身の選手", raw: { kind: "nba", query: "player_profile", player: "Duke University" }, expect: { player: null } },
  { q: "オンオフがマイナスの選手", raw: { kind: "nba", query: "on_off", player: "マイナス" }, expect: { player: null } },
  { q: "ハーデンのハッスル", raw: { kind: "off_topic", player: "James Harden" }, expect: { kind: "nba", query: "player_season" } },
  { q: "プレーオフはいつから", raw: { kind: "app" }, expect: { kind: "nba", query: "unsupported" } },
  { q: "オールスターの投票", raw: { kind: "off_topic" }, expect: { kind: "nba", query: "unsupported" } },
  { q: "トレード期限はいつ", raw: { kind: "off_topic" }, expect: { kind: "nba", query: "unsupported" } },
  { q: "ヨキッチの昨季の成績", raw: { kind: "nba", query: "player_season", player: "Nikola Jokic" }, expect: { season: "2025-26" } },
  { q: "ドンチッチの2024-25シーズンの成績", raw: { kind: "nba", query: "player_season", player: "Luka Doncic" }, expect: { season: "2024-25" } },
  { q: "レブロンのプレーオフの成績", raw: { kind: "nba", query: "player_season", player: "LeBron James" }, expect: { playoffs: true } },
  { q: "プレーオフ圏外のチーム", raw: { kind: "nba", query: "standings", playoffs: true }, expect: { playoffs: false } },
  { q: "レブロンの昨季と今季の比較", raw: { kind: "nba", query: "player_season", player: "LeBron James" }, expect: { season: null } },
  // 2026-11 の 386 問で外れた読み取り
  { q: "SGAの前の試合のスタッツ", raw: { kind: "nba", query: "player_recent_games", player: "Shai Gilgeous-Alexander", count: 1 }, expect: { query: "player_last_game" } },
  { q: "ブランソンは何試合出てる", raw: { kind: "nba", query: "player_recent_games", player: "Jalen Brunson", count: 5 }, expect: { query: "player_season" } },
  { q: "SGAって何がすごいの", raw: { kind: "nba", query: "player_profile", player: "Shai Gilgeous-Alexander" }, expect: { query: "player_season" } },
  { q: "SGAの出身大学", raw: { kind: "nba", query: "player_profile", player: "Shai Gilgeous-Alexander" }, expect: { query: "player_profile" } },
  { q: "ウェンビーえぐい", raw: { kind: "off_topic" }, expect: { kind: "nba", query: "player_season" } },
  { q: "サンダー強すぎない？", raw: { kind: "off_topic", team: "OKC" }, expect: { kind: "nba", query: "team_record" } },
  { q: "ドライブ top10", raw: { kind: "off_topic" }, expect: { kind: "nba", query: "player_leaders" } },
  { q: "プルアップ3Pが一番うまい選手", raw: { kind: "nba", query: "style_map" }, expect: { query: "player_leaders" } },
  { q: "ケンタッキー大学出身の選手", raw: { kind: "nba", query: "player_profile", player: "Kentucky" }, expect: { player: null, query: "player_leaders" } },
  { q: "キャバリアーズの失点", raw: { kind: "nba", query: "team_position_defense", team: "CLE" }, expect: { query: "team_stat" } },
  { q: "キャバリアーズのガードへの失点", raw: { kind: "nba", query: "team_position_defense", team: "CLE" }, expect: { query: "team_position_defense" } },
  { q: "セルティックスの5人組で一番いいのは", raw: { kind: "nba", query: "team_stat", team: "BOS" }, expect: { query: "team_lineups", lineup_size: 5, order: "best" } },
  { q: "ナゲッツの2人組で一番いいのは", raw: { kind: "nba", query: "player_season", player: "Nikola Jokic", team: "DEN" }, expect: { query: "team_lineups", player: null, lineup_size: 2 } },
  { q: "オンのネットが一番高い選手", raw: { kind: "nba", query: "salary_ranking", player: "Nikola Jokic" }, expect: { query: "on_off", player: null } },
  { q: "今季ブレイクしてる選手", raw: { kind: "nba", query: "player_leaders" }, expect: { query: "award_ladder", award: "mip" } },
  { q: "ファストブレイクが多いチーム", raw: { kind: "nba", query: "team_stat" }, expect: { query: "team_stat" } },
  { q: "プレーイン争い", raw: { kind: "nba", query: "player_season", player: "play-in" }, expect: { query: "standings", player: null } },
  { q: "テクニカルファウルが一番多い選手", raw: { kind: "nba", query: "player_leaders" }, expect: { query: "player_discipline" } },
  { q: "フレグラントファウルの数", raw: { kind: "app" }, expect: { kind: "nba", query: "player_discipline" } },
  { q: "テクニカルが一番多いチーム", raw: { kind: "nba", query: "team_stat" }, expect: { query: "team_discipline" } },
  { q: "レイカーズとナゲッツのゲーム差", raw: { kind: "nba", query: "team_record", team: "LAL" }, expect: { query: "standings" } },
  /** 初歩的な選手名・呼び名（AI が別人でも settle のニックネームで直す） */
  { q: "エンビードの平均", raw: { kind: "nba", query: "player_season", player: "Joel Embiid" }, expect: { player: "Joel Embiid" } },
  { q: "テイタムの得点", raw: { kind: "nba", query: "player_season", player: "Jaylen Brown" }, expect: { player: "Jayson Tatum" } },
  { q: "ザイオン怪我してる？", raw: { kind: "nba", query: "team_injuries", player: "Zion Williamson" }, expect: { player: "Zion Williamson" } },
  { q: "デュラントの今季平均", raw: { kind: "nba", query: "player_season", player: "Kevin Durant" }, expect: { player: "Kevin Durant" } },
  { q: "ウェンビーえぐい", raw: { kind: "off_topic" }, expect: { kind: "nba", query: "player_season", player: "Victor Wembanyama" } },
  { q: "ジョーカーのアシスト", raw: { kind: "nba", query: "player_season", player: "Nikola Jokic" }, expect: { player: "Nikola Jokic" } },
  { q: "ステフの3P", raw: { kind: "nba", query: "player_season", player: "Stephen Curry" }, expect: { player: "Stephen Curry" } },
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
