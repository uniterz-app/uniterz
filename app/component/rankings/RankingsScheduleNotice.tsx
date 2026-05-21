"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";
import cn from "clsx";
import type { Language } from "@/lib/i18n/language";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import { getRankingsScheduleNoticeText } from "@/lib/rankings/getRankingsScheduleNoticeText";
import { t } from "@/lib/i18n/t";

type Props = {
  phase: RankingPhase;
  language: Language;
  countryCode?: string | null;
  /** ヘッダー右に載せるコンパクトな i ボタン（説明はポップオーバー） */
  compact?: boolean;
};

export default function RankingsScheduleNotice({
  phase,
  language,
  countryCode,
  compact = false,
}: Props) {
  void phase;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const m = t(language);
  const text = getRankingsScheduleNoticeText(language, countryCode);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", compact ? "shrink-0" : "mx-auto")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={m.rankings.scheduleInfoToggle}
        className={cn(
          "flex items-center justify-center text-white/55 transition-colors hover:text-white/90",
          compact ? "h-10 w-10 shrink-0" : "mx-auto h-8 w-8",
        )}
      >
        <Info className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelId}
            role="tooltip"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "absolute z-50 overflow-hidden rounded-lg border border-white/20 bg-white/[0.07] px-3 py-2.5 shadow-[0_10px_36px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl backdrop-saturate-150",
              compact
                ? "right-0 top-full mt-1.5 w-[min(calc(100vw-2rem),20rem)]"
                : "left-1/2 top-full mt-2 w-[min(calc(100vw-2rem),22rem)] -translate-x-1/2",
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.02)_45%,rgba(103,232,249,0.06)_100%)]"
              aria-hidden
            />
            <p className="relative text-center text-[11px] leading-relaxed text-white/75 sm:text-[12px]">
              {text}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
