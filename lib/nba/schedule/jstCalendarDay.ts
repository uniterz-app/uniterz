/** JST calendar day [00:00, 23:59:59.999] as epoch ms (games.startAtJst range queries). */
export function jstCalendarDayStartEndMs(now = new Date()): {
  startMs: number;
  endMs: number;
} {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const startMs = new Date(`${ymd}T00:00:00+09:00`).getTime();
  const endMs = new Date(`${ymd}T23:59:59.999+09:00`).getTime();
  return { startMs, endMs };
}
