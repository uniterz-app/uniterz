import type { Language } from "../i18n/language";
import { t } from "../i18n/t";
import { resolveUserTimezone } from "../i18n/countryTimezone";
import {
  TIMEZONE_JST,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "../time/zonedTime";

/**
 * JST 16:00 の次回更新をユーザーのローカルタイムゾーンで表示用に整形（Web `RankingsScheduleNotice` と同一）。
 */
function formatRankingsUpdateTime(
  language: Language,
  countryCode: string | null | undefined,
): string {
  const userTz = resolveUserTimezone(countryCode, language);

  const now = new Date();
  const todayKeyJst = toDateKeyInTimeZone(now, TIMEZONE_JST);
  const todayMidnightJst = parseDateKeyInTimeZone(todayKeyJst, TIMEZONE_JST);
  if (!todayMidnightJst) return "16:00";

  const MS_16H = 16 * 60 * 60 * 1000;
  const MS_1D = 24 * 60 * 60 * 1000;
  const jstUpdateTodayMs = todayMidnightJst.getTime() + MS_16H;
  const jstUpdateMs =
    now.getTime() >= jstUpdateTodayMs
      ? jstUpdateTodayMs + MS_1D
      : jstUpdateTodayMs;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: userTz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(jstUpdateMs));
}

/** Web `RankingsScheduleNotice` と同じ1行文言（「 / 」で累積説明を連結） */
export function getRankingsScheduleNoticeText(
  language: Language,
  countryCode: string | null | undefined,
): string {
  const m = t(language);
  const time = formatRankingsUpdateTime(language, countryCode);
  return `${m.rankings.updatedDaily.replace("{time}", time)} / ${m.rankings.scoresCumulative}`;
}
