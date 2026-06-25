"use client";

import { Trophy } from "lucide-react";
import {
  WC_BRACKET_INPUT_PHASES,
  type WcBracketInputPhase,
} from "@/lib/wc/wc-bracket-input-phases";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import {
  canOpenWcBracketPhase,
  isWcBracketPhaseComplete,
} from "@/lib/wc/wc-bracket-input-phases";

type Props = {
  activePhase: WcBracketInputPhase;
  bracket: WcBracketState;
  onChange: (phase: WcBracketInputPhase) => void;
};

export default function WcBracketRoundTabs({
  activePhase,
  bracket,
  onChange,
}: Props) {
  return (
    <div className="px-3 pb-3">
      <div className="flex items-center justify-between gap-0.5 rounded-full bg-white/[0.07] p-1">
        {WC_BRACKET_INPUT_PHASES.map((phase) => {
          const open = canOpenWcBracketPhase(phase.id, bracket);
          const done = isWcBracketPhaseComplete(phase.id, bracket);
          const active = phase.id === activePhase;
          const isFinal = phase.id === "FINAL";

          return (
            <button
              key={phase.id}
              type="button"
              disabled={!open}
              onClick={() => open && onChange(phase.id)}
              className={[
                "flex min-w-0 flex-1 items-center justify-center gap-0.5 rounded-full py-2 text-[11px] font-bold tracking-wide transition",
                active
                  ? "bg-white text-[#0a1020] shadow-sm"
                  : done
                    ? "text-emerald-300/90"
                    : open
                      ? "text-white/65 hover:text-white/85"
                      : "cursor-not-allowed text-white/25",
              ].join(" ")}
            >
              {isFinal ? (
                <Trophy
                  className={[
                    "h-3.5 w-3.5",
                    active ? "text-[#0a1020]" : "",
                  ].join(" ")}
                  strokeWidth={2.5}
                />
              ) : (
                phase.tabLabel
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
