"use client";
import React from "react";
import { Lilita_One } from "next/font/google";

// ※ すでに他で読み込んでるならこの行はあなたの環境に合わせてOK
const lilita = Lilita_One({ weight: "400", subsets: ["latin"] });

const sizeMap = {
  sm: "text-xs px-2 py-1 rounded-md",
  md: "text-sm px-4 py-2 rounded-lg",
  lg: "text-base px-5 py-3 rounded-xl",
} as const;

type Tab = "overview" | "stats";

type Props = {
  value: Tab;
  onChange: (v: Tab) => void;
  /** ← これを追加： サイズ指定（sm/md/lg）。何も渡さなければ md */
  size?: keyof typeof sizeMap;
  sizeClass?: string;
};

export default function Tabs({ value, onChange, size = "md", sizeClass,}: Props) {
  const items: Tab[] = ["overview", "stats"];

  return (
    <div className={`${lilita.className} flex gap-2`}>
      {items.map((t) => {
        const active = value === t;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={[
              sizeClass ?? sizeMap[size],
              "border transition-colors",
              active
                ? "bg-white/10 border-[#6EA8FE] text-white"
                : "bg-transparent border-white/10 text-white/70 hover:bg-white/5",
            ].join(" ")}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
