import { getFirestore } from "firebase-admin/firestore";

import { jstCalendarDayStartEndTimestamps } from "../time/jstCalendarDayFirestore";

/** JST 当日に NBA または WC の試合があれば true（累積ランキング集計トリガー用） */
export async function hasRankingAggregationScheduledJstToday(): Promise<boolean> {
  const db = getFirestore();
  const { start, end } = jstCalendarDayStartEndTimestamps();

  const [nbaSnap, wcSnap] = await Promise.all([
    db
      .collection("games")
      .where("league", "==", "nba")
      .where("startAtJst", ">=", start)
      .where("startAtJst", "<=", end)
      .limit(1)
      .get(),
    db
      .collection("games")
      .where("league", "==", "wc")
      .where("startAtJst", ">=", start)
      .where("startAtJst", "<=", end)
      .limit(1)
      .get(),
  ]);

  return !nbaSnap.empty || !wcSnap.empty;
}
