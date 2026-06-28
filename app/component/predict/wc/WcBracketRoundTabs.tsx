"use client";

import {
  WC_BRACKET_INPUT_PHASES,
  type WcBracketInputPhase,
} from "@/lib/wc/wc-bracket-input-phases";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import { WC_BRACKET_INPUT_HPAD } from "@/lib/wc/wc-bracket-input-layout";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";

type Props = {
  activePhase: WcBracketInputPhase;
  bracket: WcBracketState;
  onChange: (phase: WcBracketInputPhase) => void;
};

export default function WcBracketRoundTabs({
  activePhase,
  onChange,
}: Props) {
  return (
    <div className={`${WC_BRACKET_INPUT_HPAD} pb-2`}>
      <CyberSlantedTabBar fill aria-label="Bracket round">
        {WC_BRACKET_INPUT_PHASES.map((phase) => (
          <CyberSlantedTab
            key={phase.id}
            role="tab"
            label={phase.tabLabel}
            active={phase.id === activePhase}
            onClick={() => onChange(phase.id)}
            compact
          />
        ))}
      </CyberSlantedTabBar>
    </div>
  );
}
