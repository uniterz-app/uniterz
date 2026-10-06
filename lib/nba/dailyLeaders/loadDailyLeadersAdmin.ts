/** 指定日（ユーザー TZ の暦日）の NBA 試合を Firestore から読み、Top20 を作る */
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { shiftDateKeyInTimeZone } from "@/lib/games/gamesWindowRange";
import { parseDateKeyInTimeZone } from "@/lib/time/zonedTime";
import {
  buildDailyLeaders,
  type DailyLeadersPayload,
} from "@/lib/nba/dailyLeaders/buildDailyLeaders";

export async function loadDailyLeadersAdmin(
  db: Firestore,
  params: { dateKey: string; timeZone: string }
): Promise<DailyLeadersPayload> {
  const { dateKey, timeZone } = params;
  const start = parseDateKeyInTimeZone(dateKey, timeZone);
  const nextKey = shiftDateKeyInTimeZone(dateKey, timeZone, 1);
  const end = nextKey ? parseDateKeyInTimeZone(nextKey, timeZone) : null;
  if (!start || !end) throw new Error("invalid_date");

  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", GAME_SCHEDULE_SEASON)
    .where("startAtJst", ">=", Timestamp.fromDate(start))
    .where("startAtJst", "<", Timestamp.fromDate(end))
    .orderBy("startAtJst", "asc")
    .limit(40)
    .get();

  return buildDailyLeaders(
    snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })),
    dateKey,
    timeZone
  );
}
