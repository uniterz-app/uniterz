import type { Language } from "@/lib/i18n/language";
import { TIMEZONE_BY_COUNTRY } from "@/lib/i18n/countryTimezone";
import {
  TIMEZONE_JST,
  getZonedYMD,
  zonedTimeToUtcMs,
} from "@/lib/time/zonedTime";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 国未登録・不明・日本 → JST 表記 */
function isJstDisplayZone(timeZone: string): boolean {
  return timeZone === TIMEZONE_JST || timeZone === "Asia/Tokyo";
}

/**
 * ランキング日次更新の基準時刻 16:00 JST を、
 * 登録国の代表タイムゾーン（米国は NY）の壁時計に換算したラベル。
 * 国未登録なら常に 16:00 JST（日本語は「日本時間16:00」）。
 */
export function formatRankingUpdateLocalTime(
  countryCode: string | null | undefined,
  language: Language,
  now: Date = new Date(),
): string {
  const code =
    typeof countryCode === "string" && countryCode.trim()
      ? countryCode.trim().toUpperCase()
      : null;
  const timeZone = code ? TIMEZONE_BY_COUNTRY[code] ?? TIMEZONE_JST : TIMEZONE_JST;

  if (!code || isJstDisplayZone(timeZone)) {
    return language === "ja"
      ? "日本時間16:00"
      : language === "zh"
        ? "日本时间16:00"
        : language === "ko"
          ? "일본 시간 16:00"
          : language === "ar"
            ? "16:00 بتوقيت اليابان"
            : "16:00 JST";
  }

  const { year, month, day } = getZonedYMD(now, TIMEZONE_JST);
  const instant = new Date(
    zonedTimeToUtcMs({
      year,
      month,
      day,
      hour: 16,
      minute: 0,
      second: 0,
      timeZone: TIMEZONE_JST,
    }),
  );

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).formatToParts(instant);

  const hourRaw = Number(parts.find((p) => p.type === "hour")?.value ?? NaN);
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value?.trim() ?? "";
  const hour = Number.isFinite(hourRaw) ? pad2(hourRaw === 24 ? 0 : hourRaw) : "00";

  return tzName ? `${hour}:${minute} ${tzName}` : `${hour}:${minute}`;
}

export function rankingsUpdatedDailySentence(
  language: Language,
  timeLabel: string,
): string {
  switch (language) {
    case "ja":
      return `ランキングは${timeLabel}に更新`;
    case "zh":
      return `排名于${timeLabel}更新`;
    case "ko":
      return `랭킹은 ${timeLabel}에 업데이트됩니다`;
    case "es":
      return `Ranking actualizado a las ${timeLabel}`;
    case "de":
      return `Ranking aktualisiert um ${timeLabel}`;
    case "fr":
      return `Classement mis à jour à ${timeLabel}`;
    case "ar":
      return `يتم تحديث التصنيفات الساعة ${timeLabel}`;
    case "pt":
      return `Ranking atualizado às ${timeLabel}`;
    case "en":
    default:
      return `Rankings update at ${timeLabel}`;
  }
}
