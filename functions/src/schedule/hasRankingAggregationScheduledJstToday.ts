import { getFirestore } from "firebase-admin/firestore";

import { jstCalendarDayStartEndTimestamps } from "../time/jstCalendarDayFirestore";

/** JST 当日に NBA 試合があれば true（累積ランキング集計トリガー用） */
export async function hasRankingAggregationScheduledJstToday(): Promise<boolean> {
  const db = getFirestore();
  const { start, end } = jstCalendarDayStartEndTimestamps();

  const nbaSnap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", start)
    .where("startAtJst", "<=", end)
    .limit(1)
    .get();

  return !nbaSnap.empty;
}
