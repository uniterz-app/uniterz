"use client";

import { useMemo } from "react";
import type { Language } from "@/lib/i18n/language";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { nameBebas } from "@/lib/fonts";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import ProfileKinetikPanelFrame from "@/app/component/profile/ui/ProfileKinetikPanelFrame";
import ProfileDailyComboChartNeural from "@/app/component/profile/ui/ProfileDailyComboChartNeural";

export type ProfileDailyTrendPoint = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  scorePrecision: number;
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
};

export default function ProfileDailyTrendChart({
  data,
  range = "7d",
  language = "ja",
  rankingLeague = "nba",
  layout = "web",
}: Props) {
  const limitedData = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    if (range === "7d") return rows.slice(-7);
    return rows.slice(-10);
  }, [data, range]);

  const isEmpty = limitedData.length === 0;

  return (
    <ProfileKinetikPanelFrame className="relative overflow-x-clip p-3 sm:p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.36]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1 min-w-0">
      {isEmpty ? (
        <div role="status" className="grid min-h-44 place-items-center px-3">
          <p
            className={[
              nameBebas.className,
              "text-center text-[clamp(1.25rem,4.2vw,2.1rem)] leading-none tracking-[0.2em]",
            ].join(" ")}
            style={cyberNoDataLabelStyle}
          >
            NO DATA
          </p>
        </div>
      ) : (
        <ProfileDailyComboChartNeural
          data={limitedData}
          language={language}
          rankingLeague={rankingLeague}
          layout={layout}
        />
      )}
      </div>
    </ProfileKinetikPanelFrame>
  );
}
