// lib/profile/buildUserStatsWindowCache.ts
// API route: build user_stats_v2_window_cache (shared pattern with Cloud Functions)

import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  aggregateRecentWindowsFromDailySnaps,
  buildDailyTrendFromDailySnaps,
} from "./userStatsV2ProfileRollup";

const STALE_HOURS = 24;

export function isWindowCacheStale(
  updatedAt: { toDate(): Date } | undefined
): boolean {
  if (!updatedAt) return true;
  const then = updatedAt.toDate();
  const now = new Date();
  return now.getTime() - then.getTime() > STALE_HOURS * 60 * 60 * 1000;
}

function dateKeyJST(d: Date): string {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 既に取得済みの直近30日スナップショットで window_cache のみ更新（再読み取りなし） */
export async function buildWindowCacheForUserFromSnapshots(
  db: Firestore,
  uid: string,
  dailySnaps: DocumentSnapshot[]
): Promise<void> {
  const { recent3, seven, thirty } =
    aggregateRecentWindowsFromDailySnaps(dailySnaps);
  const dailyTrend = buildDailyTrendFromDailySnaps(dailySnaps);

  const windowRef = db.doc(`user_stats_v2_window_cache/${uid}`);
  await windowRef.set(
    {
      "7d": { ...seven },
      "30d": { ...thirty },
      recent3Posts: recent3.fullPosts,
      dailyTrend,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function buildWindowCacheForUser(
  db: Firestore,
  uid: string
): Promise<void> {
  const today = new Date();
  const dates: Date[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }

  const dailySnaps = await Promise.all(
    dates.map((d) =>
      db.doc(`user_stats_v2_daily/${uid}_${dateKeyJST(d)}`).get()
    )
  );

  await buildWindowCacheForUserFromSnapshots(db, uid, dailySnaps);
}
