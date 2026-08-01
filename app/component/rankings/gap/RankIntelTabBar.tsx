"use client";

import {
  CyberSlantedTab,
  CyberSlantedTabBar,
  type CyberSlantedTabTheme,
} from "@/app/component/rankings/CyberSlantedTab";
import type { RankIntelTab } from "@/lib/navigation/rankIntelTab";
import { RANK_GAP_CYBER } from "@/lib/rankings/rankGapDonut";

const RANK_INTEL_TAB_THEME: CyberSlantedTabTheme = {
  accent: RANK_GAP_CYBER.magenta,
  inactiveText: "rgba(255,255,255,0.55)",
  activeText: "#050508",
  activeShadow:
    "0 0 10px rgba(255,0,200,0.5), 0 0 22px rgba(255,0,200,0.26)",
  inactiveBorder: RANK_GAP_CYBER.neonBorder,
};

type Props = {
  active: RankIntelTab;
  gapLabel: string;
  shadowLabel: string;
  onChange: (tab: RankIntelTab) => void;
};

export default function RankIntelTabBar({
  active,
  gapLabel,
  shadowLabel,
  onChange,
}: Props) {
  return (
    <CyberSlantedTabBar fill className="mb-4" aria-label="Rank Intel">
      <CyberSlantedTab
        role="tab"
        label={gapLabel}
        active={active === "gap"}
        onClick={() => onChange("gap")}
        compact
        fontWeight={900}
        theme={RANK_INTEL_TAB_THEME}
      />
      <CyberSlantedTab
        role="tab"
        label={shadowLabel}
        active={active === "shadow"}
        onClick={() => onChange("shadow")}
        compact
        fontWeight={900}
        theme={RANK_INTEL_TAB_THEME}
      />
    </CyberSlantedTabBar>
  );
}
