"use client";

import { createContext, useContext, type ReactNode } from "react";
import { nameOxanium } from "@/lib/fonts";
import {
  hasJaScript,
  rankingFontSizePx,
} from "@/lib/rankings/rankingJaTextSize";

export const CYBER_TAB_CYAN = "#00F5FF";

const CyberSlantedTabFillContext = createContext(false);

type CyberSlantedTabProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
  fontWeight?: number;
  /** role="tab" 用 */
  role?: "tab";
  "aria-selected"?: boolean;
  /** タブ内右上に表示する装飾バッジ（例: 未入力アラートの ! ） */
  badge?: ReactNode;
};

export function CyberSlantedTab({
  label,
  active,
  onClick,
  compact = false,
  fontWeight = 700,
  role,
  "aria-selected": ariaSelected,
  badge,
}: CyberSlantedTabProps) {
  const fill = useContext(CyberSlantedTabFillContext);
  const jaLabel = hasJaScript(label);
  const fontSize = rankingFontSizePx(compact ? 9 : 10, label);

  return (
    <button
      type="button"
      role={role}
      aria-selected={ariaSelected ?? (role === "tab" ? active : undefined)}
      onClick={onClick}
      className={[
        "cyber-slanted-tab relative transition-[color,background,box-shadow,border-color] duration-200",
        fill ? "min-w-0 flex-1 basis-0" : "shrink-0",
        nameOxanium.className,
        fill
          ? compact
            ? "px-1.5 py-1.5"
            : "px-2 py-2"
          : compact
            ? "px-3.5 py-1.5"
            : "px-5 py-2",
      ].join(" ")}
      style={{
        transform: "skewX(-14deg)",
        fontSize,
        fontWeight,
        letterSpacing: jaLabel ? "0.06em" : "0.14em",
        color: active ? "#050508" : CYBER_TAB_CYAN,
        background: active ? CYBER_TAB_CYAN : "transparent",
        border: active ? "none" : `1px solid ${CYBER_TAB_CYAN}`,
        boxShadow: active ? "0 0 18px rgba(0,245,255,0.45)" : "none",
      }}
    >
      {active ? (
        <span aria-hidden className="cyber-slanted-tab__scan pointer-events-none" />
      ) : null}
      <span
        className={[
          "relative z-1 flex items-center justify-center gap-1",
          fill ? "w-full" : "",
        ].join(" ")}
        style={{ transform: "skewX(14deg)" }}
      >
        <span className={[fill ? "truncate" : "", jaLabel ? "" : "uppercase"].join(" ")}>
          {label}
        </span>
        {badge ? (
          <span className="pointer-events-none shrink-0">{badge}</span>
        ) : null}
      </span>
    </button>
  );
}

export function CyberSlantedTabBar({
  children,
  className = "",
  fill = false,
  gridColumns,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  /** 子タブを均等幅で横いっぱいに並べる */
  fill?: boolean;
  /** 指標が多いランキング用。例: WC の 6 指標を 3×2 にする */
  gridColumns?: 3;
  "aria-label"?: string;
}) {
  const layoutClass =
    gridColumns === 3
      ? "grid w-full grid-cols-3 gap-x-2 gap-y-2 pb-1"
      : [
          "flex gap-2 pb-1",
          fill
            ? "w-full"
            : "overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        ].join(" ");

  return (
    <CyberSlantedTabFillContext.Provider value={fill}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={[
          layoutClass,
          className,
        ].join(" ")}
      >
        {children}
      </div>
    </CyberSlantedTabFillContext.Provider>
  );
}
