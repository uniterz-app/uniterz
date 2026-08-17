"use client";

/**
 * Regular Season 内 — Pick Up / PRO LEAGUE
 * Season / Weekly と同じ CyberSlantedTab（本体は凍結・ここでは利用のみ）。
 * PRO LEAGUE 選択色のみ紫。
 */

import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import type { RankingDivision } from "@/lib/rankings/rankingDivision";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { PRO_LEAGUE_DIVISION_TAB_THEME } from "@/lib/rankings/proLeagueAtmosphere";

type Props = {
  division: RankingDivision;
  onChange: (next: RankingDivision) => void;
  language?: Language;
};

export default function RankingsDivisionTabs({
  division,
  onChange,
  language = "ja",
}: Props) {
  const m = t(language).rankings;

  return (
    <CyberSlantedTabBar
      fill
      aria-label={m.divisionTabsLabel ?? "Ranking division"}
    >
      <CyberSlantedTab
        role="tab"
        label={m.divisionStandard ?? "Pick Up"}
        active={division === "standard"}
        onClick={() => onChange("standard")}
        compact
      />
      <CyberSlantedTab
        role="tab"
        label={m.divisionOpen ?? "PRO LEAGUE"}
        active={division === "open"}
        onClick={() => onChange("open")}
        compact
        theme={PRO_LEAGUE_DIVISION_TAB_THEME}
      />
    </CyberSlantedTabBar>
  );
}
