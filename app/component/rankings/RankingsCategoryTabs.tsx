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
};

export default function RankingsCategoryTabs({
  category,
  onChange,
  league = "nba",
}: Props) {
  const playoffsLabel = league === "worldcup" ? "WORLD CUP" : "Playoffs";

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
      />
    </CyberSlantedTabBar>
  );
}
