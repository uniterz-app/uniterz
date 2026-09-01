"use client";

import { useEffect } from "react";
import type { DetailChipExplainPayload } from "@/lib/nba/detailInsights/detailInsightTypes";

type Props = {
  open: boolean;
  payload: DetailChipExplainPayload | null;
  isJa: boolean;
  accent: string;
  onClose: () => void;
};

export function DetailChipExplainModal({
  open,
  payload,
  isJa,
  accent,
  onClose,
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

  if (!open || !payload) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-chip-explain-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label={isJa ? "閉じる" : "Close"}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md border bg-[#080a10] p-4 shadow-2xl"
        style={{ borderColor: accent }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3
            id="detail-chip-explain-title"
            className="text-[13px] font-extrabold uppercase tracking-wide"
            style={{ color: accent }}
          >
            {payload.label}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-white/45"
          >
            {isJa ? "閉じる" : "Close"}
          </button>
        </div>
        <p className="whitespace-pre-line text-[13px] leading-relaxed text-white/78">
          {isJa ? payload.hintJa : payload.hintEn}
        </p>
      </div>
    </div>
  );
}
