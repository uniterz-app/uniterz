"use client";

import type { LucideIcon } from "lucide-react";
import cn from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { CYBER_TAB_CYAN } from "@/app/component/rankings/CyberSlantedTab";

type Props = {
  onClick: () => void;
  /** Lucide アイコン（`iconSrc` と排他） */
  icon?: LucideIcon;
  /** カスタム画像アイコン（`/…` の public パス） */
  iconSrc?: string;
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
 * サイドメニュー行 — スキューチップ台座
 * （アイコン枠四角なし。ラベルは斜線の右側に余白を確保）
 */
export default function SideMenuItemButton({
  onClick,
  icon: Icon,
  iconSrc,
  iconSize = 18,
  children,
  trailing,
  dense = false,
  tone = "default",
  active = false,
  labelStyle,
  className,
}: Props) {
  const sz = dense ? Math.max(14, iconSize - 3) : Math.max(16, iconSize - 1);
  /** カスタム PNG は枠いっぱい近くまで拡大 */
  const imgSz = dense ? 28 : 32;
  const iconBox = iconSrc
    ? dense
      ? "h-8 w-8"
      : "h-9 w-9"
    : dense
      ? "h-6 w-6"
      : "h-7 w-7";
  const textSize = dense ? "text-sm" : "text-[15px]";
  const isDanger = tone === "danger";
  const accent = isDanger ? "#fb7185" : CYBER_TAB_CYAN;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cyber-side-menu-item group relative flex w-full touch-manipulation items-center border-y border-r pr-3",
        isDanger && "cyber-side-menu-item--danger",
        dense ? "min-h-8 py-1" : "min-h-9 py-1.5",
        active
          ? isDanger
            ? "cyber-side-menu-item--active border-rose-400/55 bg-rose-500/[0.1]"
            : "cyber-side-menu-item--active border-[rgba(0,245,255,0.75)]"
          : isDanger
            ? "border-white/10 bg-[#0a0e14]/95 hover:border-rose-400/38"
            : "border-[rgba(0,245,255,0.1)] hover:border-[rgba(0,245,255,0.4)]",
        "transition-[border-color,box-shadow,background-color] duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35",
        "active:brightness-[0.96]",
        className
      )}
      style={{
        boxShadow: active
          ? isDanger
            ? "0 0 22px rgba(251,113,133,0.16), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 0 30px rgba(0,245,255,0.26), inset 0 0 22px rgba(0,245,255,0.1), inset 0 0 0 1px rgba(0,245,255,0.2)"
          : "inset 0 1px 0 rgba(0,245,255,0.05)",
      }}
    >
      {!isDanger ? (
        <span
          className={cn(
            "cyber-side-menu-item__chip",
            active && "cyber-side-menu-item__chip--active"
          )}
          aria-hidden
        />
      ) : null}

      {/* チップ幅に合わせたアイコン列 */}
      <span className="relative z-[1] flex w-[48px] shrink-0 items-center justify-center pl-1">
        <span
          className={cn(
            "flex items-center justify-center border-0 bg-transparent",
            iconBox
          )}
        >
          {iconSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconSrc}
              alt=""
              width={imgSz}
              height={imgSz}
              className="shrink-0 object-contain"
              draggable={false}
            />
          ) : Icon ? (
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
          ) : null}
        </span>
      </span>

      {/* 斜線の右側から開始 */}
      <span
        className={cn(
          "relative z-[1] min-w-0 flex-1 truncate text-left font-bold leading-tight text-white pl-2.5",
          textSize
        )}
        style={{
          ...labelStyle,
          textShadow: active && !isDanger ? `0 0 18px ${accent}33` : undefined,
        }}
      >
        {children}
      </span>
      {active && !isDanger ? (
        <span
          aria-hidden
          className="cyber-side-menu-caret relative z-[1] shrink-0 pl-1 text-[10px] leading-none"
        >
          ▸
        </span>
      ) : null}
      {trailing ? <span className="relative z-[1] shrink-0 pl-1">{trailing}</span> : null}
    </button>
  );
}
