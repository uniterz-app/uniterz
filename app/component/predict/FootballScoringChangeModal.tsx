"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { jp } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { resolveFootballScoringChangeCopy } from "@/lib/predict/resolveFootballScoringChangeCopy";
import {
  FootballTotalScoreRulesOnly,
  ScoringRulesDisplayProvider,
} from "@/app/component/predict/predictionScoringRules";

type Props = {
  open: boolean;
  language: Language;
  league?: string;
  displaySize?: "mobile" | "web";
  onClose: () => void;
};

export default function FootballScoringChangeModal({
  open,
  language,
  league,
  displaySize = "mobile",
  onClose,
}: Props) {
  const m = t(language);
  const copy = resolveFootballScoringChangeCopy(language);
  const isWeb = displaySize === "web";
  const showWcGoalScorer = String(league ?? "").toLowerCase() === "wc";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-1000035 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal
      aria-labelledby="football-scoring-change-title"
    >
      <div
        className={[
          "flex min-h-full w-full items-center justify-center bg-black/78",
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
              ? "max-h-[min(860px,92dvh)] max-w-2xl"
              : "max-h-[min(680px,88dvh)] max-w-sm sm:max-w-md",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={[
              "min-h-0 flex-1 overflow-y-auto overscroll-contain",
              isWeb ? "px-6 py-5 sm:px-8 sm:py-6" : "px-4 py-4 sm:px-5 sm:py-5",
            ].join(" ")}
          >
            <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/85">
              {copy.tag}
            </p>
            <h2
              id="football-scoring-change-title"
              className={[
                "mb-2 text-center font-bold leading-snug text-white",
                isWeb ? "text-lg sm:text-xl" : "text-base sm:text-lg",
              ].join(" ")}
            >
              {copy.title}
            </h2>
            <p
              className={[
                "mb-4 text-center leading-relaxed text-white/62",
                isWeb ? "text-[13px] sm:text-sm" : "text-[12px] sm:text-[13px]",
              ].join(" ")}
            >
              {copy.lead}
            </p>

            <div className="mb-3 h-px w-full bg-linear-to-r from-transparent via-cyan-400/25 to-transparent" />

            <ScoringRulesDisplayProvider size={displaySize}>
              <FootballTotalScoreRulesOnly
                language={language}
                showWcGoalScorer={showWcGoalScorer}
              />
            </ScoringRulesDisplayProvider>
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
                "w-full rounded-lg border border-cyan-400/30 bg-cyan-400/10 font-semibold text-cyan-50/95",
                isWeb ? "py-2.5 text-sm" : "py-2.5 text-[12px] sm:text-sm",
              ].join(" ")}
            >
              {m.predict.rulesStart}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
