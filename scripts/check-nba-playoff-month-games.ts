/**
 * Firestore の NBA 5月/6月試合数を確認（読取のみ）
 *   npx tsx scripts/check-nba-playoff-month-games.ts
 */

import { initializeApp } from "firebase/app";
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { getCalendarMonthRangeInTimeZone } from "../lib/time/zonedTime";

const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
  ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ?? "matchpik-7dbb1";

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY
  ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  console.error("EXPO_PUBLIC_FIREBASE_API_KEY または NEXT_PUBLIC_FIREBASE_API_KEY が必要です");
  process.exit(1);
}

const app = initializeApp({
  apiKey,
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
    ?? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    ?? `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
    ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ?? `${projectId}.appspot.com`,
});

const db = getFirestore(app);
const TIMEZONE = "Asia/Tokyo";
const SEASON = "2025-26";

async function countMonth(year: number, month: number) {
  const anchor = new Date(Date.UTC(year, month - 1, 15));
  const { start, end } = getCalendarMonthRangeInTimeZone(anchor, TIMEZONE);
  const q = query(
    collection(db, "games"),
    where("league", "==", "nba"),
    where("season", "==", SEASON),
    where("startAtJst", ">=", Timestamp.fromDate(start)),
    where("startAtJst", "<", Timestamp.fromDate(end)),
    orderBy("startAtJst", "asc"),
    limit(500)
  );
  const snap = await getDocs(q);
  const keys = new Set<string>();
  for (const doc of snap.docs) {
    const raw = doc.data().startAtJst;
    const d = raw?.toDate?.();
    if (d) keys.add(d.toISOString().slice(0, 10));
  }
  return { count: snap.size, days: [...keys].sort() };
}

async function main() {
  console.log(`project: ${projectId}`);
  const may = await countMonth(2026, 5);
  const june = await countMonth(2026, 6);
  console.log(`\n2026-05: ${may.count} 試合, 日付: ${may.days.join(", ") || "(なし)"}`);
  console.log(`2026-06: ${june.count} 試合, 日付: ${june.days.join(", ") || "(なし)"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
