"use client";

import cn from "clsx";
import { Globe2, Trophy } from "lucide-react";
import { CyberSideMenuSectionTitle } from "@/app/component/common/CyberSideMenuSectionTitle";
import SideMenuItemButton from "@/app/component/settings/SideMenuItemButton";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import type { League } from "@/lib/leagues";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  variant?: "mobile" | "web";
  language: Language;
  league: League;
  /** W杯追加の周知用（未確認時のみ） */
  showWcNewBadge?: boolean;
  onSelectNba: () => void;
  onSelectWorldCup: () => void;
};

function WcNewBadge() {
  return (
    <span
      className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-black leading-none text-amber-950 shadow-[0_0_12px_rgba(251,191,36,0.45)]"
      aria-hidden
    >
      !
    </span>
  );
}

export default function GamesDrawerMenu({
  variant = "web",
  language,
  league,
  showWcNewBadge = false,
  onSelectNba,
  onSelectWorldCup,
}: Props) {
  const isMobile = variant === "mobile";
  const m = t(language);

  const containerClasses = cn(
    "relative flex flex-col text-white",
    isMobile ? "w-full p-4" : "w-full p-5"
  );

  const menuLabelFont = bracketMarketTeamTypography(isMobile);

  const nbaActive = league === "nba";
  const wcActive = league === "wc";

  return (
    <nav className={cn(containerClasses, "overflow-x-hidden")}>
      <CyberSideMenuSectionTitle first>
        {m.games.games}
      </CyberSideMenuSectionTitle>

      <div className="flex flex-col gap-2">
        <SideMenuItemButton
          icon={Trophy}
          labelStyle={menuLabelFont}
          active={nbaActive}
          onClick={onSelectNba}
        >
          <span className={cn(language !== "ja" && "uppercase")}>{m.games.nba}</span>
        </SideMenuItemButton>

        <SideMenuItemButton
          icon={Globe2}
          labelStyle={menuLabelFont}
          active={wcActive}
          onClick={onSelectWorldCup}
          trailing={showWcNewBadge ? <WcNewBadge /> : undefined}
        >
          <span className={cn(language !== "ja" && "uppercase")}>{m.games.worldCup}</span>
        </SideMenuItemButton>
      </div>
    </nav>
  );
}
