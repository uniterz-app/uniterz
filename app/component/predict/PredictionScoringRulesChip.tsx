"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { leagueScoringSport } from "@/lib/scoring/leagueScoringSport";
import CyberHelpMark from "@/app/component/common/CyberHelpMark";
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
          "inline-flex shrink-0 items-center justify-center transition",
          "hover:opacity-95 active:scale-[0.98]",
          className,
        ].join(" ")}
        aria-label={m.predict.scoringRulesChip}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CyberHelpMark size={size === "web" ? "md" : "sm"} active={open} />
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
