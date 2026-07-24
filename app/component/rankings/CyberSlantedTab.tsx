"use client";

/**
 * 斜めタブのデザインは固定（変更しない）:
 * - 選択: アクセント塗りつぶし + 黒文字 + スキャン横線
 * - 非選択: 透明 + アクセント枠 + アクセント文字
 */
import { createContext, useContext, type ReactNode } from "react";
import { nameOxanium } from "@/lib/fonts";
import {
  hasJaScript,
  rankingFontSizePx,
} from "@/lib/rankings/rankingJaTextSize";

export const CYBER_TAB_CYAN = "#00F5FF";

export type CyberSlantedTabTheme = {
  accent: string;
  inactiveText?: string;
  activeText?: string;
  activeShadow?: string;
  inactiveBorder?: string;
};

const DEFAULT_TAB_THEME: CyberSlantedTabTheme = {
  accent: CYBER_TAB_CYAN,
  inactiveText: CYBER_TAB_CYAN,
  activeText: "#050508",
  /** skew 後に乗るので平行四辺形に沿って光る */
  activeShadow:
    "0 0 10px rgba(0,245,255,0.55), 0 0 22px rgba(0,245,255,0.28)",
};

const CyberSlantedTabFillContext = createContext(false);

type CyberSlantedTabProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
  fontWeight?: number;
  theme?: CyberSlantedTabTheme;
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
  theme = DEFAULT_TAB_THEME,
  role,
  "aria-selected": ariaSelected,
  badge,
}: CyberSlantedTabProps) {
  const fill = useContext(CyberSlantedTabFillContext);
  const jaLabel = hasJaScript(label);
  const fontSize = rankingFontSizePx(compact ? 9 : 10, label);
  const inactiveText = theme.inactiveText ?? theme.accent;
  const activeText = theme.activeText ?? "#050508";
  const activeShadow =
    theme.activeShadow ??
    "0 0 10px rgba(0,245,255,0.55), 0 0 22px rgba(0,245,255,0.28)";
  const inactiveBorder = theme.inactiveBorder ?? theme.accent;

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
        color: active ? activeText : inactiveText,
        background: active ? theme.accent : "transparent",
        border: active ? "none" : `1px solid ${inactiveBorder}`,
        boxShadow: active ? activeShadow : "none",
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
