"use client";

import { Minus } from "lucide-react";
import {
  CyberRankNumber,
  CyberScanlineText,
} from "@/app/component/rankings/CyberRankingListParts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameBebas, nameOxanium } from "@/lib/fonts";

const DELTA_CHAMFER_CLIP = `polygon(
  0 0,
  100% 0,
  100% calc(100% - 12px),
  calc(100% - 12px) 100%,
  0 100%
)`;

type ShiftState = "up" | "down" | "flat";

const SHIFT_THEME: Record<
  ShiftState,
  {
    accent: string;
    panelBg: string;
    panelFg: string;
    panelBorder: string;
    panelGlow: string;
  }
> = {
  up: {
    accent: "#3ecf7a",
    panelBg: "rgba(14, 34, 24, 0.96)",
    panelFg: "#8ef0b8",
    panelBorder: "rgba(57, 255, 136, 0.34)",
    panelGlow:
      "inset 0 0 0 1px rgba(57,255,136,0.1), 0 0 14px rgba(57,255,136,0.06)",
  },
  down: {
    accent: "#c848c8",
    panelBg: "rgba(28, 8, 28, 0.96)",
    panelFg: "#f0a8f0",
    panelBorder: "rgba(255, 0, 255, 0.32)",
    panelGlow:
      "inset 0 0 0 1px rgba(255,0,255,0.08), 0 0 14px rgba(255,0,255,0.06)",
  },
  flat: {
    accent: "rgba(255,255,255,0.3)",
    panelBg: "rgba(255,255,255,0.07)",
    panelFg: "rgba(255,255,255,0.78)",
    panelBorder: "rgba(255,255,255,0.14)",
    panelGlow: "none",
  },
};

type Props = {
  currentRank: number;
  priorRank: number;
  language?: Language;
};

function resolveShift(priorRank: number, currentRank: number): {
  state: ShiftState;
  magnitude: number;
} {
  const delta = priorRank - currentRank;
  if (delta > 0) return { state: "up", magnitude: delta };
  if (delta < 0) return { state: "down", magnitude: Math.abs(delta) };
  return { state: "flat", magnitude: 0 };
}

export default function RankShadowWeeklyShift({
  currentRank,
  priorRank,
  language = "ja",
}: Props) {
  const s = t(language).rankings.rankShadow;
  const { state, magnitude } = resolveShift(priorRank, currentRank);
  const theme = SHIFT_THEME[state];
  const deltaLabel =
    state === "up"
      ? s.weeklyShiftRankUp
      : state === "down"
        ? s.weeklyShiftRankDown
        : s.weeklyShiftNoChange;
  const magnitudeText = String(magnitude).padStart(2, "0");

  return (
    <div className="mt-4 grid grid-cols-[1fr_0.92fr] overflow-hidden rounded-sm">
      <div
        className="relative flex min-h-[5.5rem] flex-col justify-center border border-r-0 px-3 py-3 sm:min-h-[6rem] sm:px-4"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          backgroundColor: "#050508",
        }}
      >
        <span
          className="absolute top-0 bottom-0 left-0 w-[3px]"
          style={{ backgroundColor: theme.accent }}
          aria-hidden
        />
        <p
          className={[
            nameOxanium.className,
            "text-[8px] font-bold uppercase tracking-[0.18em] sm:text-[9px]",
          ].join(" ")}
          style={{ color: "rgba(255,255,255,0.42)" }}
        >
          {s.weeklyShiftCurrentLabel}
        </p>
        <div className="mt-1.5 origin-left scale-[0.88] sm:scale-[0.95]">
          <CyberRankNumber
            rank={currentRank}
            compact={false}
            displayValue={`#${currentRank}`}
          />
        </div>
      </div>

      <div
        className="relative flex min-h-[5.5rem] flex-col justify-between px-3 py-2.5 sm:min-h-[6rem] sm:px-3.5 sm:py-3"
        style={{
          clipPath: DELTA_CHAMFER_CLIP,
          WebkitClipPath: DELTA_CHAMFER_CLIP,
          backgroundColor: theme.panelBg,
          color: theme.panelFg,
          border: `1px solid ${theme.panelBorder}`,
          boxShadow: theme.panelGlow,
        }}
      >
        <p
          className={[
            nameOxanium.className,
            "text-[8px] font-bold uppercase tracking-[0.16em] sm:text-[9px]",
          ].join(" ")}
        >
          {deltaLabel}
        </p>

        <div className="flex items-center justify-center gap-2">
          {state === "up" ? (
            <span
              className="text-lg leading-none sm:text-xl"
              style={{ color: theme.panelFg }}
              aria-hidden
            >
              ▲
            </span>
          ) : state === "down" ? (
            <span
              className="text-lg leading-none sm:text-xl"
              style={{ color: theme.panelFg }}
              aria-hidden
            >
              ▼
            </span>
          ) : (
            <Minus className="h-4 w-4 shrink-0 stroke-[3]" aria-hidden />
          )}
          <CyberScanlineText subtle={state === "flat"}>
            <span
              className={[nameBebas.className, "block tabular-nums leading-none"].join(
                " "
              )}
              style={{
                fontSize: state === "flat" ? "2.35rem" : "2.75rem",
                transform: "skewX(-12deg)",
                display: "inline-block",
                color: theme.panelFg,
                letterSpacing: "0.05em",
              }}
            >
              {magnitudeText}
            </span>
          </CyberScanlineText>
        </div>

        <p
          className={[
            nameOxanium.className,
            "text-[8px] font-bold uppercase tracking-[0.16em] sm:text-[9px]",
          ].join(" ")}
        >
          {s.weeklyShiftFooter}
        </p>
      </div>
    </div>
  );
}
