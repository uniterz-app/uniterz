"use client";

import { nameBebas, nameOxanium } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import {
  seasonPredictRulesSections,
  type SeasonPredictRulesKind,
  type SeasonPredictRulesLang,
} from "@/lib/predict/seasonPredictRulesCopy";
import { PREDICT_OVERLAY_SUBMIT_BTN_CLASS } from "@/lib/ui/predictOverlayCyber";

type Props = {
  open: boolean;
  kind: SeasonPredictRulesKind;
  language?: SeasonPredictRulesLang;
  displaySize?: "mobile" | "web";
  onClose: () => void;
  closeLabel?: string;
};

export default function SeasonPredictRulesModal({
  open,
  kind,
  language = "ja",
  displaySize = "mobile",
  onClose,
  closeLabel,
}: Props) {
  const isWeb = displaySize === "web";
  const ja = language !== "en";
  const sections = seasonPredictRulesSections(kind, language);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100020 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal
      aria-labelledby="season-predict-rules-title"
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
                id="season-predict-rules-title"
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
              {closeLabel ?? (ja ? "閉じる" : "Close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
