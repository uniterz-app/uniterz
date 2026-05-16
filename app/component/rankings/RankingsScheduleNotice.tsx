"use client";

import type { Language } from "@/lib/i18n/language";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import { getRankingsScheduleNoticeText } from "@/lib/rankings/getRankingsScheduleNoticeText";

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
  const text = getRankingsScheduleNoticeText(language, countryCode);

  return (
    <div className="text-center">
      <p className="text-[12px] leading-relaxed text-white/60">{text}</p>
    </div>
  );
}
