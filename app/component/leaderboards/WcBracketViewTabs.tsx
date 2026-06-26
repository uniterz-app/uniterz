"use client";

import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";

export type WcBracketViewMode = "survivor" | "market";

type Props = {
  mode: WcBracketViewMode;
  onChange: (next: WcBracketViewMode) => void;
};

export default function WcBracketViewTabs({ mode, onChange }: Props) {
  return (
    <CyberSlantedTabBar fill aria-label="WC bracket view">
      <CyberSlantedTab
        role="tab"
        label="SURVIVOR"
        active={mode === "survivor"}
        onClick={() => onChange("survivor")}
        fontWeight={600}
      />
      <CyberSlantedTab
        role="tab"
        label="MARKET"
        active={mode === "market"}
        onClick={() => onChange("market")}
        fontWeight={600}
      />
    </CyberSlantedTabBar>
  );
}
