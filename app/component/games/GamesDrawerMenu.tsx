"use client";

import type { ReactNode } from "react";
import cn from "clsx";
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
  onSelectNba: () => void;
  onSelectAwardsPredict: () => void;
  onSelectStandingsPredict: () => void;
};

const BRANCH = "rgba(0,245,255,0.42)";

/** NBA 下の枝分かれ行（├ / └） */
function BranchRow({
  last,
  children,
}: {
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-9 items-stretch">
      {/* 縦幹 */}
      <span
        aria-hidden
        className="absolute left-[9px] w-px"
        style={{
          top: 0,
          bottom: last ? "50%" : 0,
          backgroundColor: BRANCH,
          boxShadow: "0 0 6px rgba(0,245,255,0.25)",
        }}
      />
      {/* 横枝 */}
      <span
        aria-hidden
        className="absolute left-[9px] top-1/2 h-px w-[14px] -translate-y-1/2"
        style={{
          backgroundColor: BRANCH,
          boxShadow: "0 0 6px rgba(0,245,255,0.25)",
        }}
      />
      <div className="min-w-0 flex-1 pl-[28px]">{children}</div>
    </div>
  );
}

export default function GamesDrawerMenu({
  variant = "web",
  language,
  league,
  onSelectNba,
  onSelectAwardsPredict,
  onSelectStandingsPredict,
}: Props) {
  const isMobile = variant === "mobile";
  const m = t(language);

  const containerClasses = cn(
    "relative flex flex-col text-white",
    isMobile ? "w-full p-4" : "w-full p-5"
  );

  const menuLabelFont = bracketMarketTeamTypography(isMobile);

  const nbaActive = league === "nba";

  return (
    <nav className={cn(containerClasses, "overflow-x-hidden")}>
      <CyberSideMenuSectionTitle first>
        {m.games.games}
      </CyberSideMenuSectionTitle>

      <div className="flex flex-col gap-2">
        {/* NBA + 枝分かれサブ */}
        <div className="flex flex-col">
          <SideMenuItemButton
            iconSrc="/games-drawer/nba.png"
            labelStyle={menuLabelFont}
            active={nbaActive}
            onClick={onSelectNba}
          >
            <span className={cn(language !== "ja" && "uppercase")}>{m.games.nba}</span>
          </SideMenuItemButton>

          <div className="relative mt-1 flex flex-col gap-1.5">
            {/* NBA 底辺 → 最初の枝までの縦幹 */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[9px] top-[-4px] h-1 w-px"
              style={{
                backgroundColor: BRANCH,
                boxShadow: "0 0 6px rgba(0,245,255,0.25)",
              }}
            />

            <BranchRow>
              <SideMenuItemButton
                iconSrc="/games-drawer/awards.png"
                dense
                labelStyle={menuLabelFont}
                onClick={onSelectAwardsPredict}
              >
                <span className={cn(language !== "ja" && "uppercase")}>
                  {m.games.awardsPredict}
                </span>
              </SideMenuItemButton>
            </BranchRow>
            <BranchRow last>
              <SideMenuItemButton
                iconSrc="/games-drawer/standings.png"
                dense
                labelStyle={menuLabelFont}
                onClick={onSelectStandingsPredict}
              >
                <span className={cn(language !== "ja" && "uppercase")}>
                  {m.games.standingsPredict}
                </span>
              </SideMenuItemButton>
            </BranchRow>
          </div>
        </div>
      </div>
    </nav>
  );
}
