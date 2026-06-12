"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { leagueScoringSport } from "@/lib/scoring/leagueScoringSport";
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
          "inline-flex shrink-0 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10",
          "text-cyan-100/95 transition",
          "hover:border-cyan-300/50 hover:bg-cyan-500/16 active:scale-[0.98]",
          size === "web" ? "h-8 w-8" : "h-7 w-7",
          className,
        ].join(" ")}
        aria-label={m.predict.scoringRulesChip}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CircleHelp
          className={[
            "shrink-0 opacity-90",
            size === "web" ? "h-4 w-4" : "h-3.5 w-3.5",
          ].join(" ")}
          aria-hidden
        />
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
