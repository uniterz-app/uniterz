"use client";

import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  round: PlayoffRoundKey;
  onChange: (round: PlayoffRoundKey) => void;
  isMobile?: boolean;
  language?: Language;
};

const ITEMS: Array<{ key: PlayoffRoundKey; label: string }> = [
  { key: "overall", label: "TOTAL" },
  { key: "r1", label: "1ST" },
  { key: "r2", label: "2ND" },
  { key: "cf", label: "CF" },
  { key: "finals", label: "FINALS" },
];

export default function PlayoffRoundTabs({
  round,
  onChange,
  isMobile = false,
  language = "ja",
}: Props) {
  return (
    <div
      className={
        isMobile
          ? "grid grid-cols-5 gap-1 rounded-xl border border-white/10 bg-white/3 p-1"
          : "grid grid-cols-5 gap-1.5 rounded-xl border border-white/10 bg-white/3 p-1.5"
      }
    >
      {ITEMS.map((item) => {
        const active = round === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={[
              "rounded-lg border text-center font-semibold transition-colors",
              isMobile ? "h-7 text-[10px]" : "h-8 text-[11px]",
              active
                ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-100"
                : "border-white/20 bg-transparent text-white/70 hover:border-white/35 hover:text-white",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

