"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CyberHelpMark from "@/app/component/common/CyberHelpMark";
import SeasonPredictRulesModal from "@/app/component/predict/season/SeasonPredictRulesModal";
import type {
  SeasonPredictRulesKind,
  SeasonPredictRulesLang,
} from "@/lib/predict/seasonPredictRulesCopy";
import { seasonPredictPageUiCopy } from "@/lib/predict/seasonPredictUiCopy";

type Props = {
  kind: SeasonPredictRulesKind;
  language?: SeasonPredictRulesLang;
  size?: "mobile" | "web";
  className?: string;
};

/** 試合予想の採点ルールチップと同型（シーズン順位 / アワード用） */
export default function SeasonPredictRulesChip({
  kind,
  language = "ja",
  size = "mobile",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const pageUi = seasonPredictPageUiCopy(language);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
        aria-label={pageUi.rulesAria}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CyberHelpMark size={size === "web" ? "md" : "sm"} active={open} />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <SeasonPredictRulesModal
              open={open}
              kind={kind}
              language={language}
              displaySize={size}
              onClose={() => setOpen(false)}
            />,
            document.body
          )
        : null}
    </>
  );
}
