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
};

export default function RankingsCategoryTabs({
  category,
  onChange,
}: Props) {
  return (
    <CyberSlantedTabBar fill aria-label="Ranking category">
      <CyberSlantedTab
        role="tab"
        label="Playoffs"
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
