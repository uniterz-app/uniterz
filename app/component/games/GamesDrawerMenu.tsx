"use client";

import type { ReactNode } from "react";
import cn from "clsx";
import { CyberSideMenuSectionTitle } from "@/app/component/common/CyberSideMenuSectionTitle";
import SideMenuItemButton from "@/app/component/settings/SideMenuItemButton";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import { nameOxanium } from "@/lib/fonts";
import type { League } from "@/lib/leagues";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import {
  CYBER_SIDE_MENU_BRANCH,
  CYBER_SIDE_MENU_BRANCH_GLOW,
} from "@/lib/ui/cyberSideMenu";
import { formatCyberSideMenuDate } from "@/lib/ui/cyberSideMenuDate";
type Props = {
  variant?: "mobile" | "web";
  language: Language;
  league: League;
  onSelectNba: () => void;
  onSelectAwardsPredict: () => void;
  onSelectStandingsPredict: () => void;
};

/** NBA 下の枝分かれ行（├ / └）— 2px 線 + 枝先ジョイントで階層を明示 */
function BranchRow({
  last,
  children,
}: {
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-8 items-stretch">
      {/* 縦幹 */}
      <span
        aria-hidden
        className="absolute left-[9px] w-[2px]"
        style={{
          top: 0,
          bottom: last ? "50%" : 0,
          backgroundColor: CYBER_SIDE_MENU_BRANCH,
          boxShadow: CYBER_SIDE_MENU_BRANCH_GLOW,
        }}
      />
      {/* 横枝 */}
      <span
        aria-hidden
        className="absolute left-[9px] top-1/2 h-[2px] w-[14px] -translate-y-1/2"
        style={{
          backgroundColor: CYBER_SIDE_MENU_BRANCH,
          boxShadow: CYBER_SIDE_MENU_BRANCH_GLOW,
        }}
      />
      {/* 枝先ジョイント */}
      <span
        aria-hidden
        className="absolute left-[20px] top-1/2 h-[5px] w-[5px] -translate-y-1/2 rotate-45"
        style={{
          backgroundColor: "rgba(246, 195, 68, 0.9)",
          boxShadow: "0 0 8px rgba(246, 195, 68, 0.7)",
        }}
      />
      {/* サブ行は右端を短くして「ぶら下がり」を形で見せる */}
      <div className="min-w-0 flex-1 pl-[28px] pr-4">{children}</div>
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
  const hudDate = formatCyberSideMenuDate();

  return (
    <nav className={cn(containerClasses, "overflow-x-hidden")}>
      {/* ミニヘッダー — UNITERZ + 日付 */}
      <div className="mb-3 flex items-start justify-between gap-2 border-b border-[rgba(0,245,255,0.16)] pb-2">
        <p
          className={cn(
            nameOxanium.className,
            "min-w-0 text-[15px] font-extrabold uppercase tracking-[0.28em] text-[rgba(0,245,255,0.9)]"
          )}
          style={{ textShadow: "0 0 12px rgba(0,245,255,0.35)" }}
        >
          UNITERZ
        </p>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.24em] text-white/40"
            )}
          >
            {hudDate.weekday}
          </p>
          <p
            className={cn(
              nameOxanium.className,
              "mt-0.5 text-[15px] font-bold tabular-nums tracking-[0.1em] text-[rgba(0,245,255,0.9)]"
            )}
            style={{ textShadow: "0 0 10px rgba(0,245,255,0.35)" }}
          >
            {hudDate.date}
          </p>
        </div>
      </div>

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
              className="pointer-events-none absolute left-[9px] top-[-4px] h-1 w-[2px]"
              style={{
                backgroundColor: CYBER_SIDE_MENU_BRANCH,
                boxShadow: CYBER_SIDE_MENU_BRANCH_GLOW,
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
