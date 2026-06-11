"use client";

import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";

type Props = {
  round: PlayoffRoundKey;
  onChange: (round: PlayoffRoundKey) => void;
  isMobile?: boolean;
  language?: Language;
};

function roundItems(language: Language): Array<{ key: PlayoffRoundKey; label: string }> {
  const m = t(language);
  return [
    { key: "overall", label: m.rankings.roundTotal },
    { key: "r1", label: m.rankings.roundFirst },
    { key: "r2", label: m.rankings.roundSecond },
    { key: "cf", label: m.rankings.roundCF },
    { key: "finals", label: m.rankings.roundFinals },
  ];
}

export default function PlayoffRoundTabs({
  round,
  onChange,
  isMobile = false,
  language = "ja",
}: Props) {
  const items = roundItems(language);

  return (
    <CyberSlantedTabBar fill aria-label={t(language).rankings.roundTabsLabel}>
      {items.map((item) => (
        <CyberSlantedTab
          key={item.key}
          role="tab"
          label={item.label}
          active={round === item.key}
          onClick={() => onChange(item.key)}
          compact={isMobile}
        />
      ))}
    </CyberSlantedTabBar>
  );
}
