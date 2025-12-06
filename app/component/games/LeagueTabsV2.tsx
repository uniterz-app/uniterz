"use client";
import React from "react";

export type LeagueV2 = "nba" | "bj";

type Props = {
  value: LeagueV2;
  onChange: (v: LeagueV2) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "text-xs px-2 py-1 rounded-md",
  md: "text-sm px-3 py-1.5 rounded-lg",
  lg: "text-base px-4 py-2 rounded-xl",
} as const;

export default function LeagueTabsV2({
  value,
  onChange,
  className,
  size = "md",
}: Props) {
  const items: Array<{ v: LeagueV2; label: string }> = [
    { v: "nba", label: "NBA" },
    { v: "bj", label: "B.LEAGUE" },
  ];

  return (
    <div className={`flex gap-2 ${className ?? ""}`}>
      {items.map((it) => {
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
