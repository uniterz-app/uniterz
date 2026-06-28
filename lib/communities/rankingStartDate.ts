import type { Timestamp } from "firebase-admin/firestore";
import {
  TIMEZONE_JST,
  getTodayKeyInTimeZone,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function timestampToMs(raw: unknown): number | null {
  if (
    raw &&
    typeof raw === "object" &&
    "toMillis" in raw &&
    typeof (raw as Timestamp).toMillis === "function"
  ) {
    return (raw as Timestamp).toMillis();
  }
  if (
    raw &&
    typeof raw === "object" &&
    "toDate" in raw &&
    typeof (raw as Timestamp).toDate === "function"
  ) {
    return (raw as Timestamp).toDate().getTime();
  }
  return null;
}

function timestampToDateKey(raw: unknown): string | null {
  if (
    raw &&
    typeof raw === "object" &&
    "toDate" in raw &&
    typeof (raw as Timestamp).toDate === "function"
  ) {
    return toDateKeyInTimeZone((raw as Timestamp).toDate(), TIMEZONE_JST);
  }
  return null;
}

/** グループの「これから」集計開始日（JST YYYY-MM-DD） */
export function resolveRankingStartDateKey(
  groupData: Record<string, unknown> | undefined
): string {
  const explicit = groupData?.rankingStartDateKey;
  if (typeof explicit === "string" && DATE_KEY_RE.test(explicit)) {
    return explicit;
  }

  const fromRankingStartAt = timestampToDateKey(groupData?.rankingStartAt);
  if (fromRankingStartAt) return fromRankingStartAt;

  const fromCreatedAt = timestampToDateKey(groupData?.createdAt);
  if (fromCreatedAt) return fromCreatedAt;

  return getTodayKeyInTimeZone(TIMEZONE_JST);
}

/** グループ競争の集計開始時刻（ms）。作成瞬間以降の試合のみカウントする。 */
export function resolveRankingStartAtMs(
  groupData: Record<string, unknown> | undefined
): number {
  const rankingStartAtMs = timestampToMs(groupData?.rankingStartAt);
  if (rankingStartAtMs != null) return rankingStartAtMs;

  const createdAtMs = timestampToMs(groupData?.createdAt);
  if (createdAtMs != null) return createdAtMs;

  const startKey = resolveRankingStartDateKey(groupData);
  const startDate = parseDateKeyInTimeZone(startKey, TIMEZONE_JST);
  return startDate?.getTime() ?? Date.now();
}
