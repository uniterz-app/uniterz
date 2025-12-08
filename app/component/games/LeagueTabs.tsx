"use client";
import React from "react";
import type { League } from "@/lib/leagues";  // ← これが重要

type Props = {
  value: League;                // ← LeagueV2 → League に変更
  onChange: (v: League) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "text-xs px-2 py-1 rounded-md",
  md: "text-sm px-3 py-1.5 rounded-lg",
  lg: "text-base px-4 py-2 rounded-xl",
} as const;

/**
 * UI に表示するリーグだけを制御。
 * League 型は拡張しても、ここを増やすだけで OK。
 */
const DISPLAY_ITEMS: Array<{ v: League; label: string }> = [
  { v: "nba", label: "NBA" },
  { v: "bj", label: "B.LEAGUE" },
  // ← 将来 J1 を表示するなら追加：{ v: "j", label: "J1" }
];

export default function LeagueTabsV2({
  value,
  onChange,
  className,
  size = "md",
}: Props) {
  return (
    <div className={`flex gap-2 ${className ?? ""}`}>
      {DISPLAY_ITEMS.map((it) => {
        const active = it.v === value;
        return (
          <button
            key={it.v}
            onClick={() => onChange(it.v)}
            className={[
              sizeMap[size],
              "border transition-colors",
              active
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-white/10 text-white/80 hover:bg-white/5",
            ].join(" ")}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

