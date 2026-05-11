"use client";

import { nameBebas } from "@/lib/fonts";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import type { Language } from "@/lib/i18n/language";

type Props = {
  stage: WcRankingStage;
  onChange: (stage: WcRankingStage) => void;
  isMobile?: boolean;
  language?: Language;
};

const ITEMS: Array<{ key: WcRankingStage; label: string }> = [
  { key: "overall", label: "ALL" },
  { key: "qualifying", label: "GROUP" },
  { key: "main", label: "KNOCKOUT" },
];

export default function WcRankingStageTabs({
  stage,
  onChange,
}: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/3 p-1">
      {ITEMS.map((item) => {
        const active = stage === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={[
              "h-9 rounded-xl border px-2 text-center text-[18px] leading-none tracking-[0.06em] transition-[color,border-color,box-shadow,text-shadow] sm:px-3",
              active
                ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-100 shadow-[0_0_12px_rgba(103,232,249,0.28)]"
                : "border-white/45 bg-transparent text-white/75 hover:border-[#008cff] hover:text-white hover:shadow-[0_0_18px_rgba(0,140,255,0.4)]",
              nameBebas.className,
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
