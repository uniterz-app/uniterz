/**
 * グループ期間 → 集計する日付キー一覧。
 * 終了日は常に「今日 JST」で clamp（未来分はまだ無い）。
 */
import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonKeyFromDateJST,
} from "@/lib/rankings/nbaSeason";
import {
  TIMEZONE_JST,
  getTodayKeyInTimeZone,
  getZonedYMD,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import type { CommunityPeriodType } from "./types";
import { dateKeysInMonthJST } from "./dateRange";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

const MONTH_KEY_RE = /^\d{4}-\d{2}$/;
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseRankingPeriodMonthKey(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!MONTH_KEY_RE.test(s)) return null;
  const [y, m] = s.split("-").map(Number);
  if (!Number.isFinite(y) || m < 1 || m > 12) return null;
  return `${y}-${pad2(m)}`;
}

export function parseRankingEndDateKey(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  return DATE_KEY_RE.test(s) ? s : null;
}

export function parseRankingSeasonKey(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  return CURRENT_NBA_SEASON_KEY;
}

/** `"2026-27"` → 開始年 2026 */
function seasonStartYear(seasonKey: string): number {
  const y = Number.parseInt(seasonKey.slice(0, 4), 10);
  return Number.isFinite(y) ? y : Number.parseInt(CURRENT_NBA_SEASON_KEY.slice(0, 4), 10);
}

/** 開始〜終了（両端含む）。end < start なら空。 */
export function dateKeysBetweenInclusiveJST(
  startKey: string,
  endKey: string
): string[] {
  const startDate = parseDateKeyInTimeZone(startKey, TIMEZONE_JST);
  const endDate = parseDateKeyInTimeZone(endKey, TIMEZONE_JST);
  if (!startDate || !endDate) return [];
  if (endDate.getTime() < startDate.getTime()) return [];
  const keys: string[] = [];
  const ONE = 86400000;
  for (let t = startDate.getTime(); t <= endDate.getTime(); t += ONE) {
    keys.push(toDateKeyInTimeZone(new Date(t), TIMEZONE_JST));
  }
  return keys;
}

function minDateKey(a: string, b: string): string {
  return a <= b ? a : b;
}

function maxDateKey(a: string, b: string): string {
  return a >= b ? a : b;
}

/** NBA シーズン窓: 開始年 7/1 〜 翌年 6/30 */
export function nbaSeasonDateWindow(seasonKey: string): {
  startKey: string;
  endKey: string;
} {
  const y0 = seasonStartYear(seasonKey);
  return {
    startKey: `${y0}-07-01`,
    endKey: `${y0 + 1}-06-30`,
  };
}

/** プレーオフ窓（カレンダー近似）: 終了年 4/1 〜 6/30 */
export function nbaPlayoffsDateWindow(seasonKey: string): {
  startKey: string;
  endKey: string;
} {
  const y0 = seasonStartYear(seasonKey);
  return {
    startKey: `${y0 + 1}-04-01`,
    endKey: `${y0 + 1}-06-30`,
  };
}

export type ResolveCommunityDateKeysInput = {
  periodType: CommunityPeriodType;
  rankingStartDateKey: string;
  rankingEndDateKey?: string | null;
  rankingPeriodMonthKey?: string | null;
  rankingSeasonKey?: string | null;
  now?: Date;
};

export type ResolveCommunityDateKeysResult = {
  dateKeys: string[];
  effectiveStartKey: string;
  effectiveEndKey: string;
  seasonKey: string;
};

export function resolveCommunityDateKeys(
  input: ResolveCommunityDateKeysInput
): ResolveCommunityDateKeysResult {
  const now = input.now ?? new Date();
  const today = getTodayKeyInTimeZone(TIMEZONE_JST, now);
  const seasonKey = parseRankingSeasonKey(
    input.rankingSeasonKey ?? nbaSeasonKeyFromDateJST(now)
  );

  if (input.periodType === "calendar_month") {
    const monthKey =
      parseRankingPeriodMonthKey(input.rankingPeriodMonthKey) ??
      (() => {
        const { year, month } = getZonedYMD(now, TIMEZONE_JST);
        return `${year}-${pad2(month)}`;
      })();
    const [y, m] = monthKey.split("-").map(Number);
    const monthKeys = dateKeysInMonthJST(y, m).filter((k) => k <= today);
    const start = monthKeys[0] ?? `${monthKey}-01`;
    const end = monthKeys[monthKeys.length - 1] ?? minDateKey(`${monthKey}-01`, today);
    return {
      dateKeys: monthKeys,
      effectiveStartKey: start,
      effectiveEndKey: end,
      seasonKey,
    };
  }

  if (input.periodType === "nba_season") {
    const win = nbaSeasonDateWindow(seasonKey);
    const start = win.startKey;
    const end = minDateKey(win.endKey, today);
    return {
      dateKeys: dateKeysBetweenInclusiveJST(start, end),
      effectiveStartKey: start,
      effectiveEndKey: end,
      seasonKey,
    };
  }

  if (input.periodType === "nba_playoffs") {
    const win = nbaPlayoffsDateWindow(seasonKey);
    const start = win.startKey;
    const end = minDateKey(win.endKey, today);
    return {
      dateKeys: dateKeysBetweenInclusiveJST(start, end),
      effectiveStartKey: start,
      effectiveEndKey: end,
      seasonKey,
    };
  }

  // from_now（＋任意の終了日）
  const start = input.rankingStartDateKey || today;
  const explicitEnd = parseRankingEndDateKey(input.rankingEndDateKey);
  const end = explicitEnd ? minDateKey(explicitEnd, today) : today;
  const clampedStart = maxDateKey(start, start);
  const rangeEnd = end < clampedStart ? clampedStart : end;
  return {
    dateKeys: dateKeysBetweenInclusiveJST(clampedStart, rangeEnd),
    effectiveStartKey: clampedStart,
    effectiveEndKey: rangeEnd,
    seasonKey,
  };
}

/** 作成 UI: 現行 NBA シーズンの対象月（10月〜翌7月・当月以降のみ・古い順） */
export function communityCreateMonthKeysJST(now = new Date()): string[] {
  const seasonKey = nbaSeasonKeyFromDateJST(now);
  const y0 = seasonStartYear(seasonKey);
  const keys: string[] = [];
  for (let m = 10; m <= 12; m++) keys.push(`${y0}-${pad2(m)}`);
  for (let m = 1; m <= 7; m++) keys.push(`${y0 + 1}-${pad2(m)}`);
  const { year, month } = getZonedYMD(now, TIMEZONE_JST);
  const currentKey = `${year}-${pad2(month)}`;
  return keys.filter((k) => k >= currentKey);
}

/** @deprecated → communityCreateMonthKeysJST */
export function recentMonthKeysJST(_count = 12, now = new Date()): string[] {
  return communityCreateMonthKeysJST(now);
}

/** 作成 UI: 「〜月末まで」候補（当月〜シーズン終了の 7 月） */
export function upcomingMonthEndDateKeysJST(
  now = new Date()
): Array<{ monthKey: string; endDateKey: string }> {
  return communityCreateMonthKeysJST(now).map((monthKey) => {
    const [y, m] = monthKey.split("-").map(Number);
    const days = dateKeysInMonthJST(y, m);
    const endDateKey = days[days.length - 1] ?? `${monthKey}-28`;
    return { monthKey, endDateKey };
  });
}
