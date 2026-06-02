import type { Timestamp } from "firebase-admin/firestore";
import {
  TIMEZONE_JST,
  getTodayKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** グループの「これから」集計開始日（JST YYYY-MM-DD） */
export function resolveRankingStartDateKey(
  groupData: Record<string, unknown> | undefined
): string {
  const explicit = groupData?.rankingStartDateKey;
  if (typeof explicit === "string" && DATE_KEY_RE.test(explicit)) {
    return explicit;
  }

  const createdAt = groupData?.createdAt;
  if (
    createdAt &&
    typeof createdAt === "object" &&
    "toDate" in createdAt &&
    typeof (createdAt as Timestamp).toDate === "function"
  ) {
    return toDateKeyInTimeZone((createdAt as Timestamp).toDate(), TIMEZONE_JST);
  }

  return getTodayKeyInTimeZone(TIMEZONE_JST);
}
