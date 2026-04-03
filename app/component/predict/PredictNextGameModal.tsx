"use client";

import { useEffect, useState } from "react";
import { jp } from "@/lib/fonts";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";

function resolveTeamColor(
  league: League,
  teamId: string | undefined,
  fallbackHex?: string
): string {
  const lg = normalizeLeague(league);
  if (teamId) {
    const p = getTeamPrimaryColor(lg, teamId);
    if (p.toLowerCase() !== "#ffffff") return p;
  }
  if (fallbackHex && fallbackHex.toLowerCase() !== "#ffffff") return fallbackHex;
  return "#cbd5e1";
}

type Props = {
  open: boolean;
  isEn: boolean;
  league: League;
  homeName: string;
  awayName: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeColorHex?: string;
  awayColorHex?: string;
  onYes: (dontShowAgain: boolean) => void;
  onNo: (dontShowAgain: boolean) => void;
};

export default function PredictNextGameModal({
  open,
  isEn,
  league,
  homeName,
  awayName,
  homeTeamId,
  awayTeamId,
  homeColorHex,
  awayColorHex,
  onYes,
  onNo,
}: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (open) setDontShowAgain(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onNo(dontShowAgain);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onNo, dontShowAgain]);

  if (!open) return null;

  const homeC = resolveTeamColor(league, homeTeamId, homeColorHex);
  const awayC = resolveTeamColor(league, awayTeamId, awayColorHex);

  const t = isEn
    ? {
        title: "Predict the next game too?",
        sub: "The next match in the same league on the same day.",
        skip: "Don’t show this again",
        yes: "Yes",
        no: "No (back to schedule)",
        vs: "vs",
      }
    : {
        title: "次の試合も予想しますか？",
        sub: "同じリーグ・同じ日の直後の試合です。",
        skip: "今後この案内を表示しない",
        yes: "はい",
        no: "いいえ（試合一覧へ）",
        vs: "vs",
      };

  return (
    <div
      className="fixed inset-0 z-100010 flex min-h-dvh items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="predict-next-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onNo(dontShowAgain);
      }}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border border-white/15 bg-[#0c1419] px-4 py-4 shadow-xl ${jp.className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <h2
            id="predict-next-title"
            className="mb-2 text-[13px] font-bold leading-snug text-white sm:mb-2.5 sm:text-[15px]"
          >
            {t.title}
          </h2>

          <p className="mb-1 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-[12px] font-semibold leading-snug sm:text-[13px] sm:text-sm">
            <span style={{ color: homeC }}>{homeName}</span>
            <span className="text-[10px] font-medium text-white/40 sm:text-xs">
              {t.vs}
            </span>
            <span style={{ color: awayC }}>{awayName}</span>
          </p>

          <p className="mb-3 text-[10px] leading-relaxed text-white/50 sm:mb-4 sm:text-xs">
            {t.sub}
          </p>

          <label className="mb-3 flex cursor-pointer items-center gap-1.5 text-[10px] text-white/75 sm:mb-4 sm:text-xs sm:text-white/80">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="size-3 shrink-0 rounded border-white/30 bg-black/40 text-cyan-500 focus:ring-cyan-400/40 sm:size-3.5"
            />
            <span>{t.skip}</span>
          </label>

          <div className="flex w-full flex-col gap-1.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => onNo(dontShowAgain)}
              className="flex-1 rounded-lg border border-white/20 bg-transparent px-2.5 py-1.5 text-[10px] font-semibold text-white sm:px-3 sm:py-2 sm:text-xs"
            >
              {t.no}
            </button>
            <button
              type="button"
              onClick={() => onYes(dontShowAgain)}
              className="flex-1 rounded-lg border border-cyan-400/40 bg-cyan-400 px-2.5 py-1.5 text-[10px] font-bold text-black sm:px-3 sm:py-2 sm:text-xs"
            >
              {t.yes}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
