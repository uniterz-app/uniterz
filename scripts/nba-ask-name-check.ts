/**
 * ASK の選手名の判定（AI が返した英語名 + ユーザーが書いたかな）を今季ロスターで確かめる。AI は使わない。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/nba-ask-name-check.ts
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";
import { pickNbaAskPlayer } from "../lib/nba/ask/nbaAskPlayerResolve";
import type { NbaTeamRosterDocTeam } from "../lib/nba/teamRosters/teamRosterTypes";

/** [AI の英語名, 書かれた名前, 期待する選手名の一部, AI が付けたチーム（移籍前のことがある）] */
const cases: Array<[string, string, string, string?]> = [
  ["LeBron James", "レブロン", "LeBron", "nba-lakers"],
  ["Alex Caruso", "アレックスさー", "Sarr"],
  ["Alex Caruso", "アレックスサー", "Sarr"],
  ["Alex Caruso", "カルーソ", "Caruso"],
  ["Alex Caruso", "アレックスカルーソ", "Caruso"],
  ["Mackin", "マッケイン", "McCain"],
  ["Castle", "キャッスル", "Castle"],
  ["Homegrin", "ホームグレン", "Holmgren"],
  ["Smith", "スミス", "Smith"],
  ["Draymond Green", "グリーン", "Green"],
  ["Paolo Banchero", "バンケロ", "Banchero"],
  ["Devin Booker", "ブッカー", "Booker"],
  ["Nikola Jokic", "ヨキッチ", "Jokic"],
  ["Luka Doncic", "ドンチッチ", "Doncic"],
  ["Victor Wembanyama", "ウェンバンヤマ", "Wembanyama"],
  ["Shai Gilgeous-Alexander", "ギルジャスアレクサンダー", "Gilgeous"],
  ["LeBron James", "レブロン", "LeBron"],
  ["Jayson Tatum", "テイタム", "Tatum"],
  ["Anthony Edwards", "エドワーズ", "Edwards"],
  ["Ja Morant", "ジャモラント", "Morant"],
  ["Alperen Sengun", "シェングン", "Sengun"],
  ["Giannis Antetokounmpo", "ヤニス", "Giannis"],
  ["Flagg", "フラッグ", "Flagg"],
  ["Joel Embiid", "エンビード", "Embiid"],
  ["Jalen Brunson", "ブランソン", "Brunson"],
  ["Tyrese Haliburton", "ハリバートン", "Haliburton"],
  ["Kevin Durant", "デュラント", "Durant"],
  ["Stephen Curry", "カリー", "Curry"],
  ["Klay Thompson", "トンプソン", "Thompson"],
  ["Jalen Green", "ジェイレングリーン", "Jalen Green"],
  ["Lauri Markkanen", "マルカネン", "Markkanen"],
  ["Zion Williamson", "ザイオン", "Zion"],
  ["Cade Cunningham", "カニングハム", "Cunningham"],
  ["Jaylen Brown", "ジェイレンブラウン", "Jaylen Brown"],
  ["Donovan Mitchell", "ミッチェル", "Mitchell"],
  ["Trae Young", "トレイヤング", "Young"],
  ["Rui Hachimura", "Hachimura", "Hachimura"],
  ["Kevin Durant", "デュラント", "Durant"],
  ["Zion Williamson", "ザイオン", "Zion"],
  ["Kyrie Irving", "カイリー", "Kyrie"],
  ["LaMelo Ball", "ラメロ", "LaMelo"],
  ["Joel Embiid", "エンビード", "Embiid"],
  ["Jayson Tatum", "テイタム", "Tatum"],
  /** AI が別人を返しても書かれたかなで直す */
  ["Jaylen Brown", "テイタム", "Tatum"],
  ["Anthony Davis", "エンビード", "Embiid"],
  ["Stephen Curry", "デュラント", "Durant"],
];

async function main() {
  const snap = await getAdminDb().collection("nbaTeamRosters").doc(CURRENT_NBA_SEASON_KEY).get();
  const raw = (snap.data()?.teams ?? {}) as Record<string, NbaTeamRosterDocTeam>;
  const rosters: Record<string, NbaTeamRosterDocTeam> = {};
  for (const [id, t] of Object.entries(raw)) rosters[id] = { ...t, teamId: t.teamId ?? id };
  let ng = 0;
  for (const [ai, written, want, team] of cases) {
    const r = pickNbaAskPlayer(rosters, ai, written, team ?? null);
    const got = r.kind === "one" ? r.hit.name : r.kind === "many" ? `MANY(${r.hits.map((h) => h.name).join(", ")})` : "NONE";
    const ok = got.includes(want) || (want === "Smith" && got.startsWith("MANY"));
    if (!ok) ng++;
    console.log(ok ? "OK " : "NG ", written.padEnd(12, "　"), "→", got);
  }
  console.log(`\n${cases.length - ng}/${cases.length} OK`);
}
void main();
