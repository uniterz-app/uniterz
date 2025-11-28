// scripts/import-games.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// =========================
//  Firestore Admin 初期化
// =========================

// サービスアカウントキーを安全に読み込む
const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  resolve(process.cwd(), "serviceAccount.json"); // ルート直下の serviceAccount.json

const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

// Firebase Admin SDK 初期化
initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore();

// =========================
//  ヘルパー関数
// =========================

/**
 * JST ISO文字列 → Firestore Timestamp に変換
 * 例: "2025-11-06T18:05:00+09:00"
 */
function toJstTimestamp(isoString: string): Timestamp {
  return Timestamp.fromDate(new Date(isoString));
}

/**
 * 1シーズン定義（例: 2025年8月〜2026年7月 → "2025-26"）
 */
function seasonFromDate(date: Date): string {
  const y = date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

// =========================
//  インポート対象データ
// =========================

const games = [
  {
    id: "bj-20251106-001",
    league: "bj",
    venue: "船橋アリーナ",
    roundLabel: "第4節",
    status: "scheduled",
    startAtJst: "2025-11-06T18:05:00+09:00",
    home: { name: "千葉ジェッツ" },
    away: { name: "琉球ゴールデンキングス" },
  },
  {
    id: "bj-20251106-002",
    league: "bj",
    venue: "沖縄アリーナ",
    roundLabel: "第4節",
    status: "scheduled",
    startAtJst: "2025-11-06T19:05:00+09:00",
    home: { name: "名古屋ダイヤモンドドルフィンズ" },
    away: { name: "宇都宮ブレックス" },
  },
  {
    id: "bj-20251106-003",
    league: "bj",
    venue: "横浜アリーナ",
    roundLabel: "第4節",
    status: "scheduled",
    startAtJst: "2025-11-06T19:35:00+09:00",
    home: { name: "横浜ビー・コルセアーズ" },
    away: { name: "アルバルク東京" },
  },
  {
    id: "j-20251109-001",
    league: "j",
    venue: "等々力陸上競技場",
    roundLabel: "第34節",
    status: "scheduled",
    startAtJst: "2025-11-09T16:00:00+09:00",
    home: { name: "川崎フロンターレ" },
    away: { name: "鹿島アントラーズ" },
  },
  {
    id: "j-20251109-002",
    league: "j",
    venue: "埼玉スタジアム2002",
    roundLabel: "第34節",
    status: "scheduled",
    startAtJst: "2025-11-09T16:00:00+09:00",
    home: { name: "浦和レッズ" },
    away: { name: "サンフレッチェ広島" },
  },
];

// =========================
//  Firestore 書き込み
// =========================

async function main() {
  console.log("🚀 Importing games to Firestore...");

  for (const g of games) {
    const startAtTs = toJstTimestamp(g.startAtJst);
    const season = seasonFromDate(startAtTs.toDate());

    await db.collection("games").doc(g.id).set({
      ...g,
      season,
      startAt: startAtTs,
      startAtJst: startAtTs, // Timestamp型で統一
      final: false,
      homeScore: null,
      awayScore: null,
      resultComputedAt: null,
      score: null,
      liveMeta: null,
      finalMeta: null,
    });

    console.log(`✅ imported: ${g.id}`);
  }

  console.log("🎉 All games imported successfully!");
}

// =========================
//  実行
// =========================

main().catch((e) => {
  console.error("❌ import failed:", e);
  process.exit(1);
});
