"use client";
import React from "react";
import { Lilita_One } from "next/font/google";

const lilita = Lilita_One({ weight: "400", subsets: ["latin"] });

const sizeMap = {
  sm: "text-xs px-2 py-1 rounded-md",
  md: "text-sm px-4 py-3 rounded-lg",
  lg: "text-base px-5 py-4 rounded-xl",
} as const;

type Range = "7d" | "30d" | "all";

type Props = {
  value: Range;
  onChange: (v: Range) => void;
  /** ← これを追加： サイズ指定（sm/md/lg）。何も渡さなければ md */
  size?: keyof typeof sizeMap;
  sizeClass?: string;
};

export default function PeriodToggle({ value, onChange, size = "md", sizeClass }: Props) {
  const items: Range[] = ["7d", "30d", "all"];

  return (
    <div className={`${lilita.className} flex gap-2`}>
      {items.map((r) => {
        const active = value === r;
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={[
              sizeClass ?? sizeMap[size],
              "border transition-colors",
              active
                ? "bg-white/10 border-[#6EA8FE] text-white"
                : "bg-transparent border-white/10 text-white/70 hover:bg-white/5",
            ].join(" ")}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}
