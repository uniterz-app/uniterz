"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CyberHelpMark from "@/app/component/common/CyberHelpMark";
import PeriodRankingUnitRewardsModal from "@/app/component/rankings/PeriodRankingUnitRewardsModal";
import { nameOxanium } from "@/lib/fonts";
import {
  periodRankingUnitRewardsUiCopy,
  resolvePeriodRankingUnitRewardsLang,
  type PeriodRankingUnitRewardsLang,
} from "@/lib/units/periodRankingUnitRewardsCopy";

type Props = {
  language?: PeriodRankingUnitRewardsLang | string;
  size?: "mobile" | "web";
  rankingPeriod?: "season" | "weekly" | "monthly" | string | null;
  className?: string;
};

/** ランキング期間タブ横 — Unit 獲得表チップ */
export default function PeriodRankingUnitRewardsChip({
  language: languageProp = "ja",
  size = "mobile",
  rankingPeriod,
  className = "",
}: Props) {
  const language = resolvePeriodRankingUnitRewardsLang(languageProp);
  const [open, setOpen] = useState(false);
  const ui = periodRankingUnitRewardsUiCopy(language);

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
          "inline-flex shrink-0 items-center gap-1 transition",
          "hover:opacity-95 active:scale-[0.98]",
          className,
        ].join(" ")}
        aria-label={ui.chipAria}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span
          className={[
            nameOxanium.className,
            "font-extrabold uppercase tracking-[0.14em] text-cyan-200/80",
            size === "web" ? "text-[11px]" : "text-[10px]",
          ].join(" ")}
        >
          {ui.chipLabel}
        </span>
        <CyberHelpMark size={size === "web" ? "md" : "sm"} active={open} />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <PeriodRankingUnitRewardsModal
              open={open}
              language={language}
              displaySize={size}
              rankingPeriod={rankingPeriod}
              onClose={() => setOpen(false)}
            />,
            document.body
          )
        : null}
    </>
  );
}
