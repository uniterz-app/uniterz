"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { nameOxanium } from "@/lib/fonts";
import { preseasonPredictNoticeCopy } from "@/lib/predict/preseasonPredictNotice";

type Props = {
  open: boolean;
  language?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * プレシーズン試合を初めて予想するときの告知（ランキング対象外）。
 */
export default function PreseasonPredictNoticeModal({
  open,
  language,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  const copy = preseasonPredictNoticeCopy(language);

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="preseason-predict-notice-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border border-sky-400/55 bg-[#0a0a0c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-4">
          <p
            className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em] text-sky-400/90`}
          >
            {copy.eyebrow}
          </p>
          <h2
            id="preseason-predict-notice-title"
            className={`${nameOxanium.className} mt-1 text-[15px] font-extrabold text-white`}
            style={{ transform: "skewX(-8deg)" }}
          >
            {copy.title}
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-white/65">
            {copy.body}
          </p>
        </div>
        <div className="border-t border-white/10 p-2">
          <button
            type="button"
            onClick={onConfirm}
            className={`${nameOxanium.className} w-full border border-sky-400/45 bg-sky-400/10 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-100 transition hover:bg-sky-400/20`}
          >
            {copy.ok}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
