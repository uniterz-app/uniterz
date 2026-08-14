"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { nameOxanium } from "@/lib/fonts";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import ProfileKinetikPanelFrame from "@/app/component/profile/ui/ProfileKinetikPanelFrame";
import ProfileOverviewLineFrame from "@/app/component/profile/ui/ProfileOverviewLineFrame";
import ProfileDailyComboChartNeural from "@/app/component/profile/ui/ProfileDailyComboChartNeural";
import {
  type ProfileVisualEffects,
  isProfileVisualLite,
} from "@/lib/profile/profileVisualEffects";
import chartInfoStyles from "./profileChartInfoFaq.module.css";

export type ProfileDailyTrendPoint = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  exactHitCount: number;
  upsetPoints: number;
};

type Props = {
  data: ProfileDailyTrendPoint[];
  range?: "7d" | "30d";
  allowAll?: boolean;
  language?: Language;
  entranceSync?: boolean;
  rechartsAfterEntrance?: boolean;
  rankingLeague?: RankingLeagueSource;
  layout?: "web" | "mobile";
  visualEffects?: ProfileVisualEffects;
};

export default function ProfileDailyTrendChart({
  data,
  range = "7d",
  language = "ja",
  rankingLeague = "nba",
  layout = "web",
  visualEffects = "full",
}: Props) {
  const isJa = language === "ja";
  const title = "Daily Combo Chart";
  const subtitle = isJa
    ? "過去10日のスタッツの推移"
    : "Trend of stats over the last 10 days";
  const chartInfo = isJa
    ? "カラーバー＝日ごとの投稿数・的中数。黄緑の線＝累積の総合得点。"
    : "Color bars: daily posts and correct picks. Lime line: cumulative total points.";
  const emptyHint = isJa
    ? "シーズンの日次スタッツが溜まると表示されます"
    : "Daily season stats appear after you settle picks.";

  const limitedData = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    const active = rows.filter(
      (r) =>
        r.posts > 0 ||
        Math.abs(r.pointsV3) > 1e-9 ||
        Math.abs(r.upsetPoints ?? 0) > 1e-9
    );
    if (range === "7d") return active.slice(-7);
    return active.slice(-10);
  }, [data, range]);

  const isEmpty = limitedData.length === 0;

  return (
    <ProfileOverviewLineFrame title={title}>
    <ProfileKinetikPanelFrame className="profile-kinetik-panel--line-frame relative overflow-x-clip p-3 sm:p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.36]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1 min-w-0">
        {isEmpty ? (
          <div role="status">
            <div className="relative z-20 mb-2 px-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="min-w-0 flex-1 text-[11px] text-white/60 sm:text-xs">
                  {subtitle}
                </p>
                <div className={chartInfoStyles.wrap}>
                  <button
                    type="button"
                    className={chartInfoStyles.faqButton}
                    aria-label={chartInfo}
                  >
                    <Info className="shrink-0" strokeWidth={1.75} aria-hidden />
                  </button>
                  <div className={chartInfoStyles.tooltip} aria-hidden>
                    {chartInfo}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid min-h-44 place-items-center px-3">
              <p
                className={[
                  nameOxanium.className,
                  "text-center text-[22px] font-bold leading-none tracking-[0.12em] text-white/35",
                ].join(" ")}
              >
                NO DATA
              </p>
              <p className="mt-2.5 max-w-[260px] text-center text-[11px] leading-snug text-white/42">
                {emptyHint}
              </p>
            </div>
          </div>
        ) : (
          <ProfileDailyComboChartNeural
            data={limitedData}
            language={language}
            rankingLeague={rankingLeague}
            layout={layout}
            visualEffectsLite={isProfileVisualLite(visualEffects)}
            hideTitle
          />
        )}
      </div>
    </ProfileKinetikPanelFrame>
    </ProfileOverviewLineFrame>
  );
}
