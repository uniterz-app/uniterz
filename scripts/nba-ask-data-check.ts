/**
 * ASK の答え（データ側）を、AI を使わずに全種類流す。読み取りの結果（intent）は手で決め打ち。
 * 本番 Firestore を読むだけ（書き込みなし・OpenAI なし）。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/nba-ask-data-check.ts
 *   npx tsx --tsconfig tsconfig.json scripts/nba-ask-data-check.ts --only 年俸
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { emptyNbaAskIntent, type NbaAskIntent } from "../lib/nba/ask/nbaAskIntent";
import { answerNbaAskQuery } from "../lib/nba/ask/nbaAskNbaAnswer";

/** emptyOk: データが無いと正しく言えれば OK（まだ対戦していない等） */
type Case = { q: string; intent: Partial<NbaAskIntent>; expect?: RegExp; emptyOk?: boolean };

const CASES: Case[] = [
  // 選手
  { q: "エンビードの前回の試合", intent: { query: "player_last_game", player: "Joel Embiid" }, expect: /前回の試合|今の試合/ },
  { q: "カリーの直近5試合", intent: { query: "player_recent_games", player: "Stephen Curry", count: 5 }, expect: /直近5試合/ },
  { q: "ドンチッチの今季平均", intent: { query: "player_season", player: "Luka Doncic" }, expect: /の平均/ },
  { q: "ドンチッチの得点はリーグ何位", intent: { query: "player_season", player: "Luka Doncic" }, expect: /得点 .*リーグ\d+位/ },
  { q: "ヨキッチのTS%", intent: { query: "player_season", player: "Nikola Jokic" }, expect: /TS% / },
  { q: "ウェンバンヤマのPER", intent: { query: "player_season", player: "Victor Wembanyama" }, expect: /PER / },
  { q: "ヨキッチのトリプルダブルの数", intent: { query: "player_season", player: "Nikola Jokic" }, expect: /トリプルダブル \d+回/ },
  { q: "ウェンバンヤマ ブロック何本", intent: { query: "player_season", player: "Victor Wembanyama" }, expect: /ブロック/ },
  { q: "シャイの身長", intent: { query: "player_profile", player: "Shai Gilgeous-Alexander" } },
  { q: "レブロンのキャリア", intent: { query: "player_career", player: "LeBron James" } },
  { q: "テイタムの契約", intent: { query: "player_contract", player: "Jayson Tatum" }, expect: /契約/ },
  { q: "カリーのショットゾーン", intent: { query: "player_shot_zones", player: "Stephen Curry" } },
  { q: "ドンチッチのテクニカル", intent: { query: "player_discipline", player: "Luka Doncic" }, expect: /テクニカル/ },
  { q: "ドンチッチのホームとアウェー", intent: { query: "player_splits", player: "Luka Doncic" }, expect: /ホームとアウェー/ },
  { q: "カリーのセルティックス戦", intent: { query: "player_splits", player: "Stephen Curry", opponent: "BOS" }, emptyOk: true },
  { q: "ドンチッチの今季最高得点", intent: { query: "player_highs", player: "Luka Doncic" }, expect: /シーズン最高/ },
  { q: "ザイオン怪我してる？", intent: { query: "team_injuries", player: "Zion Williamson" } },
  // チーム
  { q: "ナゲッツの前の試合", intent: { query: "team_recent_games", team: "DEN", count: 1 } },
  { q: "サンダーの成績", intent: { query: "team_record", team: "OKC" }, expect: /勝.*敗/ },
  { q: "ナゲッツのホームの成績", intent: { query: "team_splits", team: "DEN" }, expect: /ホーム（.*勝.*敗/ },
  { q: "レイカーズの状況別の成績", intent: { query: "team_splits", team: "LAL" }, expect: /状況別/ },
  { q: "レイカーズのセルティックスとの対戦成績", intent: { query: "team_splits", team: "LAL", opponent: "BOS" }, emptyOk: true },
  { q: "レイカーズのナゲッツとの対戦成績", intent: { query: "team_splits", team: "LAL", opponent: "DEN" }, emptyOk: true },
  { q: "セルティックスのレーティング", intent: { query: "team_stat", team: "BOS" }, expect: /レーティング/ },
  { q: "セルティックスのガベージ抜きNET", intent: { query: "team_stat", team: "BOS" }, expect: /ガベージタイム抜きNET/, emptyOk: true },
  { q: "クラッチに強いチーム", intent: { query: "team_stat" }, expect: /クラッチのNET1位/ },
  { q: "ペイントの得点が多いチーム", intent: { query: "team_stat" }, expect: /ペイント内の得点1位/ },
  { q: "一番ディフェンスが弱いチーム", intent: { query: "team_stat", order: "worst" }, expect: /DRTG.*下位/ },
  { q: "ウォリアーズの3P成功率は何位", intent: { query: "team_stat", team: "GSW" }, expect: /3P成功率: .*位/ },
  { q: "ニックスのロスター", intent: { query: "team_roster", team: "NYK" } },
  { q: "レイカーズのベストラインナップ", intent: { query: "team_lineups", team: "LAL", order: "best" }, emptyOk: true },
  { q: "バックスのけが人", intent: { query: "team_injuries", team: "MIL" } },
  { q: "ネッツに入った選手", intent: { query: "team_moves", team: "BKN" } },
  { q: "ロケッツは接戦に強い？", intent: { query: "team_shapes", team: "HOU" } },
  { q: "サンズのテクニカル", intent: { query: "team_discipline", team: "PHX" } },
  { q: "セルティックスの年俸", intent: { query: "team_payroll", team: "BOS" }, expect: /年俸総額/ },
  { q: "サンダーの指名権の数", intent: { query: "team_draft_picks", team: "OKC" }, expect: /1巡目 \d+本/ },
  { q: "レイカーズはどのポジションに点を取られてる", intent: { query: "team_position_defense", team: "LAL" } },
  // 年俸の順位
  { q: "今季のサラリーランキング18位は", intent: { query: "salary_ranking" }, expect: /年俸 18位は/ },
  { q: "年俸ランキング", intent: { query: "salary_ranking" }, expect: /年俸ランキング/ },
  { q: "カリーの年俸は何位", intent: { query: "salary_ranking", player: "Stephen Curry" }, expect: /リーグ\d+位/ },
  { q: "年俸総額ランキング5位のチーム", intent: { query: "salary_ranking" }, expect: /年俸総額 5位は/ },
  { q: "レイカーズのサラリーランキング", intent: { query: "salary_ranking", team: "LAL" }, expect: /年俸総額は/ },
  // LEAGUE タブ（hub）
  { q: "ドンチッチのオンオフ", intent: { query: "on_off", player: "Luka Doncic" }, expect: /コートにいると|まだ集計/, emptyOk: true },
  { q: "セルティックスで一番影響が大きい選手", intent: { query: "on_off", team: "BOS" }, expect: /差がいちばん大きい|まだ集計/, emptyOk: true },
  { q: "ドートのマッチアップ", intent: { query: "player_matchups", player: "Luguentz Dort" }, expect: /マッチアップ（|まだ集計/, emptyOk: true },
  { q: "カリーを誰が守ってる", intent: { query: "player_matchups", player: "Stephen Curry" }, expect: /マッチアップ（|まだ集計/, emptyOk: true },
  { q: "ヨキッチのプレースタイル", intent: { query: "style_map", player: "Nikola Jokic" }, expect: /プレースタイル/ },
  { q: "サンダーのプレースタイル", intent: { query: "style_map", team: "OKC" }, expect: /プレースタイル/ },
  { q: "エリートシューターは誰", intent: { query: "style_map" }, expect: /エリートシューター/ },
  // リーグ
  { q: "西の順位", intent: { query: "standings", conference: "west" } },
  { q: "得点王", intent: { query: "player_leaders", metric: "pts" }, expect: /得点1位/ },
  { q: "ダブルダブルが一番多い選手", intent: { query: "player_leaders" }, expect: /ダブルダブル1位/ },
  { q: "TS%のランキング", intent: { query: "player_leaders" }, expect: /TS%1位/ },
  { q: "昨日一番点を取った選手", intent: { query: "daily_leaders", metric: "pts", date: "yesterday" } },
  { q: "MVP争い", intent: { query: "award_ladder", award: "mvp" } },
  { q: "通算記録に近い選手", intent: { query: "milestones" } },
  { q: "今日の試合", intent: { query: "games_on_date" } },
  { q: "ヒートの次の試合", intent: { query: "games_on_date", team: "MIA" } },
];

async function main() {
  const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
  const db = getAdminDb();
  let ok = 0;
  let ng = 0;
  for (const c of CASES.filter((x) => !only || x.q.includes(only))) {
    const intent = emptyNbaAskIntent({ kind: "nba", ...c.intent });
    let line = "";
    let pass = false;
    try {
      const r = await answerNbaAskQuery({ db, language: "ja", timeZone: "Asia/Tokyo", uid: "data-check", question: c.q }, intent);
      const empty = /まだありません|見つかりませんでした|ありません。$|データはアプリにありません/.test(r.answer) && !r.board && !r.games;
      pass = (!empty || c.emptyOk === true) && (!c.expect || c.expect.test(r.answer));
      line = r.answer.split("\n")[0]!.slice(0, 120);
      if (r.board) line += `  [表 ${r.board.rows.length}行: ${r.board.rows.slice(0, 2).map((x) => `${x.label} ${x.cells.join("/")}`).join(" | ")}]`;
      if (r.games) line += `  [試合カード ${r.games.length}]`;
    } catch (e) {
      line = `ERROR ${e instanceof Error ? e.message : String(e)}`;
    }
    if (pass) ok++;
    else ng++;
    console.log(`${pass ? "OK" : "NG"}  ${c.q}\n    ${line}`);
  }
  console.log(`\n${ok}/${ok + ng} OK（AI は使っていません・Firestore 読み取りのみ）`);
}

void main();
