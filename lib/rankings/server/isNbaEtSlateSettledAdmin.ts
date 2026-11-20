/**
 * 米国東部の 1 試合日について、非延期の全試合が settle（resultComputedAtV2）済みか。
 * TODAY UNITERZ の complete 判定と同じ基準。
 */
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { shiftDateKeyInTimeZone } from "@/lib/games/gamesWindowRange";
import { parseDateKeyInTimeZone, TIMEZONE_ET } from "@/lib/time/zonedTime";

export async function isNbaEtSlateSettledAdmin(
  db: Firestore,
  dateKey: string
): Promise<boolean> {
  const start = parseDateKeyInTimeZone(dateKey, TIMEZONE_ET);
  const nextKey = shiftDateKeyInTimeZone(dateKey, TIMEZONE_ET, 1);
  const end = nextKey ? parseDateKeyInTimeZone(nextKey, TIMEZONE_ET) : null;
  if (!start || !end) return false;

  const gamesSnap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", GAME_SCHEDULE_SEASON)
    .where("startAtJst", ">=", Timestamp.fromDate(start))
    .where("startAtJst", "<", Timestamp.fromDate(end))
    .orderBy("startAtJst", "asc")
    .limit(40)
    .select("postponed", "resultComputedAtV2")
    .get();

  const games = gamesSnap.docs
    .map((d) => d.data() as Record<string, unknown>)
    .filter((g) => g.postponed !== true);
  if (games.length === 0) return false;
  return games.every((g) => g.resultComputedAtV2 != null);
}
