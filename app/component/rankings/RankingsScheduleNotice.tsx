"use client";

import type { Language } from "@/lib/i18n/language";
import { getRankingsScheduleNoticeText } from "@/lib/rankings/getRankingsScheduleNoticeText";
import PeriodRankingUnitRewardsChip from "@/app/component/rankings/PeriodRankingUnitRewardsChip";

type Props = {
  language: Language;
  /** プロフィールの居住国。未設定なら 16:00 JST 表記 */
  countryCode?: string | null;
  className?: string;
  /** 右端に Unit 獲得表チップを出す */
  showUnitRewards?: boolean;
  rankingPeriod?: "season" | "weekly" | "monthly" | string | null;
};

/** ランキング更新時刻・累積スコアの説明（マイランクカードと指標タブの間） */
export default function RankingsScheduleNotice({
  language,
  countryCode = null,
  className = "",
  showUnitRewards = false,
  rankingPeriod,
}: Props) {
  const text = getRankingsScheduleNoticeText(language, countryCode);

  if (!showUnitRewards) {
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

  return (
    <div
      className={[
        "flex items-center gap-2",
        className,
      ].join(" ")}
    >
      <p className="min-w-0 flex-1 text-center text-[10px] leading-snug text-white/55 sm:text-[11px]">
        {text}
      </p>
      <PeriodRankingUnitRewardsChip
        language={language}
        rankingPeriod={rankingPeriod}
        size="mobile"
        className="shrink-0"
      />
    </div>
  );
}
