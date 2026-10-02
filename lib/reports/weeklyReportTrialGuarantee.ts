/**
 * 週次レポート（確定週のみ）× トライアル 1 回保証。
 *
 * ルール:
 * - 週次レポートは月曜 08:30 America/New_York の final のみ（live なし）
 * - トライアル開始後、最初の配信月曜まで Pro 閲覧が残るように proUntil を底上げする
 * - その週に periodMinPosts（週次=1）以上予想していれば final doc が書かれ、1 通届く
 *
 * 「予想ゼロでも空レポートを捏造する」はしない。保証するのは配信タイミングと閲覧権。
 */

import { resolveRankingWeekStartDateKey } from "@/lib/rankings/rankingPeriod";
import { RANKING_PERIOD_TIMEZONE } from "@/lib/rankings/rankingPeriodClock";
import { zonedTimeToUtcMs } from "@/lib/time/zonedTime";

/** cron `rebuildWeeklyReportsCronV2` と同じ枠（Eastern） */
export const WEEKLY_REPORT_FINAL_CRON_HOUR_ET = 8;
export const WEEKLY_REPORT_FINAL_CRON_MINUTE_ET = 30;

/** @deprecated 旧名 — ET と同値 */
export const WEEKLY_REPORT_FINAL_CRON_HOUR_JST = WEEKLY_REPORT_FINAL_CRON_HOUR_ET;
/** @deprecated 旧名 — ET と同値 */
export const WEEKLY_REPORT_FINAL_CRON_MINUTE_JST =
  WEEKLY_REPORT_FINAL_CRON_MINUTE_ET;

/** 配信直後の閲覧余裕（ms） */
const DELIVERY_GRACE_MS = 2 * 60 * 60 * 1000;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

function etCronInstant(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(
    zonedTimeToUtcMs({
      year: y,
      month: m,
      day: d,
      hour: WEEKLY_REPORT_FINAL_CRON_HOUR_ET,
      minute: WEEKLY_REPORT_FINAL_CRON_MINUTE_ET,
      second: 0,
      timeZone: RANKING_PERIOD_TIMEZONE,
    })
  );
}

/**
 * トライアル開始時点から見て、最初に走る週次 final 配信の瞬間（UTC Date）。
 * - まだ今日の月曜 cron 前 → 今日 08:30 ET
 * - それ以外 → 次の月曜 08:30 ET
 */
export function nextWeeklyReportFinalDeliveryAt(from: Date = new Date()): Date {
  const mondayKey = resolveRankingWeekStartDateKey(from);
  const thisMondayCron = etCronInstant(mondayKey);
  if (from.getTime() < thisMondayCron.getTime()) return thisMondayCron;
  return etCronInstant(addDaysToDateKey(mondayKey, 7));
}

/**
 * 7 日トライアル等の proUntil を、最初の週次 final 配信＋猶予まで底上げする。
 * すでにそれより先ならそのまま。
 */
export function ensureProUntilCoversFirstWeeklyReport(
  proposedProUntil: Date,
  trialStartedAt: Date = new Date()
): Date {
  const delivery = nextWeeklyReportFinalDeliveryAt(trialStartedAt);
  const floor = new Date(delivery.getTime() + DELIVERY_GRACE_MS);
  return proposedProUntil.getTime() >= floor.getTime() ? proposedProUntil : floor;
}
