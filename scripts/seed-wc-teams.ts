/**
 * World Cup 出場国（teams コレクション）の seed スクリプト
 *
 * 実行:
 *   npx tsx scripts/seed-wc-teams.ts
 *   または
 *   npx ts-node scripts/seed-wc-teams.ts
 *
 * 前提:
 *   - service-account.json または serviceAccount.json がプロジェクトルートに存在
 *   - teamId は "wc-{ISO3 lower}" 形式（例: wc-jpn / wc-bra）
 *   - 国情報の唯一の真実は lib/wc/wcCountry.ts と lib/teams-wc.ts。
 *     ここはそれを Firestore に書き出すだけ。
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
// @ts-ignore
import adminPkg from "firebase-admin";
const admin = adminPkg;

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  (existsSync("service-account.json")
    ? resolve("service-account.json")
    : resolve("serviceAccount.json"));
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

const db = admin.firestore();

type WcTeamSeed = {
  iso3: string; // teamId は "wc-" + iso3
  name: string;
  nameJa: string;
  iso2: string;
  primary: string;
  secondary: string;
  group: string;
};

// 48 カ国（lib/wc/wcCountry.ts / lib/teams-wc.ts と一致）
const WC_TEAMS: WcTeamSeed[] = [
  // Group A
  { iso3: "mex", name: "Mexico", nameJa: "メキシコ", iso2: "MX", primary: "#006847", secondary: "#CE1126", group: "A" },
  { iso3: "zaf", name: "South Africa", nameJa: "南アフリカ", iso2: "ZA", primary: "#007749", secondary: "#FFB81C", group: "A" },
  { iso3: "kor", name: "South Korea", nameJa: "韓国", iso2: "KR", primary: "#003478", secondary: "#C60C30", group: "A" },
  { iso3: "cze", name: "Czechia", nameJa: "チェコ", iso2: "CZ", primary: "#11457E", secondary: "#D7141A", group: "A" },
  // Group B
  { iso3: "can", name: "Canada", nameJa: "カナダ", iso2: "CA", primary: "#FF0000", secondary: "#FFFFFF", group: "B" },
  { iso3: "bih", name: "Bosnia & Herzegovina", nameJa: "ボスニア・ヘルツェゴビナ", iso2: "BA", primary: "#002F6C", secondary: "#FECB00", group: "B" },
  { iso3: "qat", name: "Qatar", nameJa: "カタール", iso2: "QA", primary: "#8D1B3D", secondary: "#FFFFFF", group: "B" },
  { iso3: "che", name: "Switzerland", nameJa: "スイス", iso2: "CH", primary: "#FF0000", secondary: "#FFFFFF", group: "B" },
  // Group C
  { iso3: "bra", name: "Brazil", nameJa: "ブラジル", iso2: "BR", primary: "#009C3B", secondary: "#FEDF00", group: "C" },
  { iso3: "mar", name: "Morocco", nameJa: "モロッコ", iso2: "MA", primary: "#C1272D", secondary: "#006233", group: "C" },
  { iso3: "hti", name: "Haiti", nameJa: "ハイチ", iso2: "HT", primary: "#00209F", secondary: "#D21034", group: "C" },
  { iso3: "sct", name: "Scotland", nameJa: "スコットランド", iso2: "GB-SCT", primary: "#005EB8", secondary: "#FFFFFF", group: "C" },
  // Group D
  { iso3: "usa", name: "USA", nameJa: "アメリカ", iso2: "US", primary: "#002868", secondary: "#BF0A30", group: "D" },
  { iso3: "pry", name: "Paraguay", nameJa: "パラグアイ", iso2: "PY", primary: "#D52B1E", secondary: "#0038A8", group: "D" },
  { iso3: "aus", name: "Australia", nameJa: "オーストラリア", iso2: "AU", primary: "#00843D", secondary: "#FFCD00", group: "D" },
  { iso3: "tur", name: "Türkiye", nameJa: "トルコ", iso2: "TR", primary: "#E30A17", secondary: "#FFFFFF", group: "D" },
  // Group E
  { iso3: "deu", name: "Germany", nameJa: "ドイツ", iso2: "DE", primary: "#000000", secondary: "#DD0000", group: "E" },
  { iso3: "civ", name: "Côte d'Ivoire", nameJa: "コートジボワール", iso2: "CI", primary: "#F77F00", secondary: "#009E60", group: "E" },
  { iso3: "ecu", name: "Ecuador", nameJa: "エクアドル", iso2: "EC", primary: "#FFD700", secondary: "#034EA2", group: "E" },
  { iso3: "cuw", name: "Curaçao", nameJa: "キュラソー", iso2: "CW", primary: "#002B7F", secondary: "#F9E300", group: "E" },
  // Group F
  { iso3: "nld", name: "Netherlands", nameJa: "オランダ", iso2: "NL", primary: "#FF6B00", secondary: "#21468B", group: "F" },
  { iso3: "jpn", name: "Japan", nameJa: "日本", iso2: "JP", primary: "#BC002D", secondary: "#FFFFFF", group: "F" },
  { iso3: "swe", name: "Sweden", nameJa: "スウェーデン", iso2: "SE", primary: "#006AA7", secondary: "#FECC00", group: "F" },
  { iso3: "tun", name: "Tunisia", nameJa: "チュニジア", iso2: "TN", primary: "#E70013", secondary: "#FFFFFF", group: "F" },
  // Group G
  { iso3: "bel", name: "Belgium", nameJa: "ベルギー", iso2: "BE", primary: "#ED2939", secondary: "#FAE042", group: "G" },
  { iso3: "egy", name: "Egypt", nameJa: "エジプト", iso2: "EG", primary: "#CE1126", secondary: "#000000", group: "G" },
  { iso3: "irn", name: "Iran", nameJa: "イラン", iso2: "IR", primary: "#239F40", secondary: "#DA0000", group: "G" },
  { iso3: "nzl", name: "New Zealand", nameJa: "ニュージーランド", iso2: "NZ", primary: "#000000", secondary: "#FFFFFF", group: "G" },
  // Group H
  { iso3: "esp", name: "Spain", nameJa: "スペイン", iso2: "ES", primary: "#AA151B", secondary: "#F1BF00", group: "H" },
  { iso3: "cpv", name: "Cabo Verde", nameJa: "カーボベルデ", iso2: "CV", primary: "#003893", secondary: "#F7D116", group: "H" },
  { iso3: "sau", name: "Saudi Arabia", nameJa: "サウジアラビア", iso2: "SA", primary: "#006C35", secondary: "#FFFFFF", group: "H" },
  { iso3: "ury", name: "Uruguay", nameJa: "ウルグアイ", iso2: "UY", primary: "#0038A8", secondary: "#FCD116", group: "H" },
  // Group I
  { iso3: "fra", name: "France", nameJa: "フランス", iso2: "FR", primary: "#002654", secondary: "#ED2939", group: "I" },
  { iso3: "sen", name: "Senegal", nameJa: "セネガル", iso2: "SN", primary: "#00853F", secondary: "#FDEF42", group: "I" },
  { iso3: "irq", name: "Iraq", nameJa: "イラク", iso2: "IQ", primary: "#CE1126", secondary: "#000000", group: "I" },
  { iso3: "nor", name: "Norway", nameJa: "ノルウェー", iso2: "NO", primary: "#BA0C2F", secondary: "#00205B", group: "I" },
  // Group J
  { iso3: "arg", name: "Argentina", nameJa: "アルゼンチン", iso2: "AR", primary: "#74ACDF", secondary: "#FFFFFF", group: "J" },
  { iso3: "dza", name: "Algeria", nameJa: "アルジェリア", iso2: "DZ", primary: "#006233", secondary: "#FFFFFF", group: "J" },
  { iso3: "aut", name: "Austria", nameJa: "オーストリア", iso2: "AT", primary: "#ED2939", secondary: "#FFFFFF", group: "J" },
  { iso3: "jor", name: "Jordan", nameJa: "ヨルダン", iso2: "JO", primary: "#CE1126", secondary: "#007A3D", group: "J" },
  // Group K
  { iso3: "prt", name: "Portugal", nameJa: "ポルトガル", iso2: "PT", primary: "#006600", secondary: "#FF0000", group: "K" },
  { iso3: "cod", name: "DR Congo", nameJa: "DRコンゴ", iso2: "CD", primary: "#007FFF", secondary: "#FFD200", group: "K" },
  { iso3: "uzb", name: "Uzbekistan", nameJa: "ウズベキスタン", iso2: "UZ", primary: "#0099B5", secondary: "#1EB53A", group: "K" },
  { iso3: "col", name: "Colombia", nameJa: "コロンビア", iso2: "CO", primary: "#FCD116", secondary: "#003893", group: "K" },
  // Group L
  { iso3: "eng", name: "England", nameJa: "イングランド", iso2: "GB-ENG", primary: "#CE1124", secondary: "#FFFFFF", group: "L" },
  { iso3: "hrv", name: "Croatia", nameJa: "クロアチア", iso2: "HR", primary: "#FF0000", secondary: "#171796", group: "L" },
  { iso3: "gha", name: "Ghana", nameJa: "ガーナ", iso2: "GH", primary: "#006B3F", secondary: "#FCD116", group: "L" },
  { iso3: "pan", name: "Panama", nameJa: "パナマ", iso2: "PA", primary: "#005AA7", secondary: "#DA121A", group: "L" },
];

(async () => {
  console.log(`=== WC teams seeding START (${WC_TEAMS.length} teams) ===`);

  let batch = db.batch();
  let pending = 0;

  for (const team of WC_TEAMS) {
    const id = `wc-${team.iso3}`;
    const ref = db.collection("teams").doc(id);
    batch.set(
      ref,
      {
        teamId: id,
        league: "wc",

        name: team.name,
        nameJa: team.nameJa,
        iso2: team.iso2,
        iso3: team.iso3.toUpperCase(),

        primary: team.primary,
        secondary: team.secondary,
        group: team.group,

        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        rank: null,

        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    pending++;
    console.log(`  queued: ${id} (Group ${team.group})`);
    // Firestore のバッチ上限 500 を超えないように 400 ごとに commit
    if (pending >= 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();
  console.log("=== WC teams seeding COMPLETED ===");
  process.exit(0);
})().catch((e) => {
  console.error("seed failed:", e);
  process.exit(1);
});
