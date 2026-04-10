import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { getCalendarMonthRangeInTimeZone } from "@/lib/time/zonedTime";

/** 指定暦月に1試合でも存在するか（月送りの可否判定） */
export async function fetchMonthHasGames(params: {
  league: League;
  monthAnchor: Date;
  timeZone: string;
}): Promise<boolean> {
  const league = normalizeLeague(params.league);
  const { start, end } = getCalendarMonthRangeInTimeZone(
    params.monthAnchor,
    params.timeZone
  );

  const q = query(
    collection(db, "games"),
    where("league", "==", league),
    where("season", "==", GAME_SCHEDULE_SEASON),
    where("startAtJst", ">=", Timestamp.fromDate(start)),
    where("startAtJst", "<", Timestamp.fromDate(end)),
    orderBy("startAtJst", "asc"),
    limit(1)
  );

  const snap = await getDocs(q);
  return !snap.empty;
}
