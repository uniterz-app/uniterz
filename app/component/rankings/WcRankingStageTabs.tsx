"use client";

import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";

type Props = {
  stage: WcRankingStage;
  onChange: (stage: WcRankingStage) => void;
  isMobile?: boolean;
  language?: Language;
};

function stageItems(language: Language): Array<{ key: WcRankingStage; label: string }> {
  const m = t(language);
  return [
    { key: "overall", label: m.rankings.stageAll },
    { key: "qualifying", label: m.rankings.stageGroup },
    { key: "main", label: m.rankings.stageKnockout },
  ];
}

export default function WcRankingStageTabs({
  stage,
  onChange,
  isMobile = false,
  language = "ja",
}: Props) {
  const items = stageItems(language);

  return (
    <CyberSlantedTabBar fill aria-label={t(language).rankings.stageTabsLabel}>
      {items.map((item) => (
        <CyberSlantedTab
          key={item.key}
          role="tab"
          label={item.label}
          active={stage === item.key}
          onClick={() => onChange(item.key)}
          compact={isMobile}
        />
      ))}
    </CyberSlantedTabBar>
  );
}
