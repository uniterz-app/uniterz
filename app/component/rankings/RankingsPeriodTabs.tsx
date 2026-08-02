"use client";

import {
  CyberSlantedTab,
  CyberSlantedTabBar,
  type CyberSlantedTabTheme,
} from "@/app/component/rankings/CyberSlantedTab";
import type { RankingPeriod } from "@/lib/rankings/rankingPeriod";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  period: RankingPeriod;
  onChange: (next: RankingPeriod) => void;
  language?: Language;
  /** PRO LEAGUE など画面固有のタブ色 */
  tabTheme?: CyberSlantedTabTheme;
};

export default function RankingsPeriodTabs({
  period,
  onChange,
  language = "ja",
  tabTheme,
}: Props) {
  const m = t(language).rankings;

  return (
    <CyberSlantedTabBar fill aria-label="Ranking period">
      <CyberSlantedTab
        role="tab"
        label={m.periodSeason ?? "Season"}
        active={period === "season"}
        onClick={() => onChange("season")}
        compact
        theme={tabTheme}
      />
      <CyberSlantedTab
        role="tab"
        label={m.periodWeekly ?? "Weekly"}
        active={period === "weekly"}
        onClick={() => onChange("weekly")}
        compact
        theme={tabTheme}
      />
      <CyberSlantedTab
        role="tab"
        label={m.periodMonthly ?? "Monthly"}
        active={period === "monthly"}
        onClick={() => onChange("monthly")}
        compact
        theme={tabTheme}
      />
    </CyberSlantedTabBar>
  );
}
