import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { jstCalendarDayStartEndMs } from "./jstCalendarDay";

/** JST 当日に NBA 試合があれば true */
export async function hasNbaGamesScheduledJstToday(
  db: Firestore,
  now = new Date()
): Promise<boolean> {
  const { startMs, endMs } = jstCalendarDayStartEndMs(now);
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", Timestamp.fromMillis(startMs))
    .where("startAtJst", "<=", Timestamp.fromMillis(endMs))
    .limit(1)
    .get();
  return !snap.empty;
}
