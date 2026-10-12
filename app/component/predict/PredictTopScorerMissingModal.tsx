"use client";

import { useEffect, useRef, useState } from "react";
import UniterzLogoFlat from "@/app/component/units/UniterzLogoFlat";
import { jp, nameBebas, nameOxanium, resultStatsMetricNumClass } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { NBA_TOP_SCORER_BONUS_POINTS } from "@/lib/nba/topScorer";

/** 選手ピッカー見出しと同じ書体で描く語 */
const TOP_SCORER_TOKEN = "TOP SCORER";

type Props = {
  open: boolean;
  language: Language;
  /** 選手ピッカーへ戻る */
  onPick: () => void;
  /** 得点者なしで送信する */
  onSend: () => void;
};

/** TOP SCORER 未選択で送信したときの確認（`PredictNextGameModal` と同じ枠） */
export default function PredictTopScorerMissingModal({
  open,
  language,
  onPick,
  onSend,
}: Props) {
  const m = t(language).predict;
  const [choice, setChoice] = useState<"pick" | "send">("pick");
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) setChoice("pick");
    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onPick();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onPick]);

  /** 選択の点灯を見せてから閉じる */
  const commitChoice = (next: "pick" | "send") => {
    if (commitTimerRef.current) return;
    setChoice(next);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      if (next === "send") onSend();
      else onPick();
    }, 160);
  };

  if (!open) return null;

  const bonusParts = m.topScorerMissingBonus
    .replace("{n}", String(NBA_TOP_SCORER_BONUS_POINTS))
    .split(TOP_SCORER_TOKEN);

  return (
    <div
      className="fixed inset-0 z-100010 flex min-h-dvh items-center justify-center bg-black/62 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby="predict-top-scorer-missing-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onPick();
      }}
    >
      <div
        className={[
          "relative w-full max-w-[360px] rounded-none border-x border-b border-cyan-200/35 px-[18px] pb-[18px] pt-7",
          "bg-[rgba(5,8,14,0.7)]",
          "backdrop-blur-xl shadow-[0_20px_48px_rgba(0,0,0,0.55)]",
          jp.className,
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-px" aria-hidden>
          <span className="flex-1 bg-cyan-200/35" />
          <span className="w-[128px]" />
          <span className="flex-1 bg-cyan-200/35" />
        </div>
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-10 w-[108px] -translate-x-1/2 -translate-y-1/2 text-white"
          aria-hidden
        >
          <UniterzLogoFlat width="100%" fill="currentColor" title="UNITERZ" />
        </div>

        <h2
          id="predict-top-scorer-missing-title"
          className={`${nameOxanium.className} text-center text-[14px] font-bold tracking-[0.03em] text-slate-50`}
        >
          {m.topScorerMissingTitle}
        </h2>

        <div className="mt-3 border border-white/10 bg-white/[0.04] px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`${resultStatsMetricNumClass} w-9 shrink-0 text-center text-[17px] leading-5 text-[#facc15]`}
            >
              +{NBA_TOP_SCORER_BONUS_POINTS}
            </span>
            <span className="text-[12px] leading-4 text-slate-200/90">
              {bonusParts.map((part, i) => (
                <span key={i}>
                  {i > 0 ? (
                    <span
                      className={`${nameBebas.className} inline-block text-[15px] font-bold uppercase leading-none text-white`}
                      style={matchCardTeamNameStyle(true)}
                    >
                      {TOP_SCORER_TOKEN}
                    </span>
                  ) : null}
                  {part}
                </span>
              ))}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <span
              className={`${nameOxanium.className} w-9 shrink-0 text-center text-[10px] font-bold tracking-[0.08em] text-cyan-300`}
            >
              EDIT
            </span>
            <span className="text-[12px] leading-4 text-slate-200/90">
              {m.topScorerMissingEditable}
            </span>
          </div>
        </div>

        <p className="mt-3.5 text-center text-[13px] leading-[18px] text-slate-300">
          {m.topScorerMissingConfirm}
        </p>

        <div className="mt-3 flex gap-2.5">
          {(
            [
              { key: "send", label: m.topScorerMissingSend },
              { key: "pick", label: m.topScorerMissingPick },
            ] as const
          ).map((item) => {
            const active = choice === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => commitChoice(item.key)}
                className={[
                  "relative flex h-[42px] min-w-0 flex-1 items-center justify-center truncate rounded-none border border-[#00F5FF] px-1.5 text-[13px] font-bold tracking-[0.03em] transition-colors",
                  active
                    ? "bg-[#00F5FF] text-[#050508] shadow-[0_0_10px_rgba(0,245,255,0.55)]"
                    : "text-[#00F5FF] hover:bg-cyan-300/[0.08]",
                ].join(" ")}
                style={
                  active
                    ? {
                        backgroundImage:
                          "repeating-linear-gradient(to bottom, transparent 0 2px, rgba(5,5,8,0.22) 2px 3px)",
                      }
                    : undefined
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
