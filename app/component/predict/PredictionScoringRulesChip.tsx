"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { leagueScoringSport } from "@/lib/scoring/leagueScoringSport";
import { nameOxanium } from "@/lib/fonts";
import PredictionScoringRulesModal from "@/app/component/predict/PredictionScoringRulesModal";

type Props = {
  league: string;
  language: Language;
  /** /web 予想フォームではやや大きく */
  size?: "mobile" | "web";
  className?: string;
};

export default function PredictionScoringRulesChip({
  league,
  language,
  size = "mobile",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const m = t(language);
  const sport = leagueScoringSport(league);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          nameOxanium.className,
          "inline-flex shrink-0 items-center justify-center border border-cyan-400/45 bg-cyan-500/10",
          "font-extrabold text-cyan-100/95 transition",
          "hover:border-cyan-300/60 hover:bg-cyan-500/16 active:scale-[0.98]",
          size === "web" ? "h-8 w-8 text-[13px]" : "h-7 w-7 text-[12px]",
          className,
        ].join(" ")}
        aria-label={m.predict.scoringRulesChip}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        ?
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <PredictionScoringRulesModal
              open={open}
              language={language}
              sport={sport}
              league={league}
              displaySize={size}
              onClose={() => setOpen(false)}
            />,
            document.body
          )
        : null}
    </>
  );
}
