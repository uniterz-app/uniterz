"use client";

import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { resolveUserTimezone } from "@/lib/i18n/countryTimezone";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import {
  TIMEZONE_JST,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";

/**
 * JST 16:00 をユーザーのローカルタイムゾーンに変換して返す。
 */
function formatRankingsUpdateTime(
  language: Language,
  countryCode: string | null | undefined,
) {
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

type Props = {
  phase: RankingPhase;
  language: Language;
  countryCode?: string | null;
};

export default function RankingsScheduleNotice({
  phase,
  language,
  countryCode,
}: Props) {
  void phase;
  const m = t(language);
  const time = formatRankingsUpdateTime(language, countryCode);

  return (
    <div className="text-center">
      <p className="text-[12px] leading-relaxed text-white/60">
        {m.rankings.updatedDaily.replace("{time}", time)}
        {" / "}
        {m.rankings.scoresCumulative}
      </p>
    </div>
  );
}
