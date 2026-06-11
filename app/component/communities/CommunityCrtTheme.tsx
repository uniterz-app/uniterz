"use client";

import type { CSSProperties, ReactNode } from "react";
import { IBM_Plex_Mono } from "next/font/google";

export const communityCrtMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const CRT_CYAN_BORDER = "rgba(34,211,238,0.45)";
export const CRT_AMBER_BORDER = "rgba(251,191,36,0.35)";
export const CRT_CYAN_GLOW = "0 0 12px rgba(34,211,238,0.35)";
export const CRT_AMBER_GLOW = "0 0 8px rgba(251,191,36,0.4)";

export function CommunityCrtShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={`relative overflow-hidden ${communityCrtMono.className}`}
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, rgba(34,211,238,0.06) 0%, transparent 55%), #020408",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 50% 48%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.32]"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
        }}
        aria-hidden
      />
      <div className="relative z-30">{children}</div>
    </div>
  );
}

export function CommunityCrtSysLine({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[10px] tracking-[0.22em] sm:text-[11px]"
      style={{ color: "rgba(251,191,36,0.85)", textShadow: CRT_AMBER_GLOW }}
    >
      {children}
    </p>
  );
}

export function CommunityCrtSectionLabel({
  children,
  suffix,
  large = false,
}: {
  children: ReactNode;
  suffix?: string;
  large?: boolean;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <p
        className={[
          "tracking-[0.2em]",
          large ? "text-sm sm:text-base" : "text-xs sm:text-sm",
        ].join(" ")}
        style={{ color: "rgba(34,211,238,0.72)" }}
      >
        {children}
      </p>
      {suffix ? (
        <p
          className={[
            "font-mono tracking-wider text-cyan-200/45",
            large ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs",
          ].join(" ")}
        >
          {suffix}
        </p>
      ) : null}
    </div>
  );
}

export function communityCrtPanelStyle(tone: "cyan" | "amber" | "empty" | "subtle"): CSSProperties {
  if (tone === "amber") {
    return {
      borderColor: CRT_AMBER_BORDER,
      background: "rgba(6,12,8,0.95)",
      boxShadow: "inset 0 0 24px rgba(251,191,36,0.04)",
    };
  }
  if (tone === "empty") {
    return {
      borderColor: "rgba(34,211,238,0.22)",
      background: "rgba(4,10,16,0.75)",
      boxShadow: "inset 0 0 20px rgba(34,211,238,0.03)",
    };
  }
  if (tone === "subtle") {
    return {
      borderColor: "rgba(34,211,238,0.16)",
      background: "rgba(6,10,16,0.97)",
      boxShadow: "inset 0 0 16px rgba(0,0,0,0.22)",
    };
  }
  return {
    borderColor: "rgba(34,211,238,0.38)",
    background: "linear-gradient(170deg, rgba(12,22,34,0.98), rgba(4,8,14,1))",
    boxShadow: "inset 0 0 16px rgba(34,211,238,0.05)",
  };
}
