"use client";

import cn from "clsx";
import { Globe2, Trophy } from "lucide-react";
import SideMenuItemButton from "@/app/component/settings/SideMenuItemButton";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";

type Props = {
  variant?: "mobile" | "web";
  language: "ja" | "en";
  rankingLeague: RankingLeagueSource;
  onSelectNbaPlayoffs: () => void;
  onSelectWorldCup: () => void;
};

export default function RankingsDrawerMenu({
  variant = "web",
  language,
  rankingLeague,
  onSelectNbaPlayoffs,
  onSelectWorldCup,
}: Props) {
  const isMobile = variant === "mobile";
  const isEn = language === "en";

  const containerClasses = cn(
    "relative flex flex-col text-white",
    isMobile ? "w-full p-4" : "w-full p-6"
  );

  const groupTitleClasses = cn(
    "mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300/55",
    isMobile ? "pl-7" : "pl-5"
  );

  const menuLabelFont = bracketMarketTeamTypography(isMobile);
  const labelText = (en: string, ja: string) => (
    <span className={cn(isEn && "uppercase")}>{isEn ? en : ja}</span>
  );

  const nbaActive = rankingLeague === "nba";
  const wcActive = rankingLeague === "worldcup";

  return (
    <nav className={cn(containerClasses, "overflow-x-hidden")}>
      <p className={cn(groupTitleClasses, "mt-0")}>
        {isEn ? "Rankings" : "ランキング"}
      </p>

      <div className="flex flex-col gap-2">
        <SideMenuItemButton
          icon={Trophy}
          labelStyle={menuLabelFont}
          onClick={onSelectNbaPlayoffs}
          className={nbaActive ? "ring-1 ring-cyan-300/35" : undefined}
        >
          {labelText("NBA Playoffs", "NBA プレーオフ")}
        </SideMenuItemButton>

        <SideMenuItemButton
          icon={Globe2}
          labelStyle={menuLabelFont}
          onClick={onSelectWorldCup}
          className={wcActive ? "ring-1 ring-cyan-300/35" : undefined}
        >
          {labelText("World Cup", "ワールドカップ")}
        </SideMenuItemButton>
      </div>
    </nav>
  );
}
