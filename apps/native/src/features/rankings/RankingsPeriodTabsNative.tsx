/**
 * Web `RankingsPeriodTabs` 相当 — Season / Weekly / Monthly
 */

import type { RankingPeriod } from "../../../../../lib/rankings/rankingPeriod";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "./CyberSlantedTabNative";

export function RankingsPeriodTabsNative({
  period,
  onChange,
  language,
}: {
  period: RankingPeriod;
  onChange: (next: RankingPeriod) => void;
  language: RankingsLanguage;
}) {
  const t = rankingsTexts(language);
  const items: Array<{ key: RankingPeriod; label: string }> = [
    { key: "season", label: t.periodSeason },
    { key: "weekly", label: t.periodWeekly },
    { key: "monthly", label: t.periodMonthly },
  ];
  return (
    <CyberSlantedTabBarNative fill>
      {items.map((item) => (
        <CyberSlantedTabNative
          key={item.key}
          label={item.label}
          active={period === item.key}
          fill
          compact
          onPress={() => onChange(item.key)}
        />
      ))}
    </CyberSlantedTabBarNative>
  );
}
