"use client";

import type { RankingsCategory } from "@/app/component/rankings/RankingsCategoryTabs.types";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";

export type { RankingsCategory } from "@/app/component/rankings/RankingsCategoryTabs.types";

type Props = {
  category: RankingsCategory;
  onChange: (next: RankingsCategory) => void;
  /** WC ランキングでは Playoffs タブを WORLD CUP 表記にする */
  league?: "nba" | "worldcup";
  /** ブラケット未入力のとき Bracket タブに黄色の ! を表示する */
  bracketAlert?: boolean;
};

export default function RankingsCategoryTabs({
  category,
  onChange,
  league = "nba",
  bracketAlert = false,
}: Props) {
  const playoffsLabel = league === "worldcup" ? "WORLD CUP" : "Playoffs";

  const bracketBadge = bracketAlert ? (
    <span
      aria-label="Bracket not submitted"
      className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black leading-none text-amber-950 shadow-[0_0_8px_rgba(251,191,36,0.65)]"
    >
      !
    </span>
  ) : null;

  return (
    <CyberSlantedTabBar fill aria-label="Ranking category">
      <CyberSlantedTab
        role="tab"
        label={playoffsLabel}
        active={category === "playoffs"}
        onClick={() => onChange("playoffs")}
      />
      <CyberSlantedTab
        role="tab"
        label="Bracket"
        active={category === "bracket"}
        onClick={() => onChange("bracket")}
        badge={bracketBadge}
      />
    </CyberSlantedTabBar>
  );
}
