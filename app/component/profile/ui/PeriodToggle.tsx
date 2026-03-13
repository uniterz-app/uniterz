"use client";
import React from "react";
import { IBM_Plex_Sans } from "next/font/google";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

type Range = "7d" | "30d" | "all";

type Props = {
  value: Range;
  onChange: (v: Range) => void;
};

export default function PeriodToggle({ value, onChange }: Props) {
  const items: { key: Range; label: string }[] = [
    { key: "7d", label: "7日" },
    { key: "30d", label: "30日" },
    { key: "all", label: "ALL" },
  ];

  return (
    <div
      className={`${plex.className} flex items-center gap-4 text-[13px] font-semibold tracking-tight`}
    >
      {items.map((item) => {
        const active = value === item.key;

        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={[
              "transition-all duration-200",
              "px-3 py-1.5",
              active
                ? "rounded-md bg-white/10 text-white"
                : "text-white/50 hover:text-white/80",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}