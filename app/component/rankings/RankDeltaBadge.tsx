"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { nameBebas } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  delta?: number | null;
  /** 自分カードの順位タワーは lg */
  size?: "sm" | "md" | "lg";
  /** tower = MyRankCard 順位横（Bebas・順位数字に合わせる） */
  variant?: "default" | "tower";
  language?: Language;
};

const SIZE_STYLES = {
  sm: {
    wrap: "gap-0.5",
    icon: "h-2.5 w-2.5",
    text: "text-[10px]",
  },
  md: {
    wrap: "gap-0.5",
    icon: "h-3.5 w-3.5",
    text: "text-[12px]",
  },
  lg: {
    wrap: "gap-1",
    icon: "h-[18px] w-[18px]",
    text: "text-[14px]",
  },
} as const;

const TOWER_SIZE = {
  sm: { fontSize: "1.2rem", icon: "h-3 w-3", gap: "gap-0.5" },
  md: { fontSize: "1.45rem", icon: "h-3.5 w-3.5", gap: "gap-0.5" },
  lg: { fontSize: "1.65rem", icon: "h-4 w-4", gap: "gap-1" },
} as const;

export function RankDeltaBadge({
  delta,
  size = "sm",
  variant = "default",
  language = "ja",
}: Props) {
  if (typeof delta !== "number" || !Number.isFinite(delta)) {
    return null;
  }

  const m = t(language).rankings;
  const s = SIZE_STYLES[size];
  const tower = TOWER_SIZE[size];
  const isTower = variant === "tower";

  const wrapClass = isTower ? tower.gap : s.wrap;
  const iconClass = isTower ? tower.icon : s.icon;
  const textClass = isTower ? nameBebas.className : s.text;

  const towerStyle = isTower
    ? {
        fontSize: tower.fontSize,
        transform: "skewX(-10deg)",
        display: "inline-flex" as const,
        letterSpacing: "0.04em",
      }
    : undefined;

  if (delta === 0) {
    return (
      <span
        className={[
          "inline-flex items-center tabular-nums leading-none",
          isTower ? "font-normal text-white/45" : "font-bold text-white/45",
          wrapClass,
          textClass,
        ].join(" ")}
        style={towerStyle}
        aria-label={m.rankUnchanged}
        title={m.rankUnchanged}
      >
        <Minus className={iconClass} strokeWidth={2.5} aria-hidden />
        <span>0</span>
      </span>
    );
  }

  const up = delta > 0;
  const amount = Math.abs(Math.trunc(delta));
  const Icon = up ? ArrowUp : ArrowDown;
  const aria = up
    ? m.rankUpAria.replace("{n}", String(amount))
    : m.rankDownAria.replace("{n}", String(amount));

  return (
    <span
      className={[
        "inline-flex items-center tabular-nums leading-none",
        isTower ? "font-normal" : "font-extrabold",
        wrapClass,
        textClass,
        up ? "text-emerald-400" : "text-orange-400",
      ].join(" ")}
      style={towerStyle}
      aria-label={aria}
      title={aria}
    >
      <Icon className={iconClass} strokeWidth={2.75} aria-hidden />
      {amount}
    </span>
  );
}
