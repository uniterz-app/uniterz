"use client";

import { useCallback, useMemo, useState } from "react";
import {
  type WcBracketPredictMatchId,
  type WcBracketState,
  isWcBracketComplete,
} from "@/lib/wc/wc-knockout-bracket";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import { toggleWcBracketPick } from "@/lib/wc/wc-bracket-pick";
import {
  WC_BRACKET_INPUT_PHASES,
  type WcBracketInputPhase,
  firstIncompleteWcBracketPhase,
} from "@/lib/wc/wc-bracket-input-phases";
import WcBracketRoundTabs from "@/app/component/predict/wc/WcBracketRoundTabs";
import WcBracketSplitRoundView from "@/app/component/predict/wc/WcBracketSplitRoundView";
import WcBracketTreeInput from "@/app/component/predict/wc/WcBracketTreeInput";
import WcBracketSubmitButton from "@/app/component/predict/wc/WcBracketSubmitButton";
import type { Language } from "@/lib/i18n/language";

type Props = {
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  onBracketChange: (next: WcBracketState) => void;
  onSubmitClick: () => void;
  language?: Language;
  submitDisabled?: boolean;
  submitButtonLabel?: string;
  /** @deprecated 文言は常に submit */
  submitLabel?: string;
  className?: string;
};

export default function WcBracketInputMobile({
  bracket,
  advancement,
  onBracketChange,
  onSubmitClick,
  language = "ja",
  submitDisabled = false,
  submitButtonLabel,
  className = "",
}: Props) {
  const isJa = language === "ja";
  const [activePhase, setActivePhase] = useState<WcBracketInputPhase>(
    () => firstIncompleteWcBracketPhase(bracket)
  );

  const pickWinner = useCallback(
    (matchId: WcBracketPredictMatchId, teamId: string) => {
      onBracketChange(toggleWcBracketPick(bracket, matchId, teamId));
    },
    [bracket, onBracketChange]
  );

  const handlePromotePhase = useCallback((next: WcBracketInputPhase) => {
    setActivePhase(next);
  }, []);

  const isComplete = isWcBracketComplete(bracket);

  const pickedTotal = useMemo(
    () =>
      WC_BRACKET_INPUT_PHASES.reduce(
        (sum, p) =>
          sum +
          p.matchIds.filter((id) => Boolean(bracket[id]?.winner?.trim())).length,
        0
      ),
    [bracket]
  );

  return (
    <div className={["relative w-full bg-transparent pb-4", className].join(" ")}>
      <div className="relative z-20 flex justify-end px-3 pb-1 pt-2">
        <span className="text-[11px] font-semibold tabular-nums text-white/50">
          {pickedTotal}/31
        </span>
      </div>

      <WcBracketRoundTabs
        activePhase={activePhase}
        bracket={bracket}
        onChange={setActivePhase}
      />

      <div className="relative z-20 overflow-x-hidden">
        <WcBracketSplitRoundView
          activePhase={activePhase}
          bracket={bracket}
          advancement={advancement}
          language={language}
          onPick={pickWinner}
          onPromotePhase={handlePromotePhase}
        />
      </div>

      {isComplete ? (
        <div className="relative z-20 mt-4 border-t border-white/10 px-2 pt-4">
          <div className="mb-2 px-1 text-center">
            <p className="text-[12px] font-semibold text-white/90">
              {isJa ? "あなたのトーナメント表" : "Your bracket"}
            </p>
          </div>
          <WcBracketTreeInput
            bracket={bracket}
            advancement={advancement}
            language={language}
          />
        </div>
      ) : null}

      {isComplete ? (
        <div className="sticky bottom-0 z-30 mt-4 border-t border-white/10 bg-black/25 px-4 py-3 backdrop-blur-xl">
          <WcBracketSubmitButton
            disabled={submitDisabled}
            onClick={onSubmitClick}
            label={submitButtonLabel}
          />
        </div>
      ) : null}
    </div>
  );
}
