"use client";

import type { ReactNode } from "react";
import cn from "clsx";
import { CalendarRange, Crown, Globe2, Trophy } from "lucide-react";
import { CyberSideMenuSectionTitle } from "@/app/component/common/CyberSideMenuSectionTitle";
import SideMenuItemButton from "@/app/component/settings/SideMenuItemButton";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import type { NbaRankingBoard } from "@/lib/rankings/rankingDivision";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  variant?: "mobile" | "web";
  language: Language;
  rankingLeague: RankingLeagueSource;
  /** NBA 枝の選択（未指定時はレギュラー扱い） */
  nbaBoard?: NbaRankingBoard;
  onSelectNbaRegular: () => void;
  onSelectNbaPlayoffs: () => void;
  onSelectWorldCup: () => void;
  /** PRO LEAGUE（Pro 限定 NBA ランキング） */
  onSelectOpenweight?: () => void;
};

const BRANCH = "rgba(0,245,255,0.42)";

/** NBA 下の枝分かれ行（├ / └）— `GamesDrawerMenu` と同型 */
function BranchRow({
  last,
  children,
}: {
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-9 items-stretch">
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

export default function RankingsDrawerMenu({
  variant = "web",
  language,
  rankingLeague,
  nbaBoard = "regular",
  onSelectNbaRegular,
  onSelectNbaPlayoffs,
  onSelectWorldCup,
  onSelectOpenweight,
}: Props) {
  const isMobile = variant === "mobile";
  const m = t(language);

  const containerClasses = cn(
    "relative flex flex-col text-white",
    isMobile ? "w-full p-4" : "w-full p-5"
  );

  const menuLabelFont = bracketMarketTeamTypography(isMobile);

  const nbaClusterActive = rankingLeague === "nba";
  const regularActive =
    rankingLeague === "nba" && nbaBoard === "regular";
  const playoffsActive =
    rankingLeague === "nba" && nbaBoard === "playoffs";
  const openActive = rankingLeague === "nba" && nbaBoard === "open";
  const wcActive = rankingLeague === "worldcup";

  return (
    <nav className={cn(containerClasses, "overflow-x-hidden")}>
      <CyberSideMenuSectionTitle first>
        {m.rankings.title}
      </CyberSideMenuSectionTitle>

      <div className="flex flex-col gap-2">
        {onSelectOpenweight ? (
          <div className="flex flex-col">
            <SideMenuItemButton
              icon={Trophy}
              labelStyle={menuLabelFont}
              active={nbaClusterActive}
              onClick={onSelectNbaRegular}
            >
              <span className="uppercase">NBA</span>
            </SideMenuItemButton>

            <div className="relative mt-1 flex flex-col gap-1.5">
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
                  icon={CalendarRange}
                  dense
                  labelStyle={menuLabelFont}
                  active={regularActive}
                  onClick={onSelectNbaRegular}
                >
                  <span className="uppercase">
                    {m.rankings.nbaBoardRegular}
                  </span>
                </SideMenuItemButton>
              </BranchRow>
              <BranchRow>
                <SideMenuItemButton
                  icon={Trophy}
                  dense
                  labelStyle={menuLabelFont}
                  active={playoffsActive}
                  onClick={onSelectNbaPlayoffs}
                >
                  <span className="uppercase">
                    {m.rankings.nbaBoardPlayoffs}
                  </span>
                </SideMenuItemButton>
              </BranchRow>
              <BranchRow last>
                <SideMenuItemButton
                  icon={Crown}
                  dense
                  labelStyle={menuLabelFont}
                  active={openActive}
                  onClick={onSelectOpenweight}
                >
                  <span className="uppercase">{m.rankings.divisionOpen}</span>
                </SideMenuItemButton>
              </BranchRow>
            </div>
          </div>
        ) : (
          <SideMenuItemButton
            icon={Trophy}
            labelStyle={menuLabelFont}
            active={nbaClusterActive}
            onClick={onSelectNbaRegular}
          >
            <span className="uppercase">{m.rankings.nbaPlayoffs}</span>
          </SideMenuItemButton>
        )}

        <SideMenuItemButton
          icon={Globe2}
          labelStyle={menuLabelFont}
          active={wcActive}
          onClick={onSelectWorldCup}
        >
          <span className="uppercase">World Cup</span>
        </SideMenuItemButton>
      </div>
    </nav>
  );
}
