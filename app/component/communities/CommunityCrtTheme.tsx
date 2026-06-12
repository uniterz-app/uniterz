"use client";

import type { CSSProperties, ReactNode } from "react";
import { IBM_Plex_Mono } from "next/font/google";
import { WEB_LIST_CARD_PANEL } from "@/lib/games/mobileListCardLayout";

export const communityCrtMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const CRT_CYAN_BORDER = "rgba(34,211,238,0.45)";
export const CRT_AMBER_BORDER = "rgba(251,191,36,0.35)";
export const CRT_CYAN_GLOW = "0 0 12px rgba(34,211,238,0.35)";
export const CRT_AMBER_GLOW = "0 0 8px rgba(251,191,36,0.4)";

/** スロットカード共通（試合一覧カードと同系統の透過ガラス） */
export const COMMUNITY_SLOT_GLASS =
  "border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_42%,rgba(255,255,255,0.012)_100%),linear-gradient(180deg,rgba(8,8,8,0.14)_0%,rgba(8,8,8,0.14)_100%)] backdrop-blur-xl shadow-[0_10px_28px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.1)]";

/** ガラス面のハイライト */
export function CommunityGlassSheen({ tone = "cyan" }: { tone?: "cyan" | "amber" }) {
  const edge =
    tone === "amber"
      ? "rgba(251,191,36,0.3)"
      : "rgba(34,211,238,0.35)";
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 24%, transparent 50%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${edge}, transparent)`,
        }}
      />
    </>
  );
}

/** 埋まったスロットのみ — 控えめな HUD コーナー */
export function CommunityGlassCorners({ tone = "cyan" }: { tone?: "cyan" | "amber" }) {
  const color =
    tone === "amber" ? "rgba(251,191,36,0.32)" : "rgba(34,211,238,0.34)";
  const corner = (pos: "tl" | "tr" | "bl" | "br") => {
    const base = "pointer-events-none absolute z-[8] h-2.5 w-2.5";
    if (pos === "tl") return `${base} left-2.5 top-2.5 border-l border-t`;
    if (pos === "tr") return `${base} right-2.5 top-2.5 border-r border-t`;
    if (pos === "bl") return `${base} bottom-2.5 left-2.5 border-b border-l`;
    return `${base} bottom-2.5 right-2.5 border-b border-r`;
  };
  return (
    <>
      {(["tl", "tr", "bl", "br"] as const).map((pos) => (
        <span
          key={pos}
          className={corner(pos)}
          style={{ borderColor: color }}
          aria-hidden
        />
      ))}
    </>
  );
}

/**
 * ページ背景に直接載せるレイアウト。
 * 外枠ボックスは使わず、オーロラに溶け込むアンビエントのみ。
 */
export function CommunitySlotPage({ children }: { children: ReactNode }) {
  return (
    <div className={`relative ${communityCrtMono.className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 h-44"
        style={{
          background:
            "radial-gradient(ellipse 95% 75% at 50% 0%, rgba(34,211,238,0.065), transparent 72%)",
        }}
      />
      <div className="relative space-y-7">{children}</div>
    </div>
  );
}

/** セクション単位の薄い光彩（背景との中間層） */
export function CommunitySlotSection({
  children,
  accent = "cyan",
}: {
  children: ReactNode;
  accent?: "cyan" | "amber";
}) {
  const glow =
    accent === "amber"
      ? "radial-gradient(ellipse 90% 60% at 50% 15%, rgba(251,191,36,0.04), transparent 70%)"
      : "radial-gradient(ellipse 90% 60% at 50% 15%, rgba(34,211,238,0.05), transparent 70%)";
  return (
    <section className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-2 -top-3 bottom-0 -z-10"
        style={{ background: glow }}
      />
      {children}
    </section>
  );
}

/** @deprecated CommunitySlotPage を使用 */
export function CommunityCrtShell({ children }: { children: ReactNode }) {
  return <CommunitySlotPage>{children}</CommunitySlotPage>;
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
  const textCls = large ? "text-sm sm:text-base" : "text-xs sm:text-sm";
  const suffixCls = large ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs";

  return (
    <div className="mb-3 flex items-center gap-3">
      <span
        aria-hidden
        className="h-px min-w-[1.25rem] flex-1"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.28), rgba(34,211,238,0.08))",
        }}
      />
      <div className="flex shrink-0 items-center gap-2">
        <p
          className={["tracking-[0.2em]", textCls].join(" ")}
          style={{
            color: "rgba(186,230,253,0.86)",
            textShadow: "0 0 10px rgba(34,211,238,0.28)",
          }}
        >
          {children}
        </p>
        {suffix ? (
          <p
            className={[
              "rounded border border-cyan-400/18 bg-cyan-500/[0.04] px-1.5 py-px font-mono tabular-nums tracking-wider text-cyan-200/50 backdrop-blur-sm",
              suffixCls,
            ].join(" ")}
          >
            {suffix}
          </p>
        ) : null}
      </div>
      <span
        aria-hidden
        className="h-px min-w-[1.25rem] flex-1"
        style={{
          background:
            "linear-gradient(270deg, transparent, rgba(34,211,238,0.28), rgba(34,211,238,0.08))",
        }}
      />
    </div>
  );
}

export function communityCrtPanelClass(tone: "cyan" | "amber" | "empty" | "subtle") {
  const base =
    "relative overflow-hidden rounded-2xl transition-[border-color,box-shadow,background] duration-200";

  if (tone === "cyan") {
    return [
      base,
      COMMUNITY_SLOT_GLASS,
      "hover:border-cyan-300/28 hover:shadow-[0_12px_32px_rgba(0,0,0,0.38),0_0_28px_rgba(34,211,238,0.09)]",
    ].join(" ");
  }
  if (tone === "empty") {
    return [
      base,
      "border border-dashed border-cyan-400/20 bg-white/[0.012] backdrop-blur-xl",
      "shadow-[0_6px_20px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]",
      "hover:border-cyan-400/32 hover:bg-cyan-400/[0.025]",
    ].join(" ");
  }
  if (tone === "amber") {
    return [
      base,
      "border border-amber-400/26 backdrop-blur-xl",
      "bg-[linear-gradient(165deg,rgba(251,191,36,0.05)_0%,rgba(8,8,8,0.12)_100%)]",
      "shadow-[0_6px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(251,191,36,0.1)]",
      "hover:border-amber-400/38",
    ].join(" ");
  }
  return [base, WEB_LIST_CARD_PANEL].join(" ");
}

export function communityCrtPanelStyle(
  tone: "cyan" | "amber" | "empty" | "subtle"
): CSSProperties {
  if (tone === "subtle") {
    return {
      borderColor: "rgba(34,211,238,0.2)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
    };
  }
  if (tone === "amber") {
    return {
      borderColor: CRT_AMBER_BORDER,
    };
  }
  if (tone === "empty") {
    return {};
  }
  return {
    borderColor: "rgba(34,211,238,0.28)",
  };
}
