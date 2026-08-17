"use client";

/**
 * Native 各面の空状態 `NO DATA` 相当。
 * Games / Results / Rankings はページ中央の大見出し、チャートは小さめ Oxanium。
 */
import type { CSSProperties, ReactNode } from "react";
import { nameBebas, nameOxanium } from "@/lib/fonts";

export type CyberNoDataVariant =
  | "games"
  | "results"
  | "rankings"
  | "rankingsPro"
  | "chart"
  | "progress"
  | "awards"
  | "bracket";

const LABEL_CLASS: Record<CyberNoDataVariant, string> = {
  games: `${nameBebas.className} text-center text-[36px] leading-none tracking-[0.25em] text-[#5c5c5c]`,
  results: `${nameBebas.className} text-center text-[36px] leading-none tracking-[0.22em] text-white/[0.92]`,
  rankings: `${nameBebas.className} text-center text-[28px] leading-none tracking-[0.25em] text-[rgba(248,250,252,0.35)]`,
  rankingsPro: `${nameBebas.className} rankings-pro-league-no-data text-center text-[28px] leading-none tracking-[0.25em]`,
  chart: `${nameOxanium.className} text-center text-[22px] font-bold leading-none tracking-[0.12em] text-white/35`,
  progress: `${nameBebas.className} text-center text-[16px] leading-none tracking-[0.12em] text-[rgba(148,163,184,0.55)]`,
  awards: `${nameBebas.className} text-center text-[36px] leading-none tracking-[0.25em] text-white/55`,
  bracket: `${nameBebas.className} text-center text-[32px] font-bold leading-none tracking-[0.25em] text-cyan-300/55`,
};

const LABEL_STYLE: Partial<Record<CyberNoDataVariant, CSSProperties>> = {
  results: { textShadow: "0 0 16px rgba(34,211,238,0.35)" },
};

const PAGE_WRAP: Record<"games" | "results" | "rankings", string> = {
  games:
    "flex min-h-[420px] w-full items-center justify-center px-4 py-12",
  results:
    "flex min-h-[420px] w-full items-center justify-center px-4 py-12",
  rankings: "flex min-h-[220px] w-full items-center justify-center px-4",
};

export function CyberNoDataLabel({
  variant,
  className = "",
}: {
  variant: CyberNoDataVariant;
  className?: string;
}) {
  return (
    <p
      className={[LABEL_CLASS[variant], className].filter(Boolean).join(" ")}
      style={LABEL_STYLE[variant]}
    >
      NO DATA
    </p>
  );
}

/** Games / Results / Rankings のページ中央空状態 */
export function CyberNoDataPage({
  variant,
  className = "",
  "aria-label": ariaLabel,
  children,
}: {
  variant: "games" | "results" | "rankings" | "rankingsPro";
  className?: string;
  "aria-label"?: string;
  children?: ReactNode;
}) {
  const wrapKey = variant === "rankingsPro" ? "rankings" : variant;
  const labelVariant = variant === "rankingsPro" ? "rankingsPro" : variant;
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={[PAGE_WRAP[wrapKey], className].filter(Boolean).join(" ")}
    >
      <CyberNoDataLabel variant={labelVariant} />
      {children}
    </div>
  );
}
