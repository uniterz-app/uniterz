"use client";

import { nameBebas, nameOxanium } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import {
  defaultPeriodRankingUnitRewardsTab,
  PERIOD_RANKING_UNIT_REWARDS_TABS,
  periodRankingUnitRewardsSections,
  periodRankingUnitRewardsTabLabel,
  periodRankingUnitRewardsUiCopy,
  type PeriodRankingUnitRewardsLang,
  type PeriodRankingUnitRewardsTab,
} from "@/lib/units/periodRankingUnitRewardsCopy";
import { PREDICT_OVERLAY_SUBMIT_BTN_CLASS } from "@/lib/ui/predictOverlayCyber";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  language?: PeriodRankingUnitRewardsLang;
  displaySize?: "mobile" | "web";
  /** 開いたときの初期タブ（現在のランキング period から） */
  initialTab?: PeriodRankingUnitRewardsTab;
  rankingPeriod?: "season" | "weekly" | "monthly" | string | null;
  onClose: () => void;
  closeLabel?: string;
};

export default function PeriodRankingUnitRewardsModal({
  open,
  language = "ja",
  displaySize = "mobile",
  initialTab,
  rankingPeriod,
  onClose,
  closeLabel,
}: Props) {
  const isWeb = displaySize === "web";
  const ui = periodRankingUnitRewardsUiCopy(language);
  const [tab, setTab] = useState<PeriodRankingUnitRewardsTab>(
    () =>
      initialTab ?? defaultPeriodRankingUnitRewardsTab(rankingPeriod)
  );

  useEffect(() => {
    if (!open) return;
    setTab(initialTab ?? defaultPeriodRankingUnitRewardsTab(rankingPeriod));
  }, [open, initialTab, rankingPeriod]);

  if (!open) return null;

  const sections = periodRankingUnitRewardsSections(tab, language);

  return (
    <div
      className="fixed inset-0 z-100020 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal
      aria-labelledby="period-ranking-unit-rewards-title"
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
            <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2
                id="period-ranking-unit-rewards-title"
                className={[
                  nameBebas.className,
                  "font-bold uppercase leading-none text-white",
                  isWeb ? "text-[22px]" : "text-[20px]",
                ].join(" ")}
                style={matchCardTeamNameStyle(true)}
              >
                {ui.titleEn}
              </h2>
              <span
                className={[
                  nameOxanium.className,
                  "font-bold uppercase tracking-[0.08em] text-white/45",
                  isWeb ? "text-[10px]" : "text-[9px]",
                ].join(" ")}
              >
                {ui.subtitle}
              </span>
            </div>

            <div
              className="mb-4 flex flex-wrap gap-1.5"
              role="tablist"
              aria-label={ui.subtitle}
            >
              {PERIOD_RANKING_UNIT_REWARDS_TABS.map((key) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(key)}
                    className={[
                      nameOxanium.className,
                      "border px-2.5 py-1 font-extrabold uppercase tracking-[0.1em] transition",
                      isWeb ? "text-[11px]" : "text-[10px]",
                      active
                        ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-100"
                        : "border-white/15 bg-transparent text-white/55 hover:border-white/28 hover:text-white/75",
                    ].join(" ")}
                  >
                    {periodRankingUnitRewardsTabLabel(key, language)}
                  </button>
                );
              })}
            </div>

            <div className="space-y-5">
              {sections.map((section) => (
                <section key={section.title}>
                  <h3
                    className={[
                      nameOxanium.className,
                      "mb-2 font-extrabold uppercase tracking-[0.12em] text-cyan-200/85",
                      isWeb ? "text-[12px]" : "text-[11px]",
                    ].join(" ")}
                  >
                    {section.title}
                  </h3>
                  <ul
                    className={[
                      "list-disc space-y-1.5 pl-4 leading-relaxed text-white/75",
                      isWeb ? "text-[13px]" : "text-[12px]",
                    ].join(" ")}
                  >
                    {section.bullets.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
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
              {closeLabel ?? ui.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
