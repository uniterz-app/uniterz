import { Timestamp, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  TIMEZONE_JST,
  getDayRangeInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import {
  hasConcurrentKickoffSlot,
  resolveKickoffMsFromFields,
} from "@/lib/wc/wcKickoffSlot";

export type WcKickoffGameRow = {
  id: string;
  kickoffMs: number | null;
};

export async function fetchWcGamesForDateKeyJst(
  dateKeyJst: string
): Promise<WcKickoffGameRow[]> {
  const day = new Date(`${dateKeyJst}T12:00:00+09:00`);
  const { start, end } = getDayRangeInTimeZone(day, TIMEZONE_JST);
  const q = query(
    collection(db, "games"),
    where("league", "==", "wc"),
    where("startAtJst", ">=", Timestamp.fromDate(start)),
    where("startAtJst", "<", Timestamp.fromDate(end))
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    kickoffMs: resolveKickoffMsFromFields(doc.data()),
  }));
}

export function todayDateKeyJst(now = new Date()): string {
  return toDateKeyInTimeZone(now, TIMEZONE_JST);
}

export async function detectWcConcurrentKickoffForDateKey(
  dateKeyJst: string
): Promise<{
  hasConcurrent: boolean;
  gameCount: number;
  maxSlotSize: number;
}> {
  const rows = await fetchWcGamesForDateKeyJst(dateKeyJst);
  const kickoffRows = rows.map((r) => ({ kickoffMs: r.kickoffMs }));
  const hasConcurrent = hasConcurrentKickoffSlot(kickoffRows);

  const counts = new Map<number, number>();
  for (const r of kickoffRows) {
    if (r.kickoffMs == null) continue;
    counts.set(r.kickoffMs, (counts.get(r.kickoffMs) ?? 0) + 1);
  }
  const maxSlotSize = counts.size
    ? Math.max(...counts.values())
    : 0;

  return {
    hasConcurrent,
    gameCount: rows.length,
    maxSlotSize,
  };
}
