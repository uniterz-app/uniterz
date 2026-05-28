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
import {
  getDayRangeInTimeZone,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";

/**
 * 指定暦日の終端（翌日0時排他）より後に始まる最初の試合の「暦日0時」（timeZone 基準）。
 * 日付ストリップが ±数日のみのとき、次の試合日ジャンプ用。
 */
export async function fetchNextGameDayAfterLocalDay(params: {
  league: League;
  timeZone: string;
  /** この日を終えたあと（翌0時以降）の試合を探す */
  day: Date;
}): Promise<Date | null> {
  const league = normalizeLeague(params.league);
  const { end } = getDayRangeInTimeZone(params.day, params.timeZone);

  const q = query(
    collection(db, "games"),
    where("league", "==", league),
    where("season", "==", GAME_SCHEDULE_SEASON),
    where("startAtJst", ">=", Timestamp.fromDate(end)),
    orderBy("startAtJst", "asc"),
    limit(1)
  );

  const snap = await getDocs(q);
  const doc0 = snap.docs[0];
  if (!doc0) return null;

  const t = doc0.data()?.startAtJst;
  let d: Date | null = null;
  if (t instanceof Timestamp) d = t.toDate();
  else if (typeof t?.toDate === "function") d = t.toDate();
  else if (t instanceof Date) d = t;
  if (!d) return null;

  const key = toDateKeyInTimeZone(d, params.timeZone);
  return parseDateKeyInTimeZone(key, params.timeZone);
}

/**
 * 指定暦日の始端（当日0時）より前に始まる最後の試合の「暦日0時」（timeZone 基準）。
 * 直近の次試合が無い場合に、最後の試合日へフォールバックするために使う。
 */
export async function fetchPreviousGameDayBeforeLocalDay(params: {
  league: League;
  timeZone: string;
  /** この日の前（当日0時より前）の試合を探す */
  day: Date;
}): Promise<Date | null> {
  const league = normalizeLeague(params.league);
  const { start } = getDayRangeInTimeZone(params.day, params.timeZone);

  const q = query(
    collection(db, "games"),
    where("league", "==", league),
    where("season", "==", GAME_SCHEDULE_SEASON),
    where("startAtJst", "<", Timestamp.fromDate(start)),
    orderBy("startAtJst", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);
  const doc0 = snap.docs[0];
  if (!doc0) return null;

  const t = doc0.data()?.startAtJst;
  let d: Date | null = null;
  if (t instanceof Timestamp) d = t.toDate();
  else if (typeof t?.toDate === "function") d = t.toDate();
  else if (t instanceof Date) d = t;
  if (!d) return null;

  const key = toDateKeyInTimeZone(d, params.timeZone);
  return parseDateKeyInTimeZone(key, params.timeZone);
}
