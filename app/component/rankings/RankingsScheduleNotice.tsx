"use client";

import type { Language } from "@/lib/i18n/language";
import { getRankingsScheduleNoticeText } from "@/lib/rankings/getRankingsScheduleNoticeText";

type Props = {
  language: Language;
  /** プロフィールの居住国。未設定なら 16:00 JST 表記 */
  countryCode?: string | null;
  className?: string;
};

/** ランキング更新時刻・累積スコアの説明（マイランクカードと指標タブの間） */
export default function RankingsScheduleNotice({
  language,
  countryCode = null,
  className = "",
}: Props) {
  const text = getRankingsScheduleNoticeText(language, countryCode);

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
