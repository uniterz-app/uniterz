"use client";

import type { LucideIcon } from "lucide-react";
import cn from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { CYBER_TAB_CYAN } from "@/app/component/rankings/CyberSlantedTab";

type Props = {
  onClick: () => void;
  icon: LucideIcon;
  iconSize?: number;
  children: ReactNode;
  /** 右端（未読バッジなど） */
  trailing?: ReactNode;
  /** サポート行などコンパクト */
  dense?: boolean;
  tone?: "default" | "danger";
  /** 選択中（リーグ切替など） */
  active?: boolean;
  /** 試合カードラベルと同系のフォント（bracketMarketTeamTypography 等） */
  labelStyle?: CSSProperties;
  className?: string;
};

/**
 * ランキング HUD 系サイドメニュー行 — 角切り・走査線・選択時シアン枠グロー
 */
export default function SideMenuItemButton({
  onClick,
  icon: Icon,
  iconSize = 18,
  children,
  trailing,
  dense = false,
  tone = "default",
  active = false,
  labelStyle,
  className,
}: Props) {
  const sz = dense ? Math.max(14, iconSize - 2) : iconSize;
  const iconBox = dense ? "h-8 w-8" : "h-9 w-9";
  const textSize = dense ? "text-xs" : "text-sm";
  const isDanger = tone === "danger";
  const accent = isDanger ? "#fb7185" : CYBER_TAB_CYAN;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cyber-side-menu-item group relative flex w-full touch-manipulation items-center gap-3 border px-3",
        dense ? "min-h-10 py-2" : "min-h-12 py-2.5",
        active
          ? isDanger
            ? "cyber-side-menu-item--active border-rose-400/55 bg-rose-500/[0.1]"
            : "cyber-side-menu-item--active border-[rgba(0,245,255,0.45)] bg-[rgba(0,245,255,0.07)]"
          : isDanger
            ? "border-white/10 bg-[#0a0e14]/95 hover:border-rose-400/38"
            : "border-white/10 bg-[#0a0e14]/95 hover:border-[rgba(0,245,255,0.28)]",
        "transition-[border-color,box-shadow,background-color] duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35",
        "active:brightness-[0.96]",
        className
      )}
      style={{
        boxShadow: active
          ? isDanger
            ? "0 0 22px rgba(251,113,133,0.16), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 0 24px rgba(0,245,255,0.16), inset 0 0 0 1px rgba(0,245,255,0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
          : undefined,
      }}
    >
      {!isDanger ? (
        <>
          <span className="cyber-side-menu-item__rail" aria-hidden />
          <span
            className="cyber-side-menu-item__corner left-0 top-0 border-l-2 border-t-2"
            aria-hidden
          />
          <span
            className="cyber-side-menu-item__corner right-0 bottom-0 border-b-2 border-r-2"
            aria-hidden
          />
        </>
      ) : null}

      {active && !isDanger ? (
        <span className="cyber-side-menu-item__scan" aria-hidden />
      ) : null}

      <span
        className={cn(
          "relative z-[1] flex shrink-0 items-center justify-center border bg-white/[0.04]",
          iconBox,
          active && !isDanger && "border-[rgba(0,245,255,0.35)] bg-[rgba(0,245,255,0.1)]",
          active && isDanger && "border-rose-400/35 bg-rose-500/[0.14]",
          !active && "border-white/10"
        )}
        style={{
          clipPath:
            "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)",
        }}
      >
        <Icon
          size={sz}
          className={cn("shrink-0")}
          style={{
            color: isDanger
              ? "rgba(251,180,188,0.95)"
              : active
                ? CYBER_TAB_CYAN
                : "rgba(0,245,255,0.78)",
          }}
          strokeWidth={2}
        />
      </span>
      <span
        className={cn(
          "relative z-[1] min-w-0 flex-1 truncate text-left font-bold leading-tight text-white",
          textSize
        )}
        style={{
          ...labelStyle,
          textShadow: active && !isDanger ? `0 0 18px ${accent}33` : undefined,
        }}
      >
        {children}
      </span>
      {trailing ? <span className="relative z-[1] shrink-0">{trailing}</span> : null}
    </button>
  );
}
