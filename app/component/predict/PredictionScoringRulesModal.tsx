"use client";

import { useEffect } from "react";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import type { ScoringSport } from "@/lib/scoring/leagueScoringSport";
import {
  PredictionScoringFullRulesBody,
  ScoringRulesDisplayProvider,
  type ScoringRulesDisplaySize,
} from "@/app/component/predict/predictionScoringRules";
import { PREDICT_OVERLAY_SUBMIT_BTN_CLASS } from "@/lib/ui/predictOverlayCyber";

type Props = {
  open: boolean;
  language: Language;
  sport: ScoringSport;
  league?: string;
  displaySize?: ScoringRulesDisplaySize;
  onClose: () => void;
};

export default function PredictionScoringRulesModal({
  open,
  language,
  sport,
  league,
  displaySize = "mobile",
  onClose,
}: Props) {
  const m = t(language);
  const isWeb = displaySize === "web";
  const ja = language !== "en";

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
            "my-4 flex w-full flex-col border border-cyan-400/22 bg-[#05080c]",
            isWeb
              ? "max-h-[min(820px,92dvh)] max-w-2xl"
              : "max-h-[min(640px,88dvh)] max-w-sm sm:max-w-md",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={[
              "min-h-0 flex-1 overflow-y-auto overscroll-contain",
              isWeb ? "px-5 py-5 sm:px-7 sm:py-6" : "px-4 py-4",
            ].join(" ")}
          >
            <div className="mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2
                id="prediction-scoring-rules-title"
                className={[
                  nameBebas.className,
                  "font-bold uppercase leading-none text-white",
                  isWeb ? "text-[22px]" : "text-[20px]",
                ].join(" ")}
                style={matchCardTeamNameStyle(true)}
              >
                SCORING RULES
              </h2>
              <span
                className={[
                  nameOxanium.className,
                  "font-bold uppercase tracking-[0.08em] text-white/45",
                  isWeb ? "text-[10px]" : "text-[9px]",
                ].join(" ")}
              >
                {ja ? "採点ルール" : "How points are scored"}
              </span>
            </div>

            <ScoringRulesDisplayProvider size={displaySize}>
              <PredictionScoringFullRulesBody
                sport={sport}
                language={language}
                league={league}
              />
            </ScoringRulesDisplayProvider>

            <p
              className={[
                "mt-4 leading-relaxed text-white/45",
                isWeb ? "text-[12px]" : "text-[11px]",
              ].join(" ")}
            >
              {m.predict.rulesFootNote}
            </p>
          </div>

          <div className={isWeb ? "px-5 pb-5 sm:px-7" : "px-4 pb-4"}>
            <button
              type="button"
              onClick={onClose}
              className={[
                PREDICT_OVERLAY_SUBMIT_BTN_CLASS,
                "flex h-12 w-full items-center justify-center text-sm font-bold tracking-[0.06em]",
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
