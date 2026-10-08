"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { nameOxanium } from "@/lib/fonts";
import { seasonPredictInviteCopy } from "@/lib/predict/seasonPredictInvite";

type Props = {
  open: boolean;
  language?: string | null;
  awardsLabel: string;
  standingsLabel: string;
  awardsPending: boolean;
  standingsPending: boolean;
  onAwards: () => void;
  onStandings: () => void;
  onLater: () => void;
};

/**
 * シーズン予想（アワード / 順位）の案内 — Games チュートリアル後に 1 回だけ。
 */
export default function SeasonPredictInviteModal({
  open,
  language,
  awardsLabel,
  standingsLabel,
  awardsPending,
  standingsPending,
  onAwards,
  onStandings,
  onLater,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onLater();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onLater]);

  if (!open || typeof document === "undefined") return null;
  const copy = seasonPredictInviteCopy(language);
  const actionClass = `${nameOxanium.className} w-full border border-amber-300/45 bg-amber-400/10 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-400/20`;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="season-predict-invite-title"
      onClick={onLater}
    >
      <div
        className="w-full max-w-sm border border-amber-300/55 bg-[#0a0a0c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-4">
          <p
            className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300/85`}
          >
            {copy.eyebrow}
          </p>
          <h2
            id="season-predict-invite-title"
            className={`${nameOxanium.className} mt-1 text-[15px] font-extrabold text-white`}
            style={{ transform: "skewX(-8deg)" }}
          >
            {copy.title}
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-white/65">
            {copy.body}
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-white/50">
            <span className="text-amber-300/85">{copy.deadlineLabel}</span>
            {"  "}
            {copy.deadline}
          </p>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/10 p-2">
          {awardsPending ? (
            <button type="button" onClick={onAwards} className={actionClass}>
              {awardsLabel}
            </button>
          ) : null}
          {standingsPending ? (
            <button type="button" onClick={onStandings} className={actionClass}>
              {standingsLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onLater}
            className={`${nameOxanium.className} w-full border border-white/20 bg-transparent px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70 transition hover:border-white/35 hover:text-white/90`}
          >
            {copy.later}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
