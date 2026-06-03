"use client";

import { useEffect } from "react";
import { jp } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import type { ScoringSport } from "@/lib/scoring/leagueScoringSport";
import {
  PredictionScoringFullRulesBody,
  ScoringRulesDisplayProvider,
  type ScoringRulesDisplaySize,
} from "@/app/component/predict/predictionScoringRules";

type Props = {
  open: boolean;
  language: Language;
  sport: ScoringSport;
  displaySize?: ScoringRulesDisplaySize;
  onClose: () => void;
};

export default function PredictionScoringRulesModal({
  open,
  language,
  sport,
  displaySize = "mobile",
  onClose,
}: Props) {
  const m = t(language);
  const isWeb = displaySize === "web";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100020 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal
      aria-labelledby="prediction-scoring-rules-title"
    >
      <div
        className={[
          "flex min-h-full w-full items-center justify-center bg-black/75",
          isWeb ? "p-4 sm:p-6" : "p-3 sm:p-4",
        ].join(" ")}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={[
            "my-4 flex w-full flex-col rounded-2xl border border-white/15 bg-[#0c1419] shadow-xl shadow-black/40",
            jp.className,
            isWeb
              ? "max-h-[min(820px,92dvh)] max-w-2xl"
              : "max-h-[min(640px,88dvh)] max-w-sm sm:max-w-md",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={[
              "min-h-0 flex-1 overflow-y-auto overscroll-contain",
              isWeb ? "px-6 py-5 sm:px-8 sm:py-6" : "px-4 py-4 sm:px-5 sm:py-5",
            ].join(" ")}
          >
            <h2
              id="prediction-scoring-rules-title"
              className={[
                "mb-3 text-center font-bold leading-snug text-white",
                isWeb ? "text-lg sm:text-xl" : "text-base sm:text-lg",
              ].join(" ")}
            >
              {m.predict.scoringRulesChip}
            </h2>

            <div className="mb-3 h-px w-full bg-linear-to-r from-transparent via-cyan-400/25 to-transparent" />

            <ScoringRulesDisplayProvider size={displaySize}>
              <PredictionScoringFullRulesBody sport={sport} language={language} />
            </ScoringRulesDisplayProvider>

            <p
              className={[
                "mt-4 border-l-2 border-cyan-400/30 pl-2.5 leading-relaxed text-white/45",
                isWeb ? "text-[13px] sm:text-sm" : "text-[12px] sm:text-[13px]",
              ].join(" ")}
            >
              {m.predict.rulesFootNote}
            </p>
          </div>

          <div
            className={[
              "shrink-0 border-t border-white/10",
              isWeb ? "px-6 py-4 sm:px-8" : "px-4 py-3 sm:px-5",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={onClose}
              className={[
                "w-full rounded-lg border border-white/15 font-medium text-white/75",
                isWeb ? "py-2.5 text-sm" : "py-2.5 text-[12px] sm:text-sm",
              ].join(" ")}
            >
              {m.common.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
