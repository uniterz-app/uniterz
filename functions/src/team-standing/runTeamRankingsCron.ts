import { getFirestore } from "firebase-admin/firestore";

import { countsTowardRegularSeasonTeamStats } from "../teamStandingsSeasonPhase";
import { jstCalendarDayStartEndTimestamps } from "../time/jstCalendarDayFirestore";
import { updateTeamRankings } from "./updateTeamRankings";

/**
 * Runs updateTeamRankings when this JST date has any NBA game that counts toward
 * regular-season standings (same rule as countsTowardRegularSeasonTeamStats: not play_in / playoffs).
 * Skips days with only play_in or playoff games. Cron: 16:00 Asia/Tokyo.
 */
export async function runTeamRankingsCronIfNbaGamesToday(): Promise<void> {
  const db = getFirestore();
  const { start, end } = jstCalendarDayStartEndTimestamps();

  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", start)
    .where("startAtJst", "<=", end)
    .get();

  const hasRegularStandingsGame = snap.docs.some((doc) =>
    countsTowardRegularSeasonTeamStats(doc.data()?.seasonPhase)
  );

  if (!hasRegularStandingsGame) {
    console.log(
      "[runTeamRankingsCronIfNbaGamesToday] skip: no regular-season NBA games on this JST date"
    );
    return;
  }

  await updateTeamRankings();
}
