/**
 * Games 窓の端判定・日付キー加減算。
 */

import {
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { GAMES_WINDOW_EDGE_TRIGGER_DAYS } from "@/lib/games/gamesWindowConstants";

export function shiftDateKeyInTimeZone(
  dateKey: string,
  timeZone: string,
  dayDelta: number
): string | null {
  const base = parseDateKeyInTimeZone(dateKey, timeZone);
  if (!base) return null;
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + dayDelta);
  return toDateKeyInTimeZone(d, timeZone);
}

/** selected が end（半開）の trigger 日以内なら前方延長が必要 */
export function needsForwardWindowExtend(
  selectedKey: string,
  rangeEndKey: string,
  timeZone: string,
  triggerDays = GAMES_WINDOW_EDGE_TRIGGER_DAYS
): boolean {
  if (!selectedKey || !rangeEndKey) return false;
  const lastIncluded = shiftDateKeyInTimeZone(rangeEndKey, timeZone, -1);
  if (!lastIncluded) return selectedKey >= rangeEndKey;
  const triggerStart = shiftDateKeyInTimeZone(
    lastIncluded,
    timeZone,
    -(triggerDays - 1)
  );
  if (!triggerStart) return false;
  return selectedKey >= triggerStart && selectedKey < rangeEndKey;
}

/** selected が start の trigger 日以内なら後方延長が必要 */
export function needsBackwardWindowExtend(
  selectedKey: string,
  rangeStartKey: string,
  timeZone: string,
  triggerDays = GAMES_WINDOW_EDGE_TRIGGER_DAYS
): boolean {
  if (!selectedKey || !rangeStartKey) return false;
  const triggerEnd = shiftDateKeyInTimeZone(
    rangeStartKey,
    timeZone,
    triggerDays
  );
  if (!triggerEnd) return false;
  return selectedKey >= rangeStartKey && selectedKey < triggerEnd;
}

export function mergeGameRowsById(
  base: ReadonlyArray<Record<string, unknown>>,
  extra: ReadonlyArray<Record<string, unknown>>
): Record<string, unknown>[] {
  const byId = new Map<string, Record<string, unknown>>();
  for (const row of base) {
    const id = String(row.id ?? "");
    if (id) byId.set(id, row);
  }
  for (const row of extra) {
    const id = String(row.id ?? "");
    if (!id) continue;
    const prev = byId.get(id);
    byId.set(id, prev ? { ...prev, ...row } : row);
  }
  return Array.from(byId.values());
}
