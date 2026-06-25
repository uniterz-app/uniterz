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
  isWcBracketPhaseComplete,
  wcBracketPhaseIndex,
} from "@/lib/wc/wc-bracket-input-phases";
import WcBracketRoundTabs from "@/app/component/predict/wc/WcBracketRoundTabs";
import WcBracketSplitRoundView from "@/app/component/predict/wc/WcBracketSplitRoundView";
import WcBracketTreeInput from "@/app/component/predict/wc/WcBracketTreeInput";
import { PLAYOFF_BRACKET_PANEL } from "@/lib/ui/matchOverlayGlass";
import type { Language } from "@/lib/i18n/language";

type Props = {
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  onBracketChange: (next: WcBracketState) => void;
  onSubmitClick: () => void;
  language?: Language;
  submitDisabled?: boolean;
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
  submitLabel,
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

  const phaseComplete = isWcBracketPhaseComplete(activePhase, bracket);
  const isComplete = isWcBracketComplete(bracket);
  const phaseIdx = wcBracketPhaseIndex(activePhase);
  const nextPhase = WC_BRACKET_INPUT_PHASES[phaseIdx + 1];

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

  const ctaLabel =
    submitLabel ?? (isJa ? "ブラケットを提出する" : "Submit bracket");

  return (
    <div
      className={[PLAYOFF_BRACKET_PANEL, "relative w-full pb-4", className]
        .filter(Boolean)
        .join(" ")}
    >
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

      <div className="relative z-20 overflow-x-hidden px-1">
        <WcBracketSplitRoundView
          activePhase={activePhase}
          bracket={bracket}
          advancement={advancement}
          language={language}
          onPick={pickWinner}
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

      {(phaseComplete && nextPhase && !isComplete) || isComplete ? (
        <div className="sticky bottom-0 z-30 mt-4 border-t border-white/10 bg-[#050b14]/92 px-4 py-3 backdrop-blur-md">
          {phaseComplete && nextPhase && !isComplete ? (
            <button
              type="button"
              onClick={() => setActivePhase(nextPhase.id)}
              className="w-full rounded-xl bg-[#163a5f] py-3.5 text-sm font-bold text-white transition hover:bg-[#1d4c78] active:scale-[0.99]"
            >
              {isJa ? "次へ" : "Next"}
            </button>
          ) : null}

          {isComplete ? (
            <button
              type="button"
              disabled={submitDisabled}
              onClick={onSubmitClick}
              className={[
                "w-full rounded-xl py-3.5 text-sm font-bold text-white transition",
                phaseComplete && nextPhase ? "mt-2" : "",
                submitDisabled
                  ? "cursor-not-allowed bg-white/15 text-white/50"
                  : "bg-cyan-500 text-[#041018] hover:brightness-110 active:scale-[0.99]",
              ].join(" ")}
            >
              {ctaLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
