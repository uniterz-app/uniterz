"use client";
import React from "react";
import { Lilita_One } from "next/font/google";

const lilita = Lilita_One({ weight: "400", subsets: ["latin"] });

type Tab = "overview" | "stats";

const sizeMap = {
  sm: "text-sm pb-2",
  md: "text-base pb-3",
  lg: "text-lg pb-4",
} as const;

type Props = {
  value: Tab;
  onChange: (v: Tab) => void;

  /** stats を表示するか（デフォルト true） */
  showStats?: boolean;

  /** Web / Mobile 用サイズ切り替え */
  size?: keyof typeof sizeMap;
};

export default function Tabs({
  value,
  onChange,
  showStats = true,
  size = "md",
}: Props) {
  const items: Tab[] = showStats ? ["overview", "stats"] : ["overview"];

  const labelMap: Record<Tab, string> = {
    overview: "Overview",
    stats: "Pro Stats",
  };

  return (
    <div
      className={[
        lilita.className,
        "flex gap-8 border-b border-white/10",
      ].join(" ")}
    >
      {items.map((t) => {
        const active = value === t;

        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={[
              "relative transition-colors",
              sizeMap[size],
              active
                ? "text-white"
                : "text-white/50 hover:text-white/80",
            ].join(" ")}
          >
            {labelMap[t]}

            {/* active underline */}
            {active && (
              <span
                className="
                  absolute left-0 -bottom-[1px]
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
