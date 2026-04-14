import { getFirestore } from "firebase-admin/firestore";

import { jstCalendarDayStartEndTimestamps } from "../time/jstCalendarDayFirestore";

/** True if any NBA game is scheduled for the current JST calendar day (any season phase). */
export async function hasNbaGameScheduledJstToday(): Promise<boolean> {
  const db = getFirestore();
  const { start, end } = jstCalendarDayStartEndTimestamps();

  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", start)
    .where("startAtJst", "<=", end)
    .limit(1)
    .get();

  return !snap.empty;
}
