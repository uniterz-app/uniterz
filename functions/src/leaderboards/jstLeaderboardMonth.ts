/** JST 基準の月キー・日付範囲（UTC サーバーでもリーダーボード月がずれないようにする） */

const TIMEZONE_JST = "Asia/Tokyo";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getZonedYMD(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? NaN);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}

/** JST の「今日」の直前の暦月 YYYY-MM */
export function getLeaderboardLatestMonthKey(now: Date = new Date()): string {
  const { year, month } = getZonedYMD(now, TIMEZONE_JST);
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${pad2(month - 1)}`;
}

export function getJstMonthDateKeyRange(monthKey: string): {
  startKey: string;
  endKey: string;
} {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!m) throw new Error(`invalid monthKey: ${monthKey}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) throw new Error(`invalid monthKey: ${monthKey}`);

  const startKey = `${monthKey}-01`;
  const lastDay = new Date(y, mo, 0).getDate();
  return { startKey, endKey: `${monthKey}-${pad2(lastDay)}` };
}

export function jstMonthBoundaryDates(monthKey: string): {
  start: Date;
  end: Date;
} {
  const { startKey, endKey } = getJstMonthDateKeyRange(monthKey);
  return {
    start: new Date(`${startKey}T00:00:00+09:00`),
    end: new Date(`${endKey}T23:59:59.999+09:00`),
  };
}
