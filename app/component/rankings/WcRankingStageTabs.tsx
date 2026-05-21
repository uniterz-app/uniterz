"use client";

import { nameBebas } from "@/lib/fonts";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  stage: WcRankingStage;
  onChange: (stage: WcRankingStage) => void;
  isMobile?: boolean;
  language?: Language;
};

function stageItems(language: Language): Array<{ key: WcRankingStage; label: string }> {
  const m = t(language);
  return [
    { key: "overall", label: m.rankings.stageAll },
    { key: "qualifying", label: m.rankings.stageGroup },
    { key: "main", label: m.rankings.stageKnockout },
  ];
}

export default function WcRankingStageTabs({
  stage,
  onChange,
  language = "ja",
}: Props) {
  const items = stageItems(language);
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-white/3 p-0.5">
      {items.map((item) => {
        const active = stage === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={[
              "h-7 rounded-lg border px-2 text-center text-[14px] leading-none tracking-[0.05em] transition-[color,border-color,box-shadow,text-shadow] sm:px-2.5",
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
