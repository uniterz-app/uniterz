"use client";

import cn from "clsx";
import { Globe2, Trophy } from "lucide-react";
import SideMenuItemButton from "@/app/component/settings/SideMenuItemButton";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import type { League } from "@/lib/leagues";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  variant?: "mobile" | "web";
  language: Language;
  league: League;
  onSelectNba: () => void;
  onSelectWorldCup: () => void;
};

export default function GamesDrawerMenu({
  variant = "web",
  language,
  league,
  onSelectNba,
  onSelectWorldCup,
}: Props) {
  const isMobile = variant === "mobile";
  const m = t(language);

  const containerClasses = cn(
    "relative flex flex-col text-white",
    isMobile ? "w-full p-4" : "w-full p-6"
  );

  const groupTitleClasses = cn(
    "mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300/55",
    isMobile ? "pl-7" : "pl-5"
  );

  const menuLabelFont = bracketMarketTeamTypography(isMobile);

  const nbaActive = league === "nba";
  const wcActive = league === "wc";

  return (
    <nav className={cn(containerClasses, "overflow-x-hidden")}>
      <p className={cn(groupTitleClasses, "mt-0")}>
        {m.games.games}
      </p>

      <div className="flex flex-col gap-2">
        <SideMenuItemButton
          icon={Trophy}
          labelStyle={menuLabelFont}
          onClick={onSelectNba}
          className={nbaActive ? "ring-1 ring-cyan-300/35" : undefined}
        >
          <span className={cn(language !== "ja" && "uppercase")}>{m.games.nba}</span>
        </SideMenuItemButton>

        <SideMenuItemButton
          icon={Globe2}
          labelStyle={menuLabelFont}
          onClick={onSelectWorldCup}
          className={wcActive ? "ring-1 ring-cyan-300/35" : undefined}
        >
          <span className={cn(language !== "ja" && "uppercase")}>{m.games.worldCup}</span>
        </SideMenuItemButton>
      </div>
    </nav>
  );
}
