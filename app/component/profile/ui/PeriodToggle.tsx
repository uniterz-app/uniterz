"use client";
import React from "react";
import { IBM_Plex_Sans } from "next/font/google";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

type Range = "7d" | "30d";

type Props = {
  value: Range;
  onChange: (v: Range) => void;
  language?: Language;
};

export default function PeriodToggle({
  value,
  onChange,
  language = "ja",
}: Props) {
  const m = t(language);

  const items: { key: Range; label: string }[] = [
    { key: "7d", label: m.profile.last7d },
    { key: "30d", label: m.profile.last30d },
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