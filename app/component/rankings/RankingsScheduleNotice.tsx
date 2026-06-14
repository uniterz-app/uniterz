"use client";

import type { Language } from "@/lib/i18n/language";
import { getRankingsScheduleNoticeText } from "@/lib/rankings/getRankingsScheduleNoticeText";

type Props = {
  language: Language;
  className?: string;
};

/** ランキング更新時刻・累積スコアの説明（タイトル直下に常時表示） */
export default function RankingsScheduleNotice({
  language,
  className = "",
}: Props) {
  const text = getRankingsScheduleNoticeText(language);

  return (
    <p
      className={[
        "text-center text-[10px] leading-snug text-white/55 sm:text-[11px]",
        className,
      ].join(" ")}
    >
      {text}
    </p>
  );
}
