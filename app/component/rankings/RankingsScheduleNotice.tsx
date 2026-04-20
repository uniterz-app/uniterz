"use client";

import type { Language } from "@/lib/i18n/language";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import { isRankingSnapshotBuiltDailyForPhase } from "@/lib/rankings/rankingPhase";
import {
  TIMEZONE_ET,
  TIMEZONE_JST,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";

function formatRankingsUpdateTimeEn() {
  const now = new Date();
  const todayKeyJst = toDateKeyInTimeZone(now, TIMEZONE_JST);
  const todayMidnightJst = parseDateKeyInTimeZone(todayKeyJst, TIMEZONE_JST);
  if (!todayMidnightJst) return "16:00";

  const MS_16H = 16 * 60 * 60 * 1000;
  const MS_1D = 24 * 60 * 60 * 1000;
  const jstUpdateTodayMs = todayMidnightJst.getTime() + MS_16H;
  const jstUpdateMs =
    now.getTime() >= jstUpdateTodayMs ? jstUpdateTodayMs + MS_1D : jstUpdateTodayMs;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_ET,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(jstUpdateMs));
}

type Props = {
  phase: RankingPhase;
  language: Language;
};

export default function RankingsScheduleNotice({ phase, language }: Props) {
  const playInFinal = !isRankingSnapshotBuiltDailyForPhase("play_in");

  if (phase === "play_in" && playInFinal) {
    return (
      <div className="text-center">
        <p className="text-[12px] leading-relaxed text-white/60">
          {language === "en"
            ? "Play-In rankings are final — showing the last saved snapshot."
            : "プレーイン順位は確定済みです。保存されているスナップショットを表示しています。"}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-[12px] leading-relaxed text-white/60">
        {language === "en"
          ? `Rankings are updated daily at ${formatRankingsUpdateTimeEn()} / Scores are cumulative.`
          : "ランキングは毎日16:00に更新 / スコアは累積"}
      </p>
    </div>
  );
}
