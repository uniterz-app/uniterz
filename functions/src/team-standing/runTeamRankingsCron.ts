import { getFirestore, Timestamp } from "firebase-admin/firestore";

import { countsTowardRegularSeasonTeamStats } from "../teamStandingsSeasonPhase";
import { updateTeamRankings } from "./updateTeamRankings";

/** Asia/Tokyo の「今日」0:00〜23:59:59.999 を Timestamp で返す */
function jstTodayStartEnd(): { start: Timestamp; end: Timestamp } {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const start = Timestamp.fromDate(new Date(`${ymd}T00:00:00+09:00`));
  const end = Timestamp.fromDate(new Date(`${ymd}T23:59:59.999+09:00`));
  return { start, end };
}

/**
 * Runs updateTeamRankings when this JST date has any NBA game that counts toward
 * regular-season standings (same rule as countsTowardRegularSeasonTeamStats: not play_in / playoffs).
 * Skips days with only play_in or playoff games. Cron: 16:00 Asia/Tokyo.
 */
export async function runTeamRankingsCronIfNbaGamesToday(): Promise<void> {
  const db = getFirestore();
  const { start, end } = jstTodayStartEnd();

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
