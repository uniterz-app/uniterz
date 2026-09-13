"use client";

/**
 * 交換申請 — 届く流れ・条件の説明モーダル
 */
import { nameBebas, nameOxanium } from "@/lib/fonts";
import { redemptionApplyFlowCopy } from "@/lib/redemption/redemptionApplyFlowCopy";
import { PREDICT_OVERLAY_SUBMIT_BTN_CLASS } from "@/lib/ui/predictOverlayCyber";

type Props = {
  open: boolean;
  language: string;
  onClose: () => void;
};

export default function RedemptionApplyFlowModal({
  open,
  language,
  onClose,
}: Props) {
  const copy = redemptionApplyFlowCopy(language);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100020 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal
      aria-labelledby="redemption-apply-flow-title"
    >
      <div
        className="flex min-h-full w-full items-center justify-center bg-black/75 p-3 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="my-4 flex w-full max-h-[min(640px,88dvh)] max-w-sm flex-col border border-cyan-400/22 bg-[#05080c] sm:max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <div className="mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2
                id="redemption-apply-flow-title"
                className={[
                  nameBebas.className,
                  "text-[20px] font-bold uppercase leading-none text-white",
                ].join(" ")}
              >
                FLOW
              </h2>
              <span
                className={[
                  nameOxanium.className,
                  "text-[9px] font-bold uppercase tracking-[0.08em] text-white/45",
                ].join(" ")}
              >
                {copy.eyebrow}
              </span>
            </div>
            <p
              className={[
                nameOxanium.className,
                "mb-4 text-[13px] font-bold text-white/90",
              ].join(" ")}
            >
              {copy.title}
            </p>

            <div className="space-y-5">
              {copy.sections.map((section) => (
                <section key={section.title}>
                  <h3
                    className={[
                      nameOxanium.className,
                      "mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-cyan-200/85",
                    ].join(" ")}
                  >
                    {section.title}
                  </h3>
                  <ul className="list-disc space-y-1.5 pl-4 text-[12px] leading-relaxed text-white/75">
                    {section.bullets.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={onClose}
              className={[
                PREDICT_OVERLAY_SUBMIT_BTN_CLASS,
                "flex h-12 w-full items-center justify-center text-sm font-bold tracking-[0.06em]",
              ].join(" ")}
            >
              {copy.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
