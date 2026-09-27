/**
 * 日付ストリップ用の試合日インデックス（Web / Native 共用の型と導出）。
 */

import type { League } from "@/lib/leagues";
import {
  parseDateKeyInTimeZone,
  shiftCalendarMonthStart,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";

export type GameDayIndexPayload = {
  ok: true;
  league: League;
  season: string;
  /** distinct な試合開始 UTC ms（昇順） */
  startMs: number[];
};

/** 閲覧者 TZ の日付キー（重複なし・昇順） */
export function gameDayKeysFromStartMs(
  startMs: readonly number[],
  timeZone: string
): string[] {
  const keys = new Set<string>();
  for (const ms of startMs) {
    keys.add(toDateKeyInTimeZone(new Date(ms), timeZone));
  }
  return [...keys].sort();
}

export function gameDaysFromKeys(keys: readonly string[], timeZone: string): Date[] {
  return keys
    .map((k) => parseDateKeyInTimeZone(k, timeZone))
    .filter((d): d is Date => d != null);
}

/** 選択日の前後の暦月に試合日があるか（月送りの可否） */
export function adjacentMonthsHaveGameDays(
  keys: readonly string[],
  selected: Date,
  timeZone: string
): { prev: boolean; next: boolean } {
  const prevPrefix = toDateKeyInTimeZone(
    shiftCalendarMonthStart(selected, -1, timeZone),
    timeZone
  ).slice(0, 7);
  const nextPrefix = toDateKeyInTimeZone(
    shiftCalendarMonthStart(selected, 1, timeZone),
    timeZone
  ).slice(0, 7);
  return {
    prev: keys.some((k) => k.startsWith(prevPrefix)),
    next: keys.some((k) => k.startsWith(nextPrefix)),
  };
}

/** 指定月（monthAnchor の暦月）の最初の試合日キー */
export function firstGameDayKeyInMonth(
  keys: readonly string[],
  monthAnchor: Date,
  timeZone: string
): string | null {
  const prefix = toDateKeyInTimeZone(monthAnchor, timeZone).slice(0, 7);
  return keys.find((k) => k.startsWith(prefix)) ?? null;
}
