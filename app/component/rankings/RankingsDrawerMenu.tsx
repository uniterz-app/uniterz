"use client";

import cn from "clsx";
import { Globe2, Trophy } from "lucide-react";
import { CyberSideMenuSectionTitle } from "@/app/component/common/CyberSideMenuSectionTitle";
import SideMenuItemButton from "@/app/component/settings/SideMenuItemButton";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  variant?: "mobile" | "web";
  language: Language;
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
  const m = t(language);
  const isEn = language === "en";

  const containerClasses = cn(
    "relative flex flex-col text-white",
    isMobile ? "w-full p-4" : "w-full p-5"
  );

  const menuLabelFont = bracketMarketTeamTypography(isMobile);

  const nbaActive = rankingLeague === "nba";
  const wcActive = rankingLeague === "worldcup";

  return (
    <nav className={cn(containerClasses, "overflow-x-hidden")}>
      <CyberSideMenuSectionTitle first>
        {m.rankings.title}
      </CyberSideMenuSectionTitle>

      <div className="flex flex-col gap-2">
        <SideMenuItemButton
          icon={Trophy}
          labelStyle={menuLabelFont}
          active={nbaActive}
          onClick={onSelectNbaPlayoffs}
        >
          <span className={cn(isEn && "uppercase")}>{m.rankings.nbaPlayoffs}</span>
        </SideMenuItemButton>

        <SideMenuItemButton
          icon={Globe2}
          labelStyle={menuLabelFont}
          active={wcActive}
          onClick={onSelectWorldCup}
        >
          <span className={cn(isEn && "uppercase")}>{m.rankings.worldCup}</span>
        </SideMenuItemButton>
      </div>
    </nav>
  );
}
