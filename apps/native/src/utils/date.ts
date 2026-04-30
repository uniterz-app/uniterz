export const TIMEZONE_JST = "Asia/Tokyo";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? date.getFullYear());
  const month = Number(parts.find((p) => p.type === "month")?.value ?? date.getMonth() + 1);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? date.getDate());
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function getDayRangeInTimeZone(
  date: Date,
  _timeZone: string
): { start: Date; end: Date } {
  // native 初期版は端末ローカル基準で日付範囲を作る（JST端末運用を前提）
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}
