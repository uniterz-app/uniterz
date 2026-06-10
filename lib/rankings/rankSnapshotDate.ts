/** JST calendar dateKey (YYYY-MM-DD) for rankSnapshotHistory doc ids. */
export function dateKeyJST(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** JST yesterday — matches Functions `getYesterdayDateKeyJST`. */
export function getYesterdayDateKeyJST(now: Date = new Date()): string {
  const todayKey = dateKeyJST(now);
  return subtractOneDayFromDateKeyJST(todayKey);
}

export function subtractOneDayFromDateKeyJST(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  const yy = prev.getUTCFullYear();
  const mm = String(prev.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(prev.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Matches Functions `RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS`. */
export const RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS = 30;
