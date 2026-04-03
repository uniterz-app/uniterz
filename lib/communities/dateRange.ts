import {
  TIMEZONE_JST,
  getTodayKeyInTimeZone,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
  getZonedYMD,
} from "@/lib/time/zonedTime";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** JST のその月に存在する日付キー一覧 */
export function dateKeysInMonthJST(year: number, month: number): string[] {
  const keys: string[] = [];
  for (let d = 1; d <= 31; d++) {
    const key = `${year}-${pad2(month)}-${pad2(d)}`;
    const dt = parseDateKeyInTimeZone(key, TIMEZONE_JST);
    if (!dt) continue;
    const p = getZonedYMD(dt, TIMEZONE_JST);
    if (p.year === year && p.month === month) keys.push(key);
  }
  return keys;
}

export function currentMonthDateKeysJST(now = new Date()): string[] {
  const { year, month } = getZonedYMD(now, TIMEZONE_JST);
  return dateKeysInMonthJST(year, month);
}

export function rolling30DateKeysJST(now = new Date()): string[] {
  const endKey = getTodayKeyInTimeZone(TIMEZONE_JST, now);
  const endDate = parseDateKeyInTimeZone(endKey, TIMEZONE_JST);
  if (!endDate) return [endKey];
  const keys: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(endDate.getTime() - i * 86400000);
    keys.push(toDateKeyInTimeZone(d, TIMEZONE_JST));
  }
  return keys.reverse();
}
