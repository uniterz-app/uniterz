/**
 * 表示タイムゾーンの手動選択肢（プロフィール設定）。
 * 国の代表 TZ に、複数タイムゾーンを持つ国（US / CA / AU など）の主要都市を足す。
 */

import { TIMEZONE_BY_COUNTRY } from "@/lib/i18n/countryTimezone";

const EXTRA_TIME_ZONES = [
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Halifax",
  "Australia/Perth",
  "Australia/Brisbane",
  "Australia/Adelaide",
] as const;

export type TimeZoneOption = {
  timeZone: string;
  /** 例: "GMT-7 · Los Angeles" */
  label: string;
  offsetMinutes: number;
};

function offsetMinutesAt(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"));
  return Math.round((asUtc - Math.floor(at.getTime() / 60000) * 60000) / 60000);
}

function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

export function timeZoneCityLabel(timeZone: string): string {
  const last = timeZone.split("/").pop() ?? timeZone;
  return last.replace(/_/g, " ");
}

export function timeZoneOptionLabel(timeZone: string, at: Date = new Date()): string {
  return `${formatOffset(offsetMinutesAt(timeZone, at))} · ${timeZoneCityLabel(timeZone)}`;
}

/** オフセット昇順（同オフセットは都市名順） */
export function buildTimeZoneOptions(at: Date = new Date()): TimeZoneOption[] {
  const zones = new Set<string>([
    ...Object.values(TIMEZONE_BY_COUNTRY),
    ...EXTRA_TIME_ZONES,
  ]);
  return [...zones]
    .map((timeZone) => {
      const offsetMinutes = offsetMinutesAt(timeZone, at);
      return {
        timeZone,
        offsetMinutes,
        label: `${formatOffset(offsetMinutes)} · ${timeZoneCityLabel(timeZone)}`,
      };
    })
    .sort(
      (a, b) =>
        a.offsetMinutes - b.offsetMinutes ||
        timeZoneCityLabel(a.timeZone).localeCompare(timeZoneCityLabel(b.timeZone))
    );
}
