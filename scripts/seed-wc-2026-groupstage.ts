/**
 * 2026 FIFA World Cup グループステージ 全 72 試合の seed スクリプト
 *
 * 実行:
 *   npx tsx scripts/seed-wc-2026-groupstage.ts
 *
 * 前提:
 *   - service-account.json または serviceAccount.json がプロジェクトルートに存在
 *   - 先に scripts/seed-wc-teams.ts を実行済み（teams ドキュメントが存在）
 *
 * 仕様:
 *   - 試合 ID は決定的: "wc-2026-{group}-{homeIso3}-{awayIso3}"（重複実行で上書きされる）
 *   - 入力時刻は ET（UTC-4 EDT 固定。6 月で米国は DST）
 *   - Firestore には UTC Timestamp として保存（タイムゾーンに依存しない）
 *   - season は他の WC データと同じ "2025-26"（既存テストゲームと一致させる）
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { lookupWcBroadcastLabels } from "../lib/wc/wcBroadcastLabels";
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
const Timestamp = admin.firestore.Timestamp;

const SEASON = "2025-26";
const TOURNAMENT_YEAR = 2026;

// ============================================================
// 国名 -> teamId / 表示名
// ============================================================
const TEAM_NAMES: Record<string, { en: string; ja: string }> = {
  mex: { en: "Mexico", ja: "メキシコ" },
  zaf: { en: "South Africa", ja: "南アフリカ" },
  kor: { en: "South Korea", ja: "韓国" },
  cze: { en: "Czechia", ja: "チェコ" },
  can: { en: "Canada", ja: "カナダ" },
  bih: { en: "Bosnia & Herzegovina", ja: "ボスニア・ヘルツェゴビナ" },
  qat: { en: "Qatar", ja: "カタール" },
  che: { en: "Switzerland", ja: "スイス" },
  bra: { en: "Brazil", ja: "ブラジル" },
  mar: { en: "Morocco", ja: "モロッコ" },
  hti: { en: "Haiti", ja: "ハイチ" },
  sct: { en: "Scotland", ja: "スコットランド" },
  usa: { en: "USA", ja: "アメリカ" },
  pry: { en: "Paraguay", ja: "パラグアイ" },
  aus: { en: "Australia", ja: "オーストラリア" },
  tur: { en: "Türkiye", ja: "トルコ" },
  deu: { en: "Germany", ja: "ドイツ" },
  civ: { en: "Côte d'Ivoire", ja: "コートジボワール" },
  ecu: { en: "Ecuador", ja: "エクアドル" },
  cuw: { en: "Curaçao", ja: "キュラソー" },
  nld: { en: "Netherlands", ja: "オランダ" },
  jpn: { en: "Japan", ja: "日本" },
  swe: { en: "Sweden", ja: "スウェーデン" },
  tun: { en: "Tunisia", ja: "チュニジア" },
  bel: { en: "Belgium", ja: "ベルギー" },
  egy: { en: "Egypt", ja: "エジプト" },
  irn: { en: "Iran", ja: "イラン" },
  nzl: { en: "New Zealand", ja: "ニュージーランド" },
  esp: { en: "Spain", ja: "スペイン" },
  cpv: { en: "Cabo Verde", ja: "カーボベルデ" },
  sau: { en: "Saudi Arabia", ja: "サウジアラビア" },
  ury: { en: "Uruguay", ja: "ウルグアイ" },
  fra: { en: "France", ja: "フランス" },
  sen: { en: "Senegal", ja: "セネガル" },
  irq: { en: "Iraq", ja: "イラク" },
  nor: { en: "Norway", ja: "ノルウェー" },
  arg: { en: "Argentina", ja: "アルゼンチン" },
  dza: { en: "Algeria", ja: "アルジェリア" },
  aut: { en: "Austria", ja: "オーストリア" },
  jor: { en: "Jordan", ja: "ヨルダン" },
  prt: { en: "Portugal", ja: "ポルトガル" },
  cod: { en: "DR Congo", ja: "DRコンゴ" },
  uzb: { en: "Uzbekistan", ja: "ウズベキスタン" },
  col: { en: "Colombia", ja: "コロンビア" },
  eng: { en: "England", ja: "イングランド" },
  hrv: { en: "Croatia", ja: "クロアチア" },
  gha: { en: "Ghana", ja: "ガーナ" },
  pan: { en: "Panama", ja: "パナマ" },
};

// ============================================================
// 試合定義（ET 時刻）
//
//   [group, dateMMDD, timeETHHmm, homeIso3, awayIso3, venue]
//
//   ET は EDT (UTC-4) 固定（2026 年 6 月の北米は DST 期間中）
//   注: 0:00 ET 等の深夜表記は表に従ってそのまま保存。
// ============================================================
type Match = [
  group: string,
  dateMMDD: string, // "06-11"
  timeETHHmm: string, // "15:00"
  home: string, // iso3
  away: string, // iso3
  venue: string,
];

const MATCHES: Match[] = [
  // Group A
  ["A", "06-11", "15:00", "mex", "zaf", "Mexico City"],
  ["A", "06-11", "22:00", "kor", "cze", "Guadalajara"],
  ["A", "06-18", "12:00", "cze", "zaf", "Atlanta"],
  ["A", "06-18", "21:00", "mex", "kor", "Guadalajara"],
  ["A", "06-24", "21:00", "cze", "mex", "Mexico City"],
  ["A", "06-24", "21:00", "zaf", "kor", "Monterrey"],

  // Group B
  ["B", "06-12", "15:00", "can", "bih", "Toronto"],
  ["B", "06-13", "15:00", "qat", "che", "San Francisco Bay Area"],
  ["B", "06-18", "15:00", "che", "bih", "Los Angeles"],
  ["B", "06-18", "18:00", "can", "qat", "Vancouver"],
  ["B", "06-24", "15:00", "che", "can", "Vancouver"],
  ["B", "06-24", "15:00", "bih", "qat", "Seattle"],

  // Group C
  ["C", "06-13", "18:00", "bra", "mar", "New York/New Jersey"],
  ["C", "06-13", "21:00", "hti", "sct", "Boston"],
  ["C", "06-19", "18:00", "sct", "mar", "Boston"],
  ["C", "06-19", "21:00", "bra", "hti", "Philadelphia"],
  ["C", "06-24", "18:00", "sct", "bra", "Miami"],
  ["C", "06-24", "18:00", "mar", "hti", "Atlanta"],

  // Group D
  ["D", "06-12", "21:00", "usa", "pry", "Los Angeles"],
  ["D", "06-13", "00:00", "aus", "tur", "Vancouver"],
  ["D", "06-19", "00:00", "tur", "pry", "San Francisco Bay Area"],
  ["D", "06-19", "15:00", "usa", "aus", "Seattle"],
  ["D", "06-25", "22:00", "tur", "usa", "Los Angeles"],
  ["D", "06-25", "22:00", "pry", "aus", "San Francisco Bay Area"],

  // Group E
  ["E", "06-14", "13:00", "deu", "cuw", "Houston"],
  ["E", "06-14", "19:00", "civ", "ecu", "Philadelphia"],
  ["E", "06-20", "16:00", "deu", "civ", "Toronto"],
  ["E", "06-20", "20:00", "ecu", "cuw", "Kansas City"],
  ["E", "06-25", "16:00", "ecu", "deu", "New York/New Jersey"],
  ["E", "06-25", "16:00", "cuw", "civ", "Philadelphia"],

  // Group F
  ["F", "06-14", "16:00", "nld", "jpn", "Dallas"],
  ["F", "06-14", "22:00", "swe", "tun", "Monterrey"],
  ["F", "06-20", "13:00", "nld", "swe", "Houston"],
  ["F", "06-20", "00:00", "tun", "jpn", "Monterrey"],
  ["F", "06-25", "19:00", "tun", "nld", "Dallas"],
  ["F", "06-25", "19:00", "jpn", "swe", "Kansas City"],

  // Group G
  ["G", "06-15", "15:00", "bel", "egy", "Seattle"],
  ["G", "06-15", "21:00", "irn", "nzl", "Los Angeles"],
  ["G", "06-21", "15:00", "bel", "irn", "Los Angeles"],
  ["G", "06-21", "21:00", "nzl", "egy", "Vancouver"],
  ["G", "06-26", "23:00", "nzl", "bel", "Vancouver"],
  ["G", "06-26", "23:00", "egy", "irn", "Seattle"],

  // Group H
  ["H", "06-15", "12:00", "esp", "cpv", "Atlanta"],
  ["H", "06-15", "18:00", "sau", "ury", "Miami"],
  ["H", "06-21", "12:00", "esp", "sau", "Atlanta"],
  ["H", "06-21", "18:00", "ury", "cpv", "Miami"],
  ["H", "06-26", "20:00", "ury", "esp", "Houston"],
  ["H", "06-26", "20:00", "cpv", "sau", "Guadalajara"],

  // Group I
  ["I", "06-16", "15:00", "fra", "sen", "New York/New Jersey"],
  ["I", "06-16", "18:00", "irq", "nor", "Boston"],
  ["I", "06-22", "17:00", "fra", "irq", "Philadelphia"],
  ["I", "06-22", "20:00", "nor", "sen", "New York/New Jersey"],
  ["I", "06-26", "15:00", "nor", "fra", "Boston"],
  ["I", "06-26", "15:00", "sen", "irq", "Toronto"],

  // Group J
  ["J", "06-16", "21:00", "arg", "dza", "Kansas City"],
  ["J", "06-16", "00:00", "aut", "jor", "San Francisco Bay Area"],
  ["J", "06-22", "13:00", "arg", "aut", "Dallas"],
  ["J", "06-22", "23:00", "jor", "dza", "San Francisco Bay Area"],
  ["J", "06-27", "22:00", "jor", "arg", "Dallas"],
  ["J", "06-27", "22:00", "dza", "aut", "Kansas City"],

  // Group K
  ["K", "06-17", "13:00", "prt", "cod", "Houston"],
  ["K", "06-17", "22:00", "uzb", "col", "Mexico City"],
  ["K", "06-23", "13:00", "prt", "uzb", "Houston"],
  ["K", "06-23", "22:00", "col", "cod", "Guadalajara"],
  ["K", "06-27", "19:30", "col", "prt", "Miami"],
  ["K", "06-27", "19:30", "cod", "uzb", "Atlanta"],

  // Group L
  ["L", "06-17", "16:00", "eng", "hrv", "Dallas"],
  ["L", "06-17", "19:00", "gha", "pan", "Toronto"],
  ["L", "06-23", "16:00", "eng", "gha", "Boston"],
  ["L", "06-23", "19:00", "pan", "hrv", "Toronto"],
  ["L", "06-27", "17:00", "pan", "eng", "New York/New Jersey"],
  ["L", "06-27", "17:00", "hrv", "gha", "Philadelphia"],
];

// ============================================================
// ヘルパー
// ============================================================

/** ET (EDT, UTC-4) として ISO 文字列を組み立てる */
function etIsoString(dateMMDD: string, timeETHHmm: string): string {
  // dateMMDD = "06-11", timeETHHmm = "15:00"
  return `${TOURNAMENT_YEAR}-${dateMMDD}T${timeETHHmm}:00-04:00`;
}

function gameId(group: string, home: string, away: string): string {
  return `wc-${TOURNAMENT_YEAR}-${group}-${home}-${away}`;
}

(async () => {
  console.log(
    `=== WC 2026 group stage seeding START (${MATCHES.length} matches) ===`,
  );

  let batch = db.batch();
  let pending = 0;

  for (const [group, dateMMDD, timeETHHmm, homeIso, awayIso, venue] of MATCHES) {
    const id = gameId(group, homeIso, awayIso);
    const homeName = TEAM_NAMES[homeIso];
    const awayName = TEAM_NAMES[awayIso];
    if (!homeName || !awayName) {
      console.warn(`  skip ${id}: unknown team ${homeIso} or ${awayIso}`);
      continue;
    }

    const startAt = Timestamp.fromDate(
      new Date(etIsoString(dateMMDD, timeETHHmm)),
    );

    const ref = db.collection("games").doc(id);
    const broadcastLabels = lookupWcBroadcastLabels(id);
    batch.set(
      ref,
      {
        id,
        league: "wc",
        season: SEASON,

        status: "scheduled",
        startAt,
        startAtJst: startAt,

        venue,
        roundLabel: `Group ${group}`,
        wcStage: "qualifying",
        knockout: false,
        ...(broadcastLabels.length > 0 ? { broadcastLabels } : {}),

        home: {
          teamId: `wc-${homeIso}`,
          name: homeName.en,
          nameJa: homeName.ja,
        },
        away: {
          teamId: `wc-${awayIso}`,
          name: awayName.en,
          nameJa: awayName.ja,
        },

        final: false,
        homeScore: null,
        awayScore: null,
        regulationEtScore: null,
        advancingTeamId: null,

        resultComputedAt: null,
        score: null,
        liveMeta: null,
        finalMeta: null,
      },
      { merge: true },
    );
    pending++;
    console.log(
      `  queued: ${id}  ${homeName.en} vs ${awayName.en}  @ ${venue}  (${dateMMDD} ${timeETHHmm} ET)`,
    );

    if (pending >= 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();
  console.log(`=== WC 2026 group stage seeding COMPLETED ===`);
  process.exit(0);
})().catch((e) => {
  console.error("seed failed:", e);
  process.exit(1);
});
