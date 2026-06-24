"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { jp } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import type { WcConcurrentStreakCopy } from "@/lib/wc/wcConcurrentStreakNotice";

type Props = {
  open: boolean;
  language: Language;
  copy: WcConcurrentStreakCopy;
  onClose: () => void;
};

export default function WcConcurrentStreakModal({
  open,
  language,
  copy,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-1000036 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal
      aria-labelledby="wc-concurrent-streak-title"
    >
      <div
        className="flex min-h-full w-full items-center justify-center bg-black/78 p-3 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={[
            "my-4 flex w-full max-w-md flex-col rounded-2xl border border-cyan-400/25 bg-[#0a1018] shadow-xl shadow-black/50",
            jp.className,
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-cyan-300/90 uppercase">
              {copy.tag}
            </p>
            <h2
              id="wc-concurrent-streak-title"
              className="mt-2 text-lg font-bold text-white"
            >
              {copy.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/78">
              {copy.lead}
            </p>
          </div>

          <ul className="space-y-2 px-5 py-4 text-sm leading-relaxed text-white/85">
            {copy.bullets.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-cyan-300">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-white/10 px-5 py-4">
            <button
              type="button"
              className="w-full rounded-xl bg-cyan-500/90 py-3 text-sm font-bold text-[#041018] transition hover:bg-cyan-400"
              onClick={onClose}
            >
              {copy.cta}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
