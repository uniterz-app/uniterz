import { Timestamp } from "firebase-admin/firestore";

/** JST calendar day [00:00, 23:59:59.999] as Firestore Timestamps (for games.startAtJst range queries). */
export function jstCalendarDayStartEndTimestamps(now = new Date()): {
  start: Timestamp;
  end: Timestamp;
} {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const start = Timestamp.fromDate(new Date(`${ymd}T00:00:00+09:00`));
  const end = Timestamp.fromDate(new Date(`${ymd}T23:59:59.999+09:00`));
  return { start, end };
}
