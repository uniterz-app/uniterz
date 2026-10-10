"use client";

/** 起動時に未表示の Unit 獲得をまとめて 1 枚で見せるカード（演出なし） */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import cn from "clsx";
import { nameOxanium, jp } from "@/lib/fonts";
import {
  formatUnitEarnLaunchAmount,
  unitEarnLaunchCopy,
  type UnitEarnLaunchSummary,
} from "@/lib/units/unitEarnLaunchSummary";

type Props = {
  summary: UnitEarnLaunchSummary | null;
  language?: string | null;
  onClaim: () => void;
};

export default function UnitEarnLaunchCard({ summary, language, onClaim }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!summary) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClaim();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [summary, onClaim]);

  if (!mounted || !summary) return null;

  const copy = unitEarnLaunchCopy(language);
  const single = summary.lines.length === 1 && summary.hiddenCount === 0;
  const head = summary.lines[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center px-7"
      role="dialog"
      aria-modal="true"
      aria-label={copy.heading}
    >
      <div className="absolute inset-0 bg-black/80" />
      <div
        className={cn(
          jp.className,
          "relative flex w-full max-w-[320px] flex-col items-center border border-[rgba(0,245,255,0.35)] bg-[#07090d] px-[22px] pb-5 pt-6"
        )}
      >
        <p
          className={cn(
            nameOxanium.className,
            "text-center text-[12px] font-extrabold uppercase tracking-[0.17em] text-[#00F5FF]"
          )}
        >
          {copy.heading}
        </p>

        {single && head ? (
          <div className="mt-3.5 flex w-full flex-col items-center text-center">
            <p className="line-clamp-2 text-[16px] font-extrabold tracking-[0.04em] text-white/95">
              {head.title}
            </p>
            {head.subtitle ? (
              <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold text-[rgba(226,246,255,0.72)]">
                {head.subtitle}
              </p>
            ) : null}
            {head.rankText ? (
              <p
                className={cn(
                  nameOxanium.className,
                  "mt-2.5 text-[28px] font-extrabold text-[#cffafe]"
                )}
              >
                {head.rankText}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-3.5 w-full">
            {summary.lines.map((line) => (
              <div
                key={line.id}
                className="flex items-center gap-3 border-b border-white/10 py-[9px]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-white/90">
                    {line.title}
                  </p>
                  {line.rankText || line.subtitle ? (
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-[rgba(226,246,255,0.6)]">
                      {[line.rankText, line.subtitle].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    nameOxanium.className,
                    "text-[15px] font-extrabold tabular-nums text-[#ffe9a8]"
                  )}
                >
                  {formatUnitEarnLaunchAmount(line.amount)}
                </span>
              </div>
            ))}
            {summary.hiddenCount > 0 ? (
              <p className="mt-2 text-right text-[11px] font-semibold text-[rgba(226,246,255,0.55)]">
                {copy.more(summary.hiddenCount)}
              </p>
            ) : null}
          </div>
        )}

        {!single ? (
          <p
            className={cn(
              nameOxanium.className,
              "mt-4 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[rgba(226,246,255,0.6)]"
            )}
          >
            {copy.total}
          </p>
        ) : null}
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="profile-edit-kinetik-unit-vault__disc" aria-hidden>
            <span className="profile-edit-kinetik-unit-vault__disc-inner">U</span>
          </span>
          <span
            className={cn(
              nameOxanium.className,
              "text-[44px] font-extrabold leading-none tracking-[-0.02em] tabular-nums text-[#ffe9a8]"
            )}
          >
            {formatUnitEarnLaunchAmount(summary.total)}
          </span>
        </div>

        <button
          type="button"
          onClick={onClaim}
          className={cn(
            nameOxanium.className,
            "mt-[22px] min-w-[180px] bg-[#00F5FF] px-7 py-3 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#041018] active:opacity-85"
          )}
        >
          {copy.ok}
        </button>
      </div>
    </div>,
    document.body
  );
}
