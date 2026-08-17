"use client";

import type { CSSProperties, ReactNode } from "react";
import { IBM_Plex_Mono } from "next/font/google";
import { MATCH_LIST_CYBER_CARD_CLASS } from "@/lib/ui/matchListCardCyber";
import { RANKINGS_CARD_NOTCH_CLIP } from "@/lib/rankings/rankingsCyberTheme";

export const communityCrtMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const CRT_CYAN = "#00F5FF";
export const CRT_CYAN_BORDER = "rgba(0,245,255,0.45)";
export const CRT_AMBER_BORDER = "rgba(251,191,36,0.35)";
export const CRT_CYAN_GLOW = "0 0 12px rgba(0,245,255,0.35)";
export const CRT_AMBER_GLOW = "0 0 8px rgba(251,191,36,0.4)";

/** グループ系モーダル共通シェル */
export const COMMUNITY_MODAL_CARD_CLASS =
  "relative isolate overflow-hidden rounded-none border border-[rgba(0,245,255,0.22)] bg-[#050b14] shadow-[0_18px_44px_rgba(0,0,0,0.55)]";

const HUD_CARD =
  "border border-[rgba(0,245,255,0.16)] bg-[linear-gradient(168deg,rgba(9,13,20,0.95)_0%,rgba(6,9,15,0.93)_52%,rgba(4,7,12,0.91)_100%)] shadow-[0_0_22px_rgba(0,245,255,0.05),0_12px_32px_rgba(0,0,0,0.44),inset_0_1px_0_rgba(0,245,255,0.12)]";

/** スロットカード共通（試合一覧カードと同系統の HUD） */
export const COMMUNITY_SLOT_GLASS = HUD_CARD;

/** @deprecated ガラス面は使わない。互換のため空 */
export function CommunityGlassSheen(_props: { tone?: "cyan" | "amber" }) {
  return null;
}

/** 埋まったスロットのみ — 控えめな HUD コーナー */
export function CommunityGlassCorners({ tone = "cyan" }: { tone?: "cyan" | "amber" }) {
  const color =
    tone === "amber" ? "rgba(251,191,36,0.32)" : "rgba(0,245,255,0.34)";
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
            "radial-gradient(ellipse 95% 75% at 50% 0%, rgba(0,245,255,0.065), transparent 72%)",
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
      : "radial-gradient(ellipse 90% 60% at 50% 15%, rgba(0,245,255,0.05), transparent 70%)";
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
  accent = "cyan",
}: {
  children: ReactNode;
  suffix?: string;
  large?: boolean;
  accent?: "cyan" | "amber";
}) {
  const textCls = large ? "text-[11px] sm:text-xs" : "text-[10px] sm:text-[11px]";
  const suffixCls = large ? "text-[10px] sm:text-[11px]" : "text-[9px] sm:text-[10px]";
  const isAmber = accent === "amber";

  return (
    <div className="mb-3 flex items-center gap-2">
      <span
        aria-hidden
        className="h-[5px] w-[5px] shrink-0 rotate-45"
        style={{
          background: isAmber ? "rgba(251,191,36,0.85)" : "rgba(0,245,255,0.85)",
          boxShadow: isAmber
            ? "0 0 6px rgba(251,191,36,0.9)"
            : "0 0 6px rgba(0,245,255,0.9)",
        }}
      />
      <p
        className={["shrink-0 font-bold uppercase tracking-[0.24em]", textCls].join(
          " "
        )}
        style={{
          color: isAmber ? "rgba(253,230,138,0.88)" : "rgba(165,243,252,0.7)",
          textShadow: isAmber
            ? "0 0 10px rgba(251,191,36,0.32)"
            : "0 0 10px rgba(0,245,255,0.28)",
        }}
      >
        {children}
      </p>
      {suffix ? (
        <p
          className={[
            "rounded-none border px-1.5 py-px font-mono tabular-nums tracking-wider",
            suffixCls,
          ].join(" ")}
          style={{
            borderColor: isAmber
              ? "rgba(251,191,36,0.22)"
              : "rgba(0,245,255,0.18)",
            background: isAmber
              ? "rgba(245,158,11,0.06)"
              : "rgba(0,245,255,0.04)",
            color: isAmber
              ? "rgba(253,230,138,0.55)"
              : "rgba(165,243,252,0.5)",
          }}
        >
          {suffix}
        </p>
      ) : null}
    </div>
  );
}

export function communityCrtPanelClass(tone: "cyan" | "amber" | "empty" | "subtle") {
  const base =
    "relative overflow-hidden rounded-none transition-[border-color,box-shadow,background] duration-200";

  if (tone === "cyan") {
    return [
      base,
      MATCH_LIST_CYBER_CARD_CLASS,
      "hover:border-[rgba(0,245,255,0.32)]",
    ].join(" ");
  }
  if (tone === "empty") {
    return [
      base,
      "border border-dashed border-[rgba(0,245,255,0.22)] bg-[rgba(0,245,255,0.02)]",
      "hover:border-[rgba(0,245,255,0.4)] hover:bg-[rgba(0,245,255,0.04)]",
    ].join(" ");
  }
  if (tone === "amber") {
    return [
      base,
      "border border-amber-400/26",
      "bg-[linear-gradient(165deg,rgba(251,191,36,0.05)_0%,rgba(8,8,8,0.12)_100%)]",
      "shadow-[0_6px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(251,191,36,0.1)]",
      "hover:border-amber-400/38",
    ].join(" ");
  }
  return [base, HUD_CARD].join(" ");
}

export function communityCrtPanelStyle(
  tone: "cyan" | "amber" | "empty" | "subtle"
): CSSProperties {
  const notch = {
    clipPath: RANKINGS_CARD_NOTCH_CLIP,
    WebkitClipPath: RANKINGS_CARD_NOTCH_CLIP,
  };
  if (tone === "subtle") {
    return {
      borderColor: "rgba(0,245,255,0.22)",
      background:
        "linear-gradient(168deg, rgba(9,13,20,0.97) 0%, rgba(5,8,14,0.96) 100%)",
      ...notch,
    };
  }
  if (tone === "amber") {
    return {
      borderColor: CRT_AMBER_BORDER,
      ...notch,
    };
  }
  if (tone === "empty") {
    return { ...notch };
  }
  return {
    borderColor: "rgba(0,245,255,0.28)",
    ...notch,
  };
}
