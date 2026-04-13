"use client";
import React from "react";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";

export type Tab = "overview" | "stats" | "bracket";

const sizeMap = {
  sm: "text-sm pb-2 tracking-[0.06em]",
  md: "text-[15px] pb-3 tracking-[0.06em]",
  lg: "text-[18px] pb-4 tracking-[0.06em]",
} as const;

type Props = {
  value: Tab;
  onChange: (v: Tab) => void;
  showStats?: boolean;
  size?: keyof typeof sizeMap;
};

export default function Tabs({
  value,
  onChange,
  showStats = true,
  size = "md",
}: Props) {
  const teamNameFont = bracketMarketTeamTypography(size !== "lg");
  const items: Tab[] = showStats
    ? ["overview", "stats", "bracket"]
    : ["overview", "bracket"];

  const labelMap: Record<Tab, string> = {
    overview: "Overview",
    stats: "Pro Stats",
    bracket: "Bracket",
  };

  return (
    <div
      className={[
        "flex gap-8 border-b border-white/10",
      ].join(" ")}
      style={teamNameFont}
    >
      {items.map((t) => {
        const active = value === t;

        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={[
              "relative font-medium transition-colors",
              sizeMap[size],
              active
                ? "text-white"
                : "text-white/50 hover:text-white/80",
            ].join(" ")}
          >
            {labelMap[t]}

            {active && (
              <span
                className="
                  absolute left-0 -bottom-px
                  h-[2px] w-full
                  bg-[#6EA8FE]
                  rounded-full
                "
              />
            )}
          </button>
        );
      })}
    </div>
  );
}