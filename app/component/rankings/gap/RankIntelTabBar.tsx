"use client";

import {
  CyberSlantedTab,
  CyberSlantedTabBar,
  cyberSlantedTabActiveFill,
  cyberSlantedTabActiveShadow,
  type CyberSlantedTabTheme,
} from "@/app/component/rankings/CyberSlantedTab";
import type { RankIntelTab } from "@/lib/navigation/rankIntelTab";
import { RANK_GAP_CYBER } from "@/lib/rankings/rankGapDonut";

const RANK_INTEL_TAB_THEME: CyberSlantedTabTheme = {
  accent: RANK_GAP_CYBER.magenta,
  activeFill: cyberSlantedTabActiveFill({
    hi: "#FFC2EC",
    midHi: "#FF5AC8",
    mid: "#FF00C8",
    midLo: "#C4009A",
    lo: "#8B006E",
  }),
  inactiveText: "rgba(255,255,255,0.55)",
  activeText: "#050508",
  activeShadow: cyberSlantedTabActiveShadow("255,0,200"),
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
